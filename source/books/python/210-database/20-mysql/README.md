# 使用MySQL

MySQL是Web世界中使用最广泛的数据库服务器。SQLite的特点是轻量级、可嵌入，但不能承受高并发访问，适合桌面和移动应用。而MySQL是为服务器端设计的数据库，能承受高并发访问，同时占用的内存也远远大于SQLite。

此外，MySQL内部有多种数据库引擎，最常用的引擎是支持数据库事务的InnoDB。

### 安装MySQL

可以直接从MySQL官方网站下载最新的[Community Server 8.x](https://dev.mysql.com/downloads/mysql/)版本。MySQL是跨平台的，选择对应的平台下载安装文件，安装即可。

安装时，MySQL会提示输入`root`用户的口令，请务必记清楚。如果怕记不住，就把口令设置为`password`。

在Windows上，安装时请选择`UTF-8`编码，以便正确地处理中文。

在Mac或Linux上，需要编辑MySQL的配置文件，把数据库默认的编码全部改为UTF-8。MySQL的配置文件默认存放在`/etc/my.cnf`或者`/etc/mysql/my.cnf`：

```
[client]
default-character-set = utf8mb4

[mysqld]
default-storage-engine = INNODB
character-set-server = utf8mb4
collation-server = utf8_general_ci
```

重启MySQL后，可以通过MySQL的客户端命令行检查编码：

```
$ mysql -u root -p
Enter password: 
Welcome to the MySQL monitor...
...

mysql> show variables like '%char%';
+--------------------------+--------------------------------------+
| Variable_name            | Value                                |
+--------------------------+--------------------------------------+
| character_set_client     | utf8mb4                              |
| character_set_connection | utf8mb4                              |
| character_set_database   | utf8mb4                              |
| character_set_filesystem | binary                               |
| character_set_results    | utf8mb4                              |
| character_set_server     | utf8mb4                              |
| character_set_system     | utf8mb3                              |
| character_sets_dir       | /usr/local/mysql-8.x/share/charsets/ |
+--------------------------+--------------------------------------+
8 rows in set (0.00 sec)
```

看到`utf8mb4`字样就表示编码设置正确。

```alert type=notice title=注意
如果MySQL的版本<5.5.3，则只能把编码设置为`utf8`，`utf8mb4`支持最新的Unicode标准，可以显示emoji字符，但`utf8`无法显示emoji字符。
```

### 用Docker启动MySQL

如果不想安装MySQL，还可以以Docker的方式快速启动MySQL。

首先安装[Docker Desktop](https://www.docker.com/products/docker-desktop/)，然后在命令行输入：

```plain
$ docker run -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 --name mysql-8.4 -v ./mysql-data:/var/lib/mysql mysql:8.4 --mysql-native-password=ON --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

上述命令详细参数如下：

- `-e MYSQL_ROOT_PASSWORD=password`：传入root用户口令的环境变量，密码是`password`；
- `-p 3306:3306`：在本机`3306`端口监听；
- `--name mysql-8.4`：启动后容器的名称为`mysql-8.4`，可任意设置；
- `-v ./mysql-data:/var/lib/mysql`：把当前目录`./mysql-data`映射到容器目录`/var/lib/mysql`，此目录存放MySQL数据库文件，避免容器停止后数据丢失；
- `mysql:8.4`：启动镜像名称为`mysql:8.4`；
- `--mysql-native-password=ON`：表示启用明文口令；
- `--character-set-server=utf8mb4`：表示启用`utf8mb4`作为字符集；
- `--collation-server=utf8mb4_unicode_ci`：表示启用`utf8mb4`作为排序规则。

运行命令后可看到如下输出：

```plain
2024-07-11 02:44:05+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.4.1-1.el9 started.
...
2024-07-11T02:44:16.874162Z 0 [System] [MY-015015] [Server] MySQL Server - start.
...
2024-07-11T02:44:17.120017Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2024-07-11T02:44:17.561242Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
...
2024-07-11T02:44:17.868691Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections. Version: '8.4.1'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server - GPL.
```

看到最后一行`ready for connections`表示启动成功。

### 安装MySQL驱动

由于MySQL服务器以独立的进程运行，并通过网络对外服务，所以，需要支持Python的MySQL驱动来连接到MySQL服务器。MySQL官方提供了mysql-connector-python驱动：

```
$ pip install mysql-connector-python 
```

我们演示如何连接到MySQL服务器的test数据库：

```
# 导入MySQL驱动:
>>> import mysql.connector
# 注意把password设为你的root口令:
>>> conn = mysql.connector.connect(user='root', password='password', database='test')
>>> cursor = conn.cursor()
# 创建user表:
>>> cursor.execute('create table user (id varchar(20) primary key, name varchar(20))')
# 插入一行记录，注意MySQL的占位符是%s:
>>> cursor.execute('insert into user (id, name) values (%s, %s)', ['1', 'Michael'])
>>> cursor.rowcount
1
# 提交事务:
>>> conn.commit()
>>> cursor.close()
# 运行查询:
>>> cursor = conn.cursor()
>>> cursor.execute('select * from user where id = %s', ('1',))
>>> values = cursor.fetchall()
>>> values
[('1', 'Michael')]
# 关闭Cursor和Connection:
>>> cursor.close()
True
>>> conn.close()
```

由于Python的DB-API定义都是通用的，所以，操作MySQL的数据库代码和SQLite类似。

### 小结

- 执行INSERT等操作后要调用`commit()`提交事务；
- MySQL的SQL占位符是`%s`。

### 参考源码

[do_mysql.py](do_mysql.py)
