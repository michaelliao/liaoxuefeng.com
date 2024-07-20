# 设计一个可扩展的用户登录系统 (3)

在[系列 (1)](../2016-04-20-extensible-login-part-1/index.html)和[系列 (2)](../2016-04-21-extensible-login-part-2/index.html)中我们讨论了用户认证的数据库结构和相关代码。本文继续讨论几个遗留问题。

### 如何生成一个可信的Cookie

因为Cookie都是服务器端创建的，所以，生成一个可信Cookie的关键在于，客户端无法伪造出Cookie。

用什么方法可以防止伪造？数学理论告诉我们，单向函数就可以防伪造。

例如，计算md5就是一个单向函数。假设写好了函数`md5(String s)`，根据输入可以很容易地计算结果：

```plain
md5("hello") => "b1946ac92492d2347c6235b4d2611184"
```

但是，根据结果`"b1946...11184"`反推输入却非常困难。

利用单向函数，我们可以生成一个防伪造的Cookie。

例如，用户以用户名"admin"，口令"hello"登录成功后，要生成Cookie，我们就可以用md5计算：

```plain
md5("hello") => "b1946ac92492d2347c6235b4d2611184"
```

然后，把md5值和用户名`"admin"`串起来构成一个Cookie发送给客户端：

```plain
"admin:b1946ac92492d2347c6235b4d2611184"
```

当客户端把上面的Cookie发给服务器时，服务器如何验证该Cookie是有效的呢？可以按照以下步骤：

1. 服务器把Cookie分解成用户名`"admin"`和md5值`"b1946...11184"`；
2. 根据用户名`"admin"`从数据库中找到该用户的记录，并继续找到该用户的口令`"hello"`；
3. 服务器根据数据库中存储的口令计算`md5("hello")`并与客户端Cookie的md5值对比。

如果对比一致，说明Cookie是有效的。

> 现在可以愉快地为用户创建Cookie了！

*且慢！*

从理论到实践还差着一个工程的距离。上面的算法仅仅解决了基本的验证，在实际应用中，存在如下严重问题：

1. 简单的md5值很容易被彩虹表攻击，从而直接得到用户原始口令；
2. 用户名被暴露在Cookie中，如果用email作为用户名，用户的email就被泄露了；
3. Cookie没有设置有效期（注意浏览器发过来的Cookie不一定真是浏览器发的），导致一旦登录，永久有效；
4. 其他若干问题。

如何解决？方法是计算hash的时候，不仅只包含用户口令，还包含Cookie过期时间，以及其他相关随机数，这样计算的hash就非常安全。

举个栗子：

假设用户仍以用户名`"admin"`，口令`"hello"`登录成功，系统可以知道：

1. 该用户的id，例如，`1230001`；
2. 该用户的口令，例如，`"hello"`；
3. Cookie过期时间，可由当前时间戳＋固定时长计算，例如，`1461288165`；
4. 系统固定的一个随机字符串，例如，`"secret"`。

把上面4部分拼起来，得到：

```plain
"1230001:hello:1461288165:secret"
```

计算上述字符串的md5，得到：`"d9753...004d5"`。

最后，按照用户id，过期时间和最终的hash值，拼接得到Cookie如下：

```plain
"1230001:1461288165:d9753...004d5"
```

当浏览器发送Cookie回服务器时，我们就可以按照下面的方式验证Cookie：

1. 把Cookie分割成三部分，得到用户id，过期时间和hash值；
2. 如果过期时间已到，直接丢弃；
3. 根据用户id查找用户，得到用户口令；
4. 按照生成Cookie时的算法计算md5，与Cookie自带的hash值对比。

如果用户自己对Cookie进行修改，无论改用户id、过期时间，还是hash值，都会导致最终计算结果不一致。

即使用户知道自己的id和口令，也知道服务器的生成算法，他也无法自己构造出有效的Cookie，原因就在于计算hash时的“系统固定的随机字符串”他不知道。

这个“系统固定的随机字符串”还有一个用途，就是编写代码的开发人员不知道生产环境服务器配置的随机字符串，他也无法伪造Cookie。

md5算法还可以换成更安全的sha1/sha256。

现在我们就解决了如何生成一个可信Cookie的问题。

如果用户通过第三方OAuth登录，服务器如何生成Cookie呢？

方法和上面一样，具体算法自己想去。

### 如何绑定用户

如果用户被认证了，系统实际上就认为从数据库读取的一个`User`对象是有效的当前用户，现在的问题是，如何让业务层代码获知当前用户。

方法一：每个业务方法新增一个`User`参数。

该方法太弱智，故不在此处讨论。

方法二：把`User`绑定到`request`中。

该方法太幼稚，导致编写业务的时候需要这么写：

```java
User user = (User) request.getAttribute("USER");
```

问题一大堆：

- Key值`"USER"`需要定义到常量中，但不排除很多开发人员偷懒直接写死了，这样编译器根本检测不到错误；
- 某个零经验的开发人员在某处放置了`request.setAttribute("USER", true)`的代码，导致后续操作直接崩溃；
- request对象怎么拿？再写一个`SpringHelper.getContext().getCurrentRequest()`？
- 强制转型看着就不爽。

正确做法：把`User`用`ThreadLocal`绑定到当前处理线程：

```java
public class UserContext {
    public static final ThreadLocal<User> current = new ThreadLocal<User>();
}
```

在统一的入口，例如`Filter`处理：

```java
public class MyFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        User user = tryGetAuthenticatedUser(request, response);
        UserContext.current.set(user);
        chain.doFilter(request, response);
        UserContext.current.remove(user);
    }
}
```

这样就可以在业务逻辑的任何地方获得当前User：

```java
User user = UserContext.current.get();
```

上述代码是零经验工程师写的，大家不要学。

有经验的工程师会指出，没有`try...finally`逻辑就不对，但这只是知道Java语法后的生搬硬套，也不对。

这段代码的真正问题是缺少封装，没有把实现细节隐藏起来。大家熟知的开闭原则“对扩展开放，对修改关闭”，说起来容易，实现起来困难。

让我们用开闭原则重写上面的代码：

```java
public class UserContext implements AutoCloseable {
    static final ThreadLocal<User> current = new ThreadLocal<User>();

    public UserContext(User user) {
        current.set(user);
    }

    public static User getCurrentUser() {
        return current.get();
    }

    public void close() {
        current.remove();
    }
}
```

是不是简单多了？

> 代码量大了，难道还更简单了？

是的，简单与否不看代码量本身，而是看调用起来是不是简单。在Filter中调用起来就非常简单：

```java
public class MyFilter implements Filter {
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        User user = tryGetAuthenticatedUser(request, response);
        try (UserContext context = new UserContext(user)) {
            chain.doFilter(request, response);
        }
    }
}
```

`finally`哪去了？与时俱进是我们的原则之一，搜索一下`AutoCloseable`吧！

在业务逻辑中调用更简单：

```java
User user = UserContext.getCurrentUser();
```

最后我们来演示一下很多场景需要的用法：

```java
try (UserContext context = new UserContext(user)) {
    // 当前用户是user：
    processProfile(UserContext.getCurrentUser());
    // 需要更高权限的admin才能执行的操作怎么办？
    // 方法是获取一个admin用户：
    try (UserContext context = new UserContext(getAdmin())) {
        // 现在的当前用户是admin：
        processAdminJob(UserContext.getCurrentUser());
    }
    // 现在当前用户又自动变回了普通user：
    processProfile(UserContext.getCurrentUser());
}
```

实现上述逻辑只需要对`UserContext`做一个简单的修改就可以实现了。

> 这才是真正的开闭啊！
