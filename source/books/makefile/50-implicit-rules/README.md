# 使用隐式规则

我们仍然以上一节的C项目为例，当我们添加越来越多的`.c`文件时，就需要编写越来越多的规则来生成`.o`文件。

实际上，有的同学可能发现了，即使我们把`.o`的规则删掉，也能正常编译：

```makefile
# 只保留生成 world.out 的规则:
world.out: hello.o main.o
	cc -o world.out hello.o main.o

clean:
	rm -f *.o world.out
```

执行`make`，输出如下：

```plain
$ make
cc    -c -o hello.o hello.c
cc    -c -o main.o main.c
cc -o world.out hello.o main.o
```

我们没有定义`hello.o`和`main.o`的规则，为什么`make`也能正常创建这两个文件？

因为`make`最初就是为了编译C程序而设计的，为了免去重复创建编译`.o`文件的规则，`make`内置了隐式规则（Implicit Rule），即遇到一个`xyz.o`时，如果没有找到对应的规则，就自动应用一个隐式规则：

```makefile
xyz.o: xyz.c
	cc -c -o xyz.o xyz.c
```

`make`针对C、C++、ASM、Fortran等程序内置了一系列隐式规则，可以参考官方手册查看。

对于C程序来说，使用隐式规则有一个潜在问题，那就是无法跟踪`.h`文件的修改。如果我们修改了`hello.h`的定义，由于隐式规则`main.o: main.c`并不会跟踪`hello.h`的修改，导致`main.c`不会被重新编译，这个问题我们放到后面解决。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/makefile-tutorial/tree/main/v3)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/makefile-tutorial/tree/main/v3">GitHub</a>

### 小结

针对C、C++、ASM、Fortran等程序，`make`内置了一系列隐式规则，使用隐式规则可减少大量重复的通用编译规则。

查看官方手册：

- [使用隐式规则](https://www.gnu.org/software/make/manual/html_node/Using-Implicit.html)
