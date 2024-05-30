# 条件判断

JavaScript使用`if () { ... } else { ... }`来进行条件判断。例如，根据年龄显示不同内容，可以用`if`语句实现如下：

```javascript
let age = 20;
if (age >= 18) { // 如果age >= 18为true，则执行if语句块
    console.log('adult');
} else { // 否则执行else语句块
    console.log('teenager');
}
```

其中`else`语句是可选的。如果语句块只包含一条语句，那么可以省略`{}`：

```javascript
let age = 20;
if (age >= 18)
    console.log('adult');
else
    console.log('teenager');
```

省略`{}`的危险之处在于，如果后来想添加一些语句，却忘了写`{}`，就改变了`if...else...`的语义，例如：

```x-javascript
let age = 20;
if (age >= 18)
    console.log('adult');
else
    console.log('age < 18'); // 添加一行日志
    console.log('teenager'); // <- 这行语句已经不在else的控制范围了
```

上述代码的`else`子句实际上只负责执行`console.log('age < 18');`，原有的`console.log('teenager');`已经不属于`if...else...`的控制范围了，它每次都会执行。

相反地，有`{}`的语句就不会出错：

```x-javascript
let age = 20;
if (age >= 18) {
    console.log('adult');
} else {
    console.log('age < 18');
    console.log('teenager');
}
```

这就是为什么我们建议永远都要写上`{}`。

### 多行条件判断

如果还要更细致地判断条件，可以使用多个`if...else...`的组合：

```javascript
let age = 3;
if (age >= 18) {
    console.log('adult');
} else if (age >= 6) {
    console.log('teenager');
} else {
    console.log('kid');
}
```

上述多个`if...else...`的组合实际上相当于两层`if...else...`：

```javascript
let age = 3;
if (age >= 18) {
    console.log('adult');
} else {
    if (age >= 6) {
        console.log('teenager');
    } else {
        console.log('kid');
    }
}
```

但是我们通常把`else if`连写在一起，来增加可读性。这里的`else`略掉了`{}`是没有问题的，因为它只包含一个`if`语句。注意最后一个单独的`else`不要略掉`{}`。

*请注意*，`if...else...`语句的执行特点是二选一，在多个`if...else...`语句中，如果某个条件成立，则后续就不再继续判断了。

试解释为什么下面的代码显示的是`teenager`：

```x-javascript
'use strict';
let age = 20;

if (age >= 6) {
    console.log('teenager');
} else if (age >= 18) {
    console.log('adult');
} else {
    console.log('kid');
}
```

由于`age`的值为`20`，它实际上同时满足条件`age >= 6`和`age >= 18`，这说明条件判断的顺序非常重要。请修复后让其显示`adult`。

如果`if`的条件判断语句结果不是`true`或`false`怎么办？例如：

```javascript
let s = '123';
if (s.length) { // 条件计算结果为3
    //
}
```

JavaScript把`null`、`undefined`、`0`、`NaN`和空字符串`''`视为`false`，其他值一概视为`true`，因此上述代码条件判断的结果是`true`。

### 练习

小明身高1.75，体重80.5kg。请根据BMI公式（体重除以身高的平方）帮小明计算他的BMI指数，并根据BMI指数：

* 低于18.5：过轻
* 18.5-25：正常
* 25-28：过重
* 28-32：肥胖
* 高于32：严重肥胖

用`if...else...`判断并显示结果：

```x-javascript
let height = parseFloat(prompt('请输入身高(m):'));
let weight = parseFloat(prompt('请输入体重(kg):'));

// TODO:
let bmi = ???;
if ...
```
