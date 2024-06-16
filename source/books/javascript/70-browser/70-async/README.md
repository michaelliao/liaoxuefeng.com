# async函数

我们说JavaScript异步操作需要通过Promise实现，一个Promise对象在操作网络时是异步的，等到返回后再调用回调函数，执行正确就调用`then()`，执行错误就调用`catch()`，虽然异步实现了，不会让用户感觉到页面“卡住”了，但是一堆`then()`、`catch()`写起来麻烦看起来也乱。

有没有更简单的写法？

可以用关键字`async`配合`await`调用Promise，实现异步操作，但代码却和同步写法类似：

```javascript
async function get(url) {
    let resp = await fetch(url);
    let result = await resp.json();
    return result;
}
```

使用`async function`可以定义一个异步函数，异步函数和Promise可以看作是等价的，在async function内部，用`await`调用另一个异步函数，写起来和同步代码没啥区别，但执行起来是异步的。

也就是说：

```javascript
let resp = await fetch(url);
```

自动实现了异步调用，它和下面的Promise代码等价：

```javascript
let promise = fetch(url);
promise.then((resp) => {
    // 拿到resp
});
```

如果我们要实现`catch()`怎么办？用Promise的写法如下：

```javascript
let promise = fetch(url);
promise.then((resp) => {
    // 拿到resp
}).catch(e => {
    // 出错了
});
```

用`await`调用时，直接用传统的`try { ... } catch`：

```javascript
async function get(url) {
    try {
        let resp = await fetch(url);
        let result = await resp.json();
        return result;
    } catch (e) {
        // 出错了
    }
}
```

用async定义异步函数，用await调用异步函数，写起来和同步代码差不多，但可读性大大提高。

需要特别注意的是，`await`调用必须在async function中，不能在传统的同步代码中调用。那么问题来了，一个同步function怎么调用async function呢？

首先，普通function直接用await调用异步函数将报错：

```x-javascript
async function get(url) {
    let resp = await fetch(url);
    return resp.json();
}

function doGet() {
    let data = await get('/api/categories');
    console.log(data);
}

doGet();
```

如果把`await`去掉，调用实际上发生了，但我们拿不到结果，因为我们拿到的并不是异步结果，而是一个Promise对象：

```x-javascript
async function get(url) {
    let resp = await fetch(url);
    let result = await resp.text();
    return result;
}

function doGet() {
    let promise = get('./content.html');
    console.log(promise);
}

doGet();
```

因此，在普通function中调用async function，不能使用await，但可以直接调用async function拿到Promise对象，后面加上`then()`和`catch()`就可以拿到结果或错误了：

```x-javascript
async function get(url) {
    let resp = await fetch(url);
    let result = await resp.text();
    return result;
}

function doGet() {
    let promise = get('./content.html');
    promise.then(data => {
        // 拿到data
        document.getElementById('test-response-text').value = JSON.stringify(data);
    });
}

doGet();
```

<textarea id="test-response-text" rows="5" style="width: 90%; margin: 15px 0; resize: none;">
响应结果：
</textarea>

因此，定义异步任务时，使用async function比Promise简单，调用异步任务时，使用await比Promise简单，捕获错误时，按传统的`try...catch`写法，也比Promise简单。只要浏览器支持，完全可以用`async`简洁地实现异步操作。
