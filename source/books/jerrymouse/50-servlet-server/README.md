# 实现Servlet服务器

在上一节，我们已经成功实现了一个简单的HTTP服务器，但是，好像和Servlet没啥关系，因为整个操作都是基于`HttpExchange`接口做的。

而Servlet处理HTTP的接口是基于`HttpServletRequest`和`HttpServletResponse`，前者负责读取HTTP请求，后者负责写入HTTP响应。

怎么把基于`HttpExchange`的操作转换为基于`HttpServletRequest`和`HttpServletResponse`？答案是使用[Adapter模式](../../java/design-patterns/structural/adapter/index.html)。

首先我们定义`HttpExchangeAdapter`，它持有一个`HttpExchange`实例，并实现`HttpExchangeRequest`和`HttpExchangeResponse`接口：

```java
interface HttpExchangeRequest {
    String getRequestMethod();
    URI getRequestURI();
}

interface HttpExchangeResponse {
    Headers getResponseHeaders();
    void sendResponseHeaders(int rCode, long responseLength) throws IOException;
    OutputStream getResponseBody();
}

public class HttpExchangeAdapter implements HttpExchangeRequest, HttpExchangeResponse {
    final HttpExchange exchange;

    public HttpExchangeAdapter(HttpExchange exchange) {
        this.exchange = exchange;
    }

    // 实现方法
    ...
}
```

紧接着我们编写`HttpServletRequestImpl`，它内部持有`HttpServletRequest`，并实现了`HttpServletRequest`接口：

```java
public class HttpServletRequestImpl implements HttpServletRequest {
    final HttpExchangeRequest exchangeRequest;

    public HttpServletRequestImpl(HttpExchangeRequest exchangeRequest) {
        this.exchangeRequest = exchangeRequest;
    }

    // 实现方法
    ...
}
```

同理，编写`HttpServletResponseImpl`如下：

```java
public class HttpServletResponseImpl implements HttpServletResponse {
    final HttpExchangeResponse exchangeResponse;

    public HttpServletResponseImpl(HttpExchangeResponse exchangeResponse) {
        this.exchangeResponse = exchangeResponse;
    }

    // 实现方法
    ...
}
```

用一个图表示从`HttpExchange`转换为`HttpServletRequest`和`HttpServletResponse`如下：

```ascii
   ┌──────────────────────┐ ┌───────────────────────┐
   │  HttpServletRequest  │ │  HttpServletResponse  │
   └──────────────────────┘ └───────────────────────┘
               ▲                        ▲
               │                        │
   ┌──────────────────────┐ ┌───────────────────────┐
   │HttpServletRequestImpl│ │HttpServletResponseImpl│
┌──│- exchangeRequest     │ │- exchangeResponse ────┼──┐
│  └──────────────────────┘ └───────────────────────┘  │
│                                                      │
│  ┌──────────────────────┐ ┌───────────────────────┐  │
└─▶│ HttpExchangeRequest  │ │ HttpExchangeResponse  │◀─┘
   └──────────────────────┘ └───────────────────────┘
                      ▲         ▲
                      │         │
                      │         │
                 ┌───────────────────┐
                 │HttpExchangeAdapter│   ┌────────────┐
                 │- httpExchange ────┼──▶│HttpExchange│
                 └───────────────────┘   └────────────┘
```

接下来我们改造处理HTTP请求的`HttpHandler`接口：

```java
public class HttpConnector implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        var adapter = new HttpExchangeAdapter(exchange);
        var request = new HttpServletRequestImpl(adapter);
        var response = new HttpServletResponseImpl(adapter);
        process(request, response);
    }

    void process(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // TODO
    }
}
```

在`handle(HttpExchange)`方法内部，我们创建的对象如下：

1. HttpExchangeAdapter实例：它内部引用了jdk.httpserver提供的HttpExchange实例；
2. HttpServletRequestImpl实例：它内部引用了HttpExchangeAdapter实例，但是转换为HttpExchangeRequest接口；
3. HttpServletResponseImpl实例：它内部引用了HttpExchangeAdapter实例，但是转换为HttpExchangeResponse接口。

所以实际上创建的实例只有3个。最后调用`process(HttpServletRequest, HttpServletResponse)`方法，这个方法内部就可以按照Servlet标准来处理HTTP请求了，因为方法参数是标准的Servlet接口：

```java
void process(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    String name = request.getParameter("name");
    String html = "<h1>Hello, " + (name == null ? "world" : name) + ".</h1>";
    response.setContentType("text/html");
    PrintWriter pw = response.getWriter();
    pw.write(html);
    pw.close();
}
```

目前，我们仅实现了代码调用时用到的`getParameter()`、`setContentType()`和`getWriter()`这几个方法。如果补全`HttpServletRequest`和`HttpServletResponse`接口所有的方法定义，我们就得到了完整的`HttpServletRequest`和`HttpServletResponse`接口实现。

运行代码，在浏览器输入`http://localhost:8080/?name=World`，结果如下：

![simple-servlet-server](simple-servlet-server.jpg)

### 参考源码

可以从[GitHub](https://github.com/michaelliao/jerrymouse/tree/master/step-by-step/simple-servlet-server)或[Gitee](https://gitee.com/liaoxuefeng/jerrymouse/tree/master/step-by-step/simple-servlet-server)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/jerrymouse/tree/master/step-by-step/simple-servlet-server">GitHub</a>

### 小结

为了实现Servlet服务器，我们必须把jdk.httpserver提供的输入输出`HttpExchange`转换为Servlet标准定义的`HttpServletRequest`和`HttpServletResponse`接口，转换方式是Adapter模式；

转换后的`HttpExchangeAdapter`类再用`HttpExchangeRequest`和`HttpExchangeResponse`把读取和写入功能分开，使得结构更加清晰。
