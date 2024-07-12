# 实现声明式事务

Spring提供的声明式事务管理能极大地降低应用程序的事务代码。如果使用基于Annotation配置的声明式事务，则一个与数据库操作相关的类只需加上`@Transactional`注解，就实现了事务支持，非常方便：

```java
@Transactional
@Component
public class UserService {
}
```

Spring的声明式事务支持JDBC本地事务和JTA分布式事务两种，事务传播模型除了最常用的`REQUIRED`，还包括Java EE定义的`SUPPORTS`、`REQUIRED_NEW`、`NESTED`等多种模式。Summer Framework出于简化目的，仅支持JDBC本地事务，事务传播模型仅支持最常用的`REQUIRED`，这样可以大大简化代码：

|                 | Spring Framework | Summer Framework |
|-----------------|------------------|------------------|
| JDBC事务         | 支持 | 支持  |
| JTA事务          | 支持 | 不支持 |
| REQUIRED传播模式 | 支持 | 支持 |
| 其他传播模式      | 支持 | 不支持 |
| 设置隔离级别      | 支持 | 不支持 |

下面我们就来编写声明式事务管理。

首先定义`@Transactional`，这里就不允许单独在方法处定义，直接在class级别启动所有public方法的事务：

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface Transactional {
    String value() default "platformTransactionManager";
}
```

默认值`platformTransactionManager`表示用名字为`platformTransactionManager`的Bean来管理事务。

下一步是定义接口`PlatformTransactionManager`：

```java
public interface PlatformTransactionManager {
}
```

其实啥也没有，就是一个标识作用。

接着定义`TransactionStatus`，表示当前事务状态：

```java
public class TransactionStatus {
    final Connection connection;

    public TransactionStatus(Connection connection) {
        this.connection = connection;
    }
}
```

目前仅封装了一个Connection，将来如果扩展，则可以将事务的传播模式存储在里面。

最后写个`DataSourceTransactionManager`，它持有一个[ThreadLocal](../../../java/threading/thread-local/index.html)存储的`TransactionStatus`，以及一个`DataSource`：

```java
public class DataSourceTransactionManager implements
        PlatformTransactionManager, InvocationHandler
{
    static final ThreadLocal<TransactionStatus> transactionStatus = new ThreadLocal<>();
    final DataSource dataSource;

    public DataSourceTransactionManager(DataSource dataSource) {
        this.dataSource = dataSource;
    }
}
```

因为`DataSourceTransactionManager`是真正执行开启、提交、回归事务的地方，在哪执行呢？就在`invoke()`内部：

```java
@Override
public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    TransactionStatus ts = transactionStatus.get();
    if (ts == null) {
        // 当前无事务,开启新事务:
        try (Connection connection = dataSource.getConnection()) {
            final boolean autoCommit = connection.getAutoCommit();
            if (autoCommit) {
                connection.setAutoCommit(false);
            }
            try {
                // 设置ThreadLocal状态:
                transactionStatus.set(new TransactionStatus(connection));
                // 调用业务方法:
                Object r = method.invoke(proxy, args);
                // 提交事务:
                connection.commit();
                // 方法返回:
                return r;
            } catch (InvocationTargetException e) {
                // 回滚事务:
                TransactionException te = new TransactionException(e.getCause());
                try {
                    connection.rollback();
                } catch (SQLException sqle) {
                    te.addSuppressed(sqle);
                }
                throw te;
            } finally {
                // 删除ThreadLocal状态:
                transactionStatus.remove();
                if (autoCommit) {
                    connection.setAutoCommit(true);
                }
            }
        }
    } else {
        // 当前已有事务,加入当前事务执行:
        return method.invoke(proxy, args);
    }
}
```

这样就实现了声明式事务。

有的同学会问，如果一个方法开启了事务，那么，它内部调用其他方法，是怎么加入当前事务的？

这里我们先需要写一个获取当前事务连接的工具类：

```java
public class TransactionalUtils {
    @Nullable
    public static Connection getCurrentConnection() {
        TransactionStatus ts = DataSourceTransactionManager.transactionStatus.get();
        return ts == null ? null : ts.connection;
    }
}
```

然后改造下`JdbcTemplate`获取连接的代码：

```java
public class JdbcTemplate {
    public <T> T execute(ConnectionCallback<T> action) throws DataAccessException {
        // 尝试获取当前事务连接:
        Connection current = TransactionalUtils.getCurrentConnection();
        if (current != null) {
            try {
                return action.doInConnection(current);
            } catch (SQLException e) {
                throw new DataAccessException(e);
            }
        }
        // 无事务,从DataSource获取新连接:
        try (Connection newConn = dataSource.getConnection()) {
            return action.doInConnection(newConn);
        } catch (SQLException e) {
            throw new DataAccessException(e);
        }
    }
    ...
}
```

这样，使用`JdbcTemplate`，如果有事务，自动加入当前事务，否则，按普通SQL执行（数据库隐含事务）。

最后，还需要提供一个`TransactionalBeanPostProcessor`，使得AOP机制生效，才能拦截`@Transactional`标注的Bean的public方法：

```java
public class TransactionalBeanPostProcessor extends AnnotationProxyBeanPostProcessor<Transactional> {
}
```

把它们都整理一下，放到`JdbcConfiguration`中：

```java
@Configuration
public class JdbcConfiguration {

    @Bean(destroyMethod = "close")
    DataSource dataSource(
            // properties:
            @Value("${summer.datasource.url}") String url,
            @Value("${summer.datasource.username}") String username,
            @Value("${summer.datasource.password}") String password,
            @Value("${summer.datasource.driver-class-name:}") String driver,
            @Value("${summer.datasource.maximum-pool-size:20}") int maximumPoolSize,
            @Value("${summer.datasource.minimum-pool-size:1}") int minimumPoolSize,
            @Value("${summer.datasource.connection-timeout:30000}") int connTimeout
    ) {
        ...
        return new HikariDataSource(config);
    }

    @Bean
    JdbcTemplate jdbcTemplate(@Autowired DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    @Bean
    TransactionalBeanPostProcessor transactionalBeanPostProcessor() {
        return new TransactionalBeanPostProcessor();
    }

    @Bean
    PlatformTransactionManager platformTransactionManager(@Autowired DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

现在，应用程序只需导入`JdbcConfiguration`，从连接池到声明式事务全部齐活：

```java
@Import(JdbcConfiguration.class)
@ComponentScan
@Configuration
public class AppConfig {
}
```

最后我们总结下各个组件的作用：

1. 由`JdbcConfiguration`创建的`DataSource`，实现了连接池；
2. 由`JdbcConfiguration`创建的`JdbcTemplate`，实现基本SQL操作；
3. 由`JdbcConfiguration`创建的`PlatformTransactionManager`，负责拦截`@Transactional`标识的Bean的public方法，自动管理事务；
4. 由`JdbcConfiguration`创建的`TransactionalBeanPostProcessor`，负责给`@Transactional`标识的Bean创建AOP代理，拦截器正是`PlatformTransactionManager`。

应用程序除了导入一个`JdbcConfiguration`，加上默认配置项，什么也不用干，就可以开始写自动带声明式事务的代码：

```java
@Transactional
@Component
public class UserService {
    @Autowired
    JdbcTemplate jdbcTemplate;

    public User register(String email, String password) {
        jdbcTemplate.update("INSERT INTO ...", ...);
        return ...
    }
}
```

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/framework/summer-jdbc)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/framework/summer-jdbc)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/framework/summer-jdbc">GitHub</a>
