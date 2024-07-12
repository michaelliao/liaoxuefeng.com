# 实现JdbcTemplate

本节我们来实现JdbcTemplate。在Spring中，通过JdbcTemplate，基本封装了所有JDBC操作，可以覆盖绝大多数数据库操作的场景。

### 配置DataSource

使用JdbcTemplate之前，我们需要配置JDBC数据源。Spring本身只提供了基础的`DriverManagerDataSource`，但Spring Boot有一个默认配置的数据源，并采用HikariCP作为连接池。这里我们仿照Spring Boot的方式，先定义默认的数据源配置项：

```yaml
summer:
  datasource:
    url: jdbc:sqlite:test.db
    driver-class-name: org.sqlite.JDBC
    username: sa
    password: 
```

再实现一个HikariCP支持的`DataSource`：

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
        var config = new HikariConfig();
        config.setAutoCommit(false);
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        if (driver != null) {
            config.setDriverClassName(driver);
        }
        config.setMaximumPoolSize(maximumPoolSize);
        config.setMinimumIdle(minimumPoolSize);
        config.setConnectionTimeout(connTimeout);
        return new HikariDataSource(config);
    }
}
```

这样，客户端引入`JdbcConfiguration`就自动获得了数据源：

```java
@Import(JdbcConfiguration.class)
@ComponentScan
@Configuration
public class AppConfig {
}
```

### 定义JdbcTemplate

下一步是定义`JdbcTemplate`，唯一依赖是注入`DataSource`：

```java
public class JdbcTemplate {
    final DataSource dataSource;

    public JdbcTemplate(DataSource dataSource) {
        this.dataSource = dataSource;
    }
}
```

JdbcTemplate基于[Template模式](../../../java/design-patterns/behavioral/template-method/index.html)，提供了大量以回调作为参数的模板方法，其中以`execute(ConnectionCallback)`为基础：

```java
public <T> T execute(ConnectionCallback<T> action) {
    try (Connection newConn = dataSource.getConnection()) {
        T result = action.doInConnection(newConn);
        return result;
    } catch (SQLException e) {
        throw new DataAccessException(e);
    }
}
```

即由`JdbcTemplate`处理获取连接、释放连接、捕获SQLException，上层代码专注于使用`Connection`：

```java
@FunctionalInterface
public interface ConnectionCallback<T> {
    @Nullable
    T doInConnection(Connection con) throws SQLException;
}
```

其他方法其实也是基于`execute(ConnectionCallback)`，例如：

```java
public <T> T execute(PreparedStatementCreator psc, PreparedStatementCallback<T> action) {
    return execute((Connection con) -> {
        try (PreparedStatement ps = psc.createPreparedStatement(con)) {
            return action.doInPreparedStatement(ps);
        }
    });
}
```

上述代码实现了`ConnectionCallback`，内部又调用了传入的`PreparedStatementCreator`和`PreparedStatementCallback`，这样，基于更新操作的`update`就可以这么写：

```java
public int update(String sql, Object... args) {
    return execute(
        preparedStatementCreator(sql, args),
        (PreparedStatement ps) -> {
            return ps.executeUpdate();
        }
    );
}
```

基于查询操作的`queryForList()`就可以这么写：

```java
public <T> List<T> queryForList(String sql, RowMapper<T> rowMapper, Object... args) {
    return execute(preparedStatementCreator(sql, args),
        (PreparedStatement ps) -> {
            List<T> list = new ArrayList<>();
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(rowMapper.mapRow(rs, rs.getRow()));
                }
            }
            return list;
        }
    );
}
```

剩下的一系列查询方法都是基于上述方法的封装，包括：

- queryForList(String sql, RowMapper rowMapper, Object... args)
- queryForList(String sql, Class clazz, Object... args)
- queryForNumber(String sql, Object... args)

总之，就是一个工作量的问题，开发难度基本为0。

测试时，可以使用Sqlite这个轻量级数据库，测试用例覆盖到各种SQL操作，最后把`JdbcTemplate`加入到`JdbcConfiguration`中，就基本完善了。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/step-by-step/jdbc-template)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/step-by-step/jdbc-template)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/step-by-step/jdbc-template">GitHub</a>
