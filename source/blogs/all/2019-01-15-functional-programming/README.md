# 函数式编程的核心思想

函数式编程最近几年越炒越热，有函数式编程的语言鄙视没有函数式编程的语言，纯函数式编程的语言鄙视不纯的函数式编程的语言。

那么，到底什么是函数式编程，函数式编程的核心思想又是什么？

函数式编程的第一个特点就是可以把函数作为参数传递给另一个函数，也就是所谓的高阶函数。例如，对数组进行排序，可以传入一个排序函数作为参数：

```java
String[] array = { "orange", "Pear", "Apple" };
Arrays.sort(array, String::compareToIgnoreCase);
```

函数式编程的第二个特点就是可以返回一个函数，这样就可以实现闭包或者惰性计算：

以上两个特点还仅仅是简化了代码。从代码的可维护性上讲，函数式编程最大的好处是引用透明，即函数运行的结果只依赖于输入的参数，而不依赖于外部状态，因此，我们常常说函数式编程没有副作用。

没有副作用有个巨大的好处，就是函数内部无状态，即输入确定，输出就是确定的，容易测试和维护。

很多初学者容易纠结“纯”函数式语言，认为只有Haskell这种消除了变量和副作用的语言才是正宗的函数式编程。还有人甚至认为纯函数不能有任何IO操作，包括打行日志都不行。

其实这种纠结是没有意义的，因为计算机底层就是一个完全可变的内存和不可预测输入的系统，追求完美的无副作用是不现实的，我们只需要理解函数式编程的思想，把业务逻辑做到“无副作用”，至于有变量、打日志、读缓存这些无关紧要的“副作用”，根本不用担心，不需要解决，也几乎没法解决。

我们来举个栗子。

比如一个财务软件，需要一个函数专门计算个人所得税，输入是一个`IncomeRecord`，输出是个税金额：

```java
double calculateIncomeTax(IncomeRecord record) {
    ...
}
```

又假设`IncomeRecord`长这样：

```java
class IncomeRecord {
    String id; // 身份证号
    String name; // 姓名
    double salary; // 工资
}
```

先不考虑五险一金这些乱七八糟的东西，我们只关注如何计算个税。为了简化，我们假设直接扣除一个免征额后按20%计算：

```java
double calculateIncomeTax(IncomeRecord record) {
    double threshold = 3500;
    double tax = record.salary <= threshold ? 0 : (record.salary - threshold) * 0.2;
    return tax;
}
```

上面这个程序在2018年9月1号前是没问题的，问题是2018年9月1号后起征点调整到了5000，那2018年8月和2018年9月，计算结果应该不一样。怎么改？

普通开发者的改法：那还不简单？直接获取当前日期，返回正确的起征点就行：

```java
double calculateIncomeTax(IncomeRecord record) {
    double threshold = today() < date(2018, 9, 1) ? 3500 : 5000;
    double tax = record.salary <= threshold ? 0 : (record.salary - threshold) * 0.2;
    return tax;
}
```

程序是没错，问题是：

同样的输入，8月31号跑，和9月1号跑，结果不一样，难道会计要在9月1号做8月份的工资条，必须把电脑的时间先调到8月份？

用函数式编程的观点思考一下，就发现问题所在：

`today()`这个函数，返回结果与时间有关，这就造成了`calculateIncomeTax()`不再是一个纯函数，它与当前时间相关了。

那怎么把`calculateIncomeTax()`恢复成一个纯函数，同时要支持起征点调整？

方法是把时间相关的变量作为参数传进来，例如，给`IncomeRecord`增加几个字段：

```java
class IncomeRecord {
    String id; // 身份证号
    String name; // 姓名
    double salary; // 工资
    int year; // 年
    int month; // 月
}
```

这样我们就可以消除`today()`的调用：

```java
double calculateIncomeTax(IncomeRecord record) {
    double threshold = date(record.year, record.month) < date(2018, 9) ? 3500 : 5000;
    double tax = record.salary <= threshold ? 0 : (record.salary - threshold) * 0.2;
    return tax;
}
```

`calculateIncomeTax()`又变成了一个纯函数，会计就不用改电脑时间了。

是不是觉得这个例子太简单了？其实简单的函数如果都能写成有状态的，那么复杂的业务逻辑必然写成一锅粥。

举个复杂的栗子：

对于一个股票交易系统，如果我们把输入定义为：开盘前所有股民的现金和持股，以及交易时段的所有订单，那么，输出就是收盘后所有股民的现金和持股：

```java
StockStatus process(StockStatus old, List<Order> orders) {
    ...
    for (Order order : orders) {
        ...
        sendExchangeResult(...); // 给每一笔成交发送信息
    }
    ...
}
```

很显然这是一个纯函数，虽然在处理过程中，这个函数会给股民朋友发送各种心跳消息。

如果把交易系统的模型设计成这样一个纯函数，那么理论上我们只需要从股市开市的那一天开始，把所有订单全部处理一遍，就可以正确得到今天收盘后的状态。

或者说，只要取任意一天开盘前的系统状态的备份（就是整个数据库的备份），把当天的订单重新处理一遍，就得到了当天收盘的状态。这个过程可以做任意次，结果不变，因此，非常适合验证代码的修改是否影响了业务流程。

那么问题来了，交易系统中有无数和时间相关的状态，怎么处理成纯函数？这个模型的处理，可比计算个税复杂多了。

这就是函数式编程的精髓：业务系统模型无状态。模型的好坏，直接影响到代码的正确性、可靠性、稳定性，以及是否需要996。
