# 设计服务器架构

在开发我们自己的Web服务器之前，我们先看一下Tomcat的架构。

Tomcat是一个开源的Web服务器，它的架构是基于组件的设计，可以将多个组件组合起来使用，用一张图表示如下：

```ascii
  ┌─────────────────────────────────────────────────────┐
  │                    Tomcat Server                    │
  │ ┌─────────────────────────────────────────────────┐ │
  │ │                     Service                     │ │
  │ │                 ┌─────────────────────────────┐ │ │
  │ │                 │           Engine            │ │ │
  │ │                 │ ┌─────────────────────┐     │ │ │
  │ │                 │ │        Host         │     │ │ │
  │ │ ┌───────────┐   │ │ ┌───────────────────┴─┐   │ │ │
  │ │ │Connectors │   │ │ │        Host         │   │ │ │
  │ │ │┌─────────┐│   │ │ │ ┌───────────────────┴─┐ │ │ │
  │ │ ││Connector││   │ │ │ │        Host         │ │ │ │
  │ │ │└─────────┘│   │ │ │ │ ┌─────────────┐     │ │ │ │
  │ │ │┌─────────┐│   │ │ │ │ │   Context   │     │ │ │ │
◀─┼─┼▶││Connector││◀─▶│ │ │ │ │ ┌───────────┴─┐   │ │ │ │
  │ │ │└─────────┘│   │ │ │ │ │ │   Context   │   │ │ │ │
  │ │ │┌─────────┐│   │ │ │ │ │ │ ┌───────────┴─┐ │ │ │ │
  │ │ ││Connector││   │ │ │ │ └─┤ │   Context   │ │ │ │ │
  │ │ │└─────────┘│   │ └─┤ │   │ │ ┌─────────┐ │ │ │ │ │
  │ │ └───────────┘   │   │ │   └─┤ │ Web App │ │ │ │ │ │
  │ │                 │   └─┤     │ └─────────┘ │ │ │ │ │
  │ │                 │     │     └─────────────┘ │ │ │ │
  │ │                 │     └─────────────────────┘ │ │ │
  │ │                 └─────────────────────────────┘ │ │
  │ └─────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────┘
```

一个Tomcat Server内部可以有多个Service（服务），通常是一个Service。Service内部包含两个组件：

- Connectors：代表一组Connector（连接器），至少定义一个Connector，也允许定义多个Connector，例如，HTTP和HTTPS两个Connector；
- Engine：代表一个引擎，所有HTTP请求经过Connector后传递给Engine。

在一个Engine内部，可以有一个或多个Host（主机），Host可以根据域名区分，在Host内部，又可以有一个或多个Context（上下文），每个Context对应一个Web App。Context是由路径前缀区分的，如`/abc`、`/xyz`、`/`分别代表3个Web App，`/`表示的Web App在Tomcat中表示根Web App。

因此，一个HTTP请求：

```plain
http://www.example.com/abc/hello
```

首先根据域名`www.example.com`定位到某个Host，然后，根据路径前缀`/abc`定位到某个Context，若路径前缀没有匹配到任何Context，则匹配`/`Context。在Context内部，就是开发者编写的Web App，一个Context仅包含一个Web App。

可见Tomcat Server是一个全功能的Web服务器，它支持HTTP、HTTPS和AJP等多种Connector，又能同时运行多个Host，每个Host内部，还可以挂载一个或多个Context，对应一个或多个Web App。

我们设计Jerrymouse Server就没必要搞这么复杂，可以大幅简化为：

- 仅一个HTTP Connector，不支持HTTPS；
- 仅支持挂载到`/`的一个Context，不支持多个Host与多个Context。

因为只有一个Context，所以也只能有一个Web App。Jerrymouse Server的架构如下：

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

有的同学会担心，如果要运行多个Web App怎么办？

这个问题很容易解决：运行多个Jerrymouse Server就可以运行多个Web App了。

还有的同学会担心，只支持HTTP，如果一定要使用HTTPS怎么办？

HTTPS可以部署在网关，通过网关将HTTPS请求转发为HTTP请求给Jerrymouse Server即可。部署一个Nginx就可以充当网关：

```ascii
               ┌───────────────────────────────┐
               │       Jerrymouse Server       │
               │ ┌─────────────────────────────┴─┐
               │ │       Jerrymouse Server       │
    ┌───────┐  │ │ ┌─────────────────────────────┴─┐
    │       │◀─┼─│ │       Jerrymouse Server       │
    │       │  │ │ │                 ┌───────────┐ │
◀──▶│ Nginx │◀─┼─┼─│  ┌─────────┐    │  Context  │ │
    │       │  └─┤ │  │  HTTP   │    │┌─────────┐│ │
    │       │◀───┼─┼─▶│Connector│◀──▶││ Web App ││ │
    └───────┘    └─┤  └─────────┘    │└─────────┘│ │
                   │                 └───────────┘ │
                   └───────────────────────────────┘
```

此外，Nginx还可以定义多个Host，根据Host转发给不同的Jerrymouse Server，所以，我们专注于实现一个仅支持HTTP、仅支持一个Web App的Web服务器，把HTTPS、HTTP/2、HTTP/3、Host、Cluster（集群）等功能全部扔给Nginx即可。
