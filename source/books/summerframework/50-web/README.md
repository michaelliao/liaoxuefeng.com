# 实现Web MVC

现在，我们已经实现了IoC容器、AOP、JdbcTemplate和声明式事务，离一个完整的框架只差一个Web MVC了。

我们先看看Spring的Web MVC主要提供了哪些组件和API支持：

1. 一个`DispatcherServlet`作为核心处理组件，接收所有URL请求，然后按MVC规则转发；
2. 基于`@Controller`注解的URL控制器，由应用程序提供，Spring负责解析规则；
3. 提供`ViewResolver`，将应用程序的Controller处理后的结果进行渲染，给浏览器返回页面；
4. 基于`@RestController`注解的REST处理机制，由应用程序提供，Spring负责将输入输出变为JSON格式；
5. 多种拦截器和异常处理器等。

Spring的Web MVC功能十分强大，涉及到的内容也非常广。相比之下，Summer Framework的Web MVC必然要聚焦在核心组件上：

|                            | Spring Framework | Summer Framework |
|----------------------------|------------------|------------------|
| DispatcherServlet          | 支持 | 支持  |
| @Controller注解            | 支持 | 支持 |
| @RestController注解        | 支持 | 支持 |
| ViewResolver                | 支持 | 支持 |
| HandlerInterceptor          | 支持 | 不支持 |
| Exception Handler           | 支持 | 不支持 |
| CORS                       | 支持 | 不支持  |
| 异步处理                    | 支持 | 不支持  |
| WebSocket                  | 支持 | 不支持  |

不过，Spring Framework的Web MVC模块对`Filter`支持有限，要想愉快地使用`Filter`，最好通过Spring Boot提供的`FilterRegistrationBean`，Summer Framework为了便于应用程序开发自己的`Filter`，直接支持`FilterRegistrationBean`。

下面开始正式开发Summer Framework的Web MVC模块。
