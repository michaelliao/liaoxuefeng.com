# Java源码分析：深入探讨Iterator模式

`java.util`包中包含了一系列重要的集合类。本文将从分析源码入手，深入研究一个集合类的内部结构，以及遍历集合的迭代模式的源码实现内幕。

下面我们先简单讨论一个根接口`Collection`，然后分析一个抽象类`AbstractList`和它的对应`Iterator`接口，并仔细研究迭代子模式的实现原理。

本文讨论的源代码版本是JDK 1.4.2，因为JDK 1.5在`java.util`中使用了很多泛型代码，为了简化问题，所以我们还是讨论1.4版本的代码。

## 集合类的根接口Collection

`Collection`接口是所有集合类的根类型。它的一个主要的接口方法是：

```java
boolean add(Object c)
```

`add()`方法将添加一个新元素。注意这个方法会返回一个`boolean`，但是返回值不是表示添加成功与否。仔细阅读doc可以看到，`Collection`规定：如果一个集合拒绝添加这个元素，无论任何原因，都必须抛出异常。这个返回值表示的意义是`add()`方法执行后，集合的内容是否改变了（就是元素有无数量，位置等变化），这是由具体类实现的。即：如果方法出错，总会抛出异常；返回值仅仅表示该方法执行后这个`Collection`的内容有无变化。

类似的还有：

```java
boolean addAll(Collection c);
boolean remove(Object o);
boolean removeAll(Collection c);
boolean remainAll(Collection c);
```

`toArray()`方法很简单，把集合转换成数组返回。`toArray(Object[] a)`方法就有点复杂了，首先，返回的`Object[]`仍然是把集合的所有元素变成的数组，但是类型和参数a的类型是相同的，比如执行：

```java
String[] o = (String[])c.toArray(new String[0]);
```

得到的`o`实际类型是`String[]`。

其次，如果参数`a`的大小装不下集合的所有元素，返回的将是一个新的数组。如果参数`a`的大小能装下集合的所有元素，则返回的还是`a`，但`a`的内容用集合的元素来填充。尤其要注意的是，如果`a`的大小比集合元素的个数还多，`a`后面的部分全部被置为`null`。

最后一个最重要的方法是`iterator()`，返回一个Iterator（迭代子），用于遍历集合的所有元素。

## 用Iterator模式实现遍历集合

Iterator模式是用于遍历集合类的标准访问方法。它可以把访问逻辑从不同类型的集合类中抽象出来，从而避免向客户端暴露集合的内部结构。

例如，如果没有使用Iterator，遍历一个数组的方法是使用索引：

```java
for (int i=0; i<array.size(); i++) {
    // TODO: get(i) ...
}
```

而访问一个链表`LinkedList`又必须使用`while`循环：

```java
while ((e=e.next())!=null) {
    // TODO: e.data() ...
}
```

以上两种方法客户端都必须事先知道集合的内部结构，访问代码和集合本身是紧耦合，无法将访问逻辑从集合类和客户端代码中分离出来，每一种集合对应一种遍历方法，客户端代码无法复用。

更恐怖的是，如果以后需要把`ArrayList`更换为`LinkedList`，则原来的客户端代码必须全部重写。

为解决以上问题，Iterator模式总是用同一种逻辑来遍历集合：

```java
for (Iterator it = c.iterater(); it.hasNext(); ) { ... }
```

奥秘在于客户端自身不维护遍历集合的"指针"，所有的内部状态（如当前元素位置，是否有下一个元素）都由`Iterator`来维护，而这个`Iterator`由集合类通过工厂方法生成，因此，它知道如何遍历整个集合。

客户端从不直接和集合类打交道，它总是控制`Iterator`，向它发送"向前"，"向后"，"取当前元素"的命令，就可以间接遍历整个集合。

首先看看`java.util.Iterator`接口的定义：

```java
public interface Iterator {
    boolean hasNext();
    Object next();
    void remove();
}
```

依赖前两个方法就能完成遍历，典型的代码如下：

```java
for (Iterator it = c.iterator(); it.hasNext(); ) {
    Object o = it.next();
    // 对o的操作...
}
```

在JDK1.5中，还对上面的代码在语法上作了简化：

```java
// Type是具体的类型，如String。
for (Type t : c) {
    // 对t的操作...
}
```

每一种集合类返回的`Iterator`具体类型可能不同，`ArrayList`可能返回`ArrayIterator`，`Set`可能返回`SetIterator`，`Tree`可能返回`TreeIterator`，但是它们都实现了`Iterator`接口，因此，客户端不关心到底是哪种`Iterator`，它只需要获得这个`Iterator`接口即可，这就是面向对象的威力。

## Iterator源码剖析

让我们来看看`AbstracyList`如何创建`Iterator`。首先`AbstractList`定义了一个内部类（inner class）：

```java
private class Itr implements Iterator {
    ...
}
```

而`iterator()`方法的定义是：

```java
public Iterator iterator() {
    return new Itr();
}
```

因此客户端不知道它通过`Iterator it = a.iterator();`所获得的`Iterator`的真正类型。

现在我们关心的是这个申明为`private`的`Itr`类是如何实现遍历`AbstractList`的：

```java
private class Itr implements Iterator {
    int cursor = 0;
    int lastRet = -1;
    int expectedModCount = modCount;
}
```

`Itr`类依靠3个`int`变量（还有一个隐含的`AbstractList`的引用）来实现遍历，`cursor`是下一次`next()`调用时元素的位置，第一次调用`next()`将返回索引为0的元素。`lastRet`记录上一次游标所在位置，因此它总是比`cursor`少1。

变量`cursor`和集合的元素个数决定`hasNext()`：

```java
public boolean hasNext() {
    return cursor != size();
}
```

方法`next()`返回的是索引为`cursor`的元素，然后修改`cursor`和`lastRet`的值：

```java
public Object next() {
    checkForComodification();
    try {
        Object next = get(cursor);
        lastRet = cursor++;
        return next;
    } catch(IndexOutOfBoundsException e) {
        checkForComodification();
        throw new NoSuchElementException();
    }
}
```

`expectedModCount`表示期待的`modCount`值，用来判断在遍历过程中集合是否被修改过。`AbstractList`包含一个`modCount`变量，它的初始值是0，当集合每被修改一次时（调用`add`，`remove`等方法），`modCount`加`1`。因此，`modCount`如果不变，表示集合内容未被修改。

`Itr`初始化时用`expectedModCount`记录集合的`modCount`变量，此后在必要的地方它会检测`modCount`的值：

```java
final void checkForComodification() {
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
}
```

如果`modCount`与一开始记录在`expectedModeCount`中的值不等，说明集合内容被修改过，此时会抛出`ConcurrentModificationException`。

这个`ConcurrentModificationException`是`RuntimeException`，不要在客户端捕获它。如果发生此异常，说明程序代码的编写有问题，应该仔细检查代码而不是在`catch`中忽略它。

但是调用`Iterator`自身的`remove()`方法删除当前元素是完全没有问题的，因为在这个方法中会自动同步`expectedModCount`和`modCount`的值：

```java
public void remove() {
    ...
    AbstractList.this.remove(lastRet);
    ...
    // 在调用了集合的remove()方法之后重新设置了expectedModCount：
    expectedModCount = modCount;
    ...
}
```

要确保遍历过程顺利完成，必须保证遍历过程中不更改集合的内容（`Iterator`的`remove()`方法除外），因此，确保遍历可靠的原则是只在一个线程中使用这个集合，或者在多线程中对遍历代码进行同步。

最后给个完整的示例：

```java
Collection c = new ArrayList();
c.add("abc");
c.add("xyz");
for (Iterator it = c.iterator(); it.hasNext(); ) {
    String s = (String)it.next();
    System.out.println(s);
}
```

如果你把第一行代码的`ArrayList`换成`LinkedList`，剩下的代码不用改动一行就能编译，而且功能不变，这就是针对抽象编程的原则：对具体类的依赖性最小。
