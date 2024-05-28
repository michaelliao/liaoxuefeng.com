# 启动IoC容器

在开发Web MVC模块之前，我们首先回顾下Java Web应用程序到底有几方参与。

首先，Java Web应用一般遵循Servlet标准，这个标准定义了应用程序可以按接口编写哪些组件：Servlet、Filter和Listener，也规定了一个服务器（如Tomcat、Jetty、JBoss等）应该提供什么样的服务，按什么顺序加载应用程序的组件，最后才能跑起来处理来自用户的HTTP请求。

Servlet规范定义的组件有3类：

1. Servlet：处理HTTP请求，然后输出响应；
2. Filter：对HTTP请求进行过滤，可以有多个Filter形成过滤器链，实现权限检查、限流、缓存等逻辑；
3. Listener：用来监听Web应用程序产生的事件，包括启动、停止、Session有修改等。

这些组件均由应用程序实现。

而服务器为一个应用程序提供一个“容器”，即Servlet Container，一个Server可以同时跑多个Container，不同的Container可以按URL、域名等区分，Container才是用来管理Servlet、Filter、Listener这些组件的：

```ascii
┌─────────────────────────────────────┐
│Web Server                           │
│┌───────────────────────────────────┐│
││Servlet Container                  ││
││┌────────┐┌────────┐┌────────┐     ││
│││Servlet ││Servlet ││Servlet │ ... ││
││└────────┘└────────┘└────────┘     ││
││┌────────┐┌────────┐┌────────┐     ││
│││Filter  ││Filter  ││Filter  │ ... ││
││└────────┘└────────┘└────────┘     ││
││┌────────┐┌────────┐┌────────┐     ││
│││Listener││Listener││Listener│ ... ││
││└────────┘└────────┘└────────┘     ││
│└───────────────────────────────────┘│
│┌───────────────────────────────────┐│
││Servlet Container                  ││
││                                   ││
│└───────────────────────────────────┘│
└─────────────────────────────────────┘
```

另一个需要特别重要的问题是：组件由谁创建，由谁销毁。

在使用IoC容器时，注意到IoC容器也是一个Java类，IoC容器又管理着很多Bean，因此，创建顺序是：

1. 执行应用程序的入口方法`main()`；
2. 在`main()`方法中，创建IoC容器的实例；
3. IoC容器在它的内部创建各个Bean的实例。

现在，我们开发的是Web应用程序，它本身就是一堆组件，被Web服务器提供的Servlet“容器”管理，同时，又要加一个IoC容器，到底谁创建谁，谁管理谁，这个问题，必须要搞清楚。

首先，我们不能改变Servlet规范，所以，Servlet、Filter、Listener，以及IoC容器，都必须在Servlet容器内被管理：

```ascii
         ┌────────────────────────────────────────────┐
         │Servlet Container                           │
         │                        ┌──────────────────┐│
         │                        │IoC Container     ││
         │  ┌──────┐   ┌───────┐  │  ┌────────────┐  ││
Request ─┼─▶│Filter│──▶│Servlet│──┼─▶│Controller  │  ││
         │  └──────┘   └───────┘  │  └────────────┘  ││
         │                        │         │        ││
         │  ┌────────┐            │         ▼        ││
         │  │Listener│            │  ┌────────────┐  ││
         │  └────────┘            │  │UserService │  ││
         │                        │  └────────────┘  ││
         │                        │         │        ││
         │                        │         ▼        ││
         │                        │  ┌────────────┐  ││
         │                        │  │JdbcTemplate│  ││
         │                        │  └────────────┘  ││
         │                        └──────────────────┘│
         └────────────────────────────────────────────┘
```

所以我们要捋清楚这些组件的创建顺序，以及谁创建谁。

对于一个Web应用程序来说，启动时，应用程序本身只是一个`war`包，并没有`main()`方法，因此，启动时执行的是Server的`main()`方法。以Tomcat服务器为例：

1. 启动服务器，即执行Tomcat的`main()`方法；
2. Tomcat根据配置或自动检测到一个`xyz.war`包后，为这个`xyz.war`应用程序创建Servlet容器；
3. Tomcat继续查找`xyz.war`定义的Servlet、Filter和Listener组件，按顺序实例化每个组件（Listener最先被实例化，然后是Filter，最后是Servlet）；
4. 用户发送HTTP请求，Tomcat收到请求后，转发给Servlet容器，容器根据应用程序定义的映射，把请求发送个若干Filter和一个Servlet处理；
5. 处理期间产生的事件则由Servlet容器自动调用Listener。

其中，第3步实例化又有很多方式：

1. 通过在`web.xml`配置文件中定义，这也是早期Servlet规范唯一的配置方式；
2. 通过注解`@WebServlet`、`@WebFilter`和`@WebListener`定义，由Servlet容器自动扫描所有class后创建组件，这和我们用Annotation配置Bean，由IoC容器自动扫描创建Bean非常类似；
3. 先配置一个`Listener`，由Servlet容器创建`Listener`，然后，`Listener`自己调用相关接口，手动创建`Servlet`和`Filter`。

到底用哪种方式，取决于Web应用程序自己如何编写。对于使用Spring框架的Web应用程序来说，Servlet、Filter和Listener数量少，而且是固定的，应用程序自身编写的Controller数量不定，但由IoC容器管理，因此，采用方式3最合适。

具体来说，Tomcat启动一个基于Spring开发的Web应用程序时，按如下步骤初始化：

1. 为Web应用程序准备Servlet容器；
2. 根据配置实例化一个Spring提供的`Listener`；
    1. Spring提供的`Listener`在初始化时启动IoC容器；
    2. Spring提供的`Listener`在初始化时向Servlet容器注册Spring内置的一个`DispatcherServlet`。

当Tomcat把HTTP请求发送给Spring注册的`Servlet`后，因为它持有IoC容器的引用，就可以找到`Controller`实例，因此，可以把请求继续转发给对应的Controller，这样就完成了HTTP请求的处理。

另外注意到Web应用程序除了提供`Controller`外，并不必须与Servlet API打交道，因为被Spring提供的`DispatcherServlet`给隔离了。

所以，我们在开发Summer Framework的Web MVC模块时，应该以如下方式初始化：

1. 应用程序必须配置一个Summer Framework提供的Listener；
2. Tomcat完成Servlet容器的创建后，立刻根据配置创建Listener；
    1. Listener初始化时创建IoC容器；
    2. Listener继续创建DispatcherServlet实例，并向Servlet容器注册；
    3. DispatcherServlet初始化时获取到IoC容器中的Controller实例，因此可以根据URL调用不同Controller实例的不同处理方法。

我们先写一个只能输出Hello World的Servlet：

```java
public class DispatcherServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        PrintWriter pw = resp.getWriter();
        pw.write("<h1>Hello, world!</h1>");
        pw.flush();
    }
}
```

紧接着，编写一个`ContextLoaderListener`，它实现了`ServletContextListener`接口，能监听Servlet容器的启动和销毁，在监听到初始化事件时，完成创建IoC容器和注册`DispatcherServlet`两个工作：

```java
public class ContextLoaderListener implements ServletContextListener {
    // Servlet容器启动时自动调用:
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        // 创建IoC容器:
        var applicationContext = createApplicationContext(...);
        // 实例化DispatcherServlet:
        var dispatcherServlet = new DispatcherServlet();
        // 注册DispatcherServlet:
        var dispatcherReg = servletContext.addServlet("dispatcherServlet", dispatcherServlet);
        dispatcherReg.addMapping("/");
        dispatcherReg.setLoadOnStartup(0);
    }
}
```

这样，我们就完成了Web应用程序的初始化全部流程！

最后两个小问题：

1. 创建IoC容器时，需要的配置文件从哪读？这里我们采用Spring Boot的方式，默认从classpath的`application.yml`或`application.properties`读。
2. 需要的`@Configuration`配置类从哪获取？这是通过`web.xml`文件配置的：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app ...>
	<context-param>
        <!-- 固定名称 -->
		<param-name>configuration</param-name>
        <!-- 配置类的完整类名 -->
		<param-value>com.itranswarp.summer.webapp.WebAppConfig</param-value>
	</context-param>

	<listener>
		<listener-class>com.itranswarp.summer.web.ContextLoaderListener</listener-class>
	</listener>
</web-app>
```

在`ContextLoaderListener`的`contextInitialized()`方法内，先获取`ServletContext`引用，再通过`getInitParameter("configuration")`拿到完整类名，就可以顺利创建IoC容器了。

用Maven打包后，把生成的`xyz.war`改为`ROOT.war`，复制到Tomcat的`webapps`目录下，清除掉其他webapp，启动Tomcat，输入`http://localhost:8080`可看到输出`Hello, world!`。

这样我们就跑通了一个Web应用程序启动的全部流程。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/step-by-step/web-app-context)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/step-by-step/web-app-context)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/step-by-step/web-app-context">GitHub</a>
