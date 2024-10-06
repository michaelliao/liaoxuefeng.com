# 使用变量

当我们在`Makefile`中重复写很多文件名时，一来容易写错，二来如果要改名，要全部替换，费时费力。

编程语言使用变量（Variable）来解决反复引用的问题，类似的，在`Makefile`中，也可以使用变量来解决重复问题。

以上一节的`Makefile`为例：

```makefile
world.out: hello.o main.o
	cc -o world.out hello.o main.o

clean:
	rm -f *.o world.out
```

编译的最终文件`world.out`重复出现了3次，因此，完全可以定义一个变量来替换它：

```makefile
TARGET = world.out

$(TARGET): hello.o main.o
	cc -o $(TARGET) hello.o main.o

clean:
	rm -f *.o $(TARGET)
```

变量定义用`变量名 = 值`或者`变量名 := 值`，通常变量名全大写。引用变量用`$(变量名)`，非常简单。

注意到`hello.o main.o`这个“列表”也重复了，我们也可以用变量来替换：

```makefile
OBJS = hello.o main.o
TARGET = world.out

$(TARGET): $(OBJS)
	cc -o $(TARGET) $(OBJS)

clean:
	rm -f *.o $(TARGET)
```

如果有一种方式能让`make`自动生成`hello.o main.o`这个“列表”，就更好了。注意到每个`.o`文件是由对应的`.c`文件编译产生的，因此，可以让`make`先获取`.c`文件列表，再替换，得到`.o`文件列表：

```makefile
# $(wildcard *.c) 列出当前目录下的所有 .c 文件: hello.c main.c
# 用函数 patsubst 进行模式替换得到: hello.o main.o
OBJS = $(patsubst %.c,%.o,$(wildcard *.c))
TARGET = world.out

$(TARGET): $(OBJS)
	cc -o $(TARGET) $(OBJS)

clean:
	rm -f *.o $(TARGET)
```

这样，我们每添加一个`.c`文件，不需要修改`Makefile`，变量`OBJS`会自动更新。

思考：为什么我们不能直接定义`OBJS = $(wildcard *.o)`让`make`列出所有`.o`文件？

### 内置变量

我们还可以用变量`$(CC)`替换命令`cc`：

```makefile
$(TARGET): $(OBJS)
	$(CC) -o $(TARGET) $(OBJS)
```

没有定义变量`CC`也可以引用它，因为它是`make`的内置变量（Builtin Variables），表示C编译器的名字，默认值是`cc`，我们也可以修改它，例如使用交叉编译时，指定编译器：

```makefile
CC = riscv64-linux-gnu-gcc
...
```

### 自动变量

在`Makefile`中，经常可以看到`$@`、`$<`这样的变量，这种变量称为自动变量（Automatic Variable），它们在一个规则中自动指向某个值。

例如，`$@`表示目标文件，`$^`表示所有依赖文件，因此，我们可以这么写：

```makefile
world.out: hello.o main.o
	cc -o $@ $^
```

在没有歧义时可以写`$@`，也可以写`$(@)`，有歧义时必须用括号，例如`$(@D)`。

为了更好地调试，我们还可以把变量打印出来：

```makefile
world.out: hello.o main.o
	@echo '$$@ = $@' # 变量 $@ 表示target
	@echo '$$< = $<' # 变量 $< 表示第一个依赖项
	@echo '$$^ = $^' # 变量 $^ 表示所有依赖项
	cc -o $@ $^
```

执行结果输出如下：

```plain
$@ = world.out
$< = hello.o
$^ = hello.o main.o
cc -o world.out hello.o main.o
```

### 参考源码

可以从[GitHub](https://github.com/michaelliao/makefile-tutorial/tree/main/v4)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/makefile-tutorial/tree/main/v4">GitHub</a>

### 小结

使用变量可以让`Makefile`更加容易维护。

查看官方手册：

- [如何使用变量](https://www.gnu.org/software/make/manual/html_node/Using-Variables.html)
- [自动变量](https://www.gnu.org/software/make/manual/html_node/Automatic-Variables.html)
