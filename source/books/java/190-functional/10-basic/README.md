# Lambda基础

在了解Lambda之前，我们先回顾一下Java的方法。

Java的方法分为实例方法，例如`Integer`定义的`equals()`方法：

```java
public final class Integer {
    boolean equals(Object o) {
        ...
    }
}
```

以及静态方法，例如`Integer`定义的`parseInt()`方法：

```java
public final class Integer {
    public static int parseInt(String s) {
        ...
    }
}
```

无论是实例方法，还是静态方法，本质上都相当于过程式语言的函数。例如C函数：

```c
char* strcpy(char* dest, char* src)
```

只不过Java的实例方法隐含地传入了一个`this`变量，即实例方法总是有一个隐含参数`this`。

函数式编程（Functional Programming）是把函数作为基本运算单元，函数可以作为变量，可以接收函数，还可以返回函数。历史上研究函数式编程的理论是Lambda演算，所以我们经常把支持函数式编程的编码风格称为Lambda表达式。

### Lambda表达式

在Java程序中，我们经常遇到一大堆单方法接口，即一个接口只定义了一个方法：

- Comparator
- Runnable
- Callable

以`Comparator`为例，我们想要调用`Arrays.sort()`时，可以传入一个`Comparator`实例，以匿名类方式编写如下：

```java
String[] array = ...
Arrays.sort(array, new Comparator<String>() {
    public int compare(String s1, String s2) {
        return s1.compareTo(s2);
    }
});
```

上述写法非常繁琐。从Java 8开始，我们可以用Lambda表达式替换单方法接口。改写上述代码如下：

```java
// Lambda
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        String[] array = new String[] { "Apple", "Orange", "Banana", "Lemon" };
        Arrays.sort(array, (s1, s2) -> {
            return s1.compareTo(s2);
        });
        System.out.println(String.join(", ", array));
    }
}
```

观察Lambda表达式的写法，它只需要写出方法定义：

```java
(s1, s2) -> {
    return s1.compareTo(s2);
}
```

其中，参数是`(s1, s2)`，参数类型可以省略，因为编译器可以自动推断出`String`类型。`-> { ... }`表示方法体，所有代码写在内部即可。Lambda表达式没有`class`定义，因此写法非常简洁。

如果只有一行`return xxx`的代码，完全可以用更简单的写法：

```java
Arrays.sort(array, (s1, s2) -> s1.compareTo(s2));
```

返回值的类型也是由编译器自动推断的，这里推断出的返回值是`int`，因此，只要返回`int`，编译器就不会报错。

### FunctionalInterface

我们把只定义了单方法的接口称之为`FunctionalInterface`，用注解`@FunctionalInterface`标记。例如，`Callable`接口：

```java
@FunctionalInterface
public interface Callable<V> {
    V call() throws Exception;
}
```

再来看`Comparator`接口：

```java
@FunctionalInterface
public interface Comparator<T> {

    int compare(T o1, T o2);

    boolean equals(Object obj);

    default Comparator<T> reversed() {
        return Collections.reverseOrder(this);
    }

    default Comparator<T> thenComparing(Comparator<? super T> other) {
        ...
    }
    ...
}
```

虽然`Comparator`接口有很多方法，但只有一个抽象方法`int compare(T o1, T o2)`，其他的方法都是`default`方法或`static`方法。另外注意到`boolean equals(Object obj)`是`Object`定义的方法，不算在接口方法内。因此，`Comparator`也是一个`FunctionalInterface`。

### 练习

使用Lambda表达式实现忽略大小写排序。

[下载练习](stream-lambda.zip)

### 小结

单方法接口被称为`FunctionalInterface`。

接收`FunctionalInterface`作为参数的时候，可以把实例化的匿名类改写为Lambda表达式，能大大简化代码。

Lambda表达式的参数和返回值均可由编译器自动推断。
