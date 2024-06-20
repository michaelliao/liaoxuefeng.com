# stream

`stream`是Node.js提供的又一个仅在服务区端可用的模块，目的是支持“流”这种数据结构。

什么是流？流是一种抽象的数据结构。想象水流，当在水管中流动时，就可以从某个地方（例如自来水厂）源源不断地到达另一个地方（比如你家的洗手池）。我们也可以把数据看成是数据流，比如你敲键盘的时候，就可以把每个字符依次连起来，看成字符流。这个流是从键盘输入到应用程序，实际上它还对应着一个名字：标准输入流（stdin）。

如果应用程序把字符一个一个输出到显示器上，这也可以看成是一个流，这个流也有名字：标准输出流（stdout）。流的特点是数据是有序的，而且必须依次读取，或者依次写入，不能像Array那样随机定位。

![stream](std.png)

有些流用来读取数据，比如从文件读取数据时，可以打开一个文件流，然后从文件流中不断地读取数据。有些流用来写入数据，比如向文件写入数据时，只需要把数据不断地往文件流中写进去就可以了。

在Node.js中，流也是一个对象，我们只需要响应流的事件就可以了：`data`事件表示流的数据已经可以读取了，`end`事件表示这个流已经到末尾了，没有数据可以读取了，`error`事件表示出错了。

下面是一个从文件流读取文本内容的示例：

```javascript
import { createReadStream } from 'node:fs';

// 打开流:
let rs = createReadStream('sample.txt', 'utf-8');

// 读取到数据:
rs.on('data', (chunk) => {
    console.log('---- chunk ----');
    console.log(chunk);
});

// 结束读取:
rs.on('end', () => {
    console.log('---- end ----');
});

// 出错:
rs.on('error', err => {
    console.log(err);
});
```

要注意，`data`事件可能会有多次，每次传递的`chunk`是流的一部分数据。

要以流的形式写入文件，只需要不断调用`write()`方法，最后以`end()`结束：

```javascript
import { createWriteStream } from 'node:fs';

let ws = createWriteStream('output.txt', 'utf-8');
ws.write('使用Stream写入文本数据...\n');
ws.write('继续写入...\n');
ws.write('DONE.\n');
ws.end(); // 结束写入

// 写入二进制数据:
let b64array = [ ... ];

let ws2 = createWriteStream('output.png');
for (let b64 of b64array) {
    let buf = Buffer.from(b64, 'base64');
    ws2.write(buf); // 写入Buffer对象
}
ws2.end(); // 结束写入
```

所有可以读取数据的流都继承自`stream.Readable`，所有可以写入的流都继承自`stream.Writable`。

### pipe

就像可以把两个水管串成一个更长的水管一样，两个流也可以串起来。一个`Readable`流和一个`Writable`流串起来后，所有的数据自动从`Readable`流进入`Writable`流，这种操作叫`pipe`。

在Node.js中，`Readable`流有一个`pipe()`方法，就是用来干这件事的：

```javascript
rs.pipe(ws);
```

除了直接使用`pipe()`方法，Node还提供了`pipeline`功能，它可以将一个流输出到另一个流。以下是一个复制文件的程序：

```javascript
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from 'node:stream/promises';

async function copy(src, dest) {
    let rs = createReadStream(src);
    let ws = createWriteStream(dest);
    await pipeline(rs, ws);
}

copy('sample.txt', 'output.txt')
    .then(() => console.log('copied.'))
    .catch(err => console.log(err));
```

使用`pipeline`的好处是，它可以添加若干个转换器，即输入流经过若干转换后，再进入输出流。如果我们添加的转换器实现了gzip功能，那么实际上就可以把输入流自动压缩后进入输出流。

### 参考源码

[stream](stream.zip)
