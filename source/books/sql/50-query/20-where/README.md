# 条件查询

使用`SELECT * FROM <表名>`可以查询到一张表的所有记录。但是，很多时候，我们并不希望获得所有记录，而是根据条件选择性地获取指定条件的记录，例如，查询分数在80分以上的学生记录。在一张表有数百万记录的情况下，获取所有记录不仅费时，还费内存和网络带宽。

SELECT语句可以通过`WHERE`条件来设定查询条件，查询结果是满足查询条件的记录。例如，要指定条件“分数在80分或以上的学生”，写成`WHERE`条件就是`SELECT * FROM students WHERE score >= 80`。

其中，`WHERE`关键字后面的`score >= 80`就是条件。`score`是列名，该列存储了学生的成绩，因此，`score >= 80`就筛选出了指定条件的记录：

```x-sql
-- 按条件查询students:
SELECT * FROM students WHERE score >= 80;
```

因此，条件查询的语法就是：

```sql
SELECT * FROM <表名> WHERE <条件表达式>
```

条件表达式可以用`<条件1> AND <条件2>`表达满足条件1并且满足条件2。例如，符合条件“分数在80分或以上”，并且还符合条件“男生”，把这两个条件写出来：

- 条件1：根据score列的数据判断：`score >= 80`；
- 条件2：根据gender列的数据判断：`gender = 'M'`，注意`gender`列存储的是字符串，需要用单引号括起来。

就可以写出`WHERE`条件：`score >= 80 AND gender = 'M'`：

```x-sql
-- 按AND条件查询students:
SELECT * FROM students WHERE score >= 80 AND gender = 'M';
```

第二种条件是`<条件1> OR <条件2>`，表示满足条件1或者满足条件2。例如，把上述`AND`查询的两个条件改为`OR`，查询结果就是“分数在80分或以上”或者“男生”，满足任意之一的条件即选出该记录：

```x-sql
-- 按OR条件查询students:
SELECT * FROM students WHERE score >= 80 OR gender = 'M';
```

很显然`OR`条件要比`AND`条件宽松，返回的符合条件的记录也更多。

第三种条件是`NOT <条件>`，表示“不符合该条件”的记录。例如，写一个“不是2班的学生”这个条件，可以先写出“是2班的学生”：`class_id = 2`，再加上`NOT`：`NOT class_id = 2`：

```x-sql
-- 按NOT条件查询students:
SELECT * FROM students WHERE NOT class_id = 2;
```

上述`NOT`条件`NOT class_id = 2`其实等价于`class_id <> 2`，因此，`NOT`查询不是很常用。

要组合三个或者更多的条件，就需要用小括号`()`表示如何进行条件运算。例如，编写一个复杂的条件：分数在80以下或者90以上，并且是男生：

```x-sql
-- 按多个条件查询students:
SELECT * FROM students WHERE (score < 80 OR score > 90) AND gender = 'M';
```

如果不加括号，条件运算按照`NOT`、`AND`、`OR`的优先级进行，即`NOT`优先级最高，其次是`AND`，最后是`OR`。加上括号可以改变优先级。

### 常用的条件表达式

| 条件 | 表达式举例1 | 表达式举例2 | 说明 |
|-----|-----------|------------|-----|
| 使用=判断相等 | score = 80 | name = 'abc' | 字符串需要用单引号括起来 |
| 使用>判断大于 | score > 80 | name > 'abc' | 字符串比较根据ASCII码，中文字符比较根据数据库设置 |
| 使用>=判断大于或相等 | score >= 80 | name >= 'abc' | |
| 使用<判断小于 | score < 80 | name <= 'abc' | |
| 使用<=判断小于或相等 | score <= 80 | name <= 'abc' | |
| 使用<>判断不相等 | score <> 80 | name <> 'abc' | |
| 使用LIKE判断相似 | name LIKE 'ab%' | name LIKE '%bc%' | %表示任意字符，例如'ab%'将匹配'ab'，'abc'，'abcd' |

```question type=checkbox
查询分数在60分(含)～90分(含)之间的学生可以使用的WHERE语句是：
----
    WHERE score >= 60 OR score <= 90
[x] WHERE score >= 60 AND score <= 90
    WHERE score IN (60, 90)
[x] WHERE score BETWEEN 60 AND 90
    WHERE 60 <= score <= 90
```

### 小结

通过`WHERE`条件查询，可以筛选出符合指定条件的记录，而不是整个表的所有记录。
