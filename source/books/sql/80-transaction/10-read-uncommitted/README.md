# Read Uncommitted

Read Uncommitted是隔离级别最低的一种事务级别。在这种隔离级别下，一个事务会读到另一个事务更新后但未提交的数据，如果另一个事务回滚，那么当前事务读到的数据就是脏数据，这就是脏读（Dirty Read）。

我们来看一个例子。

首先，我们准备好`students`表的数据，该表仅一行记录：

```plain
mysql> select * from students;
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
+----+-------+
1 row in set (0.00 sec)
```

然后，分别开启两个MySQL客户端连接，按顺序依次执行事务A和事务B：

| 时刻 | 事务A | 事务B |
|-----|------|-------|
| 1   | SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; | SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; |
| 2   | BEGIN; | BEGIN; |
| 3   | UPDATE students SET name = 'Bob' WHERE id = 1; | |
| 4   | | SELECT * FROM students WHERE id = 1; |
| 5   | ROLLBACK; | |
| 6   | | SELECT * FROM students WHERE id = 1; |
| 7   | | COMMIT; |

```video ratio=16:9
https://www.bilibili.com/video/BV1w441137qB/
```

当事务A执行完第3步时，它更新了`id=1`的记录，但并未提交，而事务B在第4步读取到的数据就是未提交的数据。

随后，事务A在第5步进行了回滚，事务B再次读取`id=1`的记录，发现和上一次读取到的数据不一致，这就是脏读。

可见，在Read Uncommitted隔离级别下，一个事务可能读取到另一个事务更新但未提交的数据，这个数据有可能是脏数据。
