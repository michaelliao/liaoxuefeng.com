# 常见问题

本节列出开发Servlet服务器时需要注意的一些常见问题。

### 如何正确实现getOutputStream()和getWriter()？

根据Servlet规范，`getOutputStream()`和`getWriter()`在一次HTTP处理中只能二选一，不能都调用，因此，HttpServletResponse内部会用`callOutput`记录调用状态：

- null：未调用`getOutputStream()`和`getWriter()`；
- Boolean.TRUE：已调用`getOutputStream()`；
- Boolean.FALSE：已调用`getWriter()`。

违反调用规则会抛出`IllegalStateException`。

### HttpServletResponse为什么要实现cleanup()？

因为Web App可能不会调用`getOutputStream()`或`getWriter()`，而是直接设置Header后返回：

```java
resp.setStatus(403);
```

此时，`HttpConnector`要调用`cleanup()`，如果发现没有发送Header，则需要立刻发送Header，否则浏览器无法收到响应。

此外，根据HttpConnector的实现方式，基于JDK的`HttpExchange`的`OutputStream`也需要关闭（但不一定会关闭对应的TCP连接）。

### 如何对Servlet排序？

Servlet需要根据映射进行排序，遵循以下原则：

- 路径长的优先级高，例如，`/auth/login`排在`/auth`前；
- 前缀匹配比后缀匹配优先级高，例如，`/auth/*`排在`*.do`前。

### 如何处理“/”映射？

根据Servlet规范，`/`相当于`/*`，但还是有所不同，因为`/`表示默认的Servlet，即所有规则均不匹配时，最后匹配`/`。

如果一个Web App没有提供`/`映射，则Web Server可以自动提供一个默认的映射到`/`的Servlet。Jerrymouse和Tomcat类似，提供一个浏览文件的`DefaultServlet`。

### 如何处理静态文件？

处理静态文件时，将URL路径`/path/to/file.doc`转换为本地文件路径`${webroot}/path/to/file.doc`，然后根据扩展名设置正确的`Content-Type`，读取文件内容，发送即可。

需要注意的是，Servlet规范规定，不允许访问`/WEB-INF/`开头的URL，因此，遇到访问`/WEB-INF/*`的请求时，直接返回404错误码。

### 如何对Filter排序？

Servlet规范没有对Filter排序的要求，但我们在实现时还是按`@WebFilter`的`filterName()`进行排序，这样Web App可以根据名称调整Filter的顺序。

### 如何启用虚拟线程？

默认情况下，Jerrymouse Server采用线程池模式，要启用虚拟线程，可以加上配置项，以创建不同类型的`ExecutorService`：

```java
ExecutorService executor = config.server.enableVirtualThread ?
        Executors.newVirtualThreadPerTaskExecutor() :
        new ThreadPoolExecutor(0, config.server.threadPoolSize, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingQueue<>());
```
