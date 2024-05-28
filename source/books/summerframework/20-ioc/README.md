# 实现IoC容器

Spring的核心就是能管理一组Bean，并能自动配置依赖关系的IoC容器。而我们的Summer Framework的核心context模块就是要实现IoC容器。

### 设计目标

Spring的IoC容器分为两类：BeanFactory和ApplicationContext，前者总是延迟创建Bean，而后者则在启动时初始化所有Bean。实际使用时，99%都采用ApplicationContext，因此，Summer Framework仅实现ApplicationContext，不支持BeanFactory。

早期的Spring容器采用XML来配置Bean，后期又加入了自动扫描包的功能，即通过`<context:component-scan base-package="org.example"/>`的配置。再后来，又加入了Annotation配置，并通过`@ComponentScan`注解实现自动扫描。如果使用Spring Boot，则99%都采用`@ComponentScan`注解方式配置，因此，Summer Framework也仅实现Annotation配置+`@ComponentScan`扫描方式完成容器的配置。

此外，Summer Framework仅支持Singleton类型的Bean，不支持Prototype类型的Bean，因为实际使用中，99%都采用Singleton。依赖注入则与Spring保持一致，支持构造方法、Setter方法与字段注入。支持`@Configuration`和`BeanPostProcessor`。至于Spring的其他功能，例如，层级容器、MessageSource、一个Bean允许多个名字等功能，一概不支持！

下表列出了Spring Framework和Summer Framework在IoC容器方面的异同：

| 功能    | Spring Framework | Summer Framework |
|--------|------------------|------------------|
| IoC容器 | 支持BeanFactory和ApplicationContext | 仅支持ApplicationContext |
| 配置方式 | 支持XML与Annotation | 仅支持Annotation |
| 扫描方式 | 支持按包名扫描 | 支持按包名扫描 |
| Bean类型 | 支持Singleton和Prototype | 仅支持Singleton |
| Bean工厂 | 支持FactoryBean和@Bean注解 | 仅支持@Bean注解 |
| 定制Bean | 支持BeanPostProcessor | 支持BeanPostProcessor |
| 依赖注入 | 支持构造方法、Setter方法与字段 | 支持构造方法、Setter方法与字段 |
| 多容器 | 支持父子容器 | 不支持 |

### Annotation配置

从使用者的角度看，使用IoC容器时，需要定义一个入口配置，它通常长这样：

```java
@ComponentScan
public class AppConfig {
}
```

`AppConfig`只是一个配置类，它的目的是通过`@ComponentScan`来标识要扫描的Bean的包。如果没有明确写出包名，那么将基于`AppConfig`所在包进行扫描，如果明确写出了包名，则在指定的包下进行扫描。

在扫描过程中，凡是带有注解`@Component`的类，将被添加到IoC容器进行管理：

```java
@Component
public class Hello {
}
```

我们用到的许多第三方组件也经常会纳入IoC容器管理。这些第三方组件是不可能带有`@Component`注解的，引入第三方Bean只能通过工厂模式，即在`@Configuration`工厂类中定义带`@Bean`的工厂方法：

```java
@Configuration
public class DbConfig {
    @Bean
    DataSource createDataSource(...) {
        return new HikariDataSource(...);
    }

    @Bean
    JdbcTemplate createJdbcTemplate(...) {
        return new JdbcTemplate(...);
    }
}
```

基于Annotation配置的IoC容器基本用法就是上面所述。下面，我们就一步一步来实现IoC容器。
