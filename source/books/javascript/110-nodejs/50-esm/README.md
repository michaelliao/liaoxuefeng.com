# 使用ESM模块

虽然Node.js从诞生起就支持模块，但JavaScript语言本身长期以来却一直没有模块功能，只能由CommonJS或其他AMD等模块系统来“模拟”。

随着ES 6标准的推出，JavaScript语言本身终于也迎来了原生内置的模块支持，称为ECMAScript Modules（简称ESM），不仅可以直接在浏览器中使用模块，也可以在Node.js中使用ESM模块。

不使用ESM模块时，我们用`module.exports`导出可供外部使用的JS对象，例如，以下模块导出了两个函数：

```javascript
'use strict';
let s = 'Hello';

function out(prompt, name) {
    console.log(`${prompt}, ${name}!`);
}

function greet(name) {
    out(s, name);
}

function hi(name) {
    out('Hi', name);
}

module.exports = {
    greet: greet,
    hi: hi
};
```

要把上述代码改为ESM模块，我们用`export`标识需要导出的函数：

```javascript
let s = 'Hello';

// out是模块内部函数，模块外部不可见:
function out(prompt, name) {
    console.log(`${prompt}, ${name}!`);
}

// greet是导出函数，可被外部调用:
export function greet(name) {
    out(s, name);
}

// hi是导出函数，可被外部调用:
export function hi(name) {
    out('Hi', name);
}
```

并将其保存为`hello.mjs`文件，注意扩展名不是`.js`，而是`.mjs`。

可以再编写一个`main.mjs`文件来调用`hello`模块：

```javascript
import { greet, hi } from './hello.mjs';

let name = 'Bob';
greet(name);
hi(name);
```

可见，ESM模块用`export`关键字导出一个JS对象，用`import`关键字导入一个模块的导出对象。

如果要实现类似如下代码的单个函数导出：

```javascript
module.exports = greet;
```

则可以用`export default`导出：

```javascript
export default function greet(name) {
    ...
}
```

相应的，导入代码修改为：

```javascript
import greet from './hello.mjs';
```

细心的同学还注意到ESM模块文件第一行并没有`'use strict'`，这是因为ESM模块默认启用严格模式，因此无需再手动声明`'use strict'`。

### 浏览器加载ESM

对于浏览器来说，也可以直接使用ESM模块。当我们加载一个ESM模块时，需要用`type="module"`来表示：

```html
<html>
<head>
    <script type="module" src="./example.js"></script>
    <script type="module">
        greet('Bob');
    </script>
</head>
...
</html>
```

或者直接使用`import`加载一个模块：

```html
<html>
<head>
    <script type="module">
        import { greet } from './example.js';
        greet('Bob');
    </script>
</head>
...
</html>
```

### 练习

在Node环境中使用ESM模块：

[下载练习](esm.zip)

### 小结

使用JavaScript内置的原生模块时，用关键字`export`和`import`来实现导出与导入；

ESM模块默认启用strict模式，无需声明`'use strict'`。
