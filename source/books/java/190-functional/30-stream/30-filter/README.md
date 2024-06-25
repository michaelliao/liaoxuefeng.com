# 使用filter

`Stream.filter()`是`Stream`的另一个常用转换方法。

所谓`filter()`操作，就是对一个`Stream`的所有元素一一进行测试，不满足条件的就被“滤掉”了，剩下的满足条件的元素就构成了一个新的`Stream`。

例如，我们对1，2，3，4，5这个`Stream`调用`filter()`，传入的测试函数`f(x) = x % 2 != 0`用来判断元素是否是奇数，这样就过滤掉偶数，只剩下奇数，因此我们得到了另一个序列1，3，5：

```ascii
            f(x) = x % 2 != 0

                  │
  ┌───┬───┬───┬───┼───┬───┬───┬───┐
  │   │   │   │   │   │   │   │   │
  ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼

[ 1   2   3   4   5   6   7   8   9 ]

  │   X   │   X   │   X   │   X   │
  ▼       ▼       ▼       ▼       ▼

[ 1       3       5       7       9 ]
```

用IntStream写出上述逻辑，代码如下：

```java
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        IntStream.of(1, 2, 3, 4, 5, 6, 7, 8, 9)
                .filter(n -> n % 2 != 0)
                .forEach(System.out::println);
    }
}
```

从结果可知，经过`filter()`后生成的`Stream`元素可能变少。

`filter()`方法接收的对象是`Predicate`接口对象，它定义了一个`test()`方法，负责判断元素是否符合条件：

```java
@FunctionalInterface
public interface Predicate<T> {
    // 判断元素t是否符合条件:
    boolean test(T t);
}
```

`filter()`除了常用于数值外，也可应用于任何Java对象。例如，从一组给定的`LocalDate`中过滤掉工作日，以便得到休息日：

```java
import java.time.*;
import java.util.function.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Stream.generate(new LocalDateSupplier())
                .limit(31)
                .filter(ldt -> ldt.getDayOfWeek() == DayOfWeek.SATURDAY || ldt.getDayOfWeek() == DayOfWeek.SUNDAY)
                .forEach(System.out::println);
    }
}

class LocalDateSupplier implements Supplier<LocalDate> {
    LocalDate start = LocalDate.of(2020, 1, 1);
    int n = -1;
    public LocalDate get() {
        n++;
        return start.plusDays(n);
    }
}
```

### 练习

请使用`filter()`过滤出成绩及格的同学，并打印出名字。

[下载练习](stream-filter.zip)

### 小结

使用`filter()`方法可以对一个`Stream`的每个元素进行测试，通过测试的元素被过滤后生成一个新的`Stream`。
