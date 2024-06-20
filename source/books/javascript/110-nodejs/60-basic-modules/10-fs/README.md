# fs

Node.js内置的`fs`模块就是文件系统模块，负责读写文件。

和所有其它JavaScript模块不同的是，`fs`模块同时提供了异步和同步的方法。

回顾一下什么是异步方法。因为JavaScript的单线程模型，执行IO操作时，JavaScript代码无需等待，而是传入回调函数后，继续执行后续JavaScript代码。比如jQuery提供的`getJSON()`操作：

```javascript
$.getJSON('http://example.com/ajax', function (data) {
    console.log('IO结果返回后执行...');
});
console.log('不等待IO结果直接执行后续代码...');
```

而同步的IO操作则需要等待函数返回：

```javascript
// 根据网络耗时，函数将执行几十毫秒~几秒不等:
let data = getJSONSync('http://example.com/ajax');
```

同步操作的好处是代码简单，缺点是程序将等待IO操作，在等待时间内，无法响应其它任何事件。而异步读取不用等待IO操作，但代码较麻烦。

### 异步读文件

按照JavaScript的标准，异步读取一个文本文件的代码如下：

```javascript
// read-text-file-async.mjs
import { readFile } from 'node:fs';

console.log('BEGIN');

readFile('sample.txt', 'utf-8', function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }
});

console.log('END');
```

请注意，`sample.txt`文件必须在当前目录下，且文件编码为`utf-8`。

异步读取时，传入的回调函数接收两个参数，当正常读取时，`err`参数为`null`，`data`参数为读取到的String。当读取发生错误时，`err`参数代表一个错误对象，`data`为`undefined`。这也是Node.js标准的回调函数：第一个参数代表错误信息，第二个参数代表结果。后面我们还会经常编写这种回调函数。

由于`err`是否为`null`就是判断是否出错的标志，所以通常的判断逻辑总是：

```javascript
if (err) {
    // 出错了
} else {
    // 正常
}
```

执行上述代码，可以看到打印的内容如下：

```plain
>>> BEGIN >>>
>>> END >>>
Sample file content...
```

因为异步读取，所以，先打印`END`后，才会执行回调函数，打印文件内容。

如果我们要读取的文件不是文本文件，而是二进制文件，怎么办？

下面的例子演示了如何读取一个图片文件：

```javascript
import { readFile } from 'node:fs';

readFile('sample.png', function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data instanceof Buffer); // true
        console.log(data); // Buffer(12451) [137, 80, 78, 71, 13, ...]
    }
});
```

当读取二进制文件时，不传入文件编码时，回调函数的`data`参数将返回一个`Buffer`对象。在Node.js中，`Buffer`对象就是一个包含零个或任意个字节的数组（注意和Array不同）。

`Buffer`对象可以和String作转换，例如，把一个`Buffer`对象转换成String：

```javascript
// Buffer -> String
let text = data.toString('utf-8');
console.log(text);
```

或者把一个String转换成`Buffer`：

```javascript
// String -> Buffer
let buf = Buffer.from(text, 'utf-8');
console.log(buf);
```

### 同步读文件

除了标准的异步读取模式外，`fs`也提供相应的同步读取函数。同步读取的函数和异步函数相比，多了一个`Sync`后缀，并且不接收回调函数，函数直接返回结果。

用`fs`模块同步读取一个文本文件的代码如下：

```javascript
// read-text-file-sync.mjs
import { readFileSync } from 'node:fs';

console.log('BEGIN');

try {
    let s = readFileSync('sample.txt', 'utf-8');
    console.log(s);
} catch (err) {
    console.log(err);
}
console.log('END');
```

可见，原异步调用的回调函数的`data`被函数直接返回，函数名需要改为`readFileSync`，其它参数不变。

如果同步读取文件发生错误，则需要用`try...catch`捕获该错误。

### 写文件

将数据写入文件是通过`fs.writeFile()`实现的：

```javascript
// write-file-async.mjs
import { writeFile } from 'node:fs';

let data = 'Hello, Node.js';
writeFile('output.txt', data, function (err) {
    if (err) {
        console.log(err);
    }
});
```

`writeFile()`的参数依次为文件名、数据和回调函数。如果传入的数据是String，默认按UTF-8编码写入文本文件，如果传入的参数是`Buffer`，则写入的是二进制文件。回调函数由于只关心成功与否，因此只需要一个`err`参数。

和`readFile()`类似，`writeFile()`也有一个同步方法，叫`writeFileSync()`。

### stat

如果我们要获取文件大小，创建时间等信息，可以使用`fs.stat()`，它返回一个`Stat`对象，能告诉我们文件或目录的详细信息：

```javascript
// read-stat-async.mjs
import { stat } from 'node:fs';

stat('sample.png', function (err, st) {
    if (err) {
        console.log(err);
    } else {
        // 是否是文件:
        console.log('isFile: ' + st.isFile());
        // 是否是目录:
        console.log('isDirectory: ' + st.isDirectory());
        if (st.isFile()) {
            // 文件大小:
            console.log('size: ' + st.size);
            // 创建时间, Date对象:
            console.log('birth time: ' + st.birthtime);
            // 修改时间, Date对象:
            console.log('modified time: ' + st.mtime);
        }
    }
});
```

运行结果如下：

```plain
isFile: true
isDirectory: false
size: 12451
birth time: Mon Jun 17 2024 19:37:24 GMT+0800 (China Standard Time)
modified time: Mon Jun 17 2024 19:37:24 GMT+0800 (China Standard Time)
```

`stat()`也有一个对应的同步函数`statSync()`，请试着改写上述异步代码为同步代码。

### 使用Promise

我们在介绍JavaScript的[Promise](../../../browser/promise/index.html)时，讲到通过[async](../../../browser/async/index.html)函数实现异步逻辑，代码更简单。

类似的，Node还提供Promise版本的fs，可以用如下代码在async函数中读取文件：

```javascript
// async-read.mjs
import { readFile } from 'node:fs/promises';

async function readTextFile(path) {
    return await readFile(path, 'utf-8');
}

readTextFile('sample.txt').then(s => console.log(s));
```

在async函数中，用await调用`fs/promises`与同步方法类似，但代码却是异步执行的。

### 异步还是同步

在`fs`模块中，提供同步方法是为了方便使用。那我们到底是应该用异步方法还是同步方法呢？

由于Node环境执行的JavaScript代码是服务器端代码，所以，绝大部分需要在服务器运行期反复执行业务逻辑的代码，*必须使用异步代码*，否则，同步代码在执行时期，服务器将停止响应，因为JavaScript只有一个执行线程。

服务器启动时如果需要读取配置文件，或者结束时需要写入到状态文件时，可以使用同步代码，因为这些代码只在启动和结束时执行一次，不影响服务器正常运行时的异步执行。

如果代码中编写了大量的async函数，那么通过await异步调用`fs/promises`模块更加方便。

### 参考源码

[fs](fs.zip)
