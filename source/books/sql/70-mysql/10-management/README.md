# 管理MySQL

要管理MySQL，可以使用可视化图形界面[MySQL Workbench](https://dev.mysql.com/downloads/workbench/)。

MySQL Workbench可以用可视化的方式查询、创建和修改数据库表，但是，归根到底，MySQL Workbench是一个图形客户端，它对MySQL的操作仍然是发送SQL语句并执行。因此，本质上，MySQL Workbench和MySQL Client命令行都是客户端，和MySQL交互，唯一的接口就是SQL。

因此，MySQL提供了大量的SQL语句用于管理。虽然可以使用MySQL Workbench图形界面来直接管理MySQL，但是，很多时候，通过SSH远程连接时，只能使用SQL命令，所以，了解并掌握常用的SQL管理操作是必须的。

### 数据库

在一个运行MySQL的服务器上，实际上可以创建多个数据库（Database）。要列出所有数据库，使用命令：

```plain
mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| shici              |
| sys                |
| test               |
| school             |
+--------------------+
```

其中，`information_schema`、`mysql`、`performance_schema`和`sys`是系统库，不要去改动它们。其他的是用户创建的数据库。

注意：在MySQL命令行客户端输入SQL后，记得加一个`;`表示SQL语句结束，再回车就可以执行该SQL语句。虽然有些SQL命令不需要`;`也能执行，但类似`SELECT`等语句不加`;`会让MySQL客户端换行后继续等待输入。如果在图形界面或程序开发中集成SQL则不需要加`;`。

要创建一个新数据库，使用命令：

```plain
mysql> CREATE DATABASE test;
Query OK, 1 row affected (0.01 sec)
```

要删除一个数据库，使用命令：

```plain
mysql> DROP DATABASE test;
Query OK, 0 rows affected (0.01 sec)
```

注意：删除一个数据库将导致该数据库的所有表全部被删除。

对一个数据库进行操作时，要首先将其切换为当前数据库：

```plain
mysql> USE test;
Database changed
```

### 表

列出当前数据库的所有表，使用命令：

```plain
mysql> SHOW TABLES;
+---------------------+
| Tables_in_test      |
+---------------------+
| classes             |
| statistics          |
| students            |
| students_of_class1  |
+---------------------+
```

要查看一个表的结构，使用命令：

```plain
mysql> DESC students;
+----------+--------------+------+-----+---------+----------------+
| Field    | Type         | Null | Key | Default | Extra          |
+----------+--------------+------+-----+---------+----------------+
| id       | bigint(20)   | NO   | PRI | NULL    | auto_increment |
| class_id | bigint(20)   | NO   |     | NULL    |                |
| name     | varchar(100) | NO   |     | NULL    |                |
| gender   | varchar(1)   | NO   |     | NULL    |                |
| score    | int(11)      | NO   |     | NULL    |                |
+----------+--------------+------+-----+---------+----------------+
5 rows in set (0.00 sec)
```

还可以使用以下命令查看创建表的SQL语句：

```plain
mysql> SHOW CREATE TABLE students;
+----------+-------------------------------------------------------+
| students | CREATE TABLE `students` (                             |
|          |   `id` bigint(20) NOT NULL AUTO_INCREMENT,            |
|          |   `class_id` bigint(20) NOT NULL,                     |
|          |   `name` varchar(100) NOT NULL,                       |
|          |   `gender` varchar(1) NOT NULL,                       |
|          |   `score` int(11) NOT NULL,                           |
|          |   PRIMARY KEY (`id`)                                  |
|          | ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 |
+----------+-------------------------------------------------------+
1 row in set (0.00 sec)
```

创建表使用`CREATE TABLE`语句，而删除表使用`DROP TABLE`语句：

```plain
mysql> DROP TABLE students;
Query OK, 0 rows affected (0.01 sec)
```

修改表就比较复杂。如果要给`students`表新增一列`birth`，使用：

```plain
ALTER TABLE students ADD COLUMN birth VARCHAR(10) NOT NULL;
```

要修改`birth`列，例如把列名改为`birthday`，类型改为`VARCHAR(20)`：

```plain
ALTER TABLE students CHANGE COLUMN birth birthday VARCHAR(20) NOT NULL;
```

要删除列，使用：

```plain
ALTER TABLE students DROP COLUMN birthday;
```

### 退出MySQL

使用`EXIT`命令退出MySQL：

```plain
mysql> EXIT
Bye
```

注意`EXIT`仅仅断开了客户端和服务器的连接，MySQL服务器仍然继续运行。
