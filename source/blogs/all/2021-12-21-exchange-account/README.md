# 证券交易系统用户资产的设计

在《[证券交易系统撮合引擎的设计](../2021-12-10-exchange-match-engine/index.html)》一文中，我们已经实现了一个最简单的完整的撮合引擎。但是光有撮合引擎是不够的，撮合引擎能处理订单的前提，是用户根据他的资产（法币和证券）来决定买卖。因此，我们还需要一个用户资产管理系统。

用户在买入证券时，需要花费法币，而卖出证券后，获得法币。在A股交易的老股民都知道，下单买入时，系统会先冻结对应的金额，下单卖出时，系统会先冻结对应的证券。之所以需要有冻结这一操作，是因为判断能否下单成功，是根据用户的可用资产判断。每下一个新的订单，就会有一部分可用资产被冻结，因此，用户资产本质上是一个由用户ID和资产ID标识的二维表：

| 用户ID | 资产ID | 可用 | 冻结 |
|-------|-------|-------:|-----:|
|   101 | FIAT  | 8900.3 | 1200 |
|   101 | STOCK |    500 |    0 |
|   102 | FIAT  |  12800 |    0 |
|   103 | STOCK |      0 |   50 |

上述二维表有一个缺陷，就是对账很困难，因为缺少了一个关键的负债账户。对任何一个资产管理系统来说，要时刻保证整个系统的资产负债表为零。

对交易所来说，用户拥有的法币和证券就是交易所的系统负债，只需引入一个负债账户，记录所有用户权益，就可以保证整个系统的资产负债表为零。假设负债账户以ID为1的系统用户表示，则用户资产表如下：

| 用户ID | 资产ID | 可用 | 冻结 |
|-------|-------|---------:|-----:|
|     1 | FIAT  | -23400.3 |    0 |
|     1 | STOCK |     -550 |    0 |
|   101 | FIAT  |   8900.3 | 1200 |
|   101 | STOCK |      500 |    0 |
|   102 | FIAT  |    12800 |    0 |
|   103 | STOCK |        0 |   50 |

引入了负债账户后，我们就可以定义资产的数据结构了。

在数据库中，上述表结构就是资产表的结构，将用户ID和资产ID标记为联合主键即可。

但是在内存中，我们怎么定义资产结构呢？

可以使用一个两层的`ConcurrentMap`定义如下：

```java
// 用户ID -> (资产ID -> Asset)
ConcurrentMap<Long, ConcurrentMap<String, Asset>> userAssets = new ConcurrentHashMap<>();
```

第一层`Map`的Key是用户ID，第二层`Map`的Key是资产ID，这样就可以用`Asset`结构表示资产：

```java
public class Asset {
    // 可用余额:
    BigDecimal available;
    // 冻结余额:
    BigDecimal frozen;

    public Asset() {
        this(BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public Asset(BigDecimal available, BigDecimal frozen) {
        this.available = available;
        this.frozen = frozen;
    }
}
```

下一步我们在`AssetService`上定义对用户资产的操作。实际上，所有资产操作只有一种操作，即转账。转账类型可用`Transfer`定义为枚举类：

```java
public enum Transfer {
    // 可用转可用:
    AVAILABLE_TO_AVAILABLE,
    // 可用转冻结:
    AVAILABLE_TO_FROZEN,
    // 冻结转可用:
    FROZEN_TO_AVAILABLE;
}
```

转账操作只需要一个`tryTransfer()`方法，实现如下：

```java
/**
 * @param type         转账类型
 * @param fromUser     源用户ID
 * @param toUser       目标用户ID
 * @param assetId      资产ID
 * @param amount       转账金额
 * @param checkBalance 是否检查余额足够
 * @return 成功返回true，失败返回false
 */
public boolean tryTransfer(Transfer type, Long fromUser, Long toUser, String assetId, BigDecimal amount, boolean checkBalance) {
    // 转账金额不能为负:
    if (amount.signum() < 0) {
        throw new IllegalArgumentException("Negative amount");
    }
    // 获取源用户资产:
    Asset fromAsset = getAsset(fromUser, assetId);
    if (fromAsset == null) {
        // 资产不存在时初始化用户资产:
        fromAsset = initAssets(fromUser, assetId);
    }
    // 获取目标用户资产:
    Asset toAsset = getAsset(toUser, assetId);
    if (toAsset == null) {
        // 资产不存在时初始化用户资产:
        toAsset = initAssets(toUser, assetId);
    }
    return switch (type) {
    case AVAILABLE_TO_AVAILABLE -> {
        // 需要检查余额且余额不足:
        if (checkBalance && fromAsset.available.compareTo(amount) < 0) {
            // 转账失败:
            yield false;
        }
        // 源用户的可用资产减少:
        fromAsset.available = fromAsset.available.subtract(amount);
        // 目标用户的可用资产增加:
        toAsset.available = toAsset.available.add(amount);
        // 返回成功:
        yield true;
    }
    // 从可用转至冻结:
    case AVAILABLE_TO_FROZEN -> {
        if (checkBalance && fromAsset.available.compareTo(amount) < 0) {
            yield false;
        }
        fromAsset.available = fromAsset.available.subtract(amount);
        toAsset.frozen = toAsset.frozen.add(amount);
        yield true;
    }
    // 从冻结转至可用:
    case FROZEN_TO_AVAILABLE -> {
        if (checkBalance && fromAsset.frozen.compareTo(amount) < 0) {
            yield false;
        }
        fromAsset.frozen = fromAsset.frozen.subtract(amount);
        toAsset.available = toAsset.available.add(amount);
        yield true;
    }
    default -> {
        throw new IllegalArgumentException("invalid type: " + type);
    }
    };
}
```

除了用户存入资产时，需要调用`tryTransfer()`并且不检查余额，因为此操作是从系统负债账户向用户转账，其他常规转账操作均需要检查余额：

```java
public void transfer(Transfer type, Long fromUser, Long toUser, String assetId, BigDecimal amount) {
    if (!tryTransfer(type, fromUser, toUser, assetId, amount, true)) {
        throw new RuntimeException("Transfer failed");
    }
}
```

冻结操作可在`tryTransfer()`基础上封装一个方法：

```java
public boolean tryFreeze(Long userId, String assetId, BigDecimal amount) {
    return tryTransfer(Transfer.AVAILABLE_TO_FROZEN, userId, userId, assetId, amount, true);
}
```

解冻操作实际上也是在`tryTransfer()`基础上封装：

```java
public void unfreeze(Long userId, String assetId, BigDecimal amount) {
    if (!tryTransfer(Transfer.FROZEN_TO_AVAILABLE, userId, userId, assetId, amount, true)) {
        throw new RuntimeException("Unfreeze failed");
    }
}
```

可以编写一个测试，调用各种转账操作：

```java
static final Long USER_A = Users.TRADER;
static final Long USER_B = Users.TRADER + 1;

@Test
public void testAssetService() {
    AssetService assetService = new AssetService();
    assetService.tryTransfer(Transfer.AVAILABLE_TO_AVAILABLE, Users.DEBT, USER_A, "FIAT", bd("12345.67"), false);
    assertBDEquals(bd("12345.67"), assetService.getAsset(USER_A, "FIAT").getAvailable());
    assertBDEquals(bd("-12345.67"), assetService.getAsset(Users.DEBT, "FIAT").getAvailable());

    assetService.tryTransfer(Transfer.AVAILABLE_TO_AVAILABLE, Users.DEBT, USER_B, "FIAT", bd("45678.9"), false);
    assertBDEquals(bd("45678.9"), assetService.getAsset(USER_B, "FIAT").getAvailable());
    assertBDEquals(bd("-58024.57"), assetService.getAsset(Users.DEBT, "FIAT").getAvailable());

    assertFalse(assetService.tryFreeze(USER_A, "FIAT", bd("12345.68")));
    assertTrue(assetService.tryFreeze(USER_A, "FIAT", bd("1234.56")));
    assertBDEquals(bd("11111.11"), assetService.getAsset(USER_A, "FIAT").getAvailable());
    assertBDEquals(bd("1234.56"), assetService.getAsset(USER_A, "FIAT").getFrozen());

    assetService.tryTransfer(Transfer.AVAILABLE_TO_AVAILABLE, Users.DEBT, USER_B, "STOCK", bd("12.34"), false);
    assertBDEquals(bd("12.34"), assetService.getAsset(USER_B, "STOCK").getAvailable());
    assertBDEquals(bd("-12.34"), assetService.getAsset(Users.DEBT, "STOCK").getAvailable());

    assetService.debug();
}
```

打印出内存的用户资产如下：

```ascii
---------- assets ----------
  User 1:
    FIAT: [A = -58024.57, F = 0.00]
    STOCK: [A = -12.34, F = 0.00]
  User 100:
    FIAT: [A = 11111.11, F = 1234.56]
  User 101:
    FIAT: [A = 45678.90, F = 0.00]
    STOCK: [A = 12.34, F = 0.00]
---------- // assets ----------
```

可验证所有资产的各余额总和为0。

最后是问题解答：

为什么不使用数据库？

因为我们要实现的交易引擎是100%全内存交易引擎，因此所有用户资产均存放在内存中，无需访问数据库。

为什么要使用`ConcurrentMap`？

使用`ConcurrentMap`并不是为了让多线程并发写入，因为`AssetService`中并没有任何同步锁。对`AssetService`进行写操作必须是单线程，不支持多线程调用`tryTransfer()`。

但是读取Asset支持多线程并发读取，这也是使用`ConcurrentMap`的原因。如果改成`HashMap`，根据不同JDK版本的实现不同，多线程读取`HashMap`可能造成死循环（注意这不是`HashMap`的bug），必须引入同步机制。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/simple-assets)下载本文源码。

### 小结

本文讨论并实现了一个高性能的用户资产系统，其核心只有一个`tryTransfer()`转账方法，业务逻辑非常简单。
