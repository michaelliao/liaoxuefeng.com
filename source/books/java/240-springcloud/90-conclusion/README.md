# 项目总结

现在，我们已经成功地完成了一个7x24运行的证券交易系统。虽然实现了基本功能，但仍有很多可改进的地方。

### 网关

直接给用户暴露API和UI是不合适的，通常我们会选择一个反向代理充当网关。可以使用[Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway)来实现网关。Spring Cloud Gateway是基于Netty的异步服务器，允许我们编写一系列过滤器来实现黑名单、权限检查、限流等功能。

也可以选择更通用的[Nginx](https://www.nginx.com/)作为网关，相应的功能则需要由Lua脚本实现，具体可参考[OpenResty](https://openresty.org/)。

### 远程调用

在系统内部，我们直接通过HTTP请求实现了远程调用，因为暴露的接口较少。如果接口比较多，可以考虑使用RPC调用，例如[Spring Cloud OpenFeign](https://spring.io/projects/spring-cloud-openfeign)。Spring Cloud OpenFeign把REST请求封装为Java接口方法，实现了一种声明式的RPC调用。也可以考虑更加通用的[gRPC](https://grpc.io/)。

### 系统监控

要监控系统状态、性能等实时信息，我们需要构造一个监控系统。从零开始是不现实的，选择一个通用的标准协议比使用JMX要更简单。StatsD就是目前最流行的监控方案，它的基本原理是：

```ascii
┌ ─ ─ ─ ─ ─ ─ ─ ┐
  ┌───────────┐
│ │Application│ │
  └───────────┘
│       │       │
     UDP│
│       ▼       │
  ┌───────────┐       ┌───────────┐
│ │  StatsD   │─┼────▶│  Server   │
  └───────────┘       └───────────┘
└ ─ ─ ─ ─ ─ ─ ─ ┘
```

应用程序本身负责收集监控数据，然后以UDP协议发给StatsD守护进程，StatsD进程通常和应用程序运行在同一台机器上，它非常轻量级，并且StatsD是否运行都不影响应用程序的正常运行（因为UDP协议只管发不管能不能收到）。如果StatsD进程在运行中，它就把监控数据实时发送给聚合服务器如[Graphite](https://graphite.readthedocs.io/)，再以可视化的形式展示出来。

StatsD是一个解决方案，既可以自己用开源组件搭建，又可以选择第三方商业服务商，例如[DataDog](https://www.datadoghq.com/)。应用程序自身的数据采集则需要根据使用的服务商确定。如果使用DataDog，它会提供一个`dd-java-agent.jar`，在启动应用程序时，以agent的方式注入到JVM中：

```plain
$ java -javaagent:dd-java-agent.jar -jar app.jar
```

再通过引入DataDog提供的API：

```xml
<dependency>
    <groupId>com.datadoghq</groupId>
    <artifactId>dd-trace-api</artifactId>
    <version>{version}</version>
</dependency>
```

就可以实现数据采集。DataDog提供的agent除了能采集应用程序的数据，还可以直接监控JVM、Linux系统，能大大简化监控配置。

对于分布式调用，例如UI调用API，API调用Engine，还可以集成[Spring Cloud Sleuth](https://spring.io/projects/spring-cloud-sleuth)来监控链路。它通过在入口调用每次生成一个唯一ID来跟踪链路，采集数据可直接与StatsD集成。

### 密钥管理

对于很多涉及密钥的配置来说，如数据库密码，系统AES密码，管理员口令等，直接存放在配置文件或数据库中都是不安全的。使用专业的密钥管理软件如[Vault](https://www.vaultproject.io/)可以更安全地管理密钥。[Spring Cloud Vault](https://spring.io/projects/spring-cloud-vault)就是用于从Vault读取密钥，适合对安全性要求特别高的项目。

### 小结

至此，我们已经从Java入门开始，学习了Java基础、JavaEE开发，重点介绍了Spring、Spring Boot和Spring Cloud，并通过一个实战项目，完成了分布式应用程序的开发。相信学到这里的你，已经成为了一个优秀的系统架构师！
