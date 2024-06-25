# 集成JPA

上一节我们讲了在Spring中集成Hibernate。Hibernate是第一个被广泛使用的ORM框架，但是很多小伙伴还听说过JPA：Java Persistence API，这又是啥？

在讨论JPA之前，我们要注意到JavaEE早在1999年就发布了，并且有Servlet、JMS等诸多标准。和其他平台不同，Java世界早期非常热衷于标准先行，各家跟进：大家先坐下来把接口定了，然后，各自回家干活去实现接口，这样，用户就可以在不同的厂家提供的产品进行选择，还可以随意切换，因为用户编写代码的时候只需要引用接口，并不需要引用具体的底层实现（想想JDBC）。

JPA就是JavaEE的一个ORM标准，它的实现其实和Hibernate没啥本质区别，但是用户如果使用JPA，那么引用的就是`jakarta.persistence`这个“标准”包，而不是`org.hibernate`这样的第三方包。因为JPA只是接口，所以，还需要选择一个实现产品，跟JDBC接口和MySQL驱动一个道理。

我们使用JPA时也完全可以选择Hibernate作为底层实现，但也可以选择其它的JPA提供方，比如[EclipseLink](https://www.eclipse.org/eclipselink/)。Spring内置了JPA的集成，并支持选择Hibernate或EclipseLink作为实现。这里我们仍然以主流的Hibernate作为JPA实现为例子，演示JPA的基本用法。

和使用Hibernate一样，我们只需要引入如下依赖：

- org.springframework:spring-context:6.0.0
- org.springframework:spring-orm:6.0.0
- jakarta.annotation:jakarta.annotation-api:2.1.1
- jakarta.persistence:jakarta.persistence-api:3.1.0
- org.hibernate:hibernate-core:6.1.4.Final
- com.zaxxer:HikariCP:5.0.1
- org.hsqldb:hsqldb:2.7.1

实际上我们这里引入的依赖和上一节集成Hibernate引入的依赖完全一样，因为Hibernate既提供了它自己的接口，也提供了JPA接口，我们用JPA接口就相当于通过JPA操作Hibernate。

然后，在`AppConfig`中启用声明式事务管理，创建`DataSource`：

```java
@Configuration
@ComponentScan
@EnableTransactionManagement
@PropertySource("jdbc.properties")
public class AppConfig {
    @Bean
    DataSource createDataSource() { ... }
}
```

使用Hibernate时，我们需要创建一个`LocalSessionFactoryBean`，并让它再自动创建一个`SessionFactory`。使用JPA也是类似的，我们也创建一个`LocalContainerEntityManagerFactoryBean`，并让它再自动创建一个`EntityManagerFactory`：

```java
@Bean
public LocalContainerEntityManagerFactoryBean createEntityManagerFactory(@Autowired DataSource dataSource) {
    var emFactory = new LocalContainerEntityManagerFactoryBean();
    // 注入DataSource:
    emFactory.setDataSource(dataSource);
    // 扫描指定的package获取所有entity class:
    emFactory.setPackagesToScan(AbstractEntity.class.getPackageName());
    // 使用Hibernate作为JPA实现:
    emFactory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
    // 其他配置项:
    var props = new Properties();
    props.setProperty("hibernate.hbm2ddl.auto", "update"); // 生产环境不要使用
    props.setProperty("hibernate.dialect", "org.hibernate.dialect.HSQLDialect");
    props.setProperty("hibernate.show_sql", "true");
    emFactory.setJpaProperties(props);
    return emFactory;
}
```

观察上述代码，除了需要注入`DataSource`和设定自动扫描的`package`外，还需要指定JPA的提供商，这里使用Spring提供的一个`HibernateJpaVendorAdapter`，最后，针对Hibernate自己需要的配置，以`Properties`的形式注入。

最后，我们还需要实例化一个`JpaTransactionManager`，以实现声明式事务：

```java
@Bean
PlatformTransactionManager createTxManager(@Autowired EntityManagerFactory entityManagerFactory) {
    return new JpaTransactionManager(entityManagerFactory);
}
```

这样，我们就完成了JPA的全部初始化工作。有些童鞋可能从网上搜索得知JPA需要`persistence.xml`配置文件，以及复杂的`orm.xml`文件。这里我们负责地告诉大家，使用Spring+Hibernate作为JPA实现，无需任何配置文件。

所有Entity Bean的配置和上一节完全相同，全部采用Annotation标注。我们现在只需关心具体的业务类如何通过JPA接口操作数据库。

还是以`UserService`为例，除了标注`@Component`和`@Transactional`外，我们需要注入一个`EntityManager`，但是不要使用`Autowired`，而是`@PersistenceContext`：

```java
@Component
@Transactional
public class UserService {
    @PersistenceContext
    EntityManager em;
}
```

我们回顾一下JDBC、Hibernate和JPA提供的接口，实际上，它们的关系如下：

| JDBC       | Hibernate      | JPA                  |
|------------|----------------|----------------------|
| DataSource | SessionFactory | EntityManagerFactory |
| Connection | Session        | EntityManager        |

`SessionFactory`和`EntityManagerFactory`相当于`DataSource`，`Session`和`EntityManager`相当于`Connection`。每次需要访问数据库的时候，需要获取新的`Session`和`EntityManager`，用完后再关闭。

但是，注意到`UserService`注入的不是`EntityManagerFactory`，而是`EntityManager`，并且标注了`@PersistenceContext`。难道使用JPA可以允许多线程操作同一个`EntityManager`？

实际上这里注入的并不是真正的`EntityManager`，而是一个`EntityManager`的代理类，相当于：

```java
public class EntityManagerProxy implements EntityManager {
    private EntityManagerFactory emf;
}
```

Spring遇到标注了`@PersistenceContext`的`EntityManager`会自动注入代理，该代理会在必要的时候自动打开`EntityManager`。换句话说，多线程引用的`EntityManager`虽然是同一个代理类，但该代理类内部针对不同线程会创建不同的`EntityManager`实例。

简单总结一下，标注了`@PersistenceContext`的`EntityManager`可以被多线程安全地共享。

因此，在`UserService`的每个业务方法里，直接使用`EntityManager`就很方便。以主键查询为例：

```java
public User getUserById(long id) {
    User user = this.em.find(User.class, id);
    if (user == null) {
        throw new RuntimeException("User not found by id: " + id);
    }
    return user;
}
```

与HQL查询类似，JPA使用JPQL查询，它的语法和HQL基本差不多：

```java
public User fetchUserByEmail(String email) {
    // JPQL查询:
    TypedQuery<User> query = em.createQuery("SELECT u FROM User u WHERE u.email = :e", User.class);
    query.setParameter("e", email);
    List<User> list = query.getResultList();
    if (list.isEmpty()) {
        return null;
    }
    return list.get(0);
}
```

同样的，JPA也支持`NamedQuery`，即先给查询起个名字，再按名字创建查询：

```java
public User login(String email, String password) {
    TypedQuery<User> query = em.createNamedQuery("login", User.class);
    query.setParameter("e", email);
    query.setParameter("pwd", password);
    List<User> list = query.getResultList();
    return list.isEmpty() ? null : list.get(0);
}
```

`NamedQuery`通过注解标注在`User`类上，它的定义和上一节的`User`类一样：

```java
@NamedQueries(
    @NamedQuery(
        name = "login",
        query = "SELECT u FROM User u WHERE u.email=:e AND u.password=:pwd"
    )
)
@Entity
public class User {
    ...
}
```

对数据库进行增删改的操作，可以分别使用`persist()`、`remove()`和`merge()`方法，参数均为Entity Bean本身，使用非常简单，这里不再多述。

### 练习

使用JPA操作数据库。

[下载练习](spring-data-jpa.zip)

### 小结

在Spring中集成JPA要选择一个实现，可以选择Hibernate或EclipseLink；

使用JPA与Hibernate类似，但注入的核心资源是带有`@PersistenceContext`注解的`EntityManager`代理类。
