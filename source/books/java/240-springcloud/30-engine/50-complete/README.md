# 完成交易引擎

我们现在实现了资产模块、订单模块、撮合引擎和清算模块，现在，就可以把它们组合起来，实现一个完整的交易引擎：

```java
public class TradingEngineService {
    @Autowired
    AssetService assetService;

    @Autowired
    OrderService orderService;

    @Autowired
    MatchEngine matchEngine;

    @Autowired
    ClearingService clearingService;
}
```

交易引擎由事件驱动，因此，通过订阅Kafka的Topic实现批量读消息，然后依次处理每个事件：

```java
void processMessages(List<AbstractEvent> messages) {
    for (AbstractEvent message : messages) {
        processEvent(message);
    }
}

void processEvent(AbstractEvent event) {
    if (event instanceof OrderRequestEvent) {
        createOrder((OrderRequestEvent) event);
    } else if (event instanceof OrderCancelEvent) {
        cancelOrder((OrderCancelEvent) event);
    } else if (event instanceof TransferEvent) {
        transfer((TransferEvent) event);
    }
}
```

我们目前一共有3种类型的事件，处理都非常简单。以`createOrder()`为例，核心代码其实就几行：

```java
void createOrder(OrderRequestEvent event) {
    // 生成Order ID:
    long orderId = event.sequenceId * 10000 + (year * 100 + month);
    // 创建Order:
    OrderEntity order = orderService.createOrder(event.sequenceId, event.createdAt, orderId, event.userId, event.direction, event.price, event.quantity);
    if (order == null) {
        logger.warn("create order failed.");
        return;
    }
    // 撮合:
    MatchResult result = matchEngine.processOrder(event.sequenceId, order);
    // 清算:
    clearingService.clearMatchResult(result);
}
```

核心的业务逻辑并不复杂，只是交易引擎在处理完订单后，仅仅改变自身状态是不够的，它还得向外输出具体的成交信息、订单状态等。因此，需要根据业务需求，在清算后继续收集撮合结果、已完成订单、准备发送的通知等，通过消息系统或Redis向外输出交易信息。如果把这些功能放到同一个线程内同步完成是非常耗时的，更好的方法是把它们先存储起来，再异步处理。例如，对于已完成的订单，可以异步落库：

```java
Queue<List<OrderEntity>> orderQueue = new ConcurrentLinkedQueue<>();

void createOrder(OrderRequestEvent event) {
    ...
    // 清算完成后,收集已完成Order:
    if (!result.matchDetails.isEmpty()) {
        List<OrderEntity> closedOrders = new ArrayList<>();
        if (result.takerOrder.status.isFinalStatus) {
            closedOrders.add(result.takerOrder);
        }
        for (MatchDetailRecord detail : result.matchDetails) {
            OrderEntity maker = detail.makerOrder();
            if (maker.status.isFinalStatus) {
                closedOrders.add(maker);
            }
        }
        this.orderQueue.add(closedOrders);
    }
}

// 启动一个线程将orderQueue的Order异步写入数据库:
void saveOrders() {
    // TODO:
}
```

类似的，输出OrderBook、通知用户成交等信息都是异步处理。

接下来，我们再继续完善`processEvent()`，处理单个事件时，在处理具体的业务逻辑之前，我们首先根据`sequenceId`判断是否是重复消息，是重复消息就丢弃：

```java
void processEvent(AbstractEvent event) {
    if (event.sequenceId <= this.lastSequenceId) {
        logger.warn("skip duplicate event: {}", event);
        return;
    }
    // TODO:
}
```

紧接着，我们判断是否丢失了消息，如果丢失了消息，就根据上次处理的消息的`sequenceId`，从数据库里捞出后续消息，直到赶上当前消息的`sequenceId`为止：

```java
// 判断是否丢失了消息:
if (event.previousId > this.lastSequenceId) {
    // 从数据库读取丢失的消息:
    List<AbstractEvent> events = storeService.loadEventsFromDb(this.lastSequenceId);
    if (events.isEmpty()) {
        // 读取失败:
        System.exit(1);
        return;
    }
    // 处理丢失的消息:
    for (AbstractEvent e : events) {
        this.processEvent(e);
    }
    return;
}
// 判断当前消息是否指向上一条消息:
if (event.previousId != lastSequenceId) {
    System.exit(1);
    return;
}
// 正常处理:
...
// 更新lastSequenceId:
this.lastSequenceId = event.sequenceId;
```

这样一来，我们对消息系统的依赖就不是要求它100%可靠，遇到重复消息、丢失消息，交易引擎都可以从这些错误中自己恢复。

由于资产、订单、撮合、清算都在内存中完成，如何保证交易引擎每处理一个事件，它的内部状态都是正确的呢？我们可以为交易引擎增加一个自验证功能，在debug模式下，每处理一个事件，就自动验证内部状态的完整性，包括：

- 验证资产系统总额为0，且除负债账户外其余账户资产不为负；
- 验证订单系统未成交订单所冻结的资产与资产系统中的冻结一致；
- 验证订单系统的订单与撮合引擎的订单簿一对一存在。

```java
void processEvent(AbstractEvent event) {
    ...
    if (debugMode) {
        this.validate();
    }
}
```

这样我们就能快速在开发阶段尽可能早地发现问题。

交易引擎的测试也相对比较简单。对于同一组输入，每次运行都会得到相同的结果，所以我们可以构造几组确定的输入来验证交易引擎：

```java
class TradingEngineServiceTest {
    @Test
    public void testTradingEngine() {
        // TODO:
    }
}
```

下面是问题解答。

### 交易引擎崩溃后如何恢复？

交易引擎如果运行时崩溃，可以重启，重启后先把现有的所有交易事件重头开始执行一遍，即可得到最新的状态。

注意到重头开始执行交易事件，会导致重复发出市场成交、用户订单通知等事件，因此，可根据时间做判断，不再重复发通知。下游系统在处理通知事件时，也要根据通知携带的`sequenceId`做去重判断。

有的童鞋会问，如果现有的交易事件已经有几千万甚至几十亿，从头开始执行如果需要花费几个小时甚至几天，怎么办？

可以定期把交易引擎的状态序列化至文件系统，例如，每10分钟一次。当交易引擎崩溃时，读取最新的状态文件，即可恢复至约10分钟前的状态，后续追赶只需要执行很少的事件消息。

### 如何序列化交易引擎的状态？

交易引擎的状态包括：

- 资产系统的状态：即所有用户的资产列表；
- 订单系统的状态：即所有活动订单列表；
- 撮合引擎的状态：即买卖盘和最新市场价；
- 最后一次处理的sequenceId。

序列化时，分别针对每个子系统进行序列化。对资产系统来说，每个用户的资产可序列化为`用户ID: [USD可用, USD冻结, BTC可用, BTC冻结]`的JSON格式，整个资产系统序列化后结构如下：

```json
{
    "1": [-123000, 0, -12.3, 0],
    "100": [60000, 20000, 9, 0],
    "200": [43000, 0, 3, 0.3]
}
```

订单系统可序列化为一系列活动订单列表：

```json
[
    { "id": 10012207, "sequenceId": 1001, "price": 20901, ...},
    { "id": 10022207, "sequenceId": 1002, "price": 20902, ...},
]
```

撮合引擎可序列化为买卖盘列表（仅包含订单ID）：

```json
{
    "BUY": [10012207, 10022207, ...],
    "SELL": [...],
    "marketPrice": 20901
}
```

最后合并为一个交易引擎的状态文件：

```json
{
    "sequenceId": 189000,
    "assets": { ... },
    "orders": [ ... ],
    "match": { ... }
}
```

交易引擎启动时，读取状态文件，然后依次恢复资产系统、订单系统和撮合引擎的状态，就得到了指定`sequenceId`的状态。

写入状态时，如果是异步写入，需要先复制状态、再写入，防止多线程读同一实例导致状态不一致。读写JSON时，要使用JSON库的流式API（例如Jackson的Streaming API），以免内存溢出。对`BigDecimal`进行序列化时，要注意不要误读为`double`类型以免丢失精度。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-6)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-6/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-6">GitHub</a>

### 小结

交易引擎是以事件驱动的状态机模型，同样的输入将得到同样的输出。为提高交易系统的健壮性，可以自动检测重复消息和消息丢失并自动恢复。
