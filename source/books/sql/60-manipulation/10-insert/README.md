# 插入数据

当我们需要向数据库表中插入一条新记录时，就必须使用`INSERT`语句。

![insert-brain](insert.jpg)

`INSERT`语句的基本语法是：

```sql
INSERT INTO <表名> (字段1, 字段2, ...) VALUES (值1, 值2, ...);
```

例如，我们向`students`表插入一条新记录，先列举出需要插入的字段名称，然后在`VALUES`子句中依次写出对应字段的值：

```x-sql
-- 添加一条新记录:
INSERT INTO students (class_id, name, gender, score) VALUES (2, '大牛', 'M', 80);
-- 查询并观察结果:
SELECT * FROM students;
```

注意到我们并没有列出`id`字段，也没有列出`id`字段对应的值，这是因为`id`字段是一个自增主键，它的值可以由数据库自己推算出来。此外，如果一个字段有默认值，那么在`INSERT`语句中也可以不出现。

要注意，`INSERT`字段顺序不必和数据库表的字段顺序一致，但值的顺序必须和`INSERT`字段顺序一致。也就是说，可以写`INSERT INTO students (score, gender, name, class_id) ...`，但是对应的`VALUES`就得变成`(80, 'M', '大牛', 2)`。

还可以一次性添加多条记录，只需要在`VALUES`子句中指定多个记录值，每个记录是由`(...)`包含的一组值，每组值用逗号`,`分隔：

```x-sql
-- 一次性添加多条新记录:
INSERT INTO students (class_id, name, gender, score) VALUES
  (1, '大宝', 'M', 87),
  (2, '二宝', 'M', 81),
  (3, '三宝', 'M', 83);
-- 查询并观察结果:
SELECT * FROM students;
```

### 小结

使用`INSERT`，我们就可以一次向一个表中插入一条或多条记录。
