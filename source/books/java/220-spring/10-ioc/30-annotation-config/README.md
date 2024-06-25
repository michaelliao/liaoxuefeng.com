# 使用Annotation配置

使用Spring的IoC容器，实际上就是通过类似XML这样的配置文件，把我们自己的Bean的依赖关系描述出来，然后让容器来创建并装配Bean。一旦容器初始化完毕，我们就直接从容器中获取Bean使用它们。

使用XML配置的优点是所有的Bean都能一目了然地列出来，并通过配置注入能直观地看到每个Bean的依赖。它的缺点是写起来非常繁琐，每增加一个组件，就必须把新的Bean配置到XML中。

有没有其他更简单的配置方式呢？

有！我们可以使用Annotation配置，可以完全不需要XML，让Spring自动扫描Bean并组装它们。

我们把上一节的示例改造一下，先删除XML配置文件，然后，给`UserService`和`MailService`添加几个注解。

首先，我们给`MailService`添加一个`@Component`注解：

```java
@Component
public class MailService {
    ...
}
```

这个`@Component`注解就相当于定义了一个Bean，它有一个可选的名称，默认是`mailService`，即小写开头的类名。

然后，我们给`UserService`添加一个`@Component`注解和一个`@Autowired`注解：

```java
@Component
public class UserService {
    @Autowired
    MailService mailService;

    ...
}
```

使用`@Autowired`就相当于把指定类型的Bean注入到指定的字段中。和XML配置相比，`@Autowired`大幅简化了注入，因为它不但可以写在`set()`方法上，还可以直接写在字段上，甚至可以写在构造方法中：

```java
@Component
public class UserService {
    MailService mailService;

    public UserService(@Autowired MailService mailService) {
        this.mailService = mailService;
    }
    ...
}
```

我们一般把`@Autowired`写在字段上，通常使用package权限的字段，便于测试。

最后，编写一个`AppConfig`类启动容器：

```java
@Configuration
@ComponentScan
public class AppConfig {
    public static void main(String[] args) {
        ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
        UserService userService = context.getBean(UserService.class);
        User user = userService.login("bob@example.com", "password");
        System.out.println(user.getName());
    }
}
```

除了`main()`方法外，`AppConfig`标注了`@Configuration`，表示它是一个配置类，因为我们创建`ApplicationContext`时：

```java
ApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
```

使用的实现类是`AnnotationConfigApplicationContext`，必须传入一个标注了`@Configuration`的类名。

此外，`AppConfig`还标注了`@ComponentScan`，它告诉容器，自动搜索当前类所在的包以及子包，把所有标注为`@Component`的Bean自动创建出来，并根据`@Autowired`进行装配。

整个工程结构如下：

```ascii
spring-ioc-annoconfig
├── pom.xml
└── src
    └── main
        └── java
            └── com
                └── itranswarp
                    └── learnjava
                        ├── AppConfig.java
                        └── service
                            ├── MailService.java
                            ├── User.java
                            └── UserService.java
```

使用Annotation配合自动扫描能大幅简化Spring的配置，我们只需要保证：

- 每个Bean被标注为`@Component`并正确使用`@Autowired`注入；
- 配置类被标注为`@Configuration`和`@ComponentScan`；
- 所有Bean均在指定包以及子包内。

使用`@ComponentScan`非常方便，但是，我们也要特别注意包的层次结构。通常来说，启动配置`AppConfig`位于自定义的顶层包（例如`com.itranswarp.learnjava`），其他Bean按类别放入子包。

### 思考

如果我们想给`UserService`注入`HikariDataSource`，但是这个类位于`com.zaxxer.hikari`包中，并且`HikariDataSource`也不可能有`@Component`注解，如何告诉IoC容器创建并配置`HikariDataSource`？或者换个说法，如何创建并配置一个第三方Bean？

### 练习

使用Annotation配置IoC容器。

[下载练习](spring-ioc-annoconfig.zip)

### 小结

使用Annotation可以大幅简化配置，每个Bean通过`@Component`和`@Autowired`注入；

必须合理设计包的层次结构，才能发挥`@ComponentScan`的威力。
