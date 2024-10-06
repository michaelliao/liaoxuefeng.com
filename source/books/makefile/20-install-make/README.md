# 安装make

安装`make`时，因为`make`只能在Unix/Linux下运行，所以，如果使用Windows系统，我们要先想办法在Windows下跑一个Linux。

方法一：安装[VirtualBox](https://www.virtualbox.org/)，然后下载Linux发行版安装盘，推荐[Ubuntu 22.04](https://releases.ubuntu.com/jammy/)，这样就可以在虚拟机中运行Linux。

方法二：对于Windows 10/11，可以首先安装WSL（Windows Subsystem for Linux）：

![Install WSL](install-wsl.png)

然后，在Windows应用商店，搜索Ubuntu 22.04，直接安装后运行，Windows会弹出PowerShell的窗口连接到Linux，在PowerShell中即可输入Linux命令，和SSH连接类似。

以Ubuntu为例，在Linux命令行下，用`apt`命令安装`make`以及GCC工具链：

```plain
$ sudo apt install build-essential
```

对于macOS系统，因为它的内核是BSD（一种Unix），所以也能直接跑`make`，推荐安装Homebrew，然后通过Homebrew安装`make`以及GCC工具链：

```plain
$ brew install make gcc
```

安装完成后，可以输入`make -v`验证：

```plain
$ make -v
GNU Make 4.3
...
```

输入`gcc --version`验证GCC工具链：

```plain
$ gcc --version
gcc (Ubuntu ...) 11.4.0
...
```

这样，我们就成功地安装了`make`，以及GCC工具链。
