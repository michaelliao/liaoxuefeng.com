# Spring Boot配置多个DataSource

使用Spring Boot时，默认情况下，配置`DataSource`非常容易。Spring Boot会自动为我们配置好一个`DataSource`。

如果在`application.yml`中指定了`spring.datasource`的相关配置，Spring Boot就会使用该配置创建一个`DataSource`。如果在`application.yml`中没有指定任何`spring.datasource`的相关配置，Spring Boot会在classpath中搜索H2、hsqldb等内存数据库的jar包，如果找到了，就会自动配置一个内存数据库的`DataSource`，所以，我们只要引入jar包即可。例如，配置一个hsqldb数据源：

```xml
<dependency>
    <groupId>org.hsqldb</groupId>
    <artifactId>hsqldb</artifactId>
    <scope>runtime</scope>
</dependency>
```

但是，在某些情况下，如果我们需要配置多个数据源，应该如何在Spring Boot中配置呢？

我们以JDBC为例，演示如何在Spring Boot中配置两个`DataSource`。对应的，我们会创建两个`JdbcTemplate`的Bean，分别使用这两个数据源。

首先，我们必须在`application.yml`中声明两个数据源的配置，一个使用`spring.datasource`，另一个使用`spring.second-datasource`：

```yaml
spring:
  application:
    name: data-multidatasource
  datasource:
    driver-class-name: org.hsqldb.jdbc.JDBCDriver
    url: jdbc:hsqldb:mem:db1
    username: sa
    password:
  second-datasource:
    driver-class-name: org.hsqldb.jdbc.JDBCDriver
    url: jdbc:hsqldb:mem:db2
    username: sa
    password:
```

这两个`DataSource`都使用hsqldb，但是数据库是不同的。此外，在使用多数据源的时候，所有必要配置都不能省略。

其次，我们需要自己创建两个`DataSource`的Bean，其中一个标记为`@Primary`，另一个命名为`secondDatasource`：

```java
@Configuration
public class SomeConfiguration {
    @Bean
    @Primary
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource primaryDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "secondDatasource")
    @ConfigurationProperties(prefix = "spring.second-datasource")
    public DataSource secondDataSource() {
        return DataSourceBuilder.create().build();
    }
}
```

对于每一个`DataSource`，我们都必须通过`@ConfigurationProperties(prefix = "xxx")`指定配置项的前缀。

紧接着，我们创建两个`JdbcTemplate`的Bean，其中一个标记为`@Primary`，另一个命名为`secondJdbcTemplate`，分别使用对应的`DataSource`：

```java
@Bean
@Primary
public JdbcTemplate primaryJdbcTemplate(DataSource dataSource) {
    return new JdbcTemplate(dataSource);
}

@Bean(name = "secondJdbcTemplate")
public JdbcTemplate secondJdbcTemplate(@Qualifier("secondDatasource") DataSource dataSource) {
    return new JdbcTemplate(dataSource);
}
```

注意到`secondJdbcTemplate`在创建时，传入的`DataSource`必须用`@Qualifier("secondDatasource")`声明，这样，才能使用第二个`DataSource`。

现在，我们就创建了两个`JdbcTemplate`的`Bean`。在需要使用第一个`JdbcTemplate`的地方，我们直接注入：

```java
@Component
public class SomeService {
    @Autowired
    JdbcTemplate jdbcTemplate;
}
```

在需要使用第二个`JdbcTemplate`的地方，我们注入时需要用`@Qualifier("secondJdbcTemplate")`标识：

```java
@Component
public class AnotherService {
    @Autowired
    @Qualifier("secondJdbcTemplate")
    JdbcTemplate secondJdbcTemplate;
}
```

这样，我们就可以针对不同的数据源，用不同的`JdbcTemplate`进行操作。

### 注意事项

当存在多个相同类型的Bean，例如，多个`DataSource`，多个`JdbcTemplate`时，*强烈建议*总是使用`@Primary`把其中某一个Bean标识为“主要的”，使用`@Autowired`注入时会首先使用被标记为`@Primary`的Bean。

相同类型的其他Bean，每一个都需要用`@Bean(name="xxx")`标识名字，并且，在使用`@Autowired`注入时配合`@Qualifier("xxx")`指定注入的Bean的名字。

完整的示例工程源码请参考：

[https://github.com/michaelliao/springcloud/tree/master/data-multidatasource](https://github.com/michaelliao/springcloud/tree/master/data-multidatasource)
