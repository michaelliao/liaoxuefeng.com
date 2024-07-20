# 如何正确缓存按需创建的记录

缓存是提高程序运行速度的重要手段。一般来说，缓存操作，总是比数据库操作快上一两个数量级，因此，不变化的数据，能缓存就缓存，可以大大减少数据库的查询压力。

本文讨论的是对于按需创建的数据库记录，如何实现缓存？

例如，考察一个按需创建Account并返回其ID的函数：

```java
@Transactional
public Long getAccount(Long userId, String currency) {
    String key = buildCacheKey(userId, currency);
    Long value = getFromCache(key);
    if (value == null) {
        Account account = getOrCreateAccount(userId, currency);
        value = account.id;
        putIntoCache(key, value);
    }
    return value;
} // <- 此处事务可能失败，但insert的记录已写入缓存

Account getOrCreateAccount(Long userId, String currency) {
    Account account = selectFromDb(userId, currency);
    if (account == null) {
        account = insertIntoDb(userId, currency);
    }
    return account;
}
```

乍一看，好像没啥问题。本地测试，一切正常。

但是，真实的环境下，代码可能是并发执行的，这个时候，会出现`INSERT`失败的情况。而只有数据库事务提交的时候，才会报错，此时，缓存已经加进去了，只不过加的缓存记录是无效的，因为稍后的事务回滚，该记录并不会在数据库中存在。

肿么办？

方法一，等事务提交成功后再缓存。问题是，事务什么时候提交？存在嵌套事务的情况下，不一定是getAccount()函数的末尾，有可能是上层调用函数的末尾。

方法二，控制并发，例如，用读写锁。问题是，多进程环境，读写锁只对当前进程起作用，无法限制其他进程。

方法三，用分布式读写锁。想想都头大，没准开销比直接读数据库还大。

每种方法复杂度都挺高。

肿么办？

其实问题的本质在于不存在记录的情况下创建，创建可能失败，但是存在记录的情况下，取到的结果肯定没问题。如果只缓存已存在的记录，问题不就解决了吗？

因此，解决方案是给返回的记录加一个标识：

```java
@Transactional
public Long getAccount(Long userId, String currency) {
    String key = buildCacheKey(userId, currency);
    Long value = getFromCache(key);
    if (value == null) {
        Account account = getOrCreateAccount(userId, currency);
        value = account.id;
        if (! account.newlyCreated) {
            // 如果记录不是新创建的，就缓存:
            putIntoCache(key, value);
        }
    }
    return value;
}

Account getOrCreateAccount(Long userId, String currency) {
    Account account = selectFromDb(userId, currency);
    if (account == null) {
        account = insertIntoDb(userId, currency);
        account.newlyCreated = true; // 标记为新创建的
    }
    return account;
}
```

这个缓存方案略微降低了第一次访问的性能，但是不需要考虑并发问题，也就不需要读写锁，因此代码简单，可靠性却很高。
