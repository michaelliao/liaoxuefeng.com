# 异步错误处理

编写JavaScript代码时，我们要时刻牢记，JavaScript引擎是一个事件驱动的执行引擎，代码总是以单线程执行，而回调函数的执行需要等到下一个满足条件的事件出现后，才会被执行。

例如，`setTimeout()`函数可以传入回调函数，并在指定若干毫秒后执行：

```javascript
function printTime() {
    console.log('It is time!');
}

setTimeout(printTime, 1000);
console.log('done');
```

上面的代码会先打印`done`，1秒后才会打印`It is time!`。

如果`printTime()`函数内部发生了错误，我们试图用try包裹`setTimeout()`是无效的：

```x-javascript
function printTime() {
    throw new Error();
}

try {
    setTimeout(printTime, 1000);
    console.log('done');
} catch (e) {
    console.log('error');
}
```

原因就在于调用`setTimeout()`函数时，传入的`printTime`函数并未立刻执行！紧接着，JavaScript引擎会继续执行`console.log('done');`语句，而此时并没有错误发生。直到1秒钟后，执行`printTime`函数时才发生错误，但此时除了在`printTime`函数内部捕获错误外，外层代码并无法捕获。

所以，涉及到异步代码，无法在调用时捕获，原因就是在捕获的当时，回调函数并未执行。

类似的，当我们处理一个事件时，在绑定事件的代码处，无法捕获事件处理函数的错误。

例如，针对以下的表单：

```html
<form>
    <input id="x"> + <input id="y">
    <button id="calc" type="button">计算</button>
</form>
```

<form>
    <input id="x"> + <input id="y">
    <button id="calc" type="button" class="uk-button">计算</button>
</form>

我们用下面的代码给button绑定click事件：

```x-javascript
let btn = document.querySelector('#calc');

// 取消已绑定的事件:
btn.onclick = null;

try {
    btn.onclick = function () {
        let
            x = parseFloat(document.querySelector('#x').value),
            y = parseFloat(document.querySelector('#y').value),
            r;
        if (isNaN(x) || isNaN(y)) {
            throw new Error('输入有误');
        }
        r = x + y;
        alert('计算结果：' + r);
    };
} catch (e) {
    alert('输入有误！');
}
```

但是，用户输入错误时，处理函数并未捕获到错误。请修复错误处理代码。
