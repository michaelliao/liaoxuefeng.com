# 完善Makefile

上一节我们解决了自动生成依赖的问题，这一节我们对项目目录进行整理，把所有源码放入`src`目录，所有编译生成的文件放入`build`目录：

```ascii
<project>
├── Makefile
├── build
└── src
    ├── hello.c
    ├── hello.h
    └── main.c
```

整理`Makefile`，内容如下：

```makefile
SRC_DIR = ./src
BUILD_DIR = ./build
TARGET = $(BUILD_DIR)/world.out

CC = cc
CFLAGS = -Wall

# ./src/*.c
SRCS = $(shell find $(SRC_DIR) -name '*.c')
# ./src/*.c => ./build/*.o
OBJS = $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.o,$(SRCS))
# ./src/*.c => ./build/*.d
DEPS = $(patsubst $(SRC_DIR)/%.c,$(BUILD_DIR)/%.d,$(SRCS))

# 默认目标:
all: $(TARGET)

# build/xyz.d 的规则由 src/xyz.c 生成:
$(BUILD_DIR)/%.d: $(SRC_DIR)/%.c
	@mkdir -p $(dir $@); \
	rm -f $@; \
	$(CC) -MM $< >$@.tmp; \
	sed 's,\($*\)\.o[ :]*,$(BUILD_DIR)/\1.o $@ : ,g' < $@.tmp > $@; \
	rm -f $@.tmp

# build/xyz.o 的规则由 src/xyz.c 生成:
$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c -o $@ $<

# 链接:
$(TARGET): $(OBJS)
	@echo "buiding $@..."
	@mkdir -p $(dir $@)
	$(CC) -o $(TARGET) $(OBJS)

# 清理 build 目录:
clean:
	@echo "clean..."
	rm -rf $(BUILD_DIR)

# 引入所有 .d 文件:
-include $(DEPS)
```

这个`Makefile`定义了源码目录`SRC_DIR`、生成目录`BUILD_DIR`，以及其他变量，同时用`-include`消除了`.d`文件不存在的错误。执行`make`，输出如下：

```plain
$ make
cc -Wall -c -o build/hello.o src/hello.c
cc -Wall -c -o build/main.o src/main.c
buiding build/world.out...
cc -o ./build/world.out ./build/hello.o ./build/main.o
```

可以说基本满足编译需求，收工！

### 参考源码

可以从[GitHub](https://github.com/michaelliao/makefile-tutorial/tree/main/v7)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/makefile-tutorial/tree/main/v7">GitHub</a>

### 小结

除了基础的用法外，`Makefile`还支持条件判断，环境变量，嵌套执行，变量展开等各种功能，需要用到时可以查询[官方手册](https://www.gnu.org/software/make/manual/html_node/index.html)。
