# 设计清算系统

在证券交易系统中，一个订单成功创建后，经过撮合引擎，就可以输出撮合结果。但此时买卖双方的资产还没有变化，要把撮合结果最终实现为买卖双方的资产交换，就需要清算。

清算系统就是处理撮合结果，将买卖双方冻结的USD和BTC分别交换到对方的可用余额，就使得买卖双方真正完成了资产交换。

因此，我们设计清算系统`ClearingService`，需要引用`AssetService`和`OrderService`：

```java
public class ClearingService {
    final AssetService assetService;
    final OrderService orderService;

    public ClearingService(@Autowired AssetService assetService, @Autowired OrderService orderService) {
        this.assetService = assetService;
        this.orderService = orderService;
    }
}
```

当撮合引擎输出`MatchResult`后，`ClearingService`需要处理该结果，该清算方法代码框架如下：

```java
public void clearMatchResult(MatchResult result) {
    OrderEntity taker = result.takerOrder;
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
    for (MatchDetailRecord detail : result.matchDetails) {
        OrderEntity maker = detail.makerOrder();
        BigDecimal matched = detail.quantity();
        if (taker.price.compareTo(maker.price) > 0) {
            // 实际买入价比报价低，部分USD退回账户:
            BigDecimal unfreezeQuote = taker.price.subtract(maker.price).multiply(matched);
            assetService.unfreeze(taker.userId, AssetEnum.USD, unfreezeQuote);
        }
        // 买方USD转入卖方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, taker.userId, maker.userId, AssetEnum.USD, maker.price.multiply(matched));
        // 卖方BTC转入买方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, maker.userId, taker.userId, AssetEnum.BTC, matched);
        // 删除完全成交的Maker:
        if (maker.unfilledQuantity.signum() == 0) {
            orderService.removeOrder(maker.id);
        }
    }
    // 删除完全成交的Taker:
    if (taker.unfilledQuantity.signum() == 0) {
        orderService.removeOrder(taker.id);
    }
}
```

对Taker卖出成交的订单，只需将冻结的BTC转入Maker，将Maker冻结的USD转入Taker即可：

```java
case SELL -> {
    for (MatchDetailRecord detail : result.matchDetails) {
        OrderEntity maker = detail.makerOrder();
        BigDecimal matched = detail.quantity();
        // 卖方BTC转入买方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, taker.userId, maker.userId, AssetEnum.BTC, matched);
        // 买方USD转入卖方账户:
        assetService.transfer(Transfer.FROZEN_TO_AVAILABLE, maker.userId, taker.userId, AssetEnum.USD, maker.price.multiply(matched));
        // 删除完全成交的Maker:
        if (maker.unfilledQuantity.signum() == 0) {
            orderService.removeOrder(maker.id);
        }
    }
    // 删除完全成交的Taker:
    if (taker.unfilledQuantity.signum() == 0) {
        orderService.removeOrder(taker.id);
    }
}
```

当用户取消订单时，`ClearingService`需要取消订单冻结的USD或BTC，然后将订单从`OrderService`中删除：

```
public void clearCancelOrder(OrderEntity order) {
    switch (order.direction) {
    case BUY -> {
        // 解冻USD = 价格 x 未成交数量
        assetService.unfreeze(order.userId, AssetEnum.USD, order.price.multiply(order.unfilledQuantity));
    }
    case SELL -> {
        // 解冻BTC = 未成交数量
        assetService.unfreeze(order.userId, AssetEnum.BTC, order.unfilledQuantity);
    }
    default -> throw new IllegalArgumentException("Invalid direction.");
    }
    // 从OrderService中删除订单:
    orderService.removeOrder(order.id);
}
```

这样，我们就完成了清算系统的实现。

下面是问题解答。

### 如果有手续费，如何清算？

如果有交易手续费，则首先需要思考：手续费应该定义在哪？

如果我们把手续费定义为一个配置，注入到`ClearingService`：

```java
public class ClearingService {
    @Value("${exchange.fee-rate:0.0005}")
    BigDecimal feeRate;
}
```

那么问题来了：对于同一个订单输入序列，设定手续费为万分之五，和设定手续费为万分之二，执行后交易引擎的状态和输出结果是*不同*的！这就使得交易引擎不再是一个确定性状态机，无法重复执行交易序列。

此外，不同用户通常可以有不同的交易费率，例如机构的费率比个人低，做市商的费率可以为0。

要支持不同用户不同的费率，以及保证交易引擎是一个确定性状态机，手续费必须作为订单的一个不变属性，从外部输入，这样交易引擎不再关心如何读取费率。

带手续费的订单在创建时，针对买单，冻结金额不再是价格x数量，而是：

```java
freeze = order.price * order.quantity * (1 + order.feeRate)
```

首先，需要修改`OrderService`创建订单时的冻结逻辑。其次，在清算时，除了买卖双方交换资产，还需要设定一个系统用户，专门接收手续费，将买方手续费从冻结的金额转入系统手续费用户，而卖方获得转入的金额会扣除手续费。

### 可以为挂单和吃单设置不同的手续费率吗？

可以，需要给订单添加两个费率属性：`takerFeeRate`和`makerFeeRate`，买方下单冻结时，额外冻结的金额按`takerFeeRate`冻结。

清算逻辑会复杂一些，要针对Taker和Maker分别计算不同的费率。

### 可以设置负费率吗？

可以，通常可以给`makerFeeRate`设置负费率，以鼓励做市。清算逻辑会更复杂一些，因为针对负费率的Maker，需要从系统手续费用户转账给Maker。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-5)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-5/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-5">GitHub</a>

### 小结

清算系统只负责根据撮合引擎输出的结果进行清算，清算的本质就是根据成交价格和数量对买卖双方的对应资产互相划转。清算系统本身没有状态。
