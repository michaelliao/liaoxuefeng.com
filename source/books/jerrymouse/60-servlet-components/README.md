# 实现Servlet组件

现在，我们已经成功实现了一个`HttpConnector`，并且，将jdk.httpserver提供的输入输出`HttpExchange`转换为Servlet标准定义的`HttpServletRequest`和`HttpServletResponse`接口，最终处理方法如下：

```java
void process(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    // TODO
}
```

这样，我们就有了处理`HttpServletRequest`和`HttpServletResponse`的入口，回顾一下Jerrymouse设计的架构图：

```ascii
  ┌───────────────────────────────┐
  │       Jerrymouse Server       │
  │                 ┌───────────┐ │
  │  ┌─────────┐    │  Context  │ │
  │  │  HTTP   │    │┌─────────┐│ │
◀─┼─▶│Connector│◀──▶││ Web App ││ │
  │  └─────────┘    │└─────────┘│ │
  │                 └───────────┘ │
  └───────────────────────────────┘
```

我们让`HttpConnector`持有一个Context实例，在Context定义`process(req, resp)`方法：


```ascii
          │
          ▼
┌───────────────────┐
│   HttpConnector   │
└───────────────────┘
          │
          ▼
┌───────────────────┐
│      Context      │
├───────────────────┤
│process(req, resp) │
└───────────────────┘
```

这个Context组件本质上可以视为Servlet规范定义的`ServletContext`，而规范定义的Servlet、Filter、Listener等组件，就可以让`ServletContext`管理，后续的服务器设计就简化为如何实现`ServletContext`，以及如何管理Servlet、Filter、Listener等组件。
