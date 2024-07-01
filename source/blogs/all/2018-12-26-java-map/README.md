# Java Map的正确使用方式

正确使用`Map`，只需要正确实现`hashCode()`和`equals()`就行了吗？

恐怕还不行。

确切地说，如果使用的是`HashMap`，那么只需要正确实现`hashCode()`和`equals()`就够了。

但是，如果换成`TreeMap`，正确实现`hashCode()`和`equals()`，结果并不一定正确。

代码胜于雄辩。先看作为key的class定义：

```java
class Student implements Comparable<Student> {
    final String name;
    final int score;

    public Student(String name, int score) {
        this.name = name;
        this.score = score;
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, score);
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof Student) {
            Student o = (Student) obj;
            return Objects.equals(this.name, o.name) && this.score == o.score;
        }
        return false;
    }

    @Override
    public int compareTo(Student o) {
        return this.score < o.score ? -1 : 1;
    }
}
```

先用`HashMap`测试：

```java
Map<Student, Integer> map = new HashMap<>();
map.put(new Student("Michael", 99), 99);
map.put(new Student("Bob", 88), 88);
map.put(new Student("Alice", 77), 77);
System.out.println(map.get(new Student("Michael", 99)));
System.out.println(map.get(new Student("Bob", 88)));
System.out.println(map.get(new Student("Alice", 77)));
```

输出为`99`、`88`、`77`，一切正常。

把`HashMap`改为`TreeMap`再测试：

```java
Map<Student, Integer> map = new TreeMap<>();
```

输出为`null`、`null`、`null`！

### 怎么肥四？

说好的接口不变，实现类随便换现在不管用了？难道是JDK的bug？

遇到这种诡异的问题，首先在心里默念三遍：

- JDK没有bug。
- JDK没有bug。
- JDK没有bug。

然后开始从自己的代码找原因。

先打开JDK的[TreeMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html)文档，注意到这句话：

> This is so because the Map interface is defined in terms of the equals operation, but a sorted map performs all key comparisons using its compareTo (or compare) method

意思是，`Map`接口定义了使用`equals()`判定key是否相等，但是`SortedMap`却使用`compareTo()`来判断key是否相等，而`TreeMap`是一种`SortedMap`。

所以，问题出在`compareTo()`方法上：

```java
@Override
public int compareTo(Student o) {
    return this.score < o.score ? -1 : 1;
}
```

上面这个定义，用来排序是没问题的，但是，没法判断相等。`TreeMap`根据`key.compareTo(anther)==0`判断是否相等，而不是`equals()`。

所以，解决问题的关键是正确实现`compareTo()`，该相等的时候，必须返回`0`：

```java
@Override
public int compareTo(Student o) {
    int n = Integer.compare(this.score, o.score);
    return n != 0 ? n : this.name.compareTo(o.name);
}
```

修正代码后，再次运行，一切正常。
