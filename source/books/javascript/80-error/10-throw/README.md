# 错误传播

如果代码发生了错误，又没有被try ... catch捕获，那么，程序执行流程会跳转到哪呢？

```javascript
function getLength(s) {
    return s.length;
}

function printLength() {
    console.log(getLength('abc')); // 3
    console.log(getLength(null)); // Error!
}

printLength();
```

如果在一个函数内部发生了错误，它自身没有捕获，错误就会被抛到外层调用函数，如果外层函数也没有捕获，该错误会一直沿着函数调用链向上抛出，直到被JavaScript引擎捕获，代码终止执行。

所以，我们不必在每一个函数内部捕获错误，只需要在合适的地方来个统一捕获，一网打尽：

```x-javascript
function main(s) {
    console.log('BEGIN main()');
    try {
        foo(s);
    } catch (e) {
        console.log('出错了：' + e);
    }
    console.log('END main()');
}

function foo(s) {
    console.log('BEGIN foo()');
    bar(s);
    console.log('END foo()');
}

function bar(s) {
    console.log('BEGIN bar()');
    console.log('length = ' + s.length);
    console.log('END bar()');
}

main(null);
```

当`bar()`函数传入参数`null`时，代码会报错，错误会向上抛给调用方`foo()`函数，`foo()`函数没有try ... catch语句，所以错误继续向上抛给调用方`main()`函数，`main()`函数有try ... catch语句，所以错误最终在`main()`函数被处理了。

至于在哪些地方捕获错误比较合适，需要视情况而定。
