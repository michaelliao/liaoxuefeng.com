# 使用Scheduler

在很多应用程序中，经常需要执行定时任务。例如，每天或每月给用户发送账户汇总报表，定期检查并发送系统状态报告，等等。

定时任务我们在[使用线程池](../../../threading/pool/index.html)一节中已经讲到了，Java标准库本身就提供了定时执行任务的功能。在Spring中，使用定时任务更简单，不需要手写线程池相关代码，只需要两个注解即可。

我们还是以实际代码为例，建立工程`spring-integration-schedule`，无需额外的依赖，我们可以直接在`AppConfig`中加上`@EnableScheduling`就开启了定时任务的支持：

```java
@Configuration
@ComponentScan
@EnableWebMvc
@EnableScheduling
@EnableTransactionManagement
@PropertySource({ "classpath:/jdbc.properties", "classpath:/task.properties" })
public class AppConfig {
    ...
}
```

接下来，我们可以直接在一个Bean中编写一个`public void`无参数方法，然后加上`@Scheduled`注解：

```java
@Component
public class TaskService {
    final Logger logger = LoggerFactory.getLogger(getClass());

    @Scheduled(initialDelay = 60_000, fixedRate = 60_000)
    public void checkSystemStatusEveryMinute() {
        logger.info("Start check system status...");
    }
}
```

上述注解指定了启动延迟60秒，并以60秒的间隔执行任务。现在，我们直接运行应用程序，就可以在控制台看到定时任务打印的日志：

```plain
2020-06-03 18:47:32 INFO  [pool-1-thread-1] c.i.learnjava.service.TaskService - Start check system status...
2020-06-03 18:48:32 INFO  [pool-1-thread-1] c.i.learnjava.service.TaskService - Start check system status...
2020-06-03 18:49:32 INFO  [pool-1-thread-1] c.i.learnjava.service.TaskService - Start check system status...
```

如果没有看到定时任务的日志，需要检查：

- 是否忘记了在`AppConfig`中标注`@EnableScheduling`；
- 是否忘记了在定时任务的方法所在的class标注`@Component`。

除了可以使用`fixedRate`外，还可以使用`fixedDelay`，两者的区别我们已经在使用线程池一节中讲过，这里不再重复。

有的童鞋在实际开发中会遇到一个问题，因为Java的注解全部是常量，写死了`fixedDelay=30000`，如果根据实际情况要改成60秒怎么办，只能重新编译？

我们可以把定时任务的配置放到配置文件中，例如`task.properties`：

```plain
task.checkDiskSpace=30000
```

这样就可以随时修改配置文件而无需动代码。但是在代码中，我们需要用`fixedDelayString`取代`fixedDelay`：

```java
@Component
public class TaskService {
    ...

    @Scheduled(initialDelay = 30_000, fixedDelayString = "${task.checkDiskSpace:30000}")
    public void checkDiskSpaceEveryMinute() {
        logger.info("Start check disk space...");
    }
}
```

注意到上述代码的注解参数`fixedDelayString`是一个属性占位符，并配有默认值30000，Spring在处理`@Scheduled`注解时，如果遇到`String`，会根据占位符自动用配置项替换，这样就可以灵活地修改定时任务的配置。

此外，`fixedDelayString`还可以使用更易读的`Duration`，例如：

```java
@Scheduled(initialDelay = 30_000, fixedDelayString = "${task.checkDiskSpace:PT2M30S}")
```

以字符串`PT2M30S`表示的`Duration`就是2分30秒，请参考[LocalDateTime](../../../datetime/local-datetime/index.html)一节的Duration相关部分。

多个`@Scheduled`方法完全可以放到一个Bean中，这样便于统一管理各类定时任务。

### 使用Cron任务

还有一类定时任务，它不是简单的重复执行，而是按时间触发，我们把这类任务称为Cron任务，例如：

- 每天凌晨2:15执行报表任务；
- 每个工作日12:00执行特定任务；
- ……

Cron源自Unix/Linux系统自带的crond守护进程，以一个简洁的表达式定义任务触发时间。在Spring中，也可以使用Cron表达式来执行Cron任务，在Spring中，它的格式是：

```plain
秒 分 小时 天 月份 星期 年
```

年是可以忽略的，通常不写。每天凌晨2:15执行的Cron表达式就是：

```plain
0 15 2 * * *
```

每个工作日12:00执行的Cron表达式就是：

```plain
0 0 12 * * MON-FRI
```

每个月1号，2号，3号和10号12:00执行的Cron表达式就是：

```plain
0 0 12 1-3,10 * *
```

在Spring中，我们定义一个每天凌晨2:15执行的任务：

```java
@Component
public class TaskService {
    ...

    @Scheduled(cron = "${task.report:0 15 2 * * *}")
    public void cronDailyReport() {
        logger.info("Start daily report task...");
    }
}
```

Cron任务同样可以使用属性占位符，这样修改起来更加方便。

Cron表达式还可以表达每10分钟执行，例如：

```plain
0 */10 * * * *
```

这样，在每个小时的0:00，10:00，20:00，30:00，40:00，50:00均会执行任务，实际上它可以取代`fixedRate`类型的定时任务。

### 集成Quartz

在Spring中使用定时任务和Cron任务都十分简单，但是要注意到，这些任务的调度都是在每个JVM进程中的。如果在本机启动两个进程，或者在多台机器上启动应用，这些进程的定时任务和Cron任务都是独立运行的，互不影响。

如果一些定时任务要以集群的方式运行，例如每天23:00执行检查任务，只需要集群中的一台运行即可，这个时候，可以考虑使用[Quartz](https://www.quartz-scheduler.org/)。

Quartz可以配置一个JDBC数据源，以便存储所有的任务调度计划以及任务执行状态。也可以使用内存来调度任务，但这样配置就和使用Spring的调度没啥区别了，额外集成Quartz的意义就不大。

Quartz的JDBC配置比较复杂，Spring对其也有一定的支持。要详细了解Quartz的集成，请参考[Spring的文档](https://docs.spring.io/spring/docs/current/spring-framework-reference/integration.html#scheduling-quartz)。

思考：如果不使用Quartz的JDBC配置，多个Spring应用同时运行时，如何保证某个任务只在某一台机器执行？

### 练习

使用Scheduler执行定时任务。

[下载练习](spring-integration-schedule.zip)

### 小结

Spring内置定时任务和Cron任务的支持，编写调度任务十分方便。
