# koa

koa是Express的下一代基于Node.js的web框架，目前有1.x和2.0两个版本。

### 历史

#### Express

Express是第一代最流行的web框架，它对Node.js的http进行了封装，用起来如下：

```javascript
let express = require('express');
let app = express();

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
```

虽然Express的API很简单，但是它是基于ES5的语法，要实现异步代码，只有一个方法：回调。如果异步嵌套层次过多，代码写起来就非常难看：

```javascript
app.get('/test', function (req, res) {
    fs.readFile('/file1', function (err, data) {
        if (err) {
            res.status(500).send('read file1 error');
        }
        fs.readFile('/file2', function (err, data) {
            if (err) {
                res.status(500).send('read file2 error');
            }
            res.type('text/plain');
            res.send(data);
        });
    });
});
```

虽然可以用async这样的库来组织异步代码，但是用回调写异步实在是太痛苦了！

#### koa 1.x

随着新版Node.js开始支持ES6，Express的团队又基于ES6的generator重新编写了下一代web框架koa。和Express相比，koa 1.x使用generator实现异步，代码看起来像同步的：

```javascript
let koa = require('koa');
let app = koa();

app.use('/test', function *() {
    yield doReadFile1();
    let data = yield doReadFile2();
    this.body = data;
});

app.listen(3000);
```

用generator实现异步比回调简单了不少，但是generator的本意并不是异步。Promise才是为异步设计的，但是Promise的写法……想想就复杂。为了简化异步代码，JavaScript引入了新的关键字`async`和`await`，可以轻松地把一个function变为异步模式：

```javascript
async function () {
    let data = await fs.read('/file1');
}
```

这是JavaScript标准的异步代码，非常简洁，并且易于使用。

#### koa 2.x

koa团队并没有止步于koa 1.x，他们又开发了koa 2，和koa 1相比，koa 2完全使用Promise并配合`async`来实现异步。

koa 2.x的代码看上去像这样：

```javascript
app.use(async (ctx, next) => {
    await next();
    let data = await doReadFile();
    ctx.response.type = 'text/plain';
    ctx.response.body = data;
});
```

### 选择哪个版本？

为了紧跟时代潮流，教程将使用最新的koa 2.x开发！
