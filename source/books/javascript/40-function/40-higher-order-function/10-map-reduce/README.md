# map/reduce

如果你读过Google的那篇大名鼎鼎的论文“[MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/)”，你就能大概明白map/reduce的概念。

### map

举例说明，比如我们有一个函数f(x)=x<sup>2</sup>，要把这个函数作用在一个数组`[1, 2, 3, 4, 5, 6, 7, 8, 9]`上，就可以用`map`实现如下：

```ascii
            f(x) = x * x

                  │
                  │
  ┌───┬───┬───┬───┼───┬───┬───┬───┐
  │   │   │   │   │   │   │   │   │
  ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼

[ 1   2   3   4   5   6   7   8   9 ]

  │   │   │   │   │   │   │   │   │
  │   │   │   │   │   │   │   │   │
  ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼

[ 1   4   9  16  25  36  49  64  81 ]
```

由于`map()`方法定义在JavaScript的`Array`中，我们调用`Array`的`map()`方法，传入我们自己的函数，就得到了一个新的`Array`作为结果：

```x-javascript
function pow(x) {
    return x * x;
}

let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let results = arr.map(pow); // [1, 4, 9, 16, 25, 36, 49, 64, 81]
console.log(results);
```

注意：`map()`传入的参数是`pow`，即函数对象本身。

你可能会想，不需要`map()`，写一个循环，也可以计算出结果：

```javascript
let f = function (x) {
    return x * x;
};

let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let result = [];
for (let i=0; i<arr.length; i++) {
    result.push(f(arr[i]));
}
```

的确可以，但是，从上面的循环代码，我们无法一眼看明白“把f(x)作用在Array的每一个元素并把结果生成一个新的Array”。

所以，`map()`作为高阶函数，事实上它把运算规则抽象了，因此，我们不但可以计算简单的f(x)=x<sup>2</sup>，还可以计算任意复杂的函数，比如，把`Array`的所有数字转为字符串：

```javascript
let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
arr.map(String); // ['1', '2', '3', '4', '5', '6', '7', '8', '9']
```

只需要一行代码。

### reduce

再看reduce的用法。Array的`reduce()`把一个函数作用在这个`Array`的`[x1, x2, x3...]`上，这个函数必须接收两个参数，`reduce()`把结果继续和序列的下一个元素做累积计算，其效果就是：

```javascript
[x1, x2, x3, x4].reduce(f) = f(f(f(x1, x2), x3), x4)
```

比方说对一个`Array`求和，就可以用`reduce`实现：

```javascript
let arr = [1, 3, 5, 7, 9];
arr.reduce(function (x, y) {
    return x + y;
}); // 25
```

如果数组元素只有1个，那么还需要提供一个额外的初始参数以便至少凑够两：

```javascript
let arr = [123];
arr.reduce(function (x, y) {
    return x + y;
}, 0); // 123
```

练习：利用`reduce()`求积：

```x-javascript
function product(arr) {
    // FIXME:
    return 0;
}

// 测试:
if (product([1, 2, 3, 4]) === 24 && product([0, 1, 2]) === 0 && product([99, 88, 77, 66]) === 44274384) {
    console.log('测试通过!');
}
else {
    console.log('测试失败!');
}
```

要把`[1, 3, 5, 7, 9]`变换成整数13579，`reduce()`也能派上用场：

```javascript
let arr = [1, 3, 5, 7, 9];
arr.reduce(function (x, y) {
    return x * 10 + y;
}); // 13579
```

如果我们继续改进这个例子，想办法把一个字符串`13579`先变成`Array`——`[1, 3, 5, 7, 9]`，再利用`reduce()`就可以写出一个把字符串转换为Number的函数。

练习：不要使用JavaScript内置的`parseInt()`函数，利用map和reduce操作实现一个`string2int()`函数：

```x-javascript
function string2int(s) {
    // FIXME:
    return 0;
}

// 测试:
if (string2int('0') === 0 && string2int('12345') === 12345 && string2int('12300') === 12300) {
    if (string2int.toString().indexOf('parseInt') !== -1) {
        console.log('请勿使用parseInt()!');
    } else if (string2int.toString().indexOf('Number') !== -1) {
        console.log('请勿使用Number()!');
    } else {
        console.log('测试通过!');
    }
}
else {
    console.log('测试失败!');
}
```

### 练习

请把用户输入的不规范的英文名字，变为首字母大写，其他小写的规范名字。输入：`['adam', 'LISA', 'barT']`，输出：`['Adam', 'Lisa', 'Bart']`。

```x-javascript
function normalize(arr) {
    // FIXME:
    return [];
}

// 测试:
if (normalize(['adam', 'LISA', 'barT']).toString() === ['Adam', 'Lisa', 'Bart'].toString()) {
    console.log('测试通过!');
}
else {
    console.log('测试失败!');
}
```

小明希望利用`map()`把字符串变成整数，他写的代码很简洁：

```x-javascript
let arr = ['1', '2', '3'];
let r;

r = arr.map(parseInt);
console.log(r);
```

结果竟然是`1`, `NaN`, `NaN`，小明百思不得其解，请帮他找到原因并修正代码。

提示：参考[Array.prototype.map()的文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/map)。

<div id="x-answer-parseInt-failed" style="display:none;">
<p>由于<code>map()</code>接收的回调函数可以有3个参数：<code>callback(currentValue, index, array)</code>，通常我们仅需要第一个参数，而忽略了传入的后面两个参数。不幸的是，<code>parseInt(string, radix)</code>没有忽略第二个参数，导致实际执行的函数分别是：</p>
<ul>
<li>parseInt('1', 0); // 1, 按十进制转换</li>
<li>parseInt('2', 1); // NaN, 没有一进制</li>
<li>parseInt('3', 2); // NaN, 按二进制转换不允许出现3</li>
</ul>
<p>可以改为<code>r = arr.map(Number);</code>，因为<code>Number(value)</code>函数仅接收一个参数。</p>
</div>

<a href="javascript:void(0)" onclick="document.querySelector('#x-answer-parseInt-failed').style.display='block';this.style.display='none'">原因分析</a>
