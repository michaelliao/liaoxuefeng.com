# 第一个Node程序

在前面的所有章节中，我们编写的JavaScript代码都是在浏览器中运行的，因此，我们可以直接在浏览器中敲代码，然后直接运行。

从本章开始，我们编写的JavaScript代码将*不能*在浏览器环境中执行了，而是在Node环境中执行，因此，JavaScript代码将直接在你的计算机上以命令行的方式运行，所以，我们要先选择一个文本编辑器来编写JavaScript代码，并且把它保存到本地硬盘的某个目录，才能够执行。

那么问题来了：文本编辑器到底哪家强？

首先，请注意，**绝对不能用Word和写字板**。Word和写字板保存的不是纯文本文件。如果我们要用记事本来编写JavaScript代码，要务必注意，记事本以UTF-8格式保存文件时，会自作聪明地在文件开始的地方加上几个特殊字符（UTF-8 BOM），结果经常会导致程序运行出现莫名其妙的错误。

所以，用记事本写代码时请注意，保存文件时使用ANSI编码，并且暂时不要输入中文。

如果你的电脑上已经安装了[Visual Studio Code](https://code.visualstudio.com/)，也可以用来编写JavaScript代码，注意用UTF-8格式保存。

输入以下代码：

```javascript
'use strict';
console.log('Hello, world.');
```

第一行总是写上`'use strict';`是因为我们总是以严格模式运行JavaScript代码，避免各种潜在陷阱。

然后，选择一个目录，例如`C:\Workspace`，把文件保存为`hello.js`，就可以打开命令行窗口，把当前目录切换到`hello.js`所在目录，然后输入以下命令运行这个程序了：

```plain
C:\Workspace> node hello.js
Hello, world.
```

也可以保存为别的名字，比如`first.js`，但是必须要以`.js`结尾。此外，文件名只能是英文字母、数字和下划线的组合。

如果当前目录下没有`hello.js`这个文件，运行`node hello.js`就会报错：

```
C:\Workspace> node hello.js
node:internal/modules/cjs/loader:1227
    throw err;
          ^
Error: Cannot find module 'C:\Workspace\hello.js'
    at Module._resolveFilename
    ...
```

报错的意思就是，没有找到`hello.js`这个文件，因为文件不存在。这个时候，就要检查一下当前目录下是否有这个文件了。

### 命令行模式和Node交互模式

请注意区分命令行模式和Node交互模式。

看到类似`PS C:\>`是在Windows提供的命令行模式：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> node hello.js                   │
│Hello, world.                                            │
│                                                         │
│PS C:\Users\liaoxuefeng>                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

在命令行模式下，可以执行`node`进入Node交互式环境，也可以执行`node hello.js`运行一个`.js`文件。

看到`>`是在Node交互式环境下：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> node                            │
│Welcome to Node.js v22.x.x.                              │
│>                                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

在Node交互式环境下，我们可以输入JavaScript代码并立刻执行。

此外，在命令行模式运行`.js`文件和在Node交互式环境下直接运行JavaScript代码有所不同。Node交互式环境会把每一行JavaScript代码的结果自动打印出来，但是，直接运行JavaScript文件却不会。

例如，在Node交互式环境下，输入：

```plain
> 100 + 200 + 300;
600
```

直接可以看到结果`600`。

但是，写一个`calc.js`的文件，内容如下：

```javascript
100 + 200 + 300;
```

然后在命令行模式下执行：

```plain
C:\Workspace> node calc.js
```

发现什么输出都没有。

这是正常的。想要输出结果，必须自己用`console.log()`打印出来。把`calc.js`改造一下：

```javascript
console.log(100 + 200 + 300);
```

再执行，就可以看到结果：

```plain
C:\Workspace> node calc.js
600
```

### 小结

用文本编辑器写JavaScript程序，然后保存为后缀为`.js`的文件，就可以用node直接运行这个程序了。

Node的交互模式和直接运行`.js`文件有什么区别呢？

直接输入`node`进入交互模式，相当于启动了Node解释器，但是等待你一行一行地输入源代码，每输入一行就执行一行。

直接运行`node hello.js`文件相当于启动了Node解释器，然后一次性把`hello.js`文件的源代码给执行了，你是没有机会以交互的方式输入源代码的。

在编写JavaScript代码的时候，完全可以一边在文本编辑器里写代码，一边开一个Node交互式命令窗口，在写代码的过程中，把部分代码粘到命令行去验证，事半功倍！前提是得有个27'的超大显示器！

### 参考源码

[hello.js](hello.js)

[calc.js](calc.js)
