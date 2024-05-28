# 实现ProxyResolver

为了实现AOP，我们先思考如何在IoC容器中实现一个动态代理。

在IoC容器中，实现动态代理需要用户提供两个Bean：

1. 原始Bean，即需要被代理的Bean；
2. 拦截器，即拦截了目标Bean的方法后，会自动调用拦截器实现代理功能。

拦截器需要定义接口，这里我们直接用Java标准库的`InvocationHandler`，免去了自定义接口。

假定我们已经从IoC容器中获取了原始Bean与实现了`InvocationHandler`的拦截器Bean，那么就可以编写一个`ProxyResolver`来实现AOP代理。

从[ByteBuddy的官网](https://bytebuddy.net/)上搜索很容易找到相关代码，我们整理为`createProxy()`方法：

```java
public class ProxyResolver {
    // ByteBuddy实例:
    ByteBuddy byteBuddy = new ByteBuddy();

    // 传入原始Bean、拦截器，返回代理后的实例:
    public <T> T createProxy(T bean, InvocationHandler handler) {
        // 目标Bean的Class类型:
        Class<?> targetClass = bean.getClass();
        // 动态创建Proxy的Class:
        Class<?> proxyClass = this.byteBuddy
                // 子类用默认无参数构造方法:
                .subclass(targetClass, ConstructorStrategy.Default.DEFAULT_CONSTRUCTOR)
                // 拦截所有public方法:
                .method(ElementMatchers.isPublic()).intercept(InvocationHandlerAdapter.of(
                        // 新的拦截器实例:
                        new InvocationHandler() {
                            public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                                // 将方法调用代理至原始Bean:
                                return handler.invoke(bean, method, args);
                            }
                        }))
                // 生成字节码:
                .make()
                // 加载字节码:
                .load(targetClass.getClassLoader()).getLoaded();
        // 创建Proxy实例:
        Object proxy;
        try {
            proxy = proxyClass.getConstructor().newInstance();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return (T) proxy;
    }
}
```

注意`InvocationHandler`有两层：外层的`invoke()`传入的Object是Proxy实例，内层的`invoke()`将调用转发至原始Bean。

一共大约50行代码，我们就实现了AOP功能。有点不敢相信，赶快写个测试看看效果。

先定义一个`OriginBean`：

```java
public class OriginBean {
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

我们要实现的AOP功能是增强带`@Polite`注解的方法，把返回值`Hello, Bob.`改为`Hello, Bob!`，让欢迎气氛更强烈一点，因此，编写一个`InvocationHandler`：

```java
public class PoliteInvocationHandler implements InvocationHandler {
    @Override
    public Object invoke(Object bean, Method method, Object[] args) throws Throwable {
        // 修改标记了@Polite的方法返回值:
        if (method.getAnnotation(Polite.class) != null) {
            String ret = (String) method.invoke(bean, args);
            if (ret.endsWith(".")) {
                ret = ret.substring(0, ret.length() - 1) + "!";
            }
            return ret;
        }
        return method.invoke(bean, args);
    }
}
```

测试代码：

```java
// 原始Bean:
OriginBean origin = new OriginBean();
origin.name = "Bob";
// 调用原始Bean的hello():
assertEquals("Hello, Bob.", origin.hello());

// 创建Proxy:
OriginBean proxy = new ProxyResolver().createProxy(origin, new PoliteInvocationHandler());

// Proxy类名,类似OriginBean$ByteBuddy$9hQwRy3T:
System.out.println(proxy.getClass().getName());

// Proxy类与OriginBean.class不同:
assertNotSame(OriginBean.class, proxy.getClass());
// proxy实例的name字段应为null:
assertNull(proxy.name);

// 调用带@Polite的方法:
assertEquals("Hello, Bob!", proxy.hello());
// 调用不带@Polite的方法:
assertEquals("Morning, Bob.", proxy.morning());
```

测试通过，本节到此收工。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/step-by-step/proxy-resolver)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/step-by-step/proxy-resolver)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/step-by-step/proxy-resolver">GitHub</a>
