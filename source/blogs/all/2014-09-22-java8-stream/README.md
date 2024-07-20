# Java 8新特性：全新的Stream API

Java 8引入了全新的Stream API。这里的`Stream`和I/O流不同，它更像具有`Iterable`的集合类，但行为和集合类又有所不同。

Stream API引入的目的在于弥补Java函数式编程的缺陷。对于很多支持函数式编程的语言，`map()`、`reduce()`基本上都内置到语言的标准库中了，不过，Java 8的Stream API总体来讲仍然是非常完善和强大，足以用很少的代码完成许多复杂的功能。

创建一个`Stream`有很多方法，最简单的方法是把一个`Collection`变成`Stream`。我们来看最基本的几个操作：

```java
public static void main(String[] args) {
    List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
    Stream<Integer> stream = numbers.stream();
    stream.filter((x) -> {
        return x % 2 == 0;
    }).map((x) -> {
        return x * x;
    }).forEach(System.out::println);
}
```

集合类新增的`stream()`方法用于把一个集合变成`Stream`，然后，通过`filter()`、`map()`等实现`Stream`的变换。`Stream`还有一个`forEach()`来完成每个元素的迭代。

为什么不在集合类实现这些操作，而是定义了全新的Stream API？Oracle官方给出了几个重要原因：

一是集合类持有的所有元素都是存储在内存中的，非常巨大的集合类会占用大量的内存，而Stream的元素却是在访问的时候才被计算出来，这种“延迟计算”的特性有点类似Clojure的lazy-seq，占用内存很少。

二是集合类的迭代逻辑是调用者负责，通常是`for`循环，而Stream的迭代是隐含在对Stream的各种操作中，例如`map()`。

要理解“延迟计算”，不妨创建一个无穷大小的Stream。

如果要表示自然数集合，显然用集合类是不可能实现的，因为自然数有无穷多个。但是Stream可以做到。

自然数集合的规则非常简单，每个元素都是前一个元素的值+1，因此，自然数发生器用代码实现如下：

```java
class NaturalSupplier implements Supplier<Long> {
    long value = 0;

    public Long get() {
        this.value = this.value + 1;
        return this.value;
    }
}
```

反复调用`get()`，将得到一个无穷数列，利用这个`Supplier`，可以创建一个无穷的`Stream`：

```java
public static void main(String[] args) {
    Stream<Long> natural = Stream.generate(new NaturalSupplier());
    natural.map((x) -> {
        return x * x;
    }).limit(10).forEach(System.out::println);
}
```

对这个`Stream`做任何`map()`、`filter()`等操作都是完全可以的，这说明Stream API对`Stream`进行转换并生成一个新的`Stream`并非实时计算，而是做了延迟计算。

当然，对这个无穷的`Stream`不能直接调用`forEach()`，这样会无限打印下去。但是我们可以利用`limit()`变换，把这个无穷`Stream`变换为有限的`Stream`。

利用Stream API，可以设计更加简单的数据接口。例如，生成斐波那契数列，完全可以用一个无穷流表示（受限Java的`long`型大小，可以改为`BigInteger`）：

```java
class FibonacciSupplier implements Supplier<Long> {
    long a = 0;
    long b = 1;

    @Override
    public Long get() {
        long x = a + b;
        a = b;
        b = x;
        return a;
    }
}

public class FibonacciStream {
    public static void main(String[] args) {
        Stream<Long> fibonacci = Stream.generate(new FibonacciSupplier());
        fibonacci.limit(10).forEach(System.out::println);
    }
}
```

如果想取得数列的前10项，用`limit(10)`，如果想取得数列的第20~30项，用：

```java
List<Long> list = fibonacci.skip(20).limit(10).collect(Collectors.toList());
```

最后通过`collect()`方法把`Stream`变为`List`。该`List`存储的所有元素就已经是计算出的确定的元素了。

用`Stream`表示Fibonacci数列，其接口比任何其他接口定义都要来得简单灵活并且高效。

计算π可以利用π的展开式：

```math
\frac{\mathrm\pi}4=1-\frac13+\frac15-\frac17+\frac19-\frac1{11}+\cdots
```

把π表示为一个无穷Stream如下：

```java
class PiSupplier implements Supplier<Double> {
    double sum = 0.0;
    double current = 1.0;
    boolean sign = true;

    @Override
    public Double get() {
        sum += (sign ? 4 : -4) / this.current;
        this.current = this.current + 2.0;
        this.sign = ! this.sign;
        return sum;
    }
}

Stream<Double> piStream = Stream.generate(new PiSupplier());
piStream.skip(100).limit(10)
        .forEach(System.out::println);
```

这个级数从100项开始可以把π的值精确到`3.13`~`3.15`之间：

```plain
3.1514934010709914
3.1317889675734545
3.1513011626954057
3.131977491197821
3.1511162471786824
3.1321589012071183
3.150938243930123
3.132333592767332
3.1507667724908344
3.1325019323081857
```

利用欧拉变换对级数进行加速，可以利用下面的公式：

```math
S_{n+1}-\frac{{(S_{n+1}-S_n)}^2}{S_{n-1}-2S_n+S_{n+1}}
```

用代码实现就是把一个流变成另一个流：

```java
class EulerTransform implements Function<Double, Double> {
    double n1 = 0.0;
    double n2 = 0.0;
    double n3 = 0.0;

    @Override
    public Double apply(Double t) {
        n1 = n2;
        n2 = n3;
        n3 = t;
        if (n1 == 0.0) {
            return 0.0;
        }
        return calc();
    }

    double calc() {
        double d = n3 - n2;
        return n3 - d * d / (n1 - 2 * n2 + n3);
    }
}

Stream<Double> piStream2 = Stream.generate(new PiSupplier());
piStream2.map(new EulerTransform())
            .limit(10)
            .forEach(System.out::println);
```

可以在10项之内把π的值计算到`3.141`~`3.142`之间：

```plain
0.0
0.0
3.166666666666667
3.1333333333333337
3.1452380952380956
3.13968253968254
3.1427128427128435
3.1408813408813416
3.142071817071818
3.1412548236077655
```

还可以多次应用这个加速器：

```java
Stream<Double> piStream3 = Stream.generate(new PiSupplier());
piStream3.map(new EulerTransform())
         .map(new EulerTransform())
         .map(new EulerTransform())
         .map(new EulerTransform())
         .map(new EulerTransform())
         .limit(20)
         .forEach(System.out::println);
```

20项之内可以计算出极其精确的值：

```plain
...
3.14159265359053
3.1415926535894667
3.141592653589949
3.141592653589719
```

可见用Stream API可以写出多么简洁的代码，用其他的模型也可以写出来，但是代码会非常复杂。
