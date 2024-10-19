# 实现Around

现在我们已经实现了ProxyResolver，下一步，实现完整的AOP就很容易了。

我们先从客户端代码入手，看看应当怎么装配AOP。

首先，客户端需要定义一个原始Bean，例如`OriginBean`，用`@Around`注解标注：

```java
@Component
@Around("aroundInvocationHandler")
public class OriginBean {

    @Value("${customer.name}")
    public String name;

    @Polite
    public String hello() {
        return "Hello, " + name + ".";
    }

    public String morning() {
        return "Morning, " + name + ".";
    }
}
```

`@Around`注解的值`aroundInvocationHandler`指出应该按什么名字查找拦截器，因此，客户端应再定义一个`AroundInvocationHandler`：

```java
@Component
public class AroundInvocationHandler implements InvocationHandler {
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 拦截标记了@Polite的方法返回值:
        if (method.getAnnotation(Polite.class) != null) {
            String ret = (String) method.invoke(proxy, args);
            if (ret.endsWith(".")) {
                ret = ret.substring(0, ret.length() - 1) + "!";
            }
            return ret;
        }
        return method.invoke(proxy, args);
    }
}
```

有了原始Bean、拦截器，就可以在IoC容器中装配AOP：

```java
@Configuration
@ComponentScan
public class AroundApplication {
    @Bean
    AroundProxyBeanPostProcessor createAroundProxyBeanPostProcessor() {
        return new AroundProxyBeanPostProcessor();
    }
}
```

注意到装配AOP是通过`AroundProxyBeanPostProcessor`实现的，而这个类是由Framework提供，客户端并不需要自己实现。因此，我们需要开发一个`AroundProxyBeanPostProcessor`：

```java
public class AroundProxyBeanPostProcessor implements BeanPostProcessor {

    Map<String, Object> originBeans = new HashMap<>();

    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        Class<?> beanClass = bean.getClass();
        // 检测@Around注解:
        Around anno = beanClass.getAnnotation(Around.class);
        if (anno != null) {
            String handlerName;
            try {
                handlerName = (String) anno.annotationType().getMethod("value").invoke(anno);
            } catch (ReflectiveOperationException e) {
                throw new AopConfigException();
            }
            Object proxy = createProxy(beanClass, bean, handlerName);
            originBeans.put(beanName, bean);
            return proxy;
        } else {
            return bean;
        }
    }

    Object createProxy(Class<?> beanClass, Object bean, String handlerName) {
        ConfigurableApplicationContext ctx = (ConfigurableApplicationContext) ApplicationContextUtils.getRequiredApplicationContext();
        BeanDefinition def = ctx.findBeanDefinition(handlerName);
        if (def == null) {
            throw new AopConfigException();
        }
        Object handlerBean = def.getInstance();
        if (handlerBean == null) {
            handlerBean = ctx.createBeanAsEarlySingleton(def);
        }
        if (handlerBean instanceof InvocationHandler handler) {
            return ProxyResolver.getInstance().createProxy(bean, handler);
        } else {
            throw new AopConfigException();
        }
    }

    @Override
    public Object postProcessOnSetProperty(Object bean, String beanName) {
        Object origin = this.originBeans.get(beanName);
        return origin != null ? origin : bean;
    }
}
```

上述`AroundProxyBeanPostProcessor`的机制非常简单：检测每个Bean实例是否带有`@Around`注解，如果有，就根据注解的值查找Bean作为`InvocationHandler`，最后创建Proxy，返回前保存了原始Bean的引用，因为IoC容器在后续的注入阶段要把相关依赖和值注入到原始Bean。

总结一下，Summer Framework提供的包括：

- `Around`注解；
- `AroundProxyBeanPostProcessor`实现AOP。

客户端代码需要提供的包括：

- 带`@Around`注解的原始Bean；
- 实现`InvocationHandler`的Bean，名字与`@Around`注解value保持一致。

没有额外的要求了。

### 实现Before和After

我们再继续思考，Spring提供的AOP拦截器，有Around、Before和After等好几种。如何实现Before和After拦截？

实际上Around拦截本身就包含了Before和After拦截，我们没必要去修改`ProxyResolver`，只需要用Adapter模式提供两个拦截器模版，一个是`BeforeInvocationHandlerAdapter`：

```java
public abstract class BeforeInvocationHandlerAdapter implements InvocationHandler {

    public abstract void before(Object proxy, Method method, Object[] args);

    @Override
    public final Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        before(proxy, method, args);
        return method.invoke(proxy, args);
    }
}
```

客户端提供的`InvocationHandler`只需继承自`BeforeInvocationHandlerAdapter`，自然就需要覆写`before()`方法，实现了Before拦截。

After拦截也是一个拦截器模版：

```java
public abstract class AfterInvocationHandlerAdapter implements InvocationHandler {
    // after允许修改方法返回值:
    public abstract Object after(Object proxy, Object returnValue, Method method, Object[] args);

    @Override
    public final Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Object ret = method.invoke(proxy, args);
        return after(proxy, ret, method, args);
    }
}
```

### 扩展Annotation

截止目前，客户端只需要定义带有`@Around`注解的Bean，就能自动触发AOP。我们思考下Spring的事务机制，其实也是AOP拦截，不过它的注解是`@Transactional`。如果要扩展Annotation，即能自定义注解来启动AOP，怎么做？

假设我们后续编写了一个事务模块，提供注解`@Transactional`，那么，要启动AOP，就必须仿照`AroundProxyBeanPostProcessor`，提供一个`TransactionProxyBeanPostProcessor`，不过复制代码太麻烦了，我们可以改造一下`AroundProxyBeanPostProcessor`，用泛型代码处理Annotation，先抽象出一个`AnnotationProxyBeanPostProcessor`：

```java
public abstract class AnnotationProxyBeanPostProcessor<A extends Annotation> implements BeanPostProcessor {

    Map<String, Object> originBeans = new HashMap<>();
    Class<A> annotationClass;

    public AnnotationProxyBeanPostProcessor() {
        this.annotationClass = getParameterizedType();
    }
    ...
}
```

实现`AroundProxyBeanPostProcessor`就一行定义：

```java
public class AroundProxyBeanPostProcessor extends AnnotationProxyBeanPostProcessor<Around> {
}
```

后续如果我们想实现`@Transactional`注解，只需定义：

```java
public class TransactionalProxyBeanPostProcessor extends AnnotationProxyBeanPostProcessor<Transactional> {
}
```

就能自动根据`@Transactional`启动AOP。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/framework/summer-aop)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/framework/summer-aop)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/framework/summer-aop">GitHub</a>
