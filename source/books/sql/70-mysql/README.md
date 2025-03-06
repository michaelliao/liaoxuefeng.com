# MySQL

安装完MySQL后，除了MySQL Server，即真正的MySQL服务器外，还附赠一个MySQL Client程序。MySQL Client是一个命令行客户端，可以通过MySQL Client登录MySQL，然后，输入SQL语句并执行。

打开命令提示符，输入命令`mysql -u root -p`，提示输入口令。填入MySQL的root口令，如果正确，就连上了MySQL Server，同时提示符变为`mysql>`：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> mysql -u root -p                │
│Enter password: ******                                   │
│                                                         │
│Server version: 5.7                                      │
│Copyright (c) 2000, 2018, ...                            │
│Type 'help;' or '\h' for help.                           │
│                                                         │
│mysql>                                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

输入`exit`断开与MySQL Server的连接并返回到命令提示符。

```alert type=tip title=提示
MySQL Client的可执行程序是mysql，MySQL Server的可执行程序是mysqld。
```

MySQL Client和MySQL Server的关系如下：

```ascii
┌──────────────┐  SQL   ┌──────────────┐
│ MySQL Client │───────▶│ MySQL Server │
└──────────────┘  TCP   └──────────────┘
```

在MySQL Client中输入的SQL语句通过TCP连接发送到MySQL Server。默认端口号是3306，即如果发送到本机MySQL Server，地址就是`127.0.0.1:3306`。

也可以只安装MySQL Client，然后连接到远程MySQL Server。假设远程MySQL Server的IP地址是`10.0.1.99`，那么就使用`-h`指定IP或域名：

```plain
mysql -h 10.0.1.99 -u root -p
```

### 小结

命令行程序`mysql`实际上是MySQL客户端，真正的MySQL服务器程序是`mysqld`，在后台运行。
