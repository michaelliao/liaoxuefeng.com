# 实现ServletContext

在Java Web应用程序中，`ServletContext`代表应用程序的运行环境，一个Web应用程序对应一个唯一的`ServletContext`实例，`ServletContext`可以用于：

- 提供初始化和全局配置：可以从`ServletContext`获取Web App配置的初始化参数、资源路径等信息；
- 共享全局数据：`ServletContext`存储的数据可以被整个Web App的所有组件读写。

既然`ServletContext`是一个Web App的全局唯一实例，而Web App又运行在Servlet容器中，我们在实现`ServletContext`时，完全可以把它当作Servlet容器来实现，它在内部维护一组Servlet实例，并根据Servlet配置的路由信息将请求转发给对应的Servlet处理。假设我们编写了两个Servlet：

- IndexServlet：映射路径为`/`；
- HelloServlet：映射路径为`/hello`。

那么，处理HTTP请求的路径如下：

```ascii
                     ┌────────────────────┐
                     │   ServletContext   │
                     ├────────────────────┤
                     │     ┌────────────┐ │
    ┌─────────────┐  │ ┌──▶│IndexServlet│ │
───▶│HttpConnector│──┼─┤   ├────────────┤ │
    └─────────────┘  │ └──▶│HelloServlet│ │
                     │     └────────────┘ │
                     └────────────────────┘
```

下面，我们来实现`ServletContext`。首先定义`ServletMapping`，它包含一个Servlet实例，以及将映射路径编译为正则表达式：

```java
public class ServletMapping {
    final Pattern pattern; // 编译后的正则表达式
    final Servlet servlet; // Servlet实例
    public ServletMapping(String urlPattern, Servlet servlet) {
        this.pattern = buildPattern(urlPattern); // 编译为正则表达式
        this.servlet = servlet;
    }
}
```

接下来实现`ServletContext`：

```java
public class ServletContextImpl implements ServletContext {
    final List<ServletMapping> servletMappings = new ArrayList<>();
}
```

这个数据结构足够能让我们实现根据请求路径路由到某个特定的Servlet：

```java
public class ServletContextImpl implements ServletContext {
    ...
    // HTTP请求处理入口:
    public void process(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        // 请求路径:
        String path = request.getRequestURI();
        // 搜索Servlet:
        Servlet servlet = null;
        for (ServletMapping mapping : this.servletMappings) {
            if (mapping.matches(path)) {
                // 路径匹配:
                servlet = mapping.servlet;
                break;
            }
        }
        if (servlet == null) {
            // 未匹配到任何Servlet显示404 Not Found:
            PrintWriter pw = response.getWriter();
            pw.write("<h1>404 Not Found</h1><p>No mapping for URL: " + path + "</p>");
            pw.close();
            return;
        }
        // 由Servlet继续处理请求:
        servlet.service(request, response);
    }
}
```

这样我们就实现了`ServletContext`！

不过，细心的同学会发现，我们编写的两个Servlet：`IndexServlet`和`HelloServlet`，还没有被添加到`ServletContext`中。那么问题来了：Servlet在什么时候被初始化？

答案是在创建`ServletContext`实例后，就立刻初始化所有的Servlet。我们编写一个`initialize()`方法，用于初始化Servlet：

```java
public class ServletContextImpl implements ServletContext {
    Map<String, ServletRegistrationImpl> servletRegistrations = new HashMap<>();
    Map<String, Servlet> nameToServlets = new HashMap<>();
    List<ServletMapping> servletMappings = new ArrayList<>();

    public void initialize(List<Class<?>> servletClasses) {
        // 依次添加每个Servlet:
        for (Class<?> c : servletClasses) {
            // 获取@WebServlet注解:
            WebServlet ws = c.getAnnotation(WebServlet.class);
            Class<? extends Servlet> clazz = (Class<? extends Servlet>) c;
            // 创建一个ServletRegistration.Dynamic:
            ServletRegistration.Dynamic registration = this.addServlet(AnnoUtils.getServletName(clazz), clazz);
            registration.addMapping(AnnoUtils.getServletUrlPatterns(clazz));
            registration.setInitParameters(AnnoUtils.getServletInitParams(clazz));
        }
        // 实例化Servlet:
        for (String name : this.servletRegistrations.keySet()) {
            var registration = this.servletRegistrations.get(name);
            registration.servlet.init(registration.getServletConfig());
            this.nameToServlets.put(name, registration.servlet);
            for (String urlPattern : registration.getMappings()) {
                this.servletMappings.add(new ServletMapping(urlPattern, registration.servlet));
            }
            registration.initialized = true;
        }
    }

    @Override
    public ServletRegistration.Dynamic addServlet(String name, Servlet servlet) {
        var registration = new ServletRegistrationImpl(this, name, servlet);
        this.servletRegistrations.put(name, registration);
        return registration;
    }
}
```

从Servlet 3.0规范开始，我们必须要提供`addServlet()`动态添加一个Servlet，并且返回`ServletRegistration.Dynamic`，因此，我们在`initialize()`方法中调用`addServlet()`，完成所有Servlet的创建和初始化。

最后我们修改`HttpConnector`，实例化`ServletContextImpl`：

```java
public class HttpConnector implements HttpHandler {
    // 持有ServletContext实例:
    final ServletContextImpl servletContext;
    final HttpServer httpServer;

    public HttpConnector() throws IOException {
        // 创建ServletContext:
        this.servletContext = new ServletContextImpl();
        // 初始化Servlet:
        this.servletContext.initialize(List.of(IndexServlet.class, HelloServlet.class));
        ...
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        var adapter = new HttpExchangeAdapter(exchange);
        var request = new HttpServletRequestImpl(adapter);
        var response = new HttpServletResponseImpl(adapter);
        // process:
        this.servletContext.process(request, response);
    }
}
```

运行服务器，输入`http://localhost:8080/`，查看`IndexServlet`的输出：

![index-page](index-page.jpg)

输入`http://localhost:8080/hello?name=Bob`，查看`HelloServlet`的输出：

![hello-page](hello-page.jpg)

输入错误的路径，查看404输出：

![404-page](404-page.jpg)

可见，我们已经成功完成了`ServletContext`和所有Servlet的管理，并实现了正确的路由。

有的同学会问：Servlet本身应该是Web App开发人员实现，而不是由服务器实现。我们在服务器中却写死了两个Servlet，这显然是不合理的。正确的方式是从外部war包加载Servlet，但是这个问题我们放到后面解决。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/jerrymouse/tree/master/step-by-step/servlet-context-support)或[Gitee](https://gitee.com/liaoxuefeng/jerrymouse/tree/master/step-by-step/servlet-context-support)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/jerrymouse/tree/master/step-by-step/servlet-context-support">GitHub</a>

### 小结

编写Servlet容器时，直接实现`ServletContext`接口，并在内部完成所有Servlet的管理，就可以实现根据路径路由到匹配的Servlet。
