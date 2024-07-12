# JDK源码分析：java.lang.Boolean

闲来无事，开始研究JDK 1.5源码，先找了一个最简单的`java.lang.Boolean`开始解剖。

首先我们剔除所有的方法和静态变量，`Boolean`的核心代码如下：

```java
public final class Boolean implements java.io.Serializable,Comparable {
    private final boolean value;
}
```

很明显，凡是成员变量都是`final`类型的，一定是immutable class，这个`Boolean`和`String`一样，一旦构造函数执行完毕，实例的状态就不能再改变了。

`Boolean`的构造方法有两个：

```java
public Boolean(boolean value) {
    this.value = value;
}

public Boolean(String s) {
    this(toBoolean(s));
}
```

另外注意到`Boolean`类实际上只有两种不同状态的实例：一个包装`true`，一个包装`false`，`Boolean`又是immutable class，所以在内存中相同状态的`Boolean`实例完全可以共享，不必用`new`创建很多实例。因此Boolean class还提供两个静态变量：

```java
public static final Boolean TRUE = new Boolean(true);
public static final Boolean FALSE = new Boolean(false);
```

这两个变量在Class Loader装载时就被实例化，并且申明为`final`，不能再指向其他实例。

提供这两个静态变量是为了让开发者直接使用这两个变量而不是每次都`new`一个`Boolean`，这样既节省内存又避免了创建一个新实例的时间开销。

因此，用

```java
Boolean b = Boolean.TRUE;
```

比

```java
Boolean b = new Boolean(true);
```

要好得多。

如果遇到下面的情况：

```java
Boolean b = new Boolean(var);
```

一定要根据一个`boolean`变量来创建`Boolean`实例怎么办？推荐使用`Boolean`提供的静态工厂方法：

```java
Boolean b = Boolean.valueOf(var);
```

这样就可以避免创建新的实例。看看`valueOf()`静态方法：

```java
public static Boolean valueOf(boolean b) {
    return (b ? TRUE : FALSE);
}
```

这个静态工厂方法返回的仍然是两个静态变量`TRUE`和`FALSE`之一，而不是`new`一个`Boolean`出来。虽然`Boolean`非常简单，占用的内存也很少，但是一个复杂的类用`new`创建实例的开销可能非常大，而且，使用工厂方法可以方便的实现缓存实例，这对客户端是透明的。所以，能用工厂方法就不要使用`new`。

和`Boolean`只有两种状态不同，`Integer`也是immutable class，但是状态上亿种，不可能用静态实例缓存所有状态。不过，SUN的工程师还是作了一点优化，`Integer`类缓存了`-128`到`127`这256个状态的`Integer`，如果使用`Integer.valueOf(int i)`，传入的`int`范围正好在此内，就返回静态实例。

`hashCode()`方法很奇怪，两种`Boolean`的hash code分别是`1231`和`1237`。估计写Boolean.java的人对这两个数字有特别偏好：

```java
public int hashCode() {
    return value ? 1231 : 1237;
}
```

`equals()`方法也很简单，只有`Boolean`类型的`Object`并且value相等才返`true`：

```java
public boolean equals(Object obj) {
    if (obj instanceof Boolean) {
        return value == ((Boolean)obj).booleanValue();
    }
    return false;
}
```

很多人写`equals()`总是在第一行写一个`null`判断：

```java
if (obj==null)
    return false;
```

其实完全没有必要，因为如果`obj==null`，下一行的`if (obj instanceof Type)`就肯定返回`false`，因为`null instanceof AnyType`永远是`false`。

详细内容请参考《Effective Java》第7条：Obey the general contract when overriding equals。

## 总结

如果一个类只有有限的几种状态，考虑用几个`final`的静态变量来表示不同状态的实例。例如编写一个`Weekday`类，状态只有7个，就不要让用户写`new Weekday(1)`，直接提供`Weekday.MONDAY`即可。

要防止用户使用`new`生成实例，就取消`public`构造方法，用户要获得静态实例的引用有两个方法：如果申明了`public static var`，就可以直接访问，比如`Boolean.TRUE`，第二个方法是通过静态工厂方法：`Boolean.valueOf(?)`。

如果不提供`public`构造方法，让用户只能通过上面的方法获得静态变量的引用，还可以大大简化`equals()`方法：

```java
public boolean equals(Object obj) {
    return this==obj;
}
```
