# 集成Artemis

ActiveMQ Artemis是一个JMS服务器，在[集成JMS](../../../spring/integration/jms/index.html)一节中我们已经详细讨论了如何在Spring中集成Artemis，本节我们讨论如何在Spring Boot中集成Artemis。

我们还是以实际工程为例，创建一个`springboot-jms`工程，引入的依赖除了`spring-boot-starter-web`，`spring-boot-starter-jdbc`等以外，新增`spring-boot-starter-artemis`：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-artemis</artifactId>
</dependency>
```

同样无需指定版本号。

如何创建Artemis服务器我们已经在集成JMS一节中详细讲述了，此处不再重复。创建Artemis服务器后，我们在`application.yml`中加入相关配置：

```yaml
spring:
  artemis:
    # 指定连接外部Artemis服务器，而不是启动嵌入式服务:
    mode: native
    # 服务器地址和端口号:
    host: 127.0.0.1
    port: 61616
    # 连接用户名和口令由创建Artemis服务器时指定:
    user: admin
    password: password
```

和Spring版本的JMS代码相比，使用Spring Boot集成JMS时，只要引入了`spring-boot-starter-artemis`，Spring Boot会自动创建JMS相关的`ConnectionFactory`、`JmsListenerContainerFactory`、`JmsTemplate`等，无需我们再手动配置了。

发送消息时只需要引入`JmsTemplate`：

```java
@Component
public class MessagingService {
    @Autowired
    JmsTemplate jmsTemplate;

    public void sendMailMessage() throws Exception {
        String text = "...";
        jmsTemplate.send("jms/queue/mail", new MessageCreator() {
            public Message createMessage(Session session) throws JMSException {
                return session.createTextMessage(text);
            }
        });
    }
}
```

接收消息时只需要标注`@JmsListener`：

```java
@Component
public class MailMessageListener {
    final Logger logger = LoggerFactory.getLogger(getClass());

    @JmsListener(destination = "jms/queue/mail", concurrency = "10")
    public void onMailMessageReceived(Message message) throws Exception {
        logger.info("received message: " + message);
    }
}
```

可见，应用程序收发消息的逻辑和Spring中使用JMS完全相同，只是通过Spring Boot，我们把工程简化到只需要设定Artemis相关配置。

### 练习

在Spring Boot中使用Artemis。

[下载练习](springboot-jms.zip)

### 小结

在Spring Boot中使用Artemis作为JMS服务时，只需引入`spring-boot-starter-artemis`依赖，即可直接使用JMS。
