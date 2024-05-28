# 实现Listener

在Java Web App中，除了Servlet、Filter和HttpSession外，还有一种Listener组件，用于事件监听。

### Listener原理

Listener是Java Web App中的一种事件监听机制，用于监听Web应用程序中产生的事件，例如，在`ServletContext`初始化完成后，会触发`contextInitialized`事件，实现了`ServletContextListener`接口的Listener就可以接收到事件通知，可以在内部做一些初始化工作，如加载配置文件，初始化数据库连接池等。实现了`HttpSessionListener`接口的Listener可以接收到Session的创建和消耗事件，这样就可以统计在线用户数。

Listener机制是基于[观察者模式](../../java/fixme)实现的，即当某个事件发生时，Listener会接收到通知并执行相应的操作。

### Listener类型

Servlet规范定义了很多种Listener接口，常用的Listener包括：

- `ServletContextListener`：用于监听`ServletContext`的创建和销毁事件；
- `HttpSessionListener`：用于监听`HttpSession`的创建和销毁事件；
- `ServletRequestListener`：用于监听`ServletRequest`的创建和销毁事件；
- `ServletContextAttributeListener`：用于监听`ServletContext`属性的添加、修改和删除事件；
- `HttpSessionAttributeListener`：用于监听`HttpSession`属性的添加、修改和删除事件；
- `ServletRequestAttributeListener`：用于监听`ServletRequest`属性的添加、修改和删除事件。

下面我们就来实现上述常用的Listener。

首先我们需要在`ServletContextImpl`中注册并管理所有的Listener，所以用不同的`List`持有注册的Listener：

```java
public class ServletContextImpl implements ServletContext {
    ...
    private List<ServletContextListener> servletContextListeners = null;
    private List<ServletContextAttributeListener> servletContextAttributeListeners = null;
    private List<ServletRequestListener> servletRequestListeners = null;
    private List<ServletRequestAttributeListener> servletRequestAttributeListeners = null;
    private List<HttpSessionAttributeListener> httpSessionAttributeListeners = null;
    private List<HttpSessionListener> httpSessionListeners = null;
    ...
}
```

然后，实现`ServletContext`的`addListener()`接口，用于注册Listener：

```java
public class ServletContextImpl implements ServletContext {
    ...
    @Override
    public void addListener(String className) {
        addListener(Class.forName(className));
    }

    @Override
    public void addListener(Class<? extends EventListener> clazz) {
        addListener(clazz.newInstance());
    }

    @Override
    public <T extends EventListener> void addListener(T t) {
        // 根据Listener类型放入不同的List:
        if (t instanceof ServletContextListener listener) {
            if (this.servletContextListeners == null) {
                this.servletContextListeners = new ArrayList<>();
            }
            this.servletContextListeners.add(listener);
        } else if (t instanceof ServletContextAttributeListener listener) {
            if (this.servletContextAttributeListeners == null) {
                this.servletContextAttributeListeners = new ArrayList<>();
            }
            this.servletContextAttributeListeners.add(listener);
        } else if ...
            ...代码略...
        } else {
            throw new IllegalArgumentException("Unsupported listener: " + t.getClass().getName());
        }
    }
    ...
}
```

接下来，就是在合适的时机，触发这些Listener。以`ServletContextAttributeListener`为例，统一触发的方法放在`ServletContextImpl`中：

```java
public class ServletContextImpl implements ServletContext {
    ...
    void invokeServletContextAttributeAdded(String name, Object value) {
        logger.info("invoke ServletContextAttributeAdded: {} = {}", name, value);
        if (this.servletContextAttributeListeners != null) {
            var event = new ServletContextAttributeEvent(this, name, value);
            for (var listener : this.servletContextAttributeListeners) {
                listener.attributeAdded(event);
            }
        }
    }

    void invokeServletContextAttributeRemoved(String name, Object value) {
        logger.info("invoke ServletContextAttributeRemoved: {} = {}", name, value);
        if (this.servletContextAttributeListeners != null) {
            var event = new ServletContextAttributeEvent(this, name, value);
            for (var listener : this.servletContextAttributeListeners) {
                listener.attributeRemoved(event);
            }
        }
    }

    void invokeServletContextAttributeReplaced(String name, Object value) {
        logger.info("invoke ServletContextAttributeReplaced: {} = {}", name, value);
        if (this.servletContextAttributeListeners != null) {
            var event = new ServletContextAttributeEvent(this, name, value);
            for (var listener : this.servletContextAttributeListeners) {
                listener.attributeReplaced(event);
            }
        }
    }
    ...
}
```

当Web App的任何组件调用`ServletContext`的`setAttribute()`或`removeAttribute()`时，就可以触发事件通知：

```java
public class ServletContextImpl implements ServletContext {
    ...
    @Override
    public void setAttribute(String name, Object value) {
        if (value == null) {
            removeAttribute(name);
        } else {
            Object old = this.attributes.setAttribute(name, value);
            if (old == null) {
                // 触发attributeAdded:
                this.invokeServletContextAttributeAdded(name, value);
            } else {
                // 触发attributeReplaced:
                this.invokeServletContextAttributeReplaced(name, value);
            }
        }
    }

    @Override
    public void removeAttribute(String name) {
        Object old = this.attributes.removeAttribute(name);
        // 触发attributeRemoved:
        this.invokeServletContextAttributeRemoved(name, old);
    }
    ...
}
```

其他事件触发也是类似的写法，此处不再重复。

### 测试Listener

为了测试Listener机制是否生效，我们还需要先编写不同类型的Listener，例如，`HelloHttpSessionAttributeListener`实现如下：

```java
@WebListener
public class HelloHelloHttpSessionAttributeListener implements HttpSessionAttributeListener {

    final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    public void attributeAdded(HttpSessionBindingEvent event) {
        logger.info(">>> HttpSession attribute added: {} = {}", event.getName(), event.getValue());
    }

    @Override
    public void attributeRemoved(HttpSessionBindingEvent event) {
        logger.info(">>> HttpSession attribute removed: {} = {}", event.getName(), event.getValue());
    }

    @Override
    public void attributeReplaced(HttpSessionBindingEvent event) {
        logger.info(">>> HttpSession attribute replaced: {} = {}", event.getName(), event.getValue());
    }
}
```

然后在`HttpConnector`中注册所有的Listener：

```java
List<Class<? extends EventListener>> listenerClasses = List.of(HelloHttpSessionAttributeListener.class, ...);
for (Class<? extends EventListener> listenerClass : listenerClasses) {
    this.servletContext.addListener(listenerClass);
}
```

启动服务器，在浏览器中登录或登出，观察日志输出，在每个请求处理前后，可以看到`ServletRequestListener`的创建和销毁事件：

```plain
08:58:23.944 [HTTP-Dispatcher] INFO  c.i.j.e.l.HelloServletRequestListener -- >>> ServletRequest initialized: HttpServletRequestImpl@71a49a97[GET:/]
...
08:58:24.008 [HTTP-Dispatcher] INFO  c.i.j.e.l.HelloServletRequestListener -- >>> ServletRequest destroyed: HttpServletRequestImpl@71a49a97[GET:/]
```

在第一次访问页面和登出时，可以看到`HttpSessionListener`的创建和销毁事件：

```plain
08:58:23.947 [HTTP-Dispatcher] INFO  c.i.j.e.l.HelloHttpSessionListener -- >>> HttpSession created: com.itranswarp.jerrymouse.engine.HttpSessionImpl@15037a31
...
08:58:36.766 [HTTP-Dispatcher] INFO  c.i.j.e.l.HelloHttpSessionListener -- >>> HttpSession destroyed: com.itranswarp.jerrymouse.engine.HttpSessionImpl@15037a31
```

其他事件的触发也可以在日志中找到，这说明我们成功地实现了Servlet规范的Listener机制。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/jerrymouse/tree/master/step-by-step/listener-support)或[Gitee](https://gitee.com/liaoxuefeng/jerrymouse/tree/master/step-by-step/listener-support)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/jerrymouse/tree/master/step-by-step/listener-support">GitHub</a>

### 小结

Servlet规范定义了各种Listener组件，我们支持了其中常用的大部分`EventListener`组件；

Listener组件由`ServletContext`统一管理，并提供统一调度入口方法；

通知机制允许多线程同时调用，如果要防止并发调用Listener的回调方法，需要Listener组件本身在内部做好同步。
