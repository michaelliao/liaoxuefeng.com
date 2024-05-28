# 启动嵌入式Tomcat

Spring Boot实现一个jar包直接运行的原理其实就是把Tomcat打包进去，自己再写个`main()`函数：

```java
@SpringBootApplication
public class AppConfig {
    public static void main(String[] args) {
        SpringApplication.run(AppConfig.class, args);
    }
}
```

在`SpringApplication.run()`方法内，Spring Boot会启动嵌入式Tomcat，然后再初始化Spring的IoC容器，实际上就是一个jar包内包含了嵌入式Tomcat、Spring IoC容器、Web MVC模块以及应用程序自己开发的Bean。

因此，我们也提供一个`SummerApplication`，实现`run()`方法如下：

```java
public class SummerApplication {
    public static void run(String webDir, String baseDir, Class<?> configClass, String... args) {
        // 读取application.yml配置:
        var propertyResolver = WebUtils.createPropertyResolver();
        // 创建Tomcat服务器:
        var server = startTomcat(webDir, baseDir, configClass, propertyResolver);
        // 等待服务器结束:
        server.await();
    }
}
```

这里多了两个参数：`webDir`和`baseDir`，这是为启动嵌入式Tomcat准备的，启动嵌入式Tomcat的代码如下：

```java
Server startTomcat(String webDir, String baseDir, Class<?> configClass, PropertyResolver propertyResolver) throws Exception {
    int port = propertyResolver.getProperty("${server.port:8080}", int.class);
    // 实例化Tomcat Server:
    Tomcat tomcat = new Tomcat();
    tomcat.setPort(port);
    // 设置Connector:
    tomcat.getConnector().setThrowOnFailure(true);
    // 添加一个默认的Webapp，挂载在'/':
    Context ctx = tomcat.addWebapp("", new File(webDir).getAbsolutePath());
    // 设置应用程序的目录:
    WebResourceRoot resources = new StandardRoot(ctx);
    resources.addPreResources(new DirResourceSet(resources, "/WEB-INF/classes", new File(baseDir).getAbsolutePath(), "/"));
    ctx.setResources(resources);
    // 设置ServletContainerInitializer监听器:
    ctx.addServletContainerInitializer(new ContextLoaderInitializer(configClass, propertyResolver), Set.of());
    // 启动服务器:
    tomcat.start();
    return tomcat.getServer();
}
```

那么我们的IoC容器，以及注册`Servlet`、`Filter`是在哪进行的？答案是我们在`startTomcat()`内注册了一个`ServletContainerInitializer`监听器，这个监听器负责启动IoC容器与注册`Servlet`、`Filter`：

```java
public class ContextLoaderInitializer implements ServletContainerInitializer {
    final Class<?> configClass;
    final PropertyResolver propertyResolver;

    public ContextLoaderInitializer(Class<?> configClass, PropertyResolver propertyResolver) {
        this.configClass = configClass;
        this.propertyResolver = propertyResolver;
    }

    @Override
    public void onStartup(Set<Class<?>> c, ServletContext ctx) throws ServletException {
        // 设置ServletContext:
        WebMvcConfiguration.setServletContext(ctx);
        // 启动IoC容器:
        ApplicationContext applicationContext = new AnnotationConfigApplicationContext(this.configClass, this.propertyResolver);
        // 注册Filter与DispatcherServlet:
        WebUtils.registerFilters(ctx);
        WebUtils.registerDispatcherServlet(ctx, this.propertyResolver);
    }
}
```

没有复用web模块的`ContextLoaderListener`是因为Tomcat不允许没有在`web.xml`中声明的`Listener`注册`Filter`与`Servlet`，而我们写boot模块原因之一也是要做到不需要`web.xml`。

这样我们就完成了boot模块的开发，它其实就包含两个组件：

- SummerApplication：负责启动嵌入式Tomcat；
- ContextLoaderInitializer：负责启动IoC容器，注册`Filter`与`DispatcherServlet`。

下面就可以编写一个基于`boot`的Web应用程序了。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/framework/summer-boot)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/framework/summer-boot)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/framework/summer-boot">GitHub</a>
