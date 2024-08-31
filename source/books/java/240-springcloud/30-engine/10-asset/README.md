# 设计资产系统

在交易系统中，用户资产是指用户以各种方式将USD、BTC充入交易所后的余额。本节我们来实现一个用户资产系统。

用户在买入BTC时，需要花费USD，而卖出BTC后，获得USD。当用户下单买入时，系统会先冻结对应的USD金额；当用户下单卖出时，系统会先冻结对应的BTC。之所以需要有冻结这一操作，是因为判断能否下单成功，是根据用户的可用资产判断。每下一个新的订单，就会有一部分可用资产被冻结，因此，用户资产本质上是一个由用户ID和资产ID标识的二维表：

| 用户ID | 资产ID | 可用 | 冻结 |
|-------|--------|-----:|----:|
|    101 | USD   | 8900.3 | 1200 |
|    101 | BTC   |    500 | 0 |
|    102 | USD   |  12800 | 0 |
|    103 | BTC   |      0 | 50 |

上述二维表有一个缺陷，就是对账很困难，因为缺少了一个关键的负债账户。对任何一个资产管理系统来说，要时刻保证整个系统的资产负债表为零。

对交易所来说，用户拥有的USD和BTC就是交易所的系统负债，只需引入一个负债账户，记录所有用户权益，就可以保证整个系统的资产负债表为零。假设负债账户以ID为1的系统用户表示，则用户资产表如下：

| 用户ID | 资产ID | 可用 | 冻结 |
|-------|--------|-----:|----:|
|      1 | USD   | -22900.3 | 0 |
|      1 | BTC   |     -550 | 0 |
|    101 | USD   | 8900.3 | 1200 |
|    101 | BTC   |    500 | 0 |
|    102 | USD   |  12800 | 0 |
|    103 | BTC   | 0 | 50 |

引入了负债账户后，我们就可以定义资产的数据结构了。

在数据库中，上述表结构就是资产表的结构，将用户ID和资产ID标记为联合主键即可。

但是在内存中，我们怎么定义资产结构呢？

可以使用一个两层的`ConcurrentMap`定义如下：

```java
// 用户ID -> (资产ID -> Asset)
ConcurrentMap<Long, ConcurrentMap<AssetEnum, Asset>> userAssets = new ConcurrentHashMap<>();
```

第一层`Map`的Key是用户ID，第二层`Map`的Key是资产ID，这样就可以用`Asset`结构表示资产：

```java
public class Asset {
    // 可用余额:
    BigDecimal available;
    // 冻结余额:
    BigDecimal frozen;

    public Assets() {
        this(BigDecimal.ZERO, BigDecimal.ZERO);
    }

    public Assets(BigDecimal available, BigDecimal frozen) {
        this.available = available;
        this.frozen = frozen;
    }
}
```

下一步，我们在`AssetService`上定义对用户资产的操作。实际上，所有资产操作只有一种操作，即转账。转账类型可用`Transfer`定义为枚举类：

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
public boolean tryTransfer(Transfer type, Long fromUser, Long toUser, AssetEnum assetId, BigDecimal amount, boolean checkBalance) {
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
public void transfer(Transfer type, Long fromUser, Long toUser, AssetEnum assetId, BigDecimal amount) {
    if (!tryTransfer(type, fromUser, toUser, assetId, amount, true)) {
        throw new RuntimeException("Transfer failed");
    }
}
```

冻结操作可在`tryTransfer()`基础上封装一个方法：

```java
public boolean tryFreeze(Long userId, AssetEnum assetId, BigDecimal amount) {
    return tryTransfer(Transfer.AVAILABLE_TO_FROZEN, userId, userId, assetId, amount, true);
}
```

解冻操作实际上也是在`tryTransfer()`基础上封装：

```java
public void unfreeze(Long userId, AssetEnum assetId, BigDecimal amount) {
    if (!tryTransfer(Transfer.FROZEN_TO_AVAILABLE, userId, userId, assetId, amount, true)) {
        throw new RuntimeException("Unfreeze failed");
    }
}
```

可以编写一个`AssetServiceTest`，测试各种转账操作：

```java
public class AssetServiceTest {
    @Test
    void tryTransfer() {
        // TODO...
    }
}
```

并验证在任意操作后，所有用户资产的各余额总和为`0`。

最后是问题解答：

### 为什么不使用数据库？

因为我们要实现的交易引擎是100%全内存交易引擎，因此所有用户资产均存放在内存中，无需访问数据库。

### 为什么要使用ConcurrentMap？

使用`ConcurrentMap`并不是为了让多线程并发写入，因为`AssetService`中并没有任何同步锁。对`AssetService`进行写操作必须是单线程，不支持多线程调用`tryTransfer()`。

但是读取Asset支持多线程并发读取，这也是使用`ConcurrentMap`的原因。如果改成`HashMap`，根据不同JDK版本的实现不同，多线程读取`HashMap`可能造成死循环（注意这不是`HashMap`的bug），必须引入同步机制。

### 如何扩展以支持更多的资产类型？

我们在`AssetEnum`中以枚举方式定义了USD和BTC两种资产，如果要扩展到更多资产类型，可以以整型ID作为资产ID，同时需要管理一个资产ID到资产名称的映射，这样可以在业务需要的时候更改资产名称。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-2)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-2/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-2">GitHub</a>

### 小结

本节我们讨论并实现了一个基于内存的高性能的用户资产系统，其核心只有一个`tryTransfer()`转账方法，业务逻辑非常简单。
