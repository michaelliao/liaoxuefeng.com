# 简介

![cover](makefile.jpg)

Linux的`make`程序用来自动化编译大型源码，很多时候，我们在Linux下编译安装软件，只需要敲一个`make`就可以全自动完成，非常方便。

`make`能自动化完成这些工作，是因为项目提供了一个`Makefile`文件，它负责告诉`make`，应该如何编译和链接程序。

`Makefile`相当于Java项目的`pom.xml`，Node工程的`package.json`，Rust项目的`Cargo.toml`，不同之处在于，`make`虽然最初是针对C语言开发，但它实际上并不限定C语言，而是可以应用到任意项目，甚至不是编程语言。此外，`make`主要用于Unix/Linux环境的自动化开发，掌握`Makefile`的写法，可以更好地在Linux环境下做开发，也可以为后续开发Linux内核做好准备。

在本教程中，我们将由浅入深，一步一步学习如何编写`Makefile`，完全针对零基础小白，只需要提前掌握如何使用Linux命令。
