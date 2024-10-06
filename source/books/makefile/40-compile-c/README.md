# 编译C程序

C程序的编译通常分两步：

1. 将每个`.c`文件编译为`.o`文件；
2. 将所有`.o`文件链接为最终的可执行文件。

我们假设如下的一个C项目，包含`hello.c`、`hello.h`和`main.c`。

`hello.c`内容如下：

```c
#include <stdio.h>

int hello()
{
    printf("hello, world!\n");
    return 0;
}
```

`hello.h`内容如下：

```c
int hello();
```

`main.c`内容如下：

```c
#include <stdio.h>
#include "hello.h"

int main()
{
    printf("start...\n");
    hello();
    printf("exit.\n");
    return 0;
}
```

注意到`main.c`引用了头文件`hello.h`。我们很容易梳理出需要生成的文件，逻辑如下：

```ascii
┌───────┐ ┌───────┐ ┌───────┐
│hello.c│ │main.c │ │hello.h│
└───────┘ └───────┘ └───────┘
    │         │         │
    │         └────┬────┘
    │              │
    ▼              ▼
┌───────┐      ┌───────┐
│hello.o│      │main.o │
└───────┘      └───────┘
    │              │
    └───────┬──────┘
            │
            ▼
       ┌─────────┐
       │world.out│
       └─────────┘
```

假定最终生成的可执行文件是`world.out`，中间步骤还需要生成`hello.o`和`main.o`两个文件。根据上述依赖关系，我们可以很容易地写出`Makefile`如下：

```makefile
# 生成可执行文件:
world.out: hello.o main.o
	cc -o world.out hello.o main.o

# 编译 hello.c:
hello.o: hello.c
	cc -c hello.c

# 编译 main.c:
main.o: main.c hello.h
	cc -c main.c

clean:
	rm -f *.o world.out
```

执行`make`，输出如下：

```plain
$ make
cc -c hello.c
cc -c main.c
cc -o world.out hello.o main.o
```

在当前目录下可以看到`hello.o`、`main.o`以及最终的可执行程序`world.out`。执行`world.out`：

```plain
$ ./world.out 
start...
hello, world!
exit.
```

与我们预期相符。

修改`hello.c`，把输出改为`"hello, bob!\n"`，再执行`make`，观察输出：

```plain
$ make
cc -c hello.c
cc -o world.out hello.o main.o
```

仅重新编译了`hello.c`，并未编译`main.c`。由于`hello.o`已更新，所以，仍然要重新生成`world.out`。执行`world.out`：

```plain
$ ./world.out 
start...
hello, bob!
exit.
```

与我们预期相符。

修改`hello.h`：

```c
// int 变为 void:
void hello();
```

以及`hello.c`，再次执行`make`：

```plain
$ make
cc -c hello.c
cc -c main.c
cc -o world.out hello.o main.o
```

会触发`main.c`的编译，因为`main.c`依赖`hello.h`。

执行`make clean`会删除所有的`.o`文件，以及可执行文件`world.out`，再次执行`make`就会强制全量编译：

```plain
$ make clean && make
rm -f *.o world.out
cc -c hello.c
cc -c main.c
cc -o world.out hello.o main.o
```

这个简单的`Makefile`使我们能自动化编译C程序，十分方便。

不过，随着越来越多的`.c`文件被添加进来，如何高效维护`Makefile`的规则？我们后面继续讲解。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/makefile-tutorial/tree/main/v2)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/makefile-tutorial/tree/main/v2">GitHub</a>

### 小结

在`Makefile`正确定义规则后，我们就能用`make`自动化编译C程序。
