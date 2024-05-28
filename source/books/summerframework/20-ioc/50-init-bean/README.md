# 初始化Bean

在创建Bean实例的过程中，我们已经完成了强依赖的注入。下一步，是根据Setter方法和字段完成弱依赖注入，接着调用用`@PostConstruct`标注的init方法，就完成了所有Bean的初始化。

这一步相对比较简单，因为只涉及到查找依赖的`@Value`和`@Autowired`，然后用反射完成调用即可：

```java
public AnnotationConfigApplicationContext(Class<?> configClass, PropertyResolver propertyResolver) {
    ...

    // 通过字段和set方法注入依赖:
    this.beans.values().forEach(def -> {
        injectBean(def);
    });

    // 调用init方法:
    this.beans.values().forEach(def -> {
        initBean(def);
    });
}
```

使用Setter方法和字段注入时，要注意一点，就是不仅要在当前类查找，还要在父类查找，因为有些`@Autowired`写在父类，所有子类都可使用，这样更方便。注入弱依赖代码如下：

```java
// 在当前类及父类进行字段和方法注入:
void injectProperties(BeanDefinition def, Class<?> clazz, Object bean) {
    // 在当前类查找Field和Method并注入:
    for (Field f : clazz.getDeclaredFields()) {
        tryInjectProperties(def, clazz, bean, f);
    }
    for (Method m : clazz.getDeclaredMethods()) {
        tryInjectProperties(def, clazz, bean, m);
    }
    // 在父类查找Field和Method并注入:
    Class<?> superClazz = clazz.getSuperclass();
    if (superClazz != null) {
        // 递归调用:
        injectProperties(def, superClazz, bean);
    }
}

// 注入单个属性
void tryInjectProperties(BeanDefinition def, Class<?> clazz, Object bean, AccessibleObject acc) {
    ...
}
```

弱依赖注入完成后，再循环一遍所有的`BeanDefinition`，对其调用`init`方法，完成最后一步初始化：

```java
void initBean(BeanDefinition def) {
    // 调用init方法:
    callMethod(def.getInstance(), def.getInitMethod(), def.getInitMethodName());
}
```

处理`@PreDestroy`方法更简单，在`ApplicationContext`关闭时遍历所有Bean，调用`destroy`方法即可。


可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/step-by-step/init-beans)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/step-by-step/init-beans)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/step-by-step/init-beans">GitHub</a>
