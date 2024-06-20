# 使用模块

在计算机程序的开发过程中，随着程序代码越写越多，在一个文件里代码就会越来越长，越来越不容易维护。

为了编写可维护的代码，我们把很多函数分组，分别放到不同的文件里，这样，每个文件包含的代码就相对较少，很多编程语言都采用这种组织代码的方式。在Node环境中，一个.js文件就称之为一个模块（module）。

使用模块有什么好处？

最大的好处是大大提高了代码的可维护性。其次，编写代码不必从零开始。当一个模块编写完毕，就可以被其他地方引用。我们在编写程序的时候，也经常引用其他模块，包括Node内置的模块和来自第三方的模块。

使用模块还可以避免函数名和变量名冲突。相同名字的函数和变量完全可以分别存在不同的模块中，因此，我们自己在编写模块时，不必考虑名字会与其他模块冲突。

在上一节，我们编写了一个`hello.js`文件，这个`hello.js`文件就是一个模块，模块的名字就是文件名（去掉`.js`后缀），所以`hello.js`文件就是名为`hello`的模块。

我们把`hello.js`改造一下，创建一个函数，这样我们就可以在其他地方调用这个函数：

```javascript
'use strict';

const s = 'Hello';

function greet(name) {
    console.log(s + ', ' + name + '!');
}

module.exports = greet;
```

函数`greet()`是我们在`hello`模块中定义的，你可能注意到最后一行是一个奇怪的赋值语句，它的意思是，把函数`greet`作为模块的输出暴露出去，这样其他模块就可以使用`greet`函数了。

问题是其他模块怎么使用`hello`模块的这个`greet`函数呢？我们再编写一个`main.js`文件，调用`hello`模块的`greet`函数：

```javascript
'use strict';

// 引入hello模块:
const greet = require('./hello');

let s = 'Michael';

greet(s); // Hello, Michael!
```

注意到引入`hello`模块用Node提供的`require`函数：

```javascript
const greet = require('./hello');
```

引入的模块作为变量保存在`greet`变量中，那`greet`变量到底是什么东西？其实变量`greet`就是在`hello.js`中我们用`module.exports = greet;`输出的`greet`函数。所以，`main.js`就成功地引用了`hello.js`模块中定义的`greet()`函数，接下来就可以直接使用它了。

在使用`require()`引入模块的时候，请注意模块的相对路径。因为`main.js`和`hello.js`位于同一个目录，所以我们用了当前目录`.`：

```javascript
const greet = require('./hello'); // 不要忘了写相对目录!
```

如果只写模块名：

```javascript
const greet = require('hello');
```

则Node会依次在内置模块、全局模块和当前模块下查找`hello.js`，你很可能会得到一个错误：

```javascript
module.js
    throw err;
          ^
Error: Cannot find module 'hello'
    at Module._resolveFilename
    ...
```

遇到这个错误，你要检查：

- 模块名是否写对了；
- 模块文件是否存在；
- 相对路径是否写对了。

### CommonJS规范

这种模块加载机制被称为CommonJS规范。在这个规范下，每个`.js`文件都是一个模块，它们内部各自使用的变量名和函数名都互不冲突，例如，`hello.js`和`main.js`都申明了全局变量`var s = 'xxx'`，但互不影响。

一个模块想要对外暴露变量（函数也是变量），可以用`module.exports = variable;`，一个模块要引用其他模块暴露的变量，用`var ref = require('module_name');`就拿到了引用模块的变量。

### 结论

要在模块中对外输出变量，用：

```javascript
module.exports = variable;
```

输出的变量可以是任意对象、函数、数组等等。

要引入其他模块输出的对象，用：

```javascript
const foo = require('other_module');
```

引入的对象具体是什么，取决于引入模块输出的对象。

### 深入了解模块原理

如果你想详细地了解CommonJS的模块实现原理，请继续往下阅读。如果不想了解，请直接跳到最后做练习。

当我们编写JavaScript代码时，我们可以申明全局变量：

```javascript
let s = 'global';
```

在浏览器中，大量使用全局变量可不好。如果你在`a.js`中使用了全局变量`s`，那么，在`b.js`中也使用全局变量`s`，将造成冲突，`b.js`中对`s`赋值会改变`a.js`的运行逻辑。

也就是说，在ESM标准之前，JavaScript语言本身并没有一种模块机制来保证不同模块可以使用相同的变量名。

那Node.js是如何实现这一点的？

其实要实现“模块”这个功能，并不需要语法层面的支持。Node.js也并不会增加任何JavaScript语法。实现“模块”功能的奥妙就在于JavaScript是一种函数式编程语言，它支持闭包。如果我们把一段JavaScript代码用一个函数包装起来，这段代码的所有“全局”变量就变成了函数内部的局部变量。

请注意我们编写的`hello.js`代码是这样的：

```javascript
let s = 'Hello';
let name = 'world';

console.log(s + ' ' + name + '!');
```

Node.js加载了`hello.js`后，它可以把代码包装一下，变成这样执行：

```javascript
(function () {
    // 读取的hello.js代码:
    let s = 'Hello';
    let name = 'world';

    console.log(s + ' ' + name + '!');
    // hello.js代码结束
})();
```

这样一来，原来的全局变量`s`现在变成了匿名函数内部的局部变量。如果Node.js继续加载其他模块，这些模块中定义的“全局”变量`s`也互不干扰。

所以，Node利用JavaScript的函数式编程的特性，轻而易举地实现了模块的隔离。

但是，模块的输出`module.exports`怎么实现？

这个也很容易实现，Node可以先准备一个对象`module`：

```javascript
// 准备module对象:
let module = {
    id: 'hello',
    exports: {}
};
let load = function (module) {
    // 读取的hello.js代码:
    function greet(name) {
        console.log('Hello, ' + name + '!');
    }
    
    module.exports = greet;
    // hello.js代码结束
    return module.exports;
};
let exported = load(module);
// 保存module:
save(module, exported);
```

可见，变量`module`是Node在加载js文件前准备的一个变量，并将其传入加载函数，我们在`hello.js`中可以直接使用变量`module`原因就在于它实际上是函数的一个参数：

```javascript
module.exports = greet;
```

通过把参数`module`传递给`load()`函数，`hello.js`就顺利地把一个变量传递给了Node执行环境，Node会把`module`变量保存到某个地方。

由于Node保存了所有导入的`module`，当我们用`require()`获取module时，Node找到对应的`module`，把这个`module`的`exports`变量返回，这样，另一个模块就顺利拿到了模块的输出：

```javascript
const greet = require('./hello');
```

以上是Node实现JavaScript模块的一个简单的原理介绍。

### module.exports vs exports

很多时候，你会看到，在Node环境中，有两种方法可以在一个模块中输出变量：

方法一：对module.exports赋值：

```javascript
// hello.js

function hello() {
    console.log('Hello, world!');
}

function greet(name) {
    console.log('Hello, ' + name + '!');
}

module.exports = {
    hello: hello,
    greet: greet
};
```

方法二：直接使用exports：

```javascript
// hello.js

function hello() {
    console.log('Hello, world!');
}

function greet(name) {
    console.log('Hello, ' + name + '!');
}

function hello() {
    console.log('Hello, world!');
}

exports.hello = hello;
exports.greet = greet;
```

但是你不可以直接对`exports`赋值：

```javascript
// 代码可以执行，但是模块并没有输出任何变量:
exports = {
    hello: hello,
    greet: greet
};
```

如果你对上面的写法感到十分困惑，不要着急，我们来分析Node的加载机制：

首先，Node会把整个待加载的`hello.js`文件放入一个包装函数`load`中执行。在执行这个`load()`函数前，Node准备好了module变量：

```javascript
let module = {
    id: 'hello',
    exports: {}
};
```

`load()`函数最终返回`module.exports`：

```javascript
let load = function (exports, module) {
    // hello.js的文件内容
    ...
    // load函数返回:
    return module.exports;
};

let exported = load(module.exports, module);
```

也就是说，默认情况下，Node准备的`exports`变量和`module.exports`变量实际上是同一个变量，并且初始化为空对象`{}`，于是，我们可以写：

```javascript
exports.foo = function () { return 'foo'; };
exports.bar = function () { return 'bar'; };
```

也可以写：

```javascript
module.exports.foo = function () { return 'foo'; };
module.exports.bar = function () { return 'bar'; };
```

换句话说，Node默认给你准备了一个空对象`{}`，这样你可以直接往里面加东西。

但是，如果我们要输出的是一个函数或数组，那么，只能给`module.exports`赋值：

```javascript
module.exports = function () { return 'foo'; };
```

给`exports`赋值是无效的，因为赋值后，`module.exports`仍然是空对象`{}`。

### 结论

如果要输出一个键值对象`{}`，可以利用`exports`这个已存在的空对象`{}`，并继续在上面添加新的键值；

如果要输出一个函数或数组，必须直接对`module.exports`对象赋值。

所以我们可以得出结论：直接对`module.exports`赋值，可以应对任何情况：

```javascript
module.exports = {
    foo: function () { return 'foo'; }
};
```

或者：

```javascript
module.exports = function () { return 'foo'; };
```

最终，我们*强烈建议*使用`module.exports = xxx`的方式来输出模块变量，这样，你只需要记忆一种方法。

### 练习

编写`hello.js`，输出一个或多个函数；

编写`main.js`，引入`hello`模块，调用其函数。

### 参考源码

[module](hello.zip)
