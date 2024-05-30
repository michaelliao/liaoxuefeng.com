# 基本查询

要查询数据库表的数据，我们使用如下的SQL语句：

```sql
SELECT * FROM <表名>
```

假设表名是`students`，要查询`students`表的所有行，我们用如下SQL语句：

```x-sql
-- 查询students表的所有数据
SELECT * FROM students;
```

使用`SELECT * FROM students`时，`SELECT`是关键字，表示将要执行一个查询，`*`表示“所有列”，`FROM`表示将要从哪个表查询，本例中是`students`表。

该SQL将查询出`students`表的所有数据。注意：查询结果也是一个二维表，它包含列名和每一行的数据。

要查询`classes`表的所有行，我们用如下SQL语句：

```x-sql
-- 查询classes表的所有数据
SELECT * FROM classes;
```

运行上述SQL语句，观察查询结果。

`SELECT`语句其实并不要求一定要有`FROM`子句。我们来试试下面的`SELECT`语句：

```x-sql
-- 计算100+200
SELECT 100+200;
```

上述查询会直接计算出表达式的结果。虽然`SELECT`可以用作计算，但它并不是SQL的强项。但是，不带`FROM`子句的`SELECT`语句有一个有用的用途，就是用来判断当前到数据库的连接是否有效。许多检测工具会执行一条`SELECT 1;`来测试数据库连接。

### 小结

使用SELECT查询的基本语句`SELECT * FROM <表名>`可以查询一个表的所有行和所有列的数据；

SELECT查询的结果是一个二维表。
