# 完成IoC容器

现在，我们已经完成了IoC容器的基本功能。最后的收尾工作主要是提取接口。先定义给用户使用的`ApplicationContext`接口：

```java
public interface ApplicationContext extends AutoCloseable {

    // 是否存在指定name的Bean？
    boolean containsBean(String name);

    // 根据name返回唯一Bean，未找到抛出NoSuchBeanDefinitionException
    <T> T getBean(String name);

    // 根据name返回唯一Bean，未找到抛出NoSuchBeanDefinitionException
    <T> T getBean(String name, Class<T> requiredType);

    // 根据type返回唯一Bean，未找到抛出NoSuchBeanDefinitionException
    <T> T getBean(Class<T> requiredType);

    // 根据type返回一组Bean，未找到返回空List
    <T> List<T> getBeans(Class<T> requiredType);

    // 关闭并执行所有bean的destroy方法
    void close();
}
```

再定义一个给Framework级别的代码用的`ConfigurableApplicationContext`接口：

```java
public interface ConfigurableApplicationContext extends ApplicationContext {

    List<BeanDefinition> findBeanDefinitions(Class<?> type);

    @Nullable
    BeanDefinition findBeanDefinition(Class<?> type);

    @Nullable
    BeanDefinition findBeanDefinition(String name);

    @Nullable
    BeanDefinition findBeanDefinition(String name, Class<?> requiredType);

    Object createBeanAsEarlySingleton(BeanDefinition def);
}
```

让`AnnotationConfigApplicationContext`实现接口：

```java
public class AnnotationConfigApplicationContext implements ConfigurableApplicationContext {
    ...
}
```

顺便在`close()`方法中把Bean的`destroy`方法执行了。

最后加一个`ApplicationUtils`类，目的是能通过`getRequiredApplicationContext()`方法随时获取到`ApplicationContext`实例。

搞定`summer-context`模块！

有的同学可能会问，为什么我们用了不到1000行核心代码，就实现了`ApplicationContext`？如果查看Spring的源码，可以看到，光是层次结构，就令人眼花缭乱：

```plain
BeanFactory
  HierarchicalBeanFactory
    ConfigurableBeanFactory
      AbstractBeanFactory
        AbstractAutowireCapableBeanFactory
          DefaultListableBeanFactory
    ApplicationContext
      ConfigurableApplicationContext
        AbstractApplicationContext
          AbstractRefreshableApplicationContext
            AbstractXmlApplicationContext
              ClassPathXmlApplicationContext
              FileSystemXmlApplicationContext
          GenericApplicationContext
            AnnotationConfigApplicationContext
            GenericXmlApplicationContext
            StaticApplicationContext
```

其实根本原因是我们大幅简化了需求。Spring最早提供了`BeanFactory`和`ApplicationContext`两种容器，前者是懒加载，后者是立刻初始化所有Bean。懒加载的特性会导致依赖注入变得更加复杂，虽然`BeanFactory`在实际项目中并没有什么卵用。然而一旦发布了接口，处于兼容性考虑，就没法再收回去了。再考虑到Spring最早采用XML配置，后来采用Annotation配置，还允许混合配置，这样一来，早期发布的`XmlApplicationContext`不能动，新的Annotation配置就必须添加新的实现类，所以，代码的复杂度随着需求增加而增加，保持兼容性又会导致需要更多的代码来实现新功能。

所以，没事不要瞎提需求。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/framework/summer-context)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/framework/summer-context)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/framework/summer-context">GitHub</a>
