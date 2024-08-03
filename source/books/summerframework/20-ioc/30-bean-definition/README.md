# 创建BeanDefinition

现在，我们可以用`ResourceResolver`扫描Class，用`PropertyResolver`获取配置，下面，我们开始实现IoC容器。

在IoC容器中，每个Bean都有一个唯一的名字标识。Spring还允许为一个Bean定义多个名字，这里我们简化一下，一个Bean只允许一个名字，因此，很容易想到用一个`Map<String, Object>`保存所有的Bean：

```java
public class AnnotationConfigApplicationContext {
    Map<String, Object> beans;
}
```

这么做不是不可以，但是丢失了大量Bean的定义信息，不便于我们创建Bean以及解析依赖关系。合理的方式是先定义`BeanDefinition`，它能从Annotation中提取到足够的信息，便于后续创建Bean、设置依赖、调用初始化方法等：

```java
public class BeanDefinition {
    // 全局唯一的Bean Name:
    String name;

    // Bean的声明类型:
    Class<?> beanClass;

    // Bean的实例:
    Object instance = null;

    // 构造方法/null:
    Constructor<?> constructor;

    // 工厂方法名称/null:
    String factoryName;

    // 工厂方法/null:
    Method factoryMethod;

    // Bean的顺序:
    int order;

    // 是否标识@Primary:
    boolean primary;

    // init/destroy方法名称:
    String initMethodName;
    String destroyMethodName;

    // init/destroy方法:
    Method initMethod;
    Method destroyMethod;
}
```

对于自己定义的带`@Component`注解的Bean，我们需要获取Class类型，获取构造方法来创建Bean，然后收集`@PostConstruct`和`@PreDestroy`标注的初始化与销毁的方法，以及其他信息，如`@Order`定义Bean的内部排序顺序，`@Primary`定义存在多个相同类型时返回哪个“主要”Bean。一个典型的定义如下：

```java
@Component
public class Hello {
    @PostConstruct
    void init() {}

    @PreDestroy
    void destroy() {}
}
```

对于`@Configuration`定义的`@Bean`方法，我们把它看作Bean的工厂方法，我们需要获取方法返回值作为Class类型，方法本身作为创建Bean的`factoryMethod`，然后收集`@Bean`定义的`initMethod`和`destroyMethod`标识的初始化于销毁的方法名，以及其他`@Order`、`@Primary`等信息。一个典型的定义如下：

```java
@Configuration
public class AppConfig {
    @Bean(initMethod="init", destroyMethod="close")
    DataSource createDataSource() {
        return new HikariDataSource(...);
    }
}
```

### Bean的声明类型

这里我们要特别注意一点，就是Bean的声明类型。对于`@Component`定义的Bean，它的声明类型就是其Class本身。然而，对于用`@Bean`工厂方法创建的Bean，它的声明类型与实际类型不一定是同一类型。上述`createDataSource()`定义的Bean，声明类型是`DataSource`，实际类型却是某个子类，例如`HikariDataSource`，因此要特别注意，我们在`BeanDefinition`中，存储的`beanClass`是**声明类型**，实际类型不必存储，因为可以通过`instance.getClass()`获得：

```java
public class BeanDefinition {
    // Bean的声明类型:
    Class<?> beanClass;

    // Bean的实例:
    Object instance = null;
}
```

这也引出了下一个问题：如果我们按照名字查找Bean或BeanDefinition，要么拿到唯一实例，要么不存在，即通过查询`Map<String, BeanDefinition>`即可完成：

```java
public class AnnotationConfigApplicationContext {
    Map<String, BeanDefinition> beans;

    // 根据Name查找BeanDefinition，如果Name不存在，返回null
    @Nullable
    public BeanDefinition findBeanDefinition(String name) {
        return this.beans.get(name);
    }
}
```

但是通过类型查找Bean或BeanDefinition，我们没法定义一个`Map<Class, BeanDefinition>`，原因就是Bean的声明类型与实际类型不一定相符，举个例子：

```java
@Configuration
public class AppConfig {
    @Bean
    AtomicInteger counter() {
        return new AtomicInteger();
    }
    
    @Bean
    Number bigInt() {
        return new BigInteger("1000000000");
    }
}
```

当我们调用`getBean(AtomicInteger.class)`时，我们会获得`counter()`方法创建的唯一实例，但是，当我们调用`getBean(Number.class)`时，`counter()`方法和`bigInt()`方法创建的实例均符合要求，此时，如果有且仅有一个标注了`@Primary`，就返回标注了`@Primary`的Bean，否则，直接报`NoUniqueBeanDefinitionException`错误。

因此，对于`getBean(Class)`方法，必须遍历找出所有符合类型的Bean，如果不唯一，再判断`@Primary`，才能返回唯一Bean或报错。

我们编写一个找出所有类型的`findBeanDefinitions(Class)`方法如下：

```java
// 根据Type查找若干个BeanDefinition，返回0个或多个:
List<BeanDefinition> findBeanDefinitions(Class<?> type) {
    return this.beans.values().stream()
        // 按类型过滤:
        .filter(def -> type.isAssignableFrom(def.getBeanClass()))
        // 排序:
        .sorted().collect(Collectors.toList());
    }
}
```

我们再编写一个`findBeanDefinition(Class)`方法如下：

```java
// 根据Type查找某个BeanDefinition，如果不存在返回null，如果存在多个返回@Primary标注的一个:
@Nullable
public BeanDefinition findBeanDefinition(Class<?> type) {
    List<BeanDefinition> defs = findBeanDefinitions(type);
    if (defs.isEmpty()) { // 没有找到任何BeanDefinition
        return null;
    }
    if (defs.size() == 1) { // 找到唯一一个
        return defs.get(0);
    }
    // 多于一个时，查找@Primary:
    List<BeanDefinition> primaryDefs = defs.stream().filter(def -> def.isPrimary()).collect(Collectors.toList());
    if (primaryDefs.size() == 1) { // @Primary唯一
        return primaryDefs.get(0);
    }
    if (primaryDefs.isEmpty()) { // 不存在@Primary
        throw new NoUniqueBeanDefinitionException(String.format("Multiple bean with type '%s' found, but no @Primary specified.", type.getName()));
    } else { // @Primary不唯一
        throw new NoUniqueBeanDefinitionException(String.format("Multiple bean with type '%s' found, and multiple @Primary specified.", type.getName()));
    }
}
```

现在，我们已经定义好了数据结构，下面开始获取所有`BeanDefinition`信息，实际分两步：

```java
public class AnnotationConfigApplicationContext {
    Map<String, BeanDefinition> beans;

    public AnnotationConfigApplicationContext(Class<?> configClass, PropertyResolver propertyResolver) {
        // 扫描获取所有Bean的Class类型:
        Set<String> beanClassNames = scanForClassNames(configClass);

        // 创建Bean的定义:
        this.beans = createBeanDefinitions(beanClassNames);
    }
    ...
}
```

第一步是扫描指定包下的所有Class，然后返回Class名字，这一步比较简单：

```java
Set<String> scanForClassNames(Class<?> configClass) {
    // 获取@ComponentScan注解:
    ComponentScan scan = ClassUtils.findAnnotation(configClass, ComponentScan.class);
    // 获取注解配置的package名字,未配置则默认当前类所在包:
    String[] scanPackages = scan == null || scan.value().length == 0 ? new String[] { configClass.getPackage().getName() } : scan.value();

    Set<String> classNameSet = new HashSet<>();
    // 依次扫描所有包:
    for (String pkg : scanPackages) {
        logger.atDebug().log("scan package: {}", pkg);
        // 扫描一个包:
        var rr = new ResourceResolver(pkg);
        List<String> classList = rr.scan(res -> {
            // 遇到以.class结尾的文件，就将其转换为Class全名:
            String name = res.name();
            if (name.endsWith(".class")) {
                return name.substring(0, name.length() - 6).replace("/", ".").replace("\\", ".");
            }
            return null;
        });
        // 扫描结果添加到Set:
        classNameSet.addAll(classList);
    }

    // 继续查找@Import(Xyz.class)导入的Class配置:
    Import importConfig = configClass.getAnnotation(Import.class);
    if (importConfig != null) {
        for (Class<?> importConfigClass : importConfig.value()) {
            String importClassName = importConfigClass.getName();
            classNameSet.add(importClassName);
        }
    }
    return classNameSet;
}
```

注意到扫描结果是指定包的所有Class名称，以及通过`@Import`导入的Class名称，下一步才会真正处理各种注解：

```java
Map<String, BeanDefinition> createBeanDefinitions(Set<String> classNameSet) {
    Map<String, BeanDefinition> defs = new HashMap<>();
    for (String className : classNameSet) {
        // 获取Class:
        Class<?> clazz = null;
        try {
            clazz = Class.forName(className);
        } catch (ClassNotFoundException e) {
            throw new BeanCreationException(e);
        }
        // 是否标注@Component?
        Component component = ClassUtils.findAnnotation(clazz, Component.class);
        if (component != null) {
            // 获取Bean的名称:
            String beanName = ClassUtils.getBeanName(clazz);
            var def = new BeanDefinition(
                beanName, clazz, getSuitableConstructor(clazz),
                getOrder(clazz), clazz.isAnnotationPresent(Primary.class),
                // init/destroy方法名称:
                null, null,
                // 查找@PostConstruct方法:
                ClassUtils.findAnnotationMethod(clazz, PostConstruct.class),
                // 查找@PreDestroy方法:
                ClassUtils.findAnnotationMethod(clazz, PreDestroy.class));
            addBeanDefinitions(defs, def);
            // 查找是否有@Configuration:
            Configuration configuration = ClassUtils.findAnnotation(clazz, Configuration.class);
            if (configuration != null) {
                // 查找@Bean方法:
                scanFactoryMethods(beanName, clazz, defs);
            }
        }
    }
    return defs;
}
```

上述代码需要注意的一点是，查找`@Component`时，并不是简单地在Class定义查看`@Component`注解，因为Spring的`@Component`是可以扩展的，例如，标记为`Controller`的Class也符合要求：

```java
@Controller
public class MvcController {...}
```

原因就在于，`@Controller`注解的定义包含了`@Component`：

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Controller {
    String value() default "";
}
```

所以，判断是否存在`@Component`，不但要在当前类查找`@Component`，还要在当前类的所有注解上，查找该注解是否有`@Component`，因此，我们编写了一个能递归查找注解的方法：

```java
public class ClassUtils {
    public static <A extends Annotation> A findAnnotation(Class<?> target, Class<A> annoClass) {
        A a = target.getAnnotation(annoClass);
        for (Annotation anno : target.getAnnotations()) {
            Class<? extends Annotation> annoType = anno.annotationType();
            if (!annoType.getPackageName().equals("java.lang.annotation")) {
                A found = findAnnotation(annoType, annoClass);
                if (found != null) {
                    if (a != null) {
                        throw new BeanDefinitionException("Duplicate @" + annoClass.getSimpleName() + " found on class " + target.getSimpleName());
                    }
                    a = found;
                }
            }
        }
        return a;
    }
}
```

带有`@Configuration`注解的Class，视为Bean的工厂，我们需要继续在`scanFactoryMethods()`中查找`@Bean`标注的方法：

```java
void scanFactoryMethods(String factoryBeanName, Class<?> clazz, Map<String, BeanDefinition> defs) {
    for (Method method : clazz.getDeclaredMethods()) {
        // 是否带有@Bean标注:
        Bean bean = method.getAnnotation(Bean.class);
        if (bean != null) {
            // Bean的声明类型是方法返回类型:
            Class<?> beanClass = method.getReturnType();
            var def = new BeanDefinition(
                ClassUtils.getBeanName(method), beanClass,
                factoryBeanName,
                // 创建Bean的工厂方法:
                method,
                // @Order
                getOrder(method),
                // 是否存在@Primary标注?
                method.isAnnotationPresent(Primary.class),
                // init方法名称:
                bean.initMethod().isEmpty() ? null : bean.initMethod(),
                // destroy方法名称:
                bean.destroyMethod().isEmpty() ? null : bean.destroyMethod(),
                // @PostConstruct / @PreDestroy方法:
                null, null);
            addBeanDefinitions(defs, def);
        }
    }
}
```

注意到`@Configuration`注解本身又用`@Component`注解修饰了，因此，对于一个`@Configuration`来说：

```java
@Configuration
public class DateTimeConfig {
    @Bean
    LocalDateTime local() { return LocalDateTime.now(); }

    @Bean
    ZonedDateTime zoned() { return ZonedDateTime.now(); }
}
```

实际上创建了3个`BeanDefinition`：

- DateTimeConfig本身；
- LocalDateTime；
- ZonedDateTime。

不创建`DateTimeConfig`行不行？不行，因为后续没有`DateTimeConfig`的实例，无法调用`local()`和`zoned()`方法。因为当前我们只创建了`BeanDefinition`，所以对于`LocalDateTime`和`ZonedDateTime`的`BeanDefinition`来说，还必须保存`DateTimeConfig`的名字，将来才能通过名字查找`DateTimeConfig`的实例。

有的同学注意到我们同时存储了`initMethodName`和`initMethod`，以及`destroyMethodName`和`destroyMethod`，这是因为在`@Component`声明的Bean中，我们可以根据`@PostConstruct`和`@PreDestroy`直接拿到Method本身，而在`@Bean`声明的Bean中，我们拿不到Method，只能从`@Bean`注解提取出字符串格式的方法名称，因此，存储在`BeanDefinition`的方法名称与方法，其中至少有一个为`null`。

最后，仔细编写`BeanDefinition`的`toString()`方法，使之能打印出详细的信息。我们编写测试，运行，打印出每个`BeanDefinition`如下：

```plain
define bean: BeanDefinition [name=annotationDestroyBean, beanClass=com.itranswarp.scan.destroy.AnnotationDestroyBean, factory=null, init-method=null, destroy-method=destroy, primary=false, instance=null]

define bean: BeanDefinition [name=nestedBean, beanClass=com.itranswarp.scan.nested.OuterBean$NestedBean, factory=null, init-method=null, destroy-method=null, primary=false, instance=null]

define bean: BeanDefinition [name=createSpecifyInitBean, beanClass=com.itranswarp.scan.init.SpecifyInitBean, factory=SpecifyInitConfiguration.createSpecifyInitBean(String, String), init-method=null, destroy-method=null, primary=false, instance=null]

...
```

现在，我们已经能扫描并创建所有的`BeanDefinition`，只是目前每个`BeanDefinition`内部的`instance`还是`null`，因为我们后续才会创建真正的Bean。

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/step-by-step/create-bean-definitions)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/step-by-step/create-bean-definitions)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/step-by-step/create-bean-definitions">GitHub</a>
