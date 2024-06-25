# 适配器

> 将一个类的接口转换成客户希望的另外一个接口，使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。

适配器模式是Adapter，也称Wrapper，是指如果一个接口需要B接口，但是待传入的对象却是A接口，怎么办？

我们举个例子。如果去美国，我们随身带的电器是无法直接使用的，因为美国的插座标准和中国不同，所以，我们需要一个适配器：

![adapter](adapter.jpg)

在程序设计中，适配器也是类似的。我们已经有一个`Task`类，实现了`Callable`接口：

```java
public class Task implements Callable<Long> {
    private long num;
    public Task(long num) {
        this.num = num;
    }

    public Long call() throws Exception {
        long r = 0;
        for (long n = 1; n <= this.num; n++) {
            r = r + n;
        }
        System.out.println("Result: " + r);
        return r;
    }
}
```

现在，我们想通过一个线程去执行它：

```java
Callable<Long> callable = new Task(123450000L);
Thread thread = new Thread(callable); // compile error!
thread.start();
```

发现编译不过！因为`Thread`接收`Runnable`接口，但不接收`Callable`接口，肿么办？

一个办法是改写`Task`类，把实现的`Callable`改为`Runnable`，但这样做不好，因为`Task`很可能在其他地方作为`Callable`被引用，改写`Task`的接口，会导致其他正常工作的代码无法编译。

另一个办法不用改写`Task`类，而是用一个Adapter，把这个`Callable`接口“变成”`Runnable`接口，这样，就可以正常编译：

```java
Callable<Long> callable = new Task(123450000L);
Thread thread = new Thread(new RunnableAdapter(callable));
thread.start();
```

这个`RunnableAdapter`类就是Adapter，它接收一个`Callable`，输出一个`Runnable`。怎么实现这个`RunnableAdapter`呢？我们先看完整的代码：

```java
public class RunnableAdapter implements Runnable {
    // 引用待转换接口:
    private Callable<?> callable;

    public RunnableAdapter(Callable<?> callable) {
        this.callable = callable;
    }

    // 实现指定接口:
    public void run() {
        // 将指定接口调用委托给转换接口调用:
        try {
            callable.call();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```

编写一个Adapter的步骤如下：

1. 实现目标接口，这里是`Runnable`；
2. 内部持有一个待转换接口的引用，这里是通过字段持有`Callable`接口；
3. 在目标接口的实现方法内部，调用待转换接口的方法。

这样一来，Thread就可以接收这个`RunnableAdapter`，因为它实现了`Runnable`接口。`Thread`作为调用方，它会调用`RunnableAdapter`的`run()`方法，在这个`run()`方法内部，又调用了`Callable`的`call()`方法，相当于`Thread`通过一层转换，间接调用了`Callable`的`call()`方法。

适配器模式在Java标准库中有广泛应用。比如我们持有数据类型是`String[]`，但是需要`List`接口时，可以用一个Adapter：

```java
String[] exist = new String[] {"Good", "morning", "Bob", "and", "Alice"};
Set<String> set = new HashSet<>(Arrays.asList(exist));
```

注意到`List<T> Arrays.asList(T[])`就相当于一个转换器，它可以把数组转换为`List`。

我们再看一个例子：假设我们持有一个`InputStream`，希望调用`readText(Reader)`方法，但它的参数类型是`Reader`而不是`InputStream`，怎么办？

当然是使用适配器，把`InputStream`“变成”`Reader`：

```java
InputStream input = Files.newInputStream(Paths.get("/path/to/file"));
Reader reader = new InputStreamReader(input, "UTF-8");
readText(reader);
```

`InputStreamReader`就是Java标准库提供的`Adapter`，它负责把一个`InputStream`适配为`Reader`。类似的还有`OutputStreamWriter`。

如果我们把`readText(Reader)`方法参数从`Reader`改为`FileReader`，会有什么问题？这个时候，因为我们需要一个`FileReader`类型，就必须把`InputStream`适配为`FileReader`：

```java
FileReader reader = new InputStreamReader(input, "UTF-8"); // compile error!
```

直接使用`InputStreamReader`这个Adapter是不行的，因为它只能转换出`Reader`接口。事实上，要把`InputStream`转换为`FileReader`也不是不可能，但需要花费十倍以上的功夫。这时，面向抽象编程这一原则就体现出了威力：持有高层接口不但代码更灵活，而且把各种接口组合起来也更容易。一旦持有某个具体的子类类型，要想做一些改动就非常困难。

### 练习

使用Adapter模式将`Callable`接口适配为`Runnable`。

[下载练习](pattern-adapter.zip)

### 小结

Adapter模式可以将一个A接口转换为B接口，使得新的对象符合B接口规范。

编写Adapter实际上就是编写一个实现了B接口，并且内部持有A接口的类：

```java
public BAdapter implements B {
    private A a;
    public BAdapter(A a) {
        this.a = a;
    }
    public void b() {
        a.a();
    }
}
```

在Adapter内部将B接口的调用“转换”为对A接口的调用。

只有A、B接口均为抽象接口时，才能非常简单地实现Adapter模式。
