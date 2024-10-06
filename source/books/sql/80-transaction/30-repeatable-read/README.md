# Repeatable Read

在Repeatable Read隔离级别下，一个事务可能会遇到幻读（Phantom Read）的问题。

幻读是指，在一个事务中，第一次查询某条记录，发现没有，但是，当试图更新这条不存在的记录时，竟然能成功，并且，再次读取同一条记录，它就神奇地出现了。

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
| 1   | SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; | SET TRANSACTION ISOLATION LEVEL REPEATABLE READ; |
| 2   | BEGIN; | BEGIN; |
| 3   | | SELECT * FROM students WHERE id = 99; -- empty |
| 4   | INSERT INTO students (id, name) VALUES (99, 'Bob'); | |
| 5   | COMMIT; | |
| 6   | | SELECT * FROM students WHERE id = 99; -- empty |
| 7   | | UPDATE students SET name = 'Alice' WHERE id = 99; -- 1 row affected |
| 8   | | SELECT * FROM students WHERE id = 99; -- Alice |
| 9   | | COMMIT; |

```video ratio=16:9
https://www.bilibili.com/video/BV1w441137v3/
```

事务B在第3步第一次读取`id=99`的记录时，读到的记录为空，说明不存在`id=99`的记录。随后，事务A在第4步插入了一条`id=99`的记录并提交。事务B在第6步再次读取`id=99`的记录时，读到的记录仍然为空，但是，事务B在第7步试图更新这条不存在的记录时，竟然成功了，并且，事务B在第8步再次读取`id=99`的记录时，记录出现了。

可见，幻读就是没有读到的记录，以为不存在，但其实是可以更新成功的，并且，更新成功后，再次读取，就出现了。
