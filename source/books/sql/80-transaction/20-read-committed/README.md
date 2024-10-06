# Read Committed

在Read Committed隔离级别下，一个事务不会读到另一个事务还没有提交的数据，但可能会遇到不可重复读（Non Repeatable Read）的问题。

不可重复读是指，在一个事务内，多次读同一数据，在这个事务还没有结束时，如果另一个事务恰好修改了这个数据，那么，在第一个事务中，两次读取的数据就可能不一致。

我们仍然先准备好`students`表的数据：

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
| 1   | SET TRANSACTION ISOLATION LEVEL READ COMMITTED; | SET TRANSACTION ISOLATION LEVEL READ COMMITTED; |
| 2   | BEGIN; | BEGIN; |
| 3   | | SELECT * FROM students WHERE id = 1; -- Alice |
| 4   | UPDATE students SET name = 'Bob' WHERE id = 1; | |
| 5   | COMMIT; | |
| 6   | | SELECT * FROM students WHERE id = 1; -- Bob |
| 7   | | COMMIT; |

```video ratio=16:9
https://www.bilibili.com/video/BV1w441137bf/
```

当事务B第一次执行第3步的查询时，得到的结果是`Alice`，随后，由于事务A在第4步更新了这条记录并提交，所以，事务B在第6步再次执行同样的查询时，得到的结果就变成了`Bob`，因此，在Read Committed隔离级别下，事务不可重复读同一条记录，因为很可能读到的结果不一致。
