# 开发Web应用

在我们开发完Summer Framework的所有组件后，就可以基于Summer Framework来开发一个真正的Web应用了！

我们来一步一步创建一个`hello-webapp`的应用，它基于Maven项目，符合webapp标准。

首先，我们在`src/main/resources`下定义配置文件`application.yml`：

```yaml
app:
  title: Hello Application
  version: 1.0

summer:
  datasource:
    url: jdbc:sqlite:test.db
    driver-class-name: org.sqlite.JDBC
    username: sa
    password: 
```

紧接着，定义IoC容器的配置类如下：

```java
@ComponentScan
@Configuration
@Import({ JdbcConfiguration.class, WebMvcConfiguration.class })
public class HelloConfiguration {
}
```

以及相关的`UserService`、`MvcController`等Bean。

接下来是在`src/main/webapp/WEB-INF`目录下创建Servlet容器所需的配置文件`web.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app ...>
	<display-name>Hello Webapp</display-name>

	<context-param>
		<param-name>configuration</param-name>
		<param-value>com.itranswarp.hello.HelloConfiguration</param-value>
	</context-param>

	<listener>
		<listener-class>com.itranswarp.summer.web.ContextLoaderListener</listener-class>
	</listener>
</web-app>
```

Servlet容器会自动读取`web.xml`，根据配置的Listener启动Summer Framework的web模块的`ContextLoaderListener`，它又会读取`web.xml`配置的`<context-param>`获得配置类的全名`com.itranswarp.hello.HelloConfiguration`，最后用这个配置类完成IoC容器的创建。创建后自动注册Summer Framework的`DispatcherServlet`，以及Web应用程序定义的`FilterRegistrationBean`，这样就完成了整个Web应用程序的初始化。

其他用到的资源包括：

- 存储在`src/main/webapp/static`目录下的静态资源；
- 存储于`src/main/webapp/favicon.ico`的图标文件；
- 存储在`src/main/webapp/WEB-INF/templates`目录下的模板。

最后，运行`mvn clean package`命令，在`target`目录得到最终的war包，改名为`ROOT.war`，复制到Tomcat的`webapps`目录下，启动Tomcat，可以正常访问`http://localhost:8080`：

![hello-webapp](hello-webapp.png)

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/step-by-step/hello-webapp)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/step-by-step/hello-webapp)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/step-by-step/hello-webapp">GitHub</a>
