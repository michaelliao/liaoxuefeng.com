# 实现ClassLoader

要通过Web服务器加载`war`包，我们首先要了解JVM的ClassLoader（类加载器）的机制。

在Java中，所有的类，都是由ClassLoader加载到JVM中执行的，但JVM中不止一种ClassLoader。写个简单的程序就可以测试：

```java
public class Main {
    public static void main(String[] args) {
        System.out.println(String.class.getClassLoader()); // null
        System.out.println(DataSource.class.getClassLoader()); // PlatformClassLoader
        System.out.println(Main.class.getClassLoader()); // AppClassLoader
    }
}
```

对于Java核心类，如`java.lang.String`，返回`null`表示使用的是JVM内部的启动类加载器（`BootClassLoader`），对于非核心的JDK类，如`javax.sql.DataSource`，使用的是`PlatformClassLoader`，对于用户编写的类，如`Main`，使用的是`AppClassLoader`。

我们通常说的ClassPath机制，即JVM应该在哪些目录和哪些jar包里去找Class，实际上说的是`AppClassLoader`使用的ClassPath，这3个ClassLoader按优先级排序如下：

1. BootClassLoader
2. PlatformClassLoader
3. AppClassLoader

用AppClassLoader加载一个Class时，它首先会委托父级ClassLoader尝试加载，如果加载失败，才尝试自己加载，这就是JVM的ClassLoader使用的双亲委派模型，它是为了防止用AppClassLoader加载用户自己编写的`java.lang.String`导致破坏JDK的核心类。

因此，对于一个Class来说，它始终关联着一个加载它自己的ClassLoader：

```ascii
                           ┌───────────────────────────────┐
┌───────────────────┐      │java.lang.String               │
│  BootClassLoader  │◀─ ─ ─│java.util.List                 │
└───────────────────┘      │...                            │
          ▲                └───────────────────────────────┘
          │                ┌───────────────────────────────┐
┌───────────────────┐      │javax.sql.DataSource           │
│PlatformClassLoader│◀─ ─ ─│javax.transaction.xa.XAResource│
└───────────────────┘      │...                            │
          ▲                └───────────────────────────────┘
          │                ┌───────────────────────────────┐
┌───────────────────┐      │com.example.Main               │
│  AppClassLoader   │◀─ ─ ─│org.slf4j.Logger               │
└───────────────────┘      │...                            │
                           └───────────────────────────────┘
```

现在，假设我们完成了Jerrymouse服务器的开发，那么最后得到的就是`jerrymouse.jar`这样的jar包，如果要运行一个`hello-webapp.war`，我们期待的命令行如下：

```plain
$ java -jar jerrymouse.jar --war hello-webapp.war
```

上述命令行的classpath实际上是`jerrymouse.jar`，服务器的类均可以被JVM的`AppClassLoader`加载，但是，`AppClassLoader`无法加载`hello-webapp.war`在`/WEB-INF/classes`存放的`.class`文件，也无法加载在`/WEB-INF/lib`存放的jar文件，原因是它们均不在classpath中，且运行期无法修改classpath。

因此，我们必须自己编写ClassLoader，才能加载到`hello-webapp.war`里的`.class`文件和`jar`包。

### 编写ClassLoader

为了加载`war`包里的`.class`文件和`jar`包，我们定义一个`WebAppClassLoader`。直接从`ClassLoader`继承不是不可以，但是要自己编写的代码太多。ClassLoader看起来很复杂，实际上就是想办法以任何方式拿到`.class`文件的用`byte[]`表示的内容，然后用`ClassLoader`的`defineClass()`获得JVM加载后的`Class`实例。大多数ClassLoader都是基于文件的加载，因此，JDK提供了一个`URLClassLoader`方便编写从文件加载的ClassLoader：

```java
public class WebAppClassLoader extends URLClassLoader {

    public WebAppClassLoader(Path classPath, Path libPath) throws IOException {
        super("WebAppClassLoader", createUrls(classPath, libPath), ClassLoader.getSystemClassLoader());
    }

    // 返回一组URL用于搜索class:
    static URL[] createUrls(Path classPath, Path libPath) throws IOException {
        List<URL> urls = new ArrayList<>();
        urls.add(toDirURL(classPath));
        Files.list(libPath).filter(p -> p.toString().endsWith(".jar")).sorted().forEach(p -> {
            urls.add(toJarURL(p));
        });
        return urls.toArray(URL[]::new);
    }

    static URL toDirURL(Path p) {
        // 将目录转换为URL:
        ...
    }

    static URL toJarURL(Path p) {
        // 将jar包转换为URL:
        ...
    }
}
```

只要传入正确的目录和一组jar包，`WebAppClassLoader`就可以加载到对应的`.class`文件。

下一步是修改启动流程，先解析命令行参数`--war`拿到`war`包的路径，然后解压到临时目录，获取到`/tmp/xxx/WEB-INF/classes`路径以及`/tmp/xxx/WEB-INF/lib`路径，就可以构造`WebAppClassLoader`了：

```java
Path classesPath = ...
Path libPath = ...
ClassLoader classLoader = new WebAppClassLoader(classesPath, libPath);
```

接下来，需要获取到所有的`Servlet`、`Filter`和`Listener`组件，因此需要在`WebAppClassLoader`的范围内扫描所有`.class`文件：

```java
Set<Class<?>> classSet = ... // 扫描获得所有Class
```

修改`HttpConnector`，传入`ClassLoader`和扫描的Class，就可以把所有`Servlet`、`Filter`和`Listener`添加到`ServletContext`中。这样，我们就把写死的Servlet组件从服务器中移除掉，并实现了从外部war包动态加载Servlet组件。

### 设置ContextClassLoader

在`HttpConnector`中，我们还需要对`handler()`方法进行改进，正确设置线程的ContextClassLoader（上下文类加载器）：

```java
public void handle(HttpExchange exchange) throws IOException {
    var adapter = new HttpExchangeAdapter(exchange);
    var response = new HttpServletResponseImpl(this.config, adapter);
    var request = new HttpServletRequestImpl(this.config, this.servletContext, adapter, response);
    try {
        // 将线程的上下文类加载器设置为WebAppClassLoader:
        Thread.currentThread().setContextClassLoader(this.classLoader);
        this.servletContext.process(request, response);
    } catch (Exception e) {
        logger.error(e.getMessage(), e);
    } finally {
        // 恢复默认的线程的上下文类加载器:
        Thread.currentThread().setContextClassLoader(null);
        response.cleanup();
    }
}
```

为什么需要设置线程的ContextClassLoader？执行`handle()`方法的线程是由线程池提供的，线程池是`HttpConnector`创建的，因此，`handle()`方法内部加载的任何类都是由`AppClassLoader`加载的，而我们希望加载的类是由`WebAppClassLoader`从解压的`war`包中加载，此时，就需要设置线程的上下文类加载器。

举例说明：

当我们在一个方法中调用`Class.forName()`时：

```java
Object createInstance(String className) {
    Class<?> clazz = Class.forName(className);
    return clazz.newInstance();
}
```

正常情况下，将由`AppClassLoader`负责查找`Class`，显然是找不到war包解压后存放在`classes`和`lib`目录里的类，只有我们自己写的`WebAppClassLoader`才能找到，因此，必须设置正确的线程上下文类加载器：

```java
Object createInstance(String className) {
    Thread.currentThread().setContextClassLoader(this.classLoader);
    Class<?> clazz = Class.forName(className);
    Thread.currentThread().setContextClassLoader(null);
    return clazz.newInstance();
}
```

最后，完善所有接口的实现类，我们就成功开发了一个迷你版的Tomcat服务器！

### 参考源码

可以从[GitHub](https://github.com/michaelliao/jerrymouse/tree/master/server)或[Gitee](https://gitee.com/liaoxuefeng/jerrymouse/tree/master/server)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/jerrymouse/tree/master/server">GitHub</a>

### 小结

开发Web服务器时，需要编写自定义的ClassLoader，才能从war包中加载`.class`文件；

处理Servlet请求的线程必须正确设置ContextClassLoader。
