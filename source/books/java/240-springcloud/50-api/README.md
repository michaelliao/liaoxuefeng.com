# 设计API系统

有了交易引擎和定序系统，我们还需要一个API系统，用于接收所有交易员的订单请求。

相比事件驱动的交易引擎，API系统就比较简单，因为它就是一个标准的Web应用。

在编写API之前，我们需要对请求进行认证，即识别出是哪个用户发出的请求。用户认证放在Filter中是最合适的。认证方式可以是简单粗暴的用户名+口令，也可以是Token，也可以是API Key+API Secret等模式。

我们先实现一个最简单的用户名+口令的认证方式。需要注意的是，API和Web页面不同，Web页面可以给用户一个登录页，登录成功后设置Session或Cookie，后续请求检查的是Session或Cookie。API不能使用Session，因为Session很难做无状态集群，API也不建议使用Cookie，因为API域名很可能与Web UI的域名不一致，拿不到Cookie。要在API中使用用户名+口令的认证方式，可以用标准的HTTP头[Authorization](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Authorization)的`Basic`模式：

```plain
Authorization: Basic 用户名:口令
```

因此，我们可以尝试从`Authorization`中获取用户名和口令来认证：

```java
Long parseUserFromAuthorization(String auth) {
    if (auth.startsWith("Basic ")) {
        // 用Base64解码:
        String eap = new String(Base64.getDecoder().decode(auth.substring(6)));
        // 分离email:password
        int pos = eap.indexOf(':');
        String email = eap.substring(0, pos);
        String passwd = eap.substring(pos + 1);
        // 验证:
        UserProfileEntity p = userService.signin(email, passwd);
        return p.userId;
    }
    throw new ApiException(ApiError.AUTH_SIGNIN_FAILED, "Invalid Authorization header.");
}
```

在`ApiFilter`中完成认证后，使用`UserContext`传递用户ID：

```java
public class ApiFilter  {
    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {
        // 尝试认证用户:
        String authHeader = req.getHeader("Authorization");
        Long userId = authHeader == null ? null : parseUserFromAuthorization(authHeader);
        if (userId == null) {
            // 匿名身份:
            chain.doFilter(req, resp);
        } else {
            // 用户身份:
            try (UserContext ctx = new UserContext(userId)) {
                chain.doFilter(req, resp);
            }
        }
    }
}
```

Basic模式很简单，需要注意的是`用户名:口令`使用`:`分隔，然后整个串用Base64编码，因此，读取的时候需要先用Base64解码。

虽然Basic模式并不安全，但是有了一种基本的认证模式，我们就可以把API-定序-交易串起来了。后续我们再继续添加其他认证模式。

### 编写API Controller

对于认证用户的操作，例如，查询资产余额，可通过`UserContext`获取当前用户，然后通过交易引擎查询并返回用户资产余额：

```java
@ResponseBody
@GetMapping(value = "/assets", produces = "application/json")
public String getAssets() throws IOException {
    Long userId = UserContext.getRequiredUserId();
    return tradingEngineApiProxyService.get("/internal/" + userId + "/assets");
}
```

因为交易引擎返回的结果就是JSON字符串，没必要先反序列化再序列化，可以以`String`的方式直接返回给客户端，需要标注`@ResponseBody`表示不要对`String`再进行序列化处理。

对于无需认证的操作，例如，查询公开市场的订单簿，可以直接返回Redis缓存结果：

```java
@ResponseBody
@GetMapping(value = "/orderBook", produces = "application/json")
public String getOrderBook() {
    String data = redisService.get(RedisCache.Key.ORDER_BOOK);
    return data == null ? OrderBookBean.EMPTY : data;
}
```

但是对于创建订单的请求，处理就麻烦一些，因为API收到请求后，仅仅通过消息系统给定序系统发了一条消息。消息系统本身并不是类似HTTP的请求-响应模式，我们拿不到消息处理的结果。这里先借助Spring的异步响应模型`DeferredResult`，再借助Redis的pub/sub模型，当API发送消息时，使用全局唯一`refId`跟踪消息，当交易引擎处理完订单请求后，向Redis发送pub事件，API收到Redis推送的事件后，根据`refId`找到`DeferredResult`，设置结果后由Spring异步返回给客户端：

```ascii
   ┌─────────┐                 ┌─────────┐
──▶│   API   │◀────────────────│  Redis  │
   └─────────┘                 └─────────┘
        │                           ▲
        ▼                           │
   ┌─────────┐                      │
   │   MQ    │                   pub│
   └─────────┘                      │
        │                           │
        ▼                           │
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │Sequencer│──▶│   MQ    │──▶│ Engine  │
   └─────────┘   └─────────┘   └─────────┘
```

代码实现如下：

```java
public class TradingApiController {
    // 消息refId -> DeferredResult:
    Map<String, DeferredResult<ResponseEntity<String>>> deferredResultMap = new ConcurrentHashMap<>();

    @Autowired
    RedisService redisService;

    @PostConstruct
    public void init() {
        // 订阅Redis:
        this.redisService.subscribe(RedisCache.Topic.TRADING_API_RESULT, this::onApiResultMessage);
    }

    @PostMapping(value = "/orders", produces = "application/json")
    @ResponseBody
    public DeferredResult<ResponseEntity<String>> createOrder(@RequestBody OrderRequestBean orderRequest) {
        final Long userId = UserContext.getRequiredUserId();
        // 消息的Reference ID:
        final String refId = IdUtil.generateUniqueId();
        var event = new OrderRequestEvent();
        event.refId = refId;
        event.userId = userId;
        event.direction = orderRequest.direction;
        event.price = orderRequest.price;
        event.quantity = orderRequest.quantity;
        event.createdAt = System.currentTimeMillis();
        // 如果超时则返回:
        ResponseEntity<String> timeout = new ResponseEntity<>(getTimeoutJson(), HttpStatus.BAD_REQUEST);
        // 正常异步返回:
        DeferredResult<ResponseEntity<String>> deferred = new DeferredResult<>(500, timeout); // 0.5秒超时
        deferred.onTimeout(() -> {
            this.deferredResultMap.remove(event.refId);
        });
        // 根据refId跟踪消息处理结果:
        this.deferredResultMap.put(event.refId, deferred);
        // 发送消息:
        sendMessage(event);
        return deferred;
    }

    // 收到Redis的消息结果推送:
    public void onApiResultMessage(String msg) {
        ApiResultMessage message = objectMapper.readValue(msg, ApiResultMessage.class);
        if (message.refId != null) {
            // 根据消息refId查找DeferredResult:
            DeferredResult<ResponseEntity<String>> deferred = this.deferredResultMap.remove(message.refId);
            if (deferred != null) {
                // 找到DeferredResult后设置响应结果:
                ResponseEntity<String> resp = new ResponseEntity<>(JsonUtil.writeJson(message.result), HttpStatus.OK);
                deferred.setResult(resp);
            }
        }
    }
}
```

### 如何实现API Key认证

身份认证的本质是确认用户身份。用户身份其实并不包含密码，而是用户ID、email、名字等信息，可以看作数据库中的`user_profiles`表：

| userId | email | name |
|--------|-------|------|
|    100 | bob@example.com | Bob |
|    101 | alice@example.com | alice |
|    102 | cook@example.com | Cook |

使用口令认证时，通过添加一个`password_auths`表，存储哈希后的口令，并关联至某个用户ID，即可完成口令认证：

| userId | random | passwd |
|--------|-------|------|
|    100 | c47snXI | 7b6da12c... |
|    101 | djEqC2I | f7b68248... |

并不是每个用户都必须有口令，没有口令的用户仅仅表示该用户不能通过口令来认证身份，但完全可以通过其他方式认证。

使用API Key认证同理，通过添加一个`api_auths`表，存储API Key、API Secret并关联至某个用户ID：

| userId | apiKey   | apiSecret |
|--------|----------|---------|
|    101 | 5b503947f4f5d34a | e57c677d4ab4c5a4 |
|    102 | 13a867e8da13c7f6 | 92e41573e833ae13 |
|    102 | 341a8e60baf5b824 | 302c9e195826267f |

用户使用API Key认证时，提供API Key，以及用API Secret计算的Hmac哈希，服务器验证Hmac哈希后，就可以确认用户身份，因为其他人不知道该用户的API Secret，无法计算出正确的Hmac。

发送API Key认证时，可以定义如下的HTTP头：

```plain
API-Key: 5b503947f4f5d34a
API-Timestamp: 20220726T092137Z <- 防止重放攻击的时间戳
API-Signature: d7a567b6cab85bcd
```

计算签名的原始输入可以包括HTTP Method、Path、Timestamp、Body等关键信息，具体格式可参考[AWS API签名方式](https://docs.aws.amazon.com/zh_cn/general/latest/gr/signature-version-4.html)。

一个用户可以关联多个API Key认证，还可以给每个API Key附加特定权限，例如只读权限，这样用API Key认证就更加安全。

### 内部系统调用API如何实现用户认证

很多时候，内部系统也需要调用API，并且需要以特定用户的身份调用API。让内部系统去读用户的口令或者API Key都是不合理的，更好的方式是使用一次性Token，还是利用Authorization头的Bearer模式：

```plain
Authorization: Bearer 5NPtI6LW...
```

构造一次性Token可以用`userId:expires:hmac`，内部系统和API共享同一个Hmac Key，就可以正确计算并验证签名。外部用户因为无法获得Hmac Key而无法伪造Token。

### 如何跟踪API性能

可以使用Spring提供的`HandlerInterceptor`和`DeferredResultProcessingInterceptor`跟踪API性能，它们分别用于拦截同步API和异步API。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-8)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-8/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-8">GitHub</a>

### 小结

API系统负责认证用户身份，并提供一个唯一的交易入口。
