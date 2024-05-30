# 聚合查询

如果我们要统计一张表的数据量，例如，想查询`students`表一共有多少条记录，难道必须用`SELECT * FROM students`查出来然后再数一数有多少行吗？

这个方法当然可以，但是比较弱智。对于统计总数、平均数这类计算，SQL提供了专门的聚合函数，使用聚合函数进行查询，就是聚合查询，它可以快速获得结果。

仍然以查询`students`表一共有多少条记录为例，我们可以使用SQL内置的`COUNT()`函数查询：

```x-sql
-- 使用聚合查询:
SELECT COUNT(*) FROM students;
```

`COUNT(*)`表示查询所有列的行数，要注意聚合的计算结果虽然是一个数字，但查询的结果仍然是一个二维表，只是这个二维表只有一行一列，并且列名是`COUNT(*)`。

通常，使用聚合查询时，我们应该给列名设置一个别名，便于处理结果：

```x-sql
-- 使用聚合查询并设置结果集的列名为num:
SELECT COUNT(*) num FROM students;
```

`COUNT(*)`和`COUNT(id)`实际上是一样的效果。另外注意，聚合查询同样可以使用`WHERE`条件，因此我们可以方便地统计出有多少男生、多少女生、多少80分以上的学生等：

```x-sql
-- 使用聚合查询并设置WHERE条件:
SELECT COUNT(*) boys FROM students WHERE gender = 'M';
```

除了`COUNT()`函数外，SQL还提供了如下聚合函数：

| 函数 | 说明 |
|-----|-----|
| SUM | 计算某一列的合计值，该列必须为数值类型 |
| AVG | 计算某一列的平均值，该列必须为数值类型 |
| MAX | 计算某一列的最大值 |
| MIN | 计算某一列的最小值 |

注意，`MAX()`和`MIN()`函数并不限于数值类型。如果是字符类型，`MAX()`和`MIN()`会返回排序最后和排序最前的字符。

要统计男生的平均成绩，我们用下面的聚合查询：

```x-sql
-- 使用聚合查询计算男生平均成绩:
SELECT AVG(score) average FROM students WHERE gender = 'M';
```

要特别注意：如果聚合查询的`WHERE`条件没有匹配到任何行，`COUNT()`会返回0，而`SUM()`、`AVG()`、`MAX()`和`MIN()`会返回`NULL`：

```x-sql
-- WHERE条件gender = 'X'匹配不到任何行:
SELECT AVG(score) average FROM students WHERE gender = 'X';
```

```question type=radio
每页3条记录，如何通过聚合查询获得总页数？
----
    SELECT COUNT(*) / 3 FROM students;
    SELECT FLOOR(COUNT(*) / 3) FROM students;
[x] SELECT CEILING(COUNT(*) / 3) FROM students;
```

### 分组

如果我们要统计一班的学生数量，我们知道，可以用`SELECT COUNT(*) num FROM students WHERE class_id = 1;`。如果要继续统计二班、三班的学生数量，难道必须不断修改`WHERE`条件来执行`SELECT`语句吗？

对于聚合查询，SQL还提供了“分组聚合”的功能。我们观察下面的聚合查询：

```x-sql
-- 按class_id分组:
SELECT COUNT(*) num FROM students GROUP BY class_id;
```

执行这个查询，`COUNT()`的结果不再是一个，而是3个，这是因为，`GROUP BY`子句指定了按`class_id`分组，因此，执行该`SELECT`语句时，会把`class_id`相同的列先分组，再分别计算，因此，得到了3行结果。

但是这3行结果分别是哪三个班级的，不好看出来，所以我们可以把`class_id`列也放入结果集中：

```x-sql
-- 按class_id分组:
SELECT class_id, COUNT(*) num FROM students GROUP BY class_id;
```

这下结果集就可以一目了然地看出各个班级的学生人数。我们再试试把`name`放入结果集：

```x-sql
-- 按class_id分组:
SELECT name, class_id, COUNT(*) num FROM students GROUP BY class_id;
```

不出意外，执行这条查询我们会得到一个语法错误，因为在任意一个分组中，只有`class_id`都相同，`name`是不同的，SQL引擎不能把多个`name`的值放入一行记录中。因此，聚合查询的列中，只能放入分组的列。

```alert type=warning title=注意
AlaSQL并没有严格执行SQL标准，上述SQL在浏览器可以正常执行，但是在MySQL、Oracle等环境下将报错，请自行在MySQL中测试。
```

也可以使用多个列进行分组。例如，我们想统计各班的男生和女生人数：

```x-sql
-- 按class_id, gender分组:
SELECT class_id, gender, COUNT(*) num FROM students GROUP BY class_id, gender;
```

上述查询结果集一共有6条记录，分别对应各班级的男生和女生人数。

### 练习

请使用一条SELECT查询查出每个班级的平均分：

```x-sql
-- 查出每个班级的平均分，结果集应当有3条记录:
SELECT 'TODO';
```

请使用一条SELECT查询查出每个班级男生和女生的平均分：

```x-sql
-- 查出每个班级的平均分，结果集应当有6条记录:
SELECT 'TODO';
```

### 小结

使用SQL提供的聚合查询，我们可以方便地计算总数、合计值、平均值、最大值和最小值；

聚合查询可以用`GROUP BY`分组聚合；

聚合查询也可以添加`WHERE`条件。
