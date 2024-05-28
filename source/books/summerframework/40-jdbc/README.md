# 实现JDBC和事务

我们已经实现了IoC容器和AOP功能，在此基础上增加JDBC和事务的支持就比较容易了。

Spring对JDBC数据库的支持主要包括：

1. 提供了一个`JdbcTemplate`和`NamedParameterJdbcTemplate`模板类，可以方便地操作JDBC；
2. 支持流行的ORM框架，如Hibernate、JPA等；
3. 支持声明式事务，只需要通过简单的注解配置即可实现事务管理。

在Summer Framework中，我们准备提供一个`JdbcTemplate`模板，以及声明式事务的支持。对于ORM，反正手动集成也比较容易，就不管了。

|                            | Spring Framework | Summer Framework |
|----------------------------|------------------|------------------|
| JdbcTemplate               | 支持 | 支持  |
| NamedParameterJdbcTemplate | 支持 | 不支持 |
| 转换SQL错误码                | 支持 | 不支持 |
| ORM                        | 支持 | 不支持 |
| 手动管理事务                 | 支持 | 不支持 |
| 声明式事务                   | 支持 | 支持  |

下面开始正式开发Summer Framework的`JdbcTemplate`与声明式事务。
