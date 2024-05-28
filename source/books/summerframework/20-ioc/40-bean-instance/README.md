# 创建Bean实例

当我们拿到所有`BeanDefinition`之后，就可以开始创建Bean的实例了。

在创建Bean实例之前，我们先看看Spring支持的4种依赖注入模式：

1. 构造方法注入，例如：

```java
@Component
public class Hello {
    JdbcTemplate jdbcTemplate;
    public Hello(@Autowired JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
}
```

2. 工厂方法注入，例如：

```java
@Configuration
public class AppConfig {
    @Bean
    Hello hello(@Autowired JdbcTemplate jdbcTemplate) {
        return new Hello(jdbcTemplate);
    }
}
```

3. Setter方法注入，例如：

```java
@Component
public class Hello {
    JdbcTemplate jdbcTemplate;

    @Autowired
    void setJdbcTemplate(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
}
```

4. 字段注入，例如：

```java
@Component
public class Hello {
    @Autowired
    JdbcTemplate jdbcTemplate;
}
```

然而我们仔细分析，发现这4种注入方式实际上是有区别的。

区别就在于，前两种方式，即构造方法注入和工厂方法注入，Bean的创建与注入是一体的，我们无法把它们分成两个阶段，因为无法中断方法内部代码的执行。而后两种方式，即Setter方法注入和属性注入，Bean的创建与注入是可以分开的，即先创建Bean实例，再用反射调用方法或字段，完成注入。

我们再分析一下循环依赖的问题。循环依赖，即A、B互相依赖，或者A依赖B，B依赖C，C依赖A，形成了一个闭环。IoC容器对Bean进行管理，可以解决部分循环依赖问题，但不是所有循环依赖都能解决。

我们先来看不能解决的循环依赖问题，假定下列代码定义的A、B两个Bean：

```java
class A {
    final B b;
    A(B b) { this.b = b; }
}

class B {
    final A a;
    B(A a) { this.a = a; }
}
```

这种通过构造方法注入依赖的两个Bean，如果存在循环依赖，是无解的，因为我们不用IoC，自己写Java代码也写不出正确创建两个Bean实例的代码。

因此，我们把构造方法注入和工厂方法注入的依赖称为强依赖，不能有强依赖的循环依赖，否则只能报错。

后两种注入方式形成的依赖则是弱依赖，假定下列代码定义的A、B两个Bean：

```java
class A {
    B b;
}

class B {
    A a;
}
```

这种循环依赖则很容易解决，因为我们可以分两步，先分别实例化Bean，再注入依赖：

```java
// 第一步,实例化:
A a = new A();
B b = new B();
// 第二步,注入:
a.b = b;
b.a = a;
```

所以，对于IoC容器来说，创建Bean的过程分两步：

1. 创建Bean的实例，此时必须注入强依赖；
2. 对Bean实例进行Setter方法注入和字段注入。

第一步如果遇到循环依赖则直接报错，第二步则不需要关心有没有循环依赖。

我们先实现第一步：创建Bean的实例，同时注入强依赖。

在上一节代码中，我们已经获得了所有的`BeanDefinition`：

```java
public class AnnotationConfigApplicationContext {
    PropertyResolver propertyResolver;
    Map<String, BeanDefinition> beans;

    public AnnotationConfigApplicationContext(Class<?> configClass, PropertyResolver propertyResolver) {
        this.propertyResolver = propertyResolver;
        // 扫描获取所有Bean的Class类型:
        Set<String> beanClassNames = scanForClassNames(configClass);
        // 创建Bean的定义:
        this.beans = createBeanDefinitions(beanClassNames);
    }
}
```

下一步是创建Bean的实例，同时注入强依赖。此阶段必须检测循环依赖。检测循环依赖其实非常简单，就是定义一个`Set<String>`跟踪当前正在创建的所有Bean的名称：

```java
public class AnnotationConfigApplicationContext {
    Set<String> creatingBeanNames;
    ...
}
```

创建Bean实例我们用方法`createBeanAsEarlySingleton()`实现，在方法开始处检测循环依赖：

```java
// 创建一个Bean，但不进行字段和方法级别的注入。如果创建的Bean不是Configuration，则在构造方法/工厂方法中注入的依赖Bean会自动创建
public Object createBeanAsEarlySingleton(BeanDefinition def) {
    if (!this.creatingBeanNames.add(def.getName())) {
        // 检测到重复创建Bean导致的循环依赖:
        throw new UnsatisfiedDependencyException();
    }
    ...
}
```

由于`@Configuration`标识的Bean实际上是工厂，它们必须先实例化，才能实例化其他普通Bean，所以我们先把`@Configuration`标识的Bean创建出来，再创建普通Bean：

```java
public AnnotationConfigApplicationContext(Class<?> configClass, PropertyResolver propertyResolver) {
    this.propertyResolver = propertyResolver;
    // 扫描获取所有Bean的Class类型:
    Set<String> beanClassNames = scanForClassNames(configClass);
    // 创建Bean的定义:
    this.beans = createBeanDefinitions(beanClassNames);

    // 创建BeanName检测循环依赖:
    this.creatingBeanNames = new HashSet<>();

    // 创建@Configuration类型的Bean:
    this.beans.values().stream()
            // 过滤出@Configuration:
            .filter(this::isConfigurationDefinition).sorted().map(def -> {
                // 创建Bean实例:
                createBeanAsEarlySingleton(def);
                return def.getName();
            }).collect(Collectors.toList());

    // 创建其他普通Bean:
    List<BeanDefinition> defs = this.beans.values().stream()
            // 过滤出instance==null的BeanDefinition:
            .filter(def -> def.getInstance() == null)
            .sorted().collect(Collectors.toList());
    // 依次创建Bean实例:
    defs.forEach(def -> {
        // 如果Bean未被创建(可能在其他Bean的构造方法注入前被创建):
        if (def.getInstance() == null) {
            // 创建Bean:
            createBeanAsEarlySingleton(def);
        }
    });
}
```

剩下的工作就是把`createBeanAsEarlySingleton()`补充完整：

```java
public Object createBeanAsEarlySingleton(BeanDefinition def) {
    // 检测循环依赖:
    if (!this.creatingBeanNames.add(def.getName())) {
        throw new UnsatisfiedDependencyException();
    }

    // 创建方式：构造方法或工厂方法:
    Executable createFn = def.getFactoryName() == null ?
        def.getConstructor() : def.getFactoryMethod();

    // 创建参数:
    Parameter[] parameters = createFn.getParameters();
    Object[] args = new Object[parameters.length];
    for (int i = 0; i < parameters.length; i++) {
        // 从参数获取@Value和@Autowired:
        Value value = ...
        Autowired autowired = ...
        // 检查Value和Autowired
        ...
        // 参数类型:
        Class<?> type = param.getType();
        if (value != null) {
            // 参数设置为查询的@Value:
            args[i] = this.propertyResolver.getRequiredProperty(value.value(), type);
        } else {
            // 参数是@Autowired,查找依赖的BeanDefinition:
            BeanDefinition dependsOnDef = name.isEmpty() ? findBeanDefinition(type) : findBeanDefinition(name, type);
            // 获取依赖Bean的实例:
            Object autowiredBeanInstance = dependsOnDef.getInstance();
            if (autowiredBeanInstance == null) {
                // 当前依赖Bean尚未初始化，递归调用初始化该依赖Bean:
                autowiredBeanInstance = createBeanAsEarlySingleton(dependsOnDef);
            }
            // 参数设置为依赖的Bean实例:
            args[i] = autowiredBeanInstance;
        }
    }
    // 已拿到所有方法参数,创建Bean实例:
    Object instance = ...
    // 设置实例到BeanDefinition:
    def.setInstance(instance);
    // 返回实例:
    return def.getInstance();
}
```

注意到递归调用：

```java
public Object createBeanAsEarlySingleton(BeanDefinition def) {
    ...
    Object[] args = new Object[parameters.length];
    for (int i = 0; i < parameters.length; i++) {
        ...
        // 获取依赖Bean的实例:
        Object autowiredBeanInstance = dependsOnDef.getInstance();
        if (autowiredBeanInstance == null && !isConfiguration) {
            // 当前依赖Bean尚未初始化，递归调用初始化该依赖Bean:
            autowiredBeanInstance = createBeanAsEarlySingleton(dependsOnDef);
        }
        ...
    }
    ...
}
```

假设如下的Bean依赖：

```java
@Component
class A {
    // 依赖B,C:
    A(@Autowired B, @Autowired C) {}
}

@Component
class B {
    // 依赖C:
    B(@Autowired C) {}
}

@Component
class C {
    // 无依赖:
    C() {}
}
```

如果按照A、B、C的顺序创建Bean实例，那么系统流程如下：

1. 准备创建A；
2. 检测到依赖B：未就绪；
   1. 准备创建B：
   2. 检测到依赖C：未就绪；
       1. 准备创建C；
       2. 完成创建C；
   3. 完成创建B；
3. 检测到依赖C，已就绪；
4. 完成创建A。

如果按照B、C、A的顺序创建Bean实例，那么系统流程如下：

1. 准备创建B；
2. 检测到依赖C：未就绪；
   1. 准备创建C；
   2. 完成创建C；
3. 完成创建B；
4. 准备创建A；
5. 检测到依赖B，已就绪；
6. 检测到依赖C，已就绪；
7. 完成创建A。

可见无论以什么顺序创建，C总是最先被实例化，A总是最后被实例化。

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/step-by-step/create-bean-instances)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/step-by-step/create-bean-instances)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/step-by-step/create-bean-instances">GitHub</a>
