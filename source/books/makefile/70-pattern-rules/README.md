# 使用模式规则

前面我们讲了使用隐式规则可以让`make`在必要时自动创建`.o`文件的规则，但`make`的隐式规则的命令是固定的，对于`xyz.o: xyz.c`，它实际上是：

```makefile
	$(CC) $(CFLAGS) -c -o $@ $<
```

能修改的只有变量`$(CC)`和`$(CFLAGS)`。如果要执行多条命令，使用隐式规则就不行了。

这时，我们可以自定义模式规则（Pattern Rules），它允许`make`匹配模式规则，如果匹配上了，就自动创建一条模式规则。

我们修改上一节的`Makefile`如下：

```makefile
OBJS = $(patsubst %.c,%.o,$(wildcard *.c))
TARGET = world.out

$(TARGET): $(OBJS)
	cc -o $(TARGET) $(OBJS)

# 模式匹配规则：当make需要目标 xyz.o 时，自动生成一条 xyz.o: xyz.c 规则:
%.o: %.c
	@echo 'compiling $<...'
	cc -c -o $@ $<

clean:
	rm -f *.o $(TARGET)
```

当`make`执行`world.out: hello.o main.o`时，发现没有`hello.o`文件，于是需要查找以`hello.o`为目标的规则，结果匹配到模式规则`%.o: %.c`，于是`make`自动根据模式规则为我们动态创建了如下规则：

```makefile
hello.o: hello.c
	@echo 'compiling $<...'
	cc -c -o $@ $<
```

查找`main.o`也是类似的匹配过程，于是我们执行`make`，就可以用模式规则完成编译：

```plain
$ make
compiling hello.c...
cc -c -o hello.o hello.c
compiling main.c...
cc -c -o main.o main.c
cc -o world.out hello.o main.o
```

模式规则的命令完全由我们自己定义，因此，它比隐式规则更灵活。

但是，模式规则仍然没有解决修改`hello.h`头文件不会触发`main.c`重新编译的问题，这个依赖问题我们继续放到后面解决。

最后注意，模式规则是按需生成，如果我们在当前目录创建一个`zzz.o`文件，因为`make`并不会在执行过程中用到它，所以并不会自动生成`zzz.o: zzz.c`这个规则。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/makefile-tutorial/tree/main/v5)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/makefile-tutorial/tree/main/v5">GitHub</a>

### 小结

使用模式规则可以灵活地按需动态创建规则，它比隐式规则更灵活。

查看官方手册：

- [模式规则](https://www.gnu.org/software/make/manual/html_node/Pattern-Intro.html)
