# 使用Filter

在一个比较复杂的Web应用程序中，通常都有很多URL映射，对应的，也会有多个Servlet来处理URL。

我们考察这样一个论坛应用程序：

```ascii
            ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
               /             ┌──────────────┐
            │ ┌─────────────▶│ IndexServlet │ │
              │              └──────────────┘
            │ │/signin       ┌──────────────┐ │
              ├─────────────▶│SignInServlet │
            │ │              └──────────────┘ │
              │/signout      ┌──────────────┐
┌───────┐   │ ├─────────────▶│SignOutServlet│ │
│Browser├─────┤              └──────────────┘
└───────┘   │ │/user/profile ┌──────────────┐ │
              ├─────────────▶│ProfileServlet│
            │ │              └──────────────┘ │
              │/user/post    ┌──────────────┐
            │ ├─────────────▶│ PostServlet  │ │
              │              └──────────────┘
            │ │/user/reply   ┌──────────────┐ │
              └─────────────▶│ ReplyServlet │
            │                └──────────────┘ │
             ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

各个Servlet设计功能如下：

- IndexServlet：浏览帖子；
- SignInServlet：登录；
- SignOutServlet：登出；
- ProfileServlet：修改用户资料；
- PostServlet：发帖；
- ReplyServlet：回复。

其中，ProfileServlet、PostServlet和ReplyServlet都需要用户登录后才能操作，否则，应当直接跳转到登录页面。

我们可以直接把判断登录的逻辑写到这3个Servlet中，但是，同样的逻辑重复3次没有必要，并且，如果后续继续加Servlet并且也需要验证登录时，还需要继续重复这个检查逻辑。

为了把一些公用逻辑从各个Servlet中抽离出来，JavaEE的Servlet规范还提供了一种Filter组件，即过滤器，它的作用是，在HTTP请求到达Servlet之前，可以被一个或多个Filter预处理，类似打印日志、登录检查等逻辑，完全可以放到Filter中。

例如，我们编写一个最简单的EncodingFilter，它强制把输入和输出的编码设置为UTF-8：

```java
@WebFilter(urlPatterns = "/*")
public class EncodingFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        System.out.println("EncodingFilter:doFilter");
        request.setCharacterEncoding("UTF-8");
        response.setCharacterEncoding("UTF-8");
        chain.doFilter(request, response);
    }
}
```

编写Filter时，必须实现`Filter`接口，在`doFilter()`方法内部，要继续处理请求，必须调用`chain.doFilter()`。最后，用`@WebFilter`注解标注该Filter需要过滤的URL。这里的`/*`表示所有路径。

添加了Filter之后，整个请求的处理架构如下：

```ascii
            ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
                                   /             ┌──────────────┐
            │                     ┌─────────────▶│ IndexServlet │ │
                                  │              └──────────────┘
            │                     │/signin       ┌──────────────┐ │
                                  ├─────────────▶│SignInServlet │
            │                     │              └──────────────┘ │
                                  │/signout      ┌──────────────┐
┌───────┐   │   ┌──────────────┐  ├─────────────▶│SignOutServlet│ │
│Browser│──────▶│EncodingFilter├──┤              └──────────────┘
└───────┘   │   └──────────────┘  │/user/profile ┌──────────────┐ │
                                  ├─────────────▶│ProfileServlet│
            │                     │              └──────────────┘ │
                                  │/user/post    ┌──────────────┐
            │                     ├─────────────▶│ PostServlet  │ │
                                  │              └──────────────┘
            │                     │/user/reply   ┌──────────────┐ │
                                  └─────────────▶│ ReplyServlet │
            │                                    └──────────────┘ │
             ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

还可以继续添加其他Filter，例如LogFilter：

```java
@WebFilter("/*")
public class LogFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        System.out.println("LogFilter: process " + ((HttpServletRequest) request).getRequestURI());
        chain.doFilter(request, response);
    }
}
```

多个Filter会组成一个链，每个请求都被链上的Filter依次处理：

```ascii
                                        ┌────────┐
                                     ┌─▶│ServletA│
                                     │  └────────┘
    ┌──────────────┐    ┌─────────┐  │  ┌────────┐
───▶│EncodingFilter│───▶│LogFilter│──┼─▶│ServletB│
    └──────────────┘    └─────────┘  │  └────────┘
                                     │  ┌────────┐
                                     └─▶│ServletC│
                                        └────────┘
```

有些细心的童鞋会问，有多个Filter的时候，Filter的顺序如何指定？多个Filter按不同顺序处理会造成处理结果不同吗？

答案是Filter的顺序确实对处理的结果有影响。但遗憾的是，Servlet规范并没有对`@WebFilter`注解标注的Filter规定顺序。如果一定要给每个Filter指定顺序，就必须在`web.xml`文件中对这些Filter再配置一遍。

注意到上述两个Filter的过滤路径都是`/*`，即它们会对所有请求进行过滤。也可以编写只对特定路径进行过滤的Filter，例如`AuthFilter`：

```java
@WebFilter("/user/*")
public class AuthFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        System.out.println("AuthFilter: check authentication");
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse resp = (HttpServletResponse) response;
        if (req.getSession().getAttribute("user") == null) {
            // 未登录，自动跳转到登录页:
            System.out.println("AuthFilter: not signin!");
            resp.sendRedirect("/signin");
        } else {
            // 已登录，继续处理:
            chain.doFilter(request, response);
        }
    }
}
```

注意到`AuthFilter`只过滤以`/user/`开头的路径，因此：

- 如果一个请求路径类似`/user/profile`，那么它会被上述3个Filter依次处理；
- 如果一个请求路径类似`/test`，那么它会被上述2个Filter依次处理（不会被AuthFilter处理）。

再注意观察`AuthFilter`，当用户没有登录时，在`AuthFilter`内部，直接调用`resp.sendRedirect()`发送重定向，且没有调用`chain.doFilter()`，因此，当用户没有登录时，请求到达`AuthFilter`后，不再继续处理，即后续的Filter和任何Servlet都没有机会处理该请求了。

可见，Filter可以有针对性地拦截或者放行HTTP请求。

如果一个Filter在当前请求中生效，但什么都没有做：

```java
@WebFilter("/*")
public class MyFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        // TODO
    }
}
```

那么，用户将看到一个空白页，因为请求没有继续处理，默认响应是200+空白输出。

```alert type=warning title=注意
如果Filter要使请求继续被处理，就一定要调用chain.doFilter()！
```

如果我们使用上一节介绍的MVC模式，即一个统一的`DispatcherServlet`入口，加上多个Controller，这种模式下Filter仍然是正常工作的。例如，一个处理`/user/*`的Filter实际上作用于那些处理`/user/`开头的Controller方法之前。

### 小结

Filter是一种对HTTP请求进行预处理的组件，它可以构成一个处理链，使得公共处理代码能集中到一起；

Filter适用于日志、登录检查、全局设置等；

设计合理的URL映射可以让Filter链更清晰。
