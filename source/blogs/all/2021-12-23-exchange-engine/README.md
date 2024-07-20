# 证券交易系统交易引擎的设计

在《[证券交易系统撮合引擎的设计](../2021-12-10-exchange-match-engine/index.html)》、《[证券交易系统用户资产的设计](../2021-12-21-exchange-account/index.html)》两篇文章中，我们已经实现了一个简单的撮合引擎和一个简单的资产管理子系统。现在，我们要在这个基础上增加订单和清算系统，就可以实现一个完整的交易引擎。

订单系统的目的是为了管理所有的活动订单，并给每个新订单一个递增的序列号。由于在创建订单时需要冻结用户资产，因此，我们定义的`OrderService`会引用`AssetService`：

```java
public class OrderService {
    // 引用AssetService:
    final AssetService assetService;

    // 全局唯一递增序列号：
    private long sequenceId = 0;

    // 跟踪所有活动订单:
    public ConcurrentMap<Long, Order> activeOrders = new ConcurrentHashMap<>();
}
```

创建一个新订单时，需要传入用户ID、方向、价格和数量：

```java
public Order createOrder(Long userId, Direction direction, BigDecimal price, BigDecimal amount) {
    switch (direction) {
    case BUY -> {
        // 买入，需冻结法币：
        if (!assetService.tryFreeze(userId, "FIAT", price.multiply(amount))) {
            throw new RuntimeException("No enough FIAT currency.");
        }
    }
    case SELL -> {
        // 卖出，需冻结证券：
        if (!assetService.tryFreeze(userId, "STOCK", amount)) {
            throw new RuntimeException("No enough stock.");
        }
    }
    default -> throw new IllegalArgumentException("Invalid direction.");
    }
    sequenceId++;
    Order order = new Order(sequenceId, userId, direction, price, amount);
    this.activeOrders.put(order.sequenceId, order);
    return order;
}
```

删除订单时，必须从活动订单中成功删除：

```java
public void removeOrder(Long sequenceId) {
    Order removed = this.activeOrders.remove(sequenceId);
    if (removed == null) {
        throw new IllegalArgumentException("Order not found by sequenceId: " + sequenceId);
    }
}
```

再加上根据`sequenceId`查找订单：

```java
public Order getOrder(Long sequenceId) {
    return this.activeOrders.get(sequenceId);
}
```

整个订单子系统就是这么简单。

这里对订单类`Order`稍作修改，我们把`amount`作为订单的只读属性，而`unfilledAmount`作为撮合时改变的属性，即未成交数量：

```java
public class Order {
    public final Long sequenceId;
    public final Long userId;
    public final Direction direction;
    public final BigDecimal price;
    public final BigDecimal amount; // 数量
    public OrderStatus status;
    public BigDecimal unfilledAmount; // 未成交数量
}
```

下一步是设计清算系统。所谓清算系统，就是将撮合结果进行清算。买卖双方各自扣除冻结的额度，转到对方可用额度。清算服务`ClearingService`需要引用`AssetService`和`OrderService`：

```java
public class ClearingService {
    final AssetService assetService;
    final OrderService orderService;
}
```

当撮合引擎输出`MatchResult`后，`ClearingService`需要处理该结果，该清算方法代码框架如下：

```java
public void clearMatchResult(MatchResult result) {
    Order taker = result.takerOrder;
    switch (taker.direction) {
    case BUY -> {
        // TODO
    }
    case SELL -> {
        // TODO
    }
    default -> throw new IllegalArgumentException("Invalid direction.");
    }
}
```

对Taker买入成交的订单，处理时需要注意，成交价格是按照Maker的报价成交的，而Taker冻结的金额是按照Taker订单的报价冻结的，因此，解冻后，部分差额要退回至Taker可用余额：

```java
case BUY -> {
    // 买入时，按Maker的价格成交：
    for (MatchRecord record : result.matchRecords) {
        Order maker = record.makerOrder;
        BigDecimal matched = record.amount;
        if (taker.price.compareTo(maker.price) > 0) {
            // 实际买入价比报价低，部分金额退回账户:
            BigDecimal unfreezeQuote = taker.price.subtract(maker.price).multiply(matched);
            assetService.unfreeze(taker.userId, "FIAT", unfreezeQuote);
        }
        // 买方FIAT转入卖方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, taker.userId, maker.userId, "FIAT", maker.price.multiply(matched));
        // 卖方STOCK转入买方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, maker.userId, taker.userId, "STOCK", matched);
        // 删除完全成交的Maker:
        if (maker.unfilledAmount.signum() == 0) {
            orderService.removeOrder(maker.sequenceId);
        }
    }
    // 删除完全成交的Taker:
    if (taker.unfilledAmount.signum() == 0) {
        orderService.removeOrder(taker.sequenceId);
    }
}
```

对Taker卖出成交的订单，只需将冻结的证券转入Maker，将Maker冻结的法币转入Taker即可：

```java
case SELL -> {
    for (MatchRecord record : result.matchRecords) {
        Order maker = record.makerOrder;
        BigDecimal matched = record.amount;
        // 卖方STOCK转入买方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, taker.userId, maker.userId, "STOCK", matched);
        // 买方FIAT转入卖方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, maker.userId, taker.userId, "FIAT", maker.price.multiply(matched));
        // 删除完全成交的Maker:
        if (maker.unfilledAmount.signum() == 0) {
            orderService.removeOrder(maker.sequenceId);
        }
    }
    // 删除完全成交的Taker:
    if (taker.unfilledAmount.signum() == 0) {
        orderService.removeOrder(taker.sequenceId);
    }
}
```

当用户取消订单时，`ClearingService`需要取消订单冻结的法币或证券，然后将订单从`OrderService`中删除：

```java
public void clearCancelOrder(Order order) {
    switch (order.direction) {
    case BUY -> {
        // 解冻FIAT:
        assetService.unfreeze(order.userId, "FIAT", order.price.multiply(order.unfilledAmount));
    }
    case SELL -> {
        // 解冻STOCK:
        assetService.unfreeze(order.userId, "STOCK", order.unfilledAmount);
    }
    default -> throw new IllegalArgumentException("Invalid direction.");
    }
    // 从OrderService中删除订单:
    orderService.removeOrder(order.sequenceId);
}
```

这样，清算系统就完成了实现。

现在，我们已经实现了资产系统、订单系统、撮合引擎和清算系统。对于外部系统来说，我们还需要一个总的交易引擎，把这些子系统封装起来，对外提供一个统一的入口。

我们定义`TradingEngine`如下，它负责实现存款、下单和撤销3种操作：

```java
public class TradingEngine {
    final AssetService assetService;
    final OrderService orderService;
    final MatchEngine matchEngine;
    final ClearingService clearingService;

    public TradingEngine() {
        this.assetService = new AssetService();
        this.orderService = new OrderService(this.assetService);
        this.matchEngine = new MatchEngine();
        this.clearingService = new ClearingService(this.assetService, this.orderService);
    }

    /**
     * 存款
     */
    public void deposit(Long userId, String assetId, BigDecimal amount) {
        // TODO:验证参数...
        boolean ok = this.assetService.tryTransfer(Transfer.AVAILABLE_TO_AVAILABLE, Users.DEBT, userId, assetId, amount, false);
        if (!ok) {
            throw new RuntimeException("deposit transfer failed.");
        }
    }

    /**
     * 创建订单
     */
    public Order createOrder(Long userId, Direction direction, BigDecimal price, BigDecimal amount) {
        // TODO:验证参数...
        Order order = this.orderService.createOrder(userId, direction, price, amount);
        MatchResult result = this.matchEngine.processOrder(order);
        this.clearingService.clearMatchResult(result);
        return order;
    }

    /**
     * 撤销订单
     */
    public Order cancelOrder(Long userId, Long sequenceId) {
        Order order = this.orderService.getOrder(sequenceId);
        // 未找到活动订单或订单不属于该用户:
        if (order == null || order.userId.longValue() != userId.longValue()) {
            throw new IllegalArgumentException("Order not found by sequenceId: " + sequenceId);
        }
        this.matchEngine.cancel(order);
        this.clearingService.clearCancelOrder(order);
        return order;
    }
}
```

以上就是一个完整的交易引擎实现。因为100%基于内存操作，在单线程模式下TPS也可以达到非常高的程度。可以编写一个简单的测试来验证我们的交易引擎，并打印出交易引擎的内部状态。

对于基于内存的交易引擎来说，如何验证引擎的正确性是非常重要的。一旦我们对交易引擎添加了新功能，需要完整地验证交易引擎的正确性，这个测试的工作量是巨大的，因此，验证功能最好能内置在交易引擎中。我们编写一个`validate()`方法用于验证交易引擎：

```java
public class TradingEngine {
    public void validate() {
        validateAssets();
        validateOrders();
        validateMatchEngine();
    }

    void validateAssets() {
        // TODO:验证系统资产完整性:
        // TODO:验证各类别资产总额为0:
    }

    void validateOrders() {
        // TODO:验证订单必须在MatchEngine中:
        // TODO:验证订单冻结的累计金额必须和Asset冻结一致:
    }

    void validateMatchEngine() {
        // TODO:OrderBook的Order必须在ActiveOrders中:
        // TODO:activeOrders的所有Order必须在Order Book中:
    }
}
```

每处理一个订单，系统可以调用`validate()`方法验证内存的所有数据完整性、一致性和正确性，一旦发生错误，整个交易引擎就会立刻终止。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/simple-trading-engine)下载本文源码。

### 小结

本文讨论并实现了一个高性能的基于内存的交易引擎，它封装了模块化的资产系统、订单系统、撮合引擎和清算系统，并提供验证方法时刻保证交易引擎的数据完整性、一致性和正确性。整个交易引擎具备简单可靠、高性能、易于扩展的特点。
