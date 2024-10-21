# 实现AOP

实现了IoC容器后，我们继续实现AOP功能。

AOP即Aspect Oriented Programming，面向切面编程，它本质上就是一个Proxy模式，只不过可以让IoC容器在运行时再组合起来，而不是事先自己用Proxy模式写死了。而实现Proxy模式的核心是拦截目标Bean的方法调用。

既然原理是方法拦截，那么AOP的实现方式不外乎以下几种：

1. 编译期：在编译时，由编译器把切面调用编译进字节码，这种方式需要定义新的关键字并扩展编译器，AspectJ就扩展了Java编译器，使用关键字aspect来实现织入；
2. 类加载器：在目标类被装载到JVM时，通过一个特殊的类加载器，对目标类的字节码重新“增强”；
3. 运行期：目标对象和切面都是普通Java类，通过JVM的动态代理功能或者第三方库实现运行期动态织入。

从复杂度看，最简单的是方案3，因为不涉及到任何JVM底层。

方案3又有两种实现方式：

1. 使用Java标准库的动态代理机制，不过仅支持对接口代理，无法对具体类实现代理；
2. 使用CGLIB或Javassist这些第三方库，通过动态生成字节码，可以对具体类实现代理。

那么Spring的实现方式是啥？Spring实际上内置了多种代理机制，如果一个Bean声明的类型是接口，那么Spring直接使用Java标准库实现对接口的代理，如果一个Bean声明的类型是Class，那么Spring就使用CGLIB动态生成字节码实现代理。

除了实现代理外，还得有一套机制让用户能定义代理。Spring又提供了多种方式：

1. 用AspectJ的语法来定义AOP，比如`execution(public * com.itranswarp.service.*.*(..))`；
2. 用注解来定义AOP，比如用`@Transactional`表示开启事务。

用表达式匹配，很容易漏掉或者打击面太大。用注解无疑是最简单的，因为这样被装配的Bean自己能清清楚楚地知道自己被安排了。因此，在Summer Framework中，我们只支持Annotation模式的AOP机制，并且采用动态生成字节码的方式实现。

明确了需求，我们来看如何实现动态生成字节码。Spring采用的是CGLIB，因此我们去CGLIB首页看一下，不看不知道，一看吓一跳：

> cglib is unmaintained ... migrating to something like ByteBuddy.

原来CGLIB已经不维护了，建议使用[ByteBuddy](https://bytebuddy.net/)。既然如此，我们就选择ByteBuddy实现AOP吧。

比较一下Spring Framework和Summer Framework对AOP的支持：

|              | Spring Framework | Summer Framework |
|--------------|------------------|------------------|
| AspectJ方式    | 支持  | 不支持 |
| Annotation方式 | 支持  | 支持   |
| 代理接口        | 支持  | 不支持 |
| 代理类          | 支持  | 支持  |
| 实现机制        | CGLIB | ByteBuddy |

下面我们就来准备实现AOP。
