# 使用Resource

在Java程序中，我们经常会读取配置文件、资源文件等。使用Spring容器时，我们也可以把“文件”注入进来，方便程序读取。

例如，AppService需要读取`logo.txt`这个文件，通常情况下，我们需要写很多繁琐的代码，主要是为了定位文件，打开InputStream。

Spring提供了一个`org.springframework.core.io.Resource`（注意不是`jarkata.annotation.Resource`或`javax.annotation.Resource`），它可以像`String`、`int`一样使用`@Value`注入：

```java
@Component
public class AppService {
    @Value("classpath:/logo.txt")
    private Resource resource;

    private String logo;

    @PostConstruct
    public void init() throws IOException {
        try (var reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            this.logo = reader.lines().collect(Collectors.joining("\n"));
        }
    }
}
```

注入`Resource`最常用的方式是通过classpath，即类似`classpath:/logo.txt`表示在classpath中搜索`logo.txt`文件，然后，我们直接调用`Resource.getInputStream()`就可以获取到输入流，避免了自己搜索文件的代码。

也可以直接指定文件的路径，例如：

```java
@Value("file:/path/to/logo.txt")
private Resource resource;
```

但使用classpath是最简单的方式。上述工程结构如下：

```ascii
spring-ioc-resource
├── pom.xml
└── src
    └── main
        ├── java
        │   └── com
        │       └── itranswarp
        │           └── learnjava
        │               ├── AppConfig.java
        │               └── AppService.java
        └── resources
            └── logo.txt
```

使用Maven的标准目录结构，所有资源文件放入`src/main/resources`即可。

### 练习

使用Spring的`Resource`注入`app.properties`文件，然后读取该配置文件。

[下载练习](spring-ioc-resource.zip)

### 小结

Spring提供了Resource类便于注入资源文件。

最常用的注入是通过classpath以`classpath:/path/to/file`的形式注入。
