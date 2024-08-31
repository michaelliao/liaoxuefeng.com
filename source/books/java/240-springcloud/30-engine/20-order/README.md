# 设计订单系统

上一节我们实现了一个资产系统，本节我们来设计并实现一个订单系统。

订单系统的目的是为了管理所有的活动订单，并给每个新订单一个递增的序列号。由于在创建订单时需要冻结用户资产，因此，我们定义的`OrderService`会引用`AssetService`：

```java
public class OrderService {
    // 引用AssetService:
    final AssetService assetService;

    public OrderService(@Autowired AssetService assetService) {
        this.assetService = assetService;
    }
}
```

一个订单由订单ID唯一标识，此外，订单包含以下重要字段：

- userId：订单关联的用户ID；
- sequenceId：定序ID，相同价格的订单根据定序ID进行排序；
- direction：订单方向：买或卖；
- price：订单价格；
- quantity：订单数量；
- unfilledQuantity：尚未成交的数量；
- status：订单状态，包括等待成交、部分成交、完全成交、部分取消、完全取消。

一个订单被成功创建后，它后续由撮合引擎处理时，只有`unfilledQuantity`和`status`会发生变化，其他属性均为只读，不会改变。

当订单状态变为完全成交、部分取消、完全取消时，订单就已经处理完成。处理完成的订单从订单系统中删除，并写入数据库永久变为历史订单。用户查询活动订单时，需要读取订单系统，用户查询历史订单时，只需从数据库查询，就与订单系统无关了。

我们定义`OrderEntity`如下：

```java
public class OrderEntity {
    // 订单ID / 定序ID / 用户ID:
    public Long id;
    public long sequenceId;
    public Long userId;

    // 价格 / 方向 / 状态:
    public BigDecimal price;
    public Direction direction;
    public OrderStatus status;

    // 订单数量 / 未成交数量:
    public BigDecimal quantity;
    public BigDecimal unfilledQuantity;

    // 创建和更新时间:
    public long createdAt;
    public long updatedAt;
}
```

处于简化设计的缘故，该对象既作为订单系统的订单对象，也作为数据库映射实体。

根据业务需要，订单系统需要支持：

- 根据订单ID查询到订单；
- 根据用户ID查询到该用户的所有活动订单。

因此，`OrderService`需要用两个`Map`存储活动订单：

```java
public class OrderService {
    // 跟踪所有活动订单: Order ID => OrderEntity
    final ConcurrentMap<Long, OrderEntity> activeOrders = new ConcurrentHashMap<>();

    // 跟踪用户活动订单: User ID => Map(Order ID => OrderEntity)
    final ConcurrentMap<Long, ConcurrentMap<Long, OrderEntity>> userOrders = new ConcurrentHashMap<>();
```

添加一个新的`Order`时，需要同时更新`activeOrders`和`userOrders`。同理，删除一个`Order`时，需要同时从`activeOrders`和`userOrders`中删除。

我们先编写创建订单的方法：

```java
/**
 * 创建订单，失败返回null:
 */
public OrderEntity createOrder(long sequenceId, long ts, Long orderId, Long userId, Direction direction, BigDecimal price, BigDecimal quantity) {
    switch (direction) {
    case BUY -> {
        // 买入，需冻结USD：
        if (!assetService.tryFreeze(userId, AssetEnum.USD, price.multiply(quantity))) {
            return null;
        }
    }
    case SELL -> {
        // 卖出，需冻结BTC：
        if (!assetService.tryFreeze(userId, AssetEnum.BTC, quantity)) {
            return null;
        }
    }
    default -> throw new IllegalArgumentException("Invalid direction.");
    }
    // 实例化Order:
    OrderEntity order = new OrderEntity();
    order.id = orderId;
    order.sequenceId = sequenceId;
    order.userId = userId;
    order.direction = direction;
    order.price = price;
    order.quantity = quantity;
    order.unfilledQuantity = quantity;
    order.createdAt = order.updatedAt = ts;
    // 添加到ActiveOrders:
    this.activeOrders.put(order.id, order);
    // 添加到UserOrders:
    ConcurrentMap<Long, OrderEntity> uOrders = this.userOrders.get(userId);
    if (uOrders == null) {
        uOrders = new ConcurrentHashMap<>();
        this.userOrders.put(userId, uOrders);
    }
    uOrders.put(order.id, order);
    return order;
}
```

后续在清算过程中，如果发现一个`Order`已经完成或取消后，需要调用删除方法将活动订单从`OrderService`中删除：

```java
public void removeOrder(Long orderId) {
    // 从ActiveOrders中删除:
    OrderEntity removed = this.activeOrders.remove(orderId);
    if (removed == null) {
        throw new IllegalArgumentException("Order not found by orderId in active orders: " + orderId);
    }
    // 从UserOrders中删除:
    ConcurrentMap<Long, OrderEntity> uOrders = userOrders.get(removed.userId);
    if (uOrders == null) {
        throw new IllegalArgumentException("User orders not found by userId: " + removed.userId);
    }
    if (uOrders.remove(orderId) == null) {
        throw new IllegalArgumentException("Order not found by orderId in user orders: " + orderId);
    }
}
```

删除订单时，必须从`activeOrders`和`userOrders`中全部成功删除，否则会造成`OrderService`内部状态混乱。

最后，根据业务需求，我们加上根据订单ID查询、根据用户ID查询的方法：

```java
// 根据订单ID查询Order，不存在返回null:
public OrderEntity getOrder(Long orderId) {
    return this.activeOrders.get(orderId);
}
// 根据用户ID查询用户所有活动Order，不存在返回null:
public ConcurrentMap<Long, OrderEntity> getUserOrders(Long userId) {
    return this.userOrders.get(userId);
}
```

整个订单子系统的实现就是这么简单。

下面是问题解答。

### Order的id和sequenceId为何不合并使用一个ID？

订单ID是Order.id，是用户看到的订单标识，而Order.sequenceId是系统内部给订单的定序序列号，用于后续撮合时进入订单簿的排序，两者功能不同。

可以使用一个简单的算法来根据Sequence ID计算Order ID：

```java
OrderID = SequenceID * 10000 + today("YYmm")
```

因为SequenceID是全局唯一的，我们给SequenceID添加创建日期的"YYmm"部分，可轻松实现按月分库保存和查询。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-3)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-3/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-3">GitHub</a>

### 小结

一个订单系统在内存中维护所有用户的活动订单，并提供删除和查询方法。
