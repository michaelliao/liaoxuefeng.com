# Servlet规范

在Java Web应用中，除了Tomcat服务器外，其实还有[Jetty](https://eclipse.dev/jetty/)、[GlassFish](https://javaee.github.io/glassfish/)、[Undertow](https://undertow.io/)等多种Web服务器。

一个Java Web App通常打包为`.war`文件，并且可以部署到Tomcat、Jetty等多种Web服务器上。为什么一个Java Web App基本上可以无修改地部署到多种Web服务器上呢？原因就在于Servlet规范。

Servlet规范是Java Servlet API的规范，用于定义Web服务器如何处理HTTP请求和响应。Servlet规范有一组接口，对于Web App来说，操作的是接口，而真正对应的实现类，则由各个Web Server实现，这样一来，Java Web App实际上编译的时候仅用到了Servlet规范定义的接口，只要每个Web服务器在实现Servlet接口时严格按照规范实现，就可以保证一个Web App可以正常运行在多种Web服务器上：

```ascii
  ┌─────────────────┐
  │     Web App     │
  └─────────────────┘
           ▲
           │
           ▼
  ┌─────────────────┐
┌─┤Servlet Interface├─┐
│ └─────────────────┘ │
│          ▲          │
│          │          │
│          ▼          │
│ ┌─────────────────┐ │
│ │     Servlet     │ │
│ │ Implementation  │ │
│ └─────────────────┘ │
│       Server        │
└─────────────────────┘
```

对于Web应用程序，Servlet规范是非常重要的。Servlet规范有好几个版本，每个版本都有一些新的功能。以下是一些常见版本的新功能：

Servlet 1.0：定义了Servlet组件，一个Servlet组件运行在Servlet容器（Container）中，通过与容器交互，就可以响应一个HTTP请求；

Servlet 2.0：定义了JSP组件，一个JSP页面可以被动态编译为Servlet组件；

Servlet 2.4：定义了Filter（过滤器）组件，可以实现过滤功能；

Servlet 2.5：支持注解，提供了ServletContextListener接口，增加了一些安全性相关的特性；

Servlet 3.0：支持异步处理的Servlet，支持注解配置Servlet和过滤器，增加了SessionCookieConfig接口；

Servlet 3.1：提供了WebSocket的支持，增加了对HTTP请求和响应的流式操作的支持，增加了对HTTP协议的新特性的支持；

Servlet 4.0：支持HTTP/2的新特性，提供了HTTP/2的Server Push等特性；

Servlet 5.0：主要是把`javax.servlet`包名改成了`jakarta.servlet`；

Servlet 6.0：继续增加一些新功能，并废除一部分功能。

目前最新的Servlet版本是6.0，我们开发Jerrymouse Server也是基于最新的Servlet 6.0。

### Servlet处理流程

当Servlet容器接收到用户的HTTP请求后，由容器负责把请求转换为`HttpServletRequest`和`HttpServletResponse`对象，分别代表HTTP请求和响应，然后，经过若干个Filter组件后，到达最终的Servlet组件，由Servlet组件完成HTTP处理，将响应写入`HttpServletResponse`对象：

```ascii
 ┌────────────────────────────────┐
 │         ServletContext         │
 │                                │
 │HttpServletRequest  ┌─────────┐ │
─┼───────────────────▶│ Filter  │ │
 │HttpServletResponse └─────────┘ │
 │                         │      │
 │                         ▼      │
 │                    ┌─────────┐ │
 │                    │ Filter  │ │
 │                    └─────────┘ │
 │                         │      │
 │ ┌─────────┐             ▼      │
 │ │Listener │        ┌─────────┐ │
 │ └─────────┘        │ Filter  │ │
 │ ┌─────────┐        └─────────┘ │
 │ │Listener │             │      │
 │ └─────────┘             ▼      │
 │ ┌─────────┐        ┌─────────┐ │
 │ │Listener │        │ Servlet │ │
 │ └─────────┘        └─────────┘ │
 └────────────────────────────────┘
```

其中，`ServletContext`代表整个容器的信息，如果容器实现了`ServletContext`接口，也可以把`ServletContext`可以看作容器本身。`ServletContext`、`HttpServletRequest`和`HttpServletResponse`都是接口，具体实现由Web服务器完成。`Filter`、`Servlet`组件也是接口，但具体实现由Web App完成。此外，还有一种`Listener`接口，可以监听各种事件，但不直接参与处理HTTP请求，具体实现由Web App完成，何时调用则由容器决定。因此，针对Web App的三大组件：`Servlet`、`Filter`和`Listener`都是运行在容器中的组件，只有容器才能主动调用它们。（此处略去JSP组件，因为我们不打算支持JSP）

对于Jerrymouse服务器来说，开发服务器就必须实现Servlet容器本身，容器实现`ServletContext`接口，容器内部管理若干个`Servlet`、`Filter`和`Listener`组件。

对每个请求，需要创建`HttpServletRequest`和`HttpServletResponse`实例，查找并匹配合适的一组`Filter`和一个`Servlet`，让它们处理HTTP请求。

在处理过程中，会产生各种事件，容器负责将产生的事件发送到`Listener`组件处理。

以上就是我们编写Servlet容器按照Servlet规范所必须的全部功能。
