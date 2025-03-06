# 安装JDK

因为Java程序必须运行在JVM之上，所以，我们第一件事情就是安装JDK。

搜索JDK 23，确保从[Oracle的官网](https://www.oracle.com/java/technologies/downloads/)下载最新的稳定版JDK：

```ascii
Java SE Development Kit 23 downloads

Linux  macOS  Windows
              -------

x64 Compressed Archive      Download
x64 Installer               Download
x64 MSI Installer           Download
```

选择合适的操作系统与安装包，找到Java SE 23的下载链接`Download`，下载安装即可。Windows优先选`x64 MSI Installer`，Linux和macOS要根据自己电脑的CPU是ARM还是x86来选择合适的安装包。

### 设置环境变量

安装完JDK后，需要设置一个`JAVA_HOME`的环境变量，它指向JDK的安装目录。在Windows下，它是安装目录，类似：

```plain
C:\Program Files\Java\jdk-23
```

在macOS下，它在`~/.bash_profile`或`~/.zprofile`里，它是：

```plain
export JAVA_HOME=`/usr/libexec/java_home -v 23`
```

然后，把`JAVA_HOME`的`bin`目录附加到系统环境变量`PATH`上。在Windows下，它长这样：

```plain
Path=%JAVA_HOME%\bin;<现有的其他路径>
```

在macOS下，它在`~/.bash_profile`或`~/.zprofile`里，长这样：

```plain
export PATH=$JAVA_HOME/bin:$PATH
```

把`JAVA_HOME`的`bin`目录添加到`PATH`中是为了在任意文件夹下都可以运行`java`。打开PowerShell窗口，输入命令`java -version`，如果一切正常，你会看到如下输出：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> java -version                   │
│java version "23" ...                                    │
│Java(TM) SE Runtime Environment                          │
│Java HotSpot(TM) 64-Bit Server VM                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

如果你看到的版本号不是`23`，而是`15`、`1.8`之类，说明系统存在多个JDK，且默认JDK不是JDK 23，需要把JDK 23提到`PATH`前面。

如果你得到一个错误输出：“无法将“java”项识别为 cmdlet、函数、脚本文件或可运行程序的名称。”：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> java -version                   │
│java : The term 'java' is not recognized as ...          │
│...                                                      │
│    + FullyQualifiedErrorId : CommandNotFoundException   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

这是因为系统无法找到Java虚拟机的程序`java.exe`，需要检查`JAVA_HOME`和`PATH`的配置。

可以参考[如何设置或更改PATH系统变量](https://www.java.com/zh-CN/download/help/path.html)。

### JDK

细心的童鞋还可以在`JAVA_HOME`的`bin`目录下找到很多可执行文件：

- java：这个可执行程序其实就是JVM，运行Java程序，就是启动JVM，然后让JVM执行指定的编译后的代码；
- javac：这是Java的编译器，它用于把Java源码文件（以`.java`后缀结尾）编译为Java字节码文件（以`.class`后缀结尾）；
- jar：用于把一组`.class`文件打包成一个`.jar`文件，便于发布；
- javadoc：用于从Java源码中自动提取注释并生成文档；
- jdb：Java调试器，用于开发阶段的运行调试。
