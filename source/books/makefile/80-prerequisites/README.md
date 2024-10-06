# 自动生成依赖

前面我们讲了隐式规则和模式规则，这两种规则都可以解决自动把`.c`文件编译成`.o`文件，但都无法解决`.c`文件依赖`.h`文件的问题。

因为一个`.c`文件依赖哪个`.h`文件必须要分析文件内容才能确定，没有一个简单的文件名映射规则。

但是，要识别出`.c`文件的头文件依赖，可以用GCC提供的`-MM`参数：

```plain
$ cc -MM main.c
main.o: main.c hello.h
```

上述输出告诉我们，编译`main.o`依赖`main.c`和`hello.h`两个文件。

因此，我们可以利用GCC的这个功能，对每个`.c`文件都生成一个依赖项，通常我们把它保存到`.d`文件中，再用`include`引入到`Makefile`，就相当于自动化完成了每个`.c`文件的精准依赖。

我们改写上一节的`Makefile`如下：

```makefile
# 列出所有 .c 文件:
SRCS = $(wildcard *.c)

# 根据SRCS生成 .o 文件列表:
OBJS = $(SRCS:.c=.o)

# 根据SRCS生成 .d 文件列表:
DEPS = $(SRCS:.c=.d)

TARGET = world.out

# 默认目标:
$(TARGET): $(OBJS)
	$(CC) -o $@ $^

# xyz.d 的规则由 xyz.c 生成:
%.d: %.c
	rm -f $@; \
	$(CC) -MM $< >$@.tmp; \
	sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.tmp > $@; \
	rm -f $@.tmp

# 模式规则:
%.o: %.c
	$(CC) -c -o $@ $<

clean:
	rm -rf *.o *.d $(TARGET)

# 引入所有 .d 文件:
include $(DEPS)
```

变量`$(SRCS)`通过扫描目录可以确定为`hello.c main.c`，因此，变量`$(OBJS)`赋值为`hello.o main.o`，变量`$(DEPS)`赋值为`hello.d main.d`。

通过`include $(DEPS)`我们引入`hello.d`和`main.d`文件，但是这两个文件一开始并不存在，不过，`make`通过模式规则匹配到`%.d: %.c`，这就给了我们一个机会，在这个模式规则内部，用`cc -MM`命令外加`sed`把`.d`文件创建出来。

运行`make`，首次输出如下：

```plain
$ make
Makefile:31: hello.d: No such file or directory
Makefile:31: main.d: No such file or directory
rm -f main.d; \
        cc -MM main.c >main.d.tmp; \
        sed 's,\(main\)\.o[ :]*,\1.o main.d : ,g' < main.d.tmp > main.d; \
        rm -f main.d.tmp
rm -f hello.d; \
        cc -MM hello.c >hello.d.tmp; \
        sed 's,\(hello\)\.o[ :]*,\1.o hello.d : ,g' < hello.d.tmp > hello.d; \
        rm -f hello.d.tmp
cc -c -o hello.o hello.c
cc -c -o main.o main.c
cc -o world.out hello.o main.o
```

`make`会提示找不到`hello.d`和`main.d`，不过随后自动创建出`hello.d`和`main.d`。`hello.d`内容如下：

```makefile
hello.o hello.d : hello.c
```

上述规则有两个目标文件，实际上相当于如下两条规则：

```makefile
hello.o : hello.c
hello.d : hello.c
```

`main.d`内容如下：

```makefile
main.o main.d : main.c hello.h
```

因此，`main.o`依赖于`main.c`和`hello.h`，这个依赖关系就和我们手动指定的一致。

改动`hello.h`，再次运行`make`，可以触发`main.c`的编译：

```plain
$ make
rm -f main.d; \
        cc -MM main.c >main.d.tmp; \
        sed 's,\(main\)\.o[ :]*,\1.o main.d : ,g' < main.d.tmp > main.d; \
        rm -f main.d.tmp
cc -c -o main.o main.c
cc -o world.out hello.o main.o
```

在实际项目中，对每个`.c`文件都可以生成一个对应的`.d`文件表示依赖关系，再通过`include`引入到`Makefile`，同时又能让`make`自动更新`.d`文件，有点蛋生鸡和鸡生蛋的关系，不过，这种机制能正常工作，除了`.d`文件不存在时会打印错误，有强迫症的同学肯定感觉不满意，这个问题我们后面解决。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/makefile-tutorial/tree/main/v6)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/makefile-tutorial/tree/main/v6">GitHub</a>

### 小结

利用GCC生成`.d`文件，再用`include`引入`Makefile`，可解决一个`.c`文件应该如何正确触发编译的问题。

查看官方手册：

- [自动生成依赖](https://www.gnu.org/software/make/manual/html_node/Automatic-Prerequisites.html)
