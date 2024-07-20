# JDK11新特性解读

随着JDK11正式发布，带来了许多新的特性。本文主要介绍JDK11的部分新特性和新的API。

### Local Var

在Lambda表达式中，可以使用`var`关键字来标识变量，变量类型由编译器自行推断。

例如：

```java
// LocalVar.java
package com.itranswarp.jdk11;

import java.util.Arrays;

public class LocalVar {
    public static void main(String[] args) {
        Arrays.asList("Java", "Python", "Ruby")
            .forEach((var s) -> {
                System.out.println("Hello, " + s);
            });
	}
}
```

### HttpClient

长期以来，如果要访问Http资源，JDK的标准库中只有一个`HttpURLConnection`，这个古老的API使用非常麻烦，而且已经不适用于最新的HTTP协议。

JDK11的新的HttpClient支持HTTP/2和WebSocket，并且可以使用异步接口：

```java
// HttpApi.java
package com.itranswarp.jdk11;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.concurrent.CompletableFuture;

public class HttpApi {

    public static void main(String[] args) {
        HttpRequest request = HttpRequest.newBuilder().uri(URI.create("https://www.qq.com/")).GET().build();
        HttpResponse.BodyHandler<String> bodyHandler = HttpResponse.BodyHandlers.ofString();
        HttpClient client = HttpClient.newHttpClient();
        CompletableFuture<HttpResponse<String>> future = client.sendAsync(request, bodyHandler);
        future.thenApply(HttpResponse::body).thenAccept(System.out::println).join();
    }
}
```

### List API

对于`List`接口，新增了一个`of(T...)`接口，用于快速创建`List`对象：

```java
List<String> list = List.of("Java", "Python", "Ruby");
```

`List`的`toArray()`还新增了一个重载方法，可以更方便地把`List`转换为数组。可以比较一下两种转换方法：

```java
// 旧的方法: 传入String[]:
String[] oldway = list.toArray(new String[list.size()]);

// 新的方法: 传入IntFunction:
String[] newway = list.toArray(String[]::new);
```

### 读写文件

对`Files`类增加了writeString和readString两个静态方法，可以直接把String写入文件，或者把整个文件读出为一个String：

```java
Files.writeString(
    Path.of("./", "tmp.txt"), // 路径
    "hello, jdk11 files api", // 内容
    StandardCharsets.UTF_8); // 编码
String s = Files.readString(
    Paths.get("./tmp.txt"), // 路径
    StandardCharsets.UTF_8); // 编码
```

这两个方法可以大大简化读取配置文件之类的问题。

### String API

`String`新增了`strip()`方法，和`trim()`相比，`strip()`可以去掉Unicode空格，例如，中文空格：

```java
String s = " Hello, JDK11!\u3000\u3000";
System.out.println("     original: [" + s + "]");
System.out.println("         trim: [" + s.trim() + "]");
System.out.println("        strip: [" + s.strip() + "]");
System.out.println(" stripLeading: [" + s.stripLeading() + "]");
System.out.println("stripTrailing: [" + s.stripTrailing() + "]");
```

输出如下：

```plain
     original: [ Hello, JDK11!　　]
         trim: [Hello, JDK11!　　]
        strip: [Hello, JDK11!]
 stripLeading: [Hello, JDK11!　　]
stripTrailing: [ Hello, JDK11!]
```

新增`isBlank()`方法，可判断字符串是不是“空白”字符串：

```java
String s = " \u3000"; // 由一个空格和一个中文空格构成
System.out.println(s.isEmpty()); // false
System.out.println(s.isBlank()); // true
```

新增`lines()`方法，可以非常方便地按行分割字符串：

```java
String s = "Java\nPython\nRuby";
s.lines().forEach(System.out::println);
```

新增`repeat()`方法，可以指定重复次数：

```java
System.out.println("-".repeat(10)); // 打印----------
```

除了新增的API外，JDK11还带来了EpsilonGC，就是什么也不做的GC，以及ZGC，一个几乎可以做到毫秒级暂停的GC。ZGC还处于实验阶段，所以启动它需要命令行参数`-XX:+UnlockExperimentalVMOptions -XX:+UseZGC`。

JDK11是一个LTS版本（Long-Term-Support），所以……

## 放心升级吧！
