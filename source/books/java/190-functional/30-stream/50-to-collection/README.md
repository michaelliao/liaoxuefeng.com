# 输出集合

我们介绍了`Stream`的几个常见操作：`map()`、`filter()`、`reduce()`。这些操作对`Stream`来说可以分为两类，一类是转换操作，即把一个`Stream`转换为另一个`Stream`，例如`map()`和`filter()`，另一类是聚合操作，即对`Stream`的每个元素进行计算，得到一个确定的结果，例如`reduce()`。

区分这两种操作是非常重要的，因为对于`Stream`来说，对其进行转换操作*并不会触发任何计算*！我们可以做个实验：

```java
import java.util.function.Supplier; 
import java.util.stream.Stream;

public class Main {
    public static void main(String[] args)     {
        Stream<Long> s1 = Stream.generate(new NatualSupplier());
        Stream<Long> s2 = s1.map(n -> n * n);
        Stream<Long> s3 = s2.map(n -> n - 1);
        System.out.println(s3); // java.util.stream.ReferencePipeline$3@49476842
    }
}

class NatualSupplier implements Supplier<Long> {
    long n = 0;
    public Long get() {
        n++;
        return n;
    }
}
```

因为`s1`是一个`Long`类型的序列，它的元素高达922亿亿个，但执行上述代码，既不会有任何内存增长，也不会有任何计算，因为转换操作只是保存了转换规则，无论我们对一个`Stream`转换多少次，都不会有任何实际计算发生。

而聚合操作则不一样，聚合操作会立刻促使`Stream`输出它的每一个元素，并依次纳入计算，以获得最终结果。所以，对一个`Stream`进行聚合操作，会触发一系列连锁反应：

```java
Stream<Long> s1 = Stream.generate(new NatualSupplier());
Stream<Long> s2 = s1.map(n -> n * n);
Stream<Long> s3 = s2.map(n -> n - 1);
Stream<Long> s4 = s3.limit(10);
s4.reduce(0, (acc, n) -> acc + n);
```

我们对`s4`进行`reduce()`聚合计算，会不断请求`s4`输出它的每一个元素。因为`s4`的上游是`s3`，它又会向`s3`请求元素，导致`s3`向`s2`请求元素，`s2`向`s1`请求元素，最终，`s1`从`Supplier`实例中请求到真正的元素，并经过一系列转换，最终被`reduce()`聚合出结果。

可见，聚合操作是真正需要从`Stream`请求数据的，对一个`Stream`做聚合计算后，结果就不是一个`Stream`，而是一个其他的Java对象。

### 输出为List

`reduce()`只是一种聚合操作，如果我们希望把`Stream`的元素保存到集合，例如`List`，因为`List`的元素是确定的Java对象，因此，把`Stream`变为`List`不是一个转换操作，而是一个聚合操作，它会强制`Stream`输出每个元素。

下面的代码演示了如何将一组`String`先过滤掉空字符串，然后把非空字符串保存到`List`中：

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Stream<String> stream = Stream.of("Apple", "", null, "Pear", "  ", "Orange");
        List<String> list = stream.filter(s -> s != null && !s.isBlank()).collect(Collectors.toList());
        System.out.println(list);
    }
}
```

把`Stream`的每个元素收集到`List`的方法是调用`collect()`并传入`Collectors.toList()`对象，它实际上是一个`Collector`实例，通过类似`reduce()`的操作，把每个元素添加到一个收集器中（实际上是`ArrayList`）。

类似的，`collect(Collectors.toSet())`可以把`Stream`的每个元素收集到`Set`中。

### 输出为数组

把Stream的元素输出为数组和输出为List类似，我们只需要调用`toArray()`方法，并传入数组的“构造方法”：

```java
List<String> list = List.of("Apple", "Banana", "Orange");
String[] array = list.stream().toArray(String[]::new);
```

注意到传入的“构造方法”是`String[]::new`，它的签名实际上是`IntFunction<String[]>`定义的`String[] apply(int)`，即传入`int`参数，获得`String[]`数组的返回值。

### 输出为Map

如果我们要把Stream的元素收集到Map中，就稍微麻烦一点。因为对于每个元素，添加到Map时需要key和value，因此，我们要指定两个映射函数，分别把元素映射为key和value：

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Stream<String> stream = Stream.of("APPL:Apple", "MSFT:Microsoft");
        Map<String, String> map = stream
                .collect(Collectors.toMap(
                        // 把元素s映射为key:
                        s -> s.substring(0, s.indexOf(':')),
                        // 把元素s映射为value:
                        s -> s.substring(s.indexOf(':') + 1)));
        System.out.println(map);
    }
}
```

### 分组输出

`Stream`还有一个强大的分组功能，可以按组输出。我们看下面的例子：

```java
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> list = List.of("Apple", "Banana", "Blackberry", "Coconut", "Avocado", "Cherry", "Apricots");
        Map<String, List<String>> groups = list.stream()
                .collect(Collectors.groupingBy(s -> s.substring(0, 1), Collectors.toList()));
        System.out.println(groups);
    }
}
```

分组输出使用`Collectors.groupingBy()`，它需要提供两个函数：一个是分组的key，这里使用`s -> s.substring(0, 1)`，表示只要首字母相同的`String`分到一组，第二个是分组的value，这里直接使用`Collectors.toList()`，表示输出为`List`，上述代码运行结果如下：

```plain
{
    A=[Apple, Avocado, Apricots],
    B=[Banana, Blackberry],
    C=[Coconut, Cherry]
}
```

可见，结果一共有3组，按`"A"`，`"B"`，`"C"`分组，每一组都是一个`List`。

假设有这样一个`Student`类，包含学生姓名、班级和成绩：

```java
class Student {
    int gradeId; // 年级
    int classId; // 班级
    String name; // 名字
    int score; // 分数
}
```

如果我们有一个`Stream<Student>`，利用分组输出，可以非常简单地按年级或班级把`Student`归类。

### 小结

`Stream`可以输出为集合：

`Stream`通过`collect()`方法可以方便地输出为`List`、`Set`、`Map`，还可以分组输出。
