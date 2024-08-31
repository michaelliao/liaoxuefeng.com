# 设计推送系统

推送系统负责将公开市场的实时信息，包括订单簿、最新成交、最新K线等推送给客户端，对于用户的订单，还需要将成交信息推送给指定用户。FIX（Financial Information eXchange）协议是金融交易的一种实时化通讯协议，但是它非常复杂，而且不同版本的规范也不同。对于Warp Exchange来说，我们先实现一版简单的基于WebSocket推送JSON格式的通知。

和普通Web应用不同的是，基于Servlet的线程池模型不能高效地支持成百上千的WebSocket长连接。Java提供了NIO能充分利用Linux系统的epoll机制高效支持大量的长连接，但是直接使用NIO的接口非常繁琐，通常我们会选择基于NIO的[Netty](https://netty.io/)服务器。直接使用Netty其实仍然比较繁琐，基于Netty开发我们可以选择：

- Spring WebFlux：封装了Netty并实现Reactive接口；
- Vert.x：封装了Netty并提供简单的API接口。

这里我们选择[Vert.x](https://vertx.io/)，因为它的API更简单。

Vert.x本身包含若干模块，根据需要，我们引入3个组件：

```xml
<dependency>
    <groupId>io.vertx</groupId>
    <artifactId>vertx-core</artifactId>
    <version>${vertx.version}</version>
</dependency>

<dependency>
    <groupId>io.vertx</groupId>
    <artifactId>vertx-web</artifactId>
    <version>${vertx.version}</version>
</dependency>

<dependency>
    <groupId>io.vertx</groupId>
    <artifactId>vertx-redis-client</artifactId>
    <version>${vertx.version}</version>
</dependency>
```

我们先编写推送服务的入口：

```java
package com.itranswarp.exchange.push;

@SpringBootApplication
// 禁用数据库自动配置 (无DataSource, JdbcTemplate...)
@EnableAutoConfiguration(exclude = DataSourceAutoConfiguration.class)
public class PushApplication {
    public static void main(String[] args) {
        System.setProperty("vertx.disableFileCPResolving", "true");
        System.setProperty("vertx.logger-delegate-factory-class-name", "io.vertx.core.logging.SLF4JLogDelegateFactory");
        SpringApplication app = new SpringApplication(PushApplication.class);
        // 禁用Spring的Web:
        app.setWebApplicationType(WebApplicationType.NONE);
        app.run(args);
    }
}
```

上述代码仍然是一个标准的Spring Boot应用，因为我们希望利用Spring Cloud Config读取配置。由于我们不使用Spring自身的Web功能，因此需要禁用Spring的Web功能。推送服务本身并不需要访问数据库，因此禁用数据库自动配置。最后，我们把`PushApplication`放在`com.itranswarp.exchange.push`包下面，以避免自动扫描到`com.itranswarp.exchange`包下的组件（如RedisService）。

下一步是编写`PushService`，注意它是一个Spring组件，由Spring初始化：

```java
@Component
public class PushService extends LoggerSupport {
    @Value("${server.port}")
    private int serverPort;

    @Value("${exchange.config.hmac-key}")
    String hmacKey;

    @Value("${spring.redis.standalone.host:localhost}")
    private String redisHost;

    @Value("${spring.redis.standalone.port:6379}")
    private int redisPort;

    @Value("${spring.redis.standalone.password:}")
    private String redisPassword;

    @Value("${spring.redis.standalone.database:0}")
    private int redisDatabase = 0;

    private Vertx vertx;

    @PostConstruct
    public void startVertx() {
        // TODO: init Vert.x
    }
}
```

由Spring初始化该组件的目的是注入各种配置。在初始化方法中，我们就可以启动Vert.x：

```java
@PostConstruct
public void startVertx() {
    // 启动Vert.x:
    this.vertx = Vertx.vertx();

    // 创建一个Vert.x Verticle组件:
    var push = new PushVerticle(this.hmacKey, this.serverPort);
    vertx.deployVerticle(push);

    // 连接到Redis:
    String url = "redis://" + (this.redisPassword.isEmpty() ? "" : ":" + this.redisPassword + "@") + this.redisHost
            + ":" + this.redisPort + "/" + this.redisDatabase;
    Redis redis = Redis.createClient(vertx, url);

    redis.connect().onSuccess(conn -> {
        // 事件处理:
        conn.handler(response -> {
            // 收到Redis的PUSH:
            if (response.type() == ResponseType.PUSH) {
                int size = response.size();
                if (size == 3) {
                    Response type = response.get(2);
                    if (type instanceof BulkType) {
                        // 收到PUBLISH通知:
                        String msg = type.toString();
                        // 由push verticle组件处理该通知:
                        push.broadcast(msg);
                    }
                }
            }
        });
        // 订阅Redis的Topic:
        conn.send(Request.cmd(Command.SUBSCRIBE).arg(RedisCache.Topic.NOTIFICATION)).onSuccess(resp -> {
            logger.info("subscribe ok.");
        }).onFailure(err -> {
            logger.error("subscribe failed.", err);
            System.exit(1);
        });
    }).onFailure(err -> {
        logger.error("connect to redis failed.", err);
        System.exit(1);
    });
}
```

Vert.x用`Verticle`表示一个组件，我们编写`PushVerticle`来处理WebSocket连接：

```java
public class PushVerticle extends AbstractVerticle {
    @Override
    public void start() {
        // 创建VertX HttpServer:
        HttpServer server = vertx.createHttpServer();

        // 创建路由:
        Router router = Router.router(vertx);

        // 处理请求 GET /notification:
        router.get("/notification").handler(requestHandler -> {
            HttpServerRequest request = requestHandler.request();
            // 从token参数解析userId:
            Supplier<Long> supplier = () -> {
                String tokenStr = request.getParam("token");
                if (tokenStr != null && !tokenStr.isEmpty()) {
                    AuthToken token = AuthToken.fromSecureString(tokenStr, this.hmacKey);
                    if (!token.isExpired()) {
                        return token.userId();
                    }
                }
                return null;
            };
            final Long userId = supplier.get();
            logger.info("parse user id from token: {}", userId);
            // 将连接升级到WebSocket:
            request.toWebSocket(ar -> {
                if (ar.succeeded()) {
                    initWebSocket(ar.result(), userId);
                }
            });
        });

        // 处理请求 GET /actuator/health:
        router.get("/actuator/health").respond(
                ctx -> ctx.response().putHeader("Content-Type", "application/json").end("{\"status\":\"UP\"}"));

        // 其他请求返回404错误:
        router.get().respond(ctx -> ctx.response().setStatusCode(404).setStatusMessage("No Route Found").end());

        // 绑定路由并监听端口:
        server.requestHandler(router).listen(this.serverPort, result -> {
            if (result.succeeded()) {
                logger.info("Vertx started on port(s): {} (http) with context path ''", this.serverPort);
            } else {
                logger.error("Start http server failed on port " + this.serverPort, result.cause());
                vertx.close();
                System.exit(1);
            }
        });
    }
}
```

在`PushVerticle`中，`start()`方法由Vert.x回调。我们在`start()`方法中主要干这么几件事：

1. 创建基于Vert.x的HTTP服务器（内部使用Netty）；
2. 创建路由；
3. 绑定一个路径为`/notification`的GET请求，将其升级为WebSocket连接；
4. 绑定其他路径的GET请求；
5. 开始监听指定端口号。

在处理`/notification`时，我们尝试从URL的token参数解析出用户ID，这样我们就无需访问数据库而获得了当前连接的用户。升级到WebSocket连接后，再调用`initWebSocket()`继续处理WebSocket连接：

```java
public class PushVerticle extends AbstractVerticle {
    // 所有Handler:
    Map<String, Boolean> handlersSet = new ConcurrentHashMap<>(1000);

    // 用户ID -> Handlers
    Map<Long, Set<String>> userToHandlersMap = new ConcurrentHashMap<>(1000);

    // Handler -> 用户ID
    Map<String, Long> handlerToUserMap = new ConcurrentHashMap<>(1000);

    void initWebSocket(ServerWebSocket websocket, Long userId) {
        // 获取一个WebSocket关联的Handler ID:
        String handlerId = websocket.textHandlerID();
        // 处理输入消息:
        websocket.textMessageHandler(str -> {
            logger.info("text message: " + str);
        });
        websocket.exceptionHandler(t -> {
            logger.error("websocket error: " + t.getMessage(), t);
        });
        // 关闭连接时:
        websocket.closeHandler(e -> {
            unsubscribeClient(handlerId);
            unsubscribeUser(handlerId, userId);
        });
        subscribeClient(handlerId);
        subscribeUser(handlerId, userId);
    }

    void subscribeClient(String handlerId) {
        this.handlersSet.put(handlerId, Boolean.TRUE);
    }

    void unsubscribeClient(String handlerId) {
        this.handlersSet.remove(handlerId);
    }

    void subscribeUser(String handlerId, Long userId) {
        if (userId == null) {
            return;
        }
        handlerToUserMap.put(handlerId, userId);
        Set<String> set = userToHandlersMap.get(userId);
        if (set == null) {
            set = new HashSet<>();
            userToHandlersMap.put(userId, set);
        }
        set.add(handlerId);
    }

    void unsubscribeUser(String handlerId, Long userId) {
        if (userId == null) {
            return;
        }
        handlerToUserMap.remove(handlerId);
        Set<String> set = userToHandlersMap.get(userId);
        if (set != null) {
            set.remove(handlerId);
        }
    }
}
```

在Vert.x中，每个WebSocket连接都有一个唯一的Handler标识，以`String`表示。我们用几个`Map`保存Handler和用户ID的映射关系，当关闭连接时，将对应的映射关系删除。

最后一个关键方法`broadcast()`由`PushService`中订阅的Redis推送时触发，该方法用于向用户主动推送通知：

```java
public void broadcast(String text) {
    NotificationMessage message = JsonUtil.readJson(text, NotificationMessage.class);
    if (message.userId == null) {
        // 没有用户ID时，推送给所有连接:
        EventBus eb = vertx.eventBus();
        for (String handler : this.handlersSet.keySet()) {
            eb.send(handler, text);
        }
    } else {
        // 推送给指定用户:
        Set<String> handlers = this.userToHandlersMap.get(message.userId);
        if (handlers != null) {
            EventBus eb = vertx.eventBus();
            for (String handler : handlers) {
                eb.send(handler, text);
            }
        }
    }
}
```

当Redis收到`PUBLISH`调用后，它自动将`String`表示的JSON数据推送给所有订阅端。我们在`PushService`中订阅了`notification`这个Topic，然后通过`broadcast()`推送给WebSocket客户端。对于一个`NotificationMessage`，如果设置了`userId`，则推送给指定用户，适用于订单成交等针对用户ID的通知；如果没有设置`userId`，则推送给所有用户，适用于公开市场信息的推送。

整个推送服务仅包括3个Java文件，我们就实现了基于Redis和WebSocket的高性能推送。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-10)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-10/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-10">GitHub</a>

### 小结

要高效处理大量WebSocket连接，我们选择基于Netty的Vert.x框架，可以通过少量代码配合Redis实现推送。
