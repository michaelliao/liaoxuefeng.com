# 设计行情系统

行情系统用来生成公开市场的历史数据，主要是K线图。

K线图的数据来源是交易引擎成交产生的一个个Tick。一个K线包括OHLC这4个价格数据。在一个时间段内，第一个Tick的价格是Open，最后一个Tick的价格是Close，最高的价格是High，最低的价格是Low：

```ascii
  High ──▶│
          │
        ┌─┴─┐◀── Close
        │   │
        │   │
Open ──▶└─┬─┘
          │
          │
   Low ──▶│
```

给定一组Tick集合，就可以汇总成一个K线，对应一个Bar结构：

```java
public class AbstractBarEntity {
    public long startTime; // 开始时间
    public BigDecimal openPrice; // 开始价格
    public BigDecimal highPrice; // 最高价格
    public BigDecimal lowPrice; // 最低价格
    public BigDecimal closePrice; // 结束价格
    public BigDecimal quantity; // 成交数量
}
```

通常我们需要按1秒、1分钟、1小时和1天来生成不同类型的K线，因此，行情系统的功能就是不断从消息系统中读取Tick，合并，然后输出不同类型的K线。

此外，API系统还需要提供查询公开市场信息的功能。对于最近的成交信息和K线图，可以缓存在Redis中，对于较早时期的K线图，可以通过数据库查询。因此，行情系统需要将生成的K线保存到数据库中，同时负责不断更新Redis的缓存。

对于最新成交信息，我们在Redis中用一个List表示，它的每一个元素是一个序列号后的JSON：

```json
["{...}", "{...}", "{...}"...]
```

如果有新的Tick产生，就需要把它们追加到列表尾部，同时将最早的Tick删除，以便维护一个最近成交的列表。

直接读取Redis列表，操作后再写回Redis是可以的，但比较麻烦。这里我们直接用Lua脚本更新最新Tick列表。Redis支持将一个Lua脚本加载后，直接在Redis内部执行脚本：

```lua
local KEY_LAST_SEQ = '_TickSeq_' -- 上次更新的SequenceID
local LIST_RECENT_TICKS = KEYS[1] -- 最新Ticks的Key

local seqId = ARGV[1] -- 输入的SequenceID
local jsonData = ARGV[2] -- 输入的JSON字符串表示的tick数组："["{...}","{...}",...]"
local strData = ARGV[3] -- 输入的JSON字符串表示的tick数组："[{...},{...},...]"

-- 获取上次更新的sequenceId:
local lastSeqId = redis.call('GET', KEY_LAST_SEQ)
local ticks, len;

if not lastSeqId or tonumber(seqId) > tonumber(lastSeqId) then
    -- 广播:
    redis.call('PUBLISH', 'notification', '{"type":"tick","sequenceId":' .. seqId .. ',"data":' .. jsonData .. '}')
    -- 保存当前sequence id:
    redis.call('SET', KEY_LAST_SEQ, seqId)
    -- 更新最新tick列表:
    ticks = cjson.decode(strData)
    len = redis.call('RPUSH', LIST_RECENT_TICKS, unpack(ticks))
    if len > 100 then
        -- 裁剪LIST以保存最新的100个Tick:
        redis.call('LTRIM', LIST_RECENT_TICKS, len-100, len-1)
    end
    return true
end
-- 无更新返回false
return false
```

在API中，要获取最新成交信息，我们直接从Redis缓存取出列表，然后拼接成一个JSON字符串：

```java
@ResponseBody
@GetMapping(value = "/ticks", produces = "application/json")
public String getRecentTicks() {
    List<String> data = redisService.lrange(RedisCache.Key.RECENT_TICKS, 0, -1);
    if (data == null || data.isEmpty()) {
        return "[]";
    }
    StringJoiner sj = new StringJoiner(",", "[", "]");
    for (String t : data) {
        sj.add(t);
    }
    return sj.toString();
}
```

用Lua脚本更新Redis缓存还有一个好处，就是Lua脚本执行的时候，不但可以更新List，还可以通过Publish命令广播事件，后续我们编写基于WebSocket的推送服务器时，直接监听Redis广播，就可以主动向浏览器推送Tick更新的事件。

类似的，针对每一种K线，我们都在Redis中用ZScoredSet存储，用K线的开始时间戳作为Score。更新K线时，从每种ZScoredSet中找出Score最大的Bar结构，就是最后一个Bar，然后尝试更新。如果可以持久化这个Bar就返回，如果可以合并这个Bar就刷新ZScoreSet，用Lua脚本实现如下：

```lua
local function merge(existBar, newBar)
    existBar[3] = math.max(existBar[3], newBar[3]) -- 更新High Price
    existBar[4] = math.min(existBar[4], newBar[4]) -- 更新Low Price
    existBar[5] = newBar[5] -- close
    existBar[6] = existBar[6] + newBar[6] -- 更新quantity
end

local function tryMergeLast(barType, seqId, zsetBars, timestamp, newBar)
    local topic = 'notification'
    local popedScore, popedBar
    -- 查找最后一个Bar:
    local poped = redis.call('ZPOPMAX', zsetBars)
    if #poped == 0 then
        -- ZScoredSet无任何bar, 直接添加:
        redis.call('ZADD', zsetBars, timestamp, cjson.encode(newBar))
        redis.call('PUBLISH', topic, '{"type":"bar","resolution":"' .. barType .. '","sequenceId":' .. seqId .. ',"data":' .. cjson.encode(newBar) .. '}')
    else
        popedBar = cjson.decode(poped[1])
        popedScore = tonumber(poped[2])
        if popedScore == timestamp then
            -- 合并Bar并发送通知:
            merge(popedBar, newBar)
            redis.call('ZADD', zsetBars, popedScore, cjson.encode(popedBar))
            redis.call('PUBLISH', topic, '{"type":"bar","resolution":"' .. barType .. '","sequenceId":' .. seqId .. ',"data":' .. cjson.encode(popedBar) .. '}')
        else
            -- 可持久化最后一个Bar，生成新的Bar:
            if popedScore < timestamp then
                redis.call('ZADD', zsetBars, popedScore, cjson.encode(popedBar), timestamp, cjson.encode(newBar))
                redis.call('PUBLISH', topic, '{"type":"bar","resolution":"' .. barType .. '","sequenceId":' .. seqId .. ',"data":' .. cjson.encode(newBar) .. '}')
                return popedBar
            end
        end
    end
    return nil
end

local seqId = ARGV[1]
local KEY_BAR_SEQ = '_BarSeq_'

local zsetBars, topics, barTypeStartTimes
local openPrice, highPrice, lowPrice, closePrice, quantity
local persistBars = {}

-- 检查sequence:
local seq = redis.call('GET', KEY_BAR_SEQ)
if not seq or tonumber(seqId) > tonumber(seq) then
    zsetBars = { KEYS[1], KEYS[2], KEYS[3], KEYS[4] }
    barTypeStartTimes = { tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4]), tonumber(ARGV[5]) }
    openPrice = tonumber(ARGV[6])
    highPrice = tonumber(ARGV[7])
    lowPrice = tonumber(ARGV[8])
    closePrice = tonumber(ARGV[9])
    quantity = tonumber(ARGV[10])

    local i, bar
    local names = { 'SEC', 'MIN', 'HOUR', 'DAY' }
    -- 检查是否可以merge:
    for i = 1, 4 do
        bar = tryMergeLast(names[i], seqId, zsetBars[i], barTypeStartTimes[i], { barTypeStartTimes[i], openPrice, highPrice, lowPrice, closePrice, quantity })
        if bar then
            persistBars[names[i]] = bar
        end
    end
    redis.call('SET', KEY_BAR_SEQ, seqId)
    return cjson.encode(persistBars)
end

redis.log(redis.LOG_WARNING, 'sequence ignored: exist seq => ' .. seq .. ' >= ' .. seqId .. ' <= new seq')

return '{}'
```

接下来我们编写`QuotationService`，初始化的时候加载Redis脚本，接收到Tick消息时调用脚本更新Tick和Bar，然后持久化Tick和Bar，代码如下：

```java
@Component
public class QuotationService {

    @Autowired
    RedisService redisService;

    @Autowired
    MessagingFactory messagingFactory;

    MessageConsumer tickConsumer;

    private String shaUpdateRecentTicksLua = null;
    private String shaUpdateBarLua = null;

    @PostConstruct
    public void init() throws Exception {
        // 加载Redis脚本:
        this.shaUpdateRecentTicksLua = this.redisService.loadScriptFromClassPath("/redis/update-recent-ticks.lua");
        this.shaUpdateBarLua = this.redisService.loadScriptFromClassPath("/redis/update-bar.lua");
        // 接收Tick消息:
        String groupId = Messaging.Topic.TICK.name() + "_" + IpUtil.getHostId();
        this.tickConsumer = messagingFactory.createBatchMessageListener(Messaging.Topic.TICK, groupId,
                this::processMessages);
    }

    // 处理接收的消息:
    public void processMessages(List<AbstractMessage> messages) {
        for (AbstractMessage message : messages) {
            processMessage((TickMessage) message);
        }
    }

    // 处理一个Tick消息:
    void processMessage(TickMessage message) {
        // 对一个Tick消息中的多个Tick先进行合并:
        final long createdAt = message.createdAt;
        StringJoiner ticksStrJoiner = new StringJoiner(",", "[", "]");
        StringJoiner ticksJoiner = new StringJoiner(",", "[", "]");
        BigDecimal openPrice = BigDecimal.ZERO;
        BigDecimal closePrice = BigDecimal.ZERO;
        BigDecimal highPrice = BigDecimal.ZERO;
        BigDecimal lowPrice = BigDecimal.ZERO;
        BigDecimal quantity = BigDecimal.ZERO;
        for (TickEntity tick : message.ticks) {
            String json = tick.toJson();
            ticksStrJoiner.add("\"" + json + "\"");
            ticksJoiner.add(json);
            if (openPrice.signum() == 0) {
                openPrice = tick.price;
                closePrice = tick.price;
                highPrice = tick.price;
                lowPrice = tick.price;
            } else {
                // open price is set:
                closePrice = tick.price;
                highPrice = highPrice.max(tick.price);
                lowPrice = lowPrice.min(tick.price);
            }
            quantity = quantity.add(tick.quantity);
        }
        // 计算应该合并的每种类型的Bar的开始时间:
        long sec = createdAt / 1000;
        long min = sec / 60;
        long hour = min / 60;
        long secStartTime = sec * 1000;
        long minStartTime = min * 60 * 1000;
        long hourStartTime = hour * 3600 * 1000;
        long dayStartTime = Instant.ofEpochMilli(hourStartTime).atZone(zoneId).withHour(0).toEpochSecond() * 1000;

        // 更新Tick缓存:
        String ticksData = ticksJoiner.toString();
        Boolean tickOk = redisService.executeScriptReturnBoolean(this.shaUpdateRecentTicksLua,
                new String[] { RedisCache.Key.RECENT_TICKS },
                new String[] { String.valueOf(this.sequenceId), ticksData, ticksStrJoiner.toString() });
        if (!tickOk.booleanValue()) {
            logger.warn("ticks are ignored by Redis.");
            return;
        }
        // 保存Tick至数据库:
        saveTicks(message.ticks);

        // 更新Redis缓存的各种类型的Bar:
        String strCreatedBars = redisService.executeScriptReturnString(this.shaUpdateBarLua,
                new String[] { RedisCache.Key.SEC_BARS, RedisCache.Key.MIN_BARS, RedisCache.Key.HOUR_BARS,
                        RedisCache.Key.DAY_BARS },
                new String[] { // ARGV
                        String.valueOf(this.sequenceId), // sequence id
                        String.valueOf(secStartTime), // sec-start-time
                        String.valueOf(minStartTime), // min-start-time
                        String.valueOf(hourStartTime), // hour-start-time
                        String.valueOf(dayStartTime), // day-start-time
                        String.valueOf(openPrice), // open
                        String.valueOf(highPrice), // high
                        String.valueOf(lowPrice), // low
                        String.valueOf(closePrice), // close
                        String.valueOf(quantity) // quantity
                });
        Map<BarType, BigDecimal[]> barMap = JsonUtil.readJson(strCreatedBars, TYPE_BARS);
        if (!barMap.isEmpty()) {
            // 保存Bar:
            SecBarEntity secBar = createBar(SecBarEntity::new, barMap.get(BarType.SEC));
            MinBarEntity minBar = createBar(MinBarEntity::new, barMap.get(BarType.MIN));
            HourBarEntity hourBar = createBar(HourBarEntity::new, barMap.get(BarType.HOUR));
            DayBarEntity dayBar = createBar(DayBarEntity::new, barMap.get(BarType.DAY));
            saveBars(secBar, minBar, hourBar, dayBar);
        }
    }
}
```

K线是一组Bar按ZSet缓存在Redis中，Score就是Bar的开始时间。更新Bar时，同时广播通知，以便后续推送。要查询某种K线图，在API中，需要传入开始和结束的时间戳，通过[ZRANGE](https://redis.io/commands/zrange/)命令返回排序后的List：

```java
String getBars(String key, long start, long end) {
    List<String> data = redisService.zrangebyscore(key, start, end);
    if (data == null || data.isEmpty()) {
        return "[]";
    }
    StringJoiner sj = new StringJoiner(",", "[", "]");
    for (String t : data) {
        sj.add(t);
    }
    return sj.toString();
}
```

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-9)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-9/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-9">GitHub</a>

### 小结

行情系统是典型的少量写、大量读的模式，非常适合缓存。通过编写Lua脚本可使得更新Redis更加简单。
