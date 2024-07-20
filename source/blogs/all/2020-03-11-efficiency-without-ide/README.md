# 提升开发效率，你并不需要依赖IDE

很多童鞋在开发应用程序的时候，对IDE的要求很高，而且喜欢折腾各种插件。

以Java Web开发为例，大家都知道，开发Java Web程序，就是基于Servlet编程。从代码到部署，有4个步骤：

1. 编写Servlet；
2. 打包为war文件；
3. 复制到Tomcat的webapps目录下；
4. 启动Tomcat。

这个过程是不是很繁琐？如果我们想在IDE中断点调试，还需要打开Tomcat的远程调试端口并且连接上去。

![javaee-expert](laoniao.jpg)

![javaee-newbee](cainiao.jpg)

许多初学者经常卡在如何在IDE中启动Tomcat并加载webapp，更不要说断点调试了。老手对于配置插件、处理不同版本差异上估计也只能靠搜索解决。并且，在团队开发中，不同系统环境的差异带来的插件配置问题更多。

所谓使用插件，无非就是我们在IDE中配置好了，由插件来自动完成上述任务。但是，越是复杂的任务，图形化的插件越不稳定。IDE中插件越多，他们之间互相冲突的概率也越大。

我们不是反对使用插件，而是说，使用IDE和插件的时候，最好依赖IDE的核心功能，对于日常提升便捷性的任务，使用插件没有问题。

还是以Java Web开发为例，如果要调试Web程序，是不是一定要启动Tomcat、配置webapp、打开远程调试呢？

其实并不需要。IDE对于启动、调试通过`main()`方法的普通Java程序是极其可靠而且稳定的，因为它就是本地JVM，而远程调试，外加动态配置服务器，就不那么稳定，尤其是一旦某些地方配置出了问题，很难排查，白白把时间浪费在配置开发环境上。并且，在一台电脑上配置的这些经验可能换一台机器就不行了，在大公司有过大型项目开发经验的童鞋可以比赛一下搭建开发环境所需要的时间。

因此，要提升开发效率，调试webapp，最好使用简单可靠，能像普通Java程序一样，直接在IDE中启动并调试webapp的方法。

因为Tomcat实际上也是一个Java程序，我们看看Tomcat的启动流程：

1. 启动JVM并执行Tomcat的`main()`方法；
2. 加载war并初始化Servlet；
3. 正常服务。

启动Tomcat无非就是设置好classpath并执行Tomcat某个jar包的`main()`方法，我们完全可以把Tomcat的jar包全部引入进来，然后自己编写一个`main()`方法，先启动Tomcat，然后让它加载我们的webapp就行。

实际上，通过Maven引入Tomcat依赖后，我们可以编写一个`main()`方法，直接启动Tomcat服务器：

```java
public class Main {
    public static void main(String[] args) throws Exception {
        // 启动Tomcat:
        Tomcat tomcat = new Tomcat();
        tomcat.setPort(Integer.getInteger("port", 8080));
        tomcat.getConnector();
        // 创建webapp:
        Context ctx = tomcat.addWebapp("", new File("src/main/webapp").getAbsolutePath());
        WebResourceRoot resources = new StandardRoot(ctx);
        resources.addPreResources(
                new DirResourceSet(resources, "/WEB-INF/classes", new File("target/classes").getAbsolutePath(), "/"));
        ctx.setResources(resources);
        tomcat.start();
        tomcat.getServer().await();
    }
}
```

这样，我们直接运行`main()`方法，即可启动嵌入式Tomcat服务器，然后，通过预设的`tomcat.addWebapp("", new File("src/main/webapp")`，Tomcat会自动加载当前工程作为根webapp，整个过程就是一个普通的Java程序，在IDE环境中启动和调试，并不需要任何插件，甚至连本地安装Tomcat的步骤都省了。

通过`main()`方法启动Tomcat服务器并加载我们自己的webapp有如下好处：

1. 启动简单，无需下载Tomcat或安装任何IDE插件；
2. 调试方便，可在IDE中使用断点调试；
3. 使用Maven创建war包后，也可以正常部署到独立的Tomcat服务器中。

对SpringBoot有所了解的童鞋可能知道，SpringBoot也支持在`main()`方法中一行代码直接启动Tomcat，并且还能方便地更换成Jetty等其他服务器。它的启动方式和我们介绍的是基本一样的，可见，编写几行样板代码直接启动整个服务器和webapp是多么方便。
