# 安装Python

因为Python是跨平台的，它可以运行在Windows、Mac和各种Linux/Unix系统上。在Windows上写Python程序，放到Linux上也是能够运行的。

要开始学习Python编程，首先就得把Python安装到你的电脑里。安装后，你会得到Python解释器（就是负责运行Python程序的），一个命令行交互环境，还有一个简单的集成开发环境。

### 安装Python 3

目前，Python有两个版本，一个是2.x版，一个是3.x版，这两个版本是不兼容的。由于3.x版越来越普及，我们的教程将以最新的Python 3.x版本为基础。请确保你的电脑上安装的Python版本是最新的3.x，这样，你才能无痛学习这个教程。

### 在Windows上安装Python

在Windows上安装Python，有两种方法。

方法一，可以直接从Python的官方网站下载Python 3对应的[Windows安装程序](https://www.python.org/downloads/windows/)，推荐下载`Windows installer (64-bit)`，然后，运行下载的`python-3.x-amd64.exe`安装包：

![install-py3](win-version.png)

特别要注意勾上`Add Python 3.x to PATH`，然后点“Install Now”即可完成安装。

方法二，先安装一个包管理器，推荐[Scoop](https://scoop.sh/)，然后在PowerShell中通过以下命令安装Python：

```plain
C:\> scoop install python
```

### 在macOS上安装Python

如果你正在使用Mac，那么系统自带的Python版本是2.x。要安装最新的Python 3.x，有两个方法：

方法一：从Python官网下载Python 3 macOS版的[安装程序](https://www.python.org/downloads/macos/)，下载后双击运行并安装；

方法二：如果安装了包管理器[Homebrew](https://brew.sh/)，直接通过命令`brew install python3`安装即可。

### 在Linux上安装Python

如果你正在使用Linux，那我可以假定你有Linux系统管理经验，自行安装Python 3应该没有问题，否则，请换回Windows系统。

对于大量的目前仍在使用Windows的同学，如果短期内没有打算换Mac，就可以继续阅读以下内容。

### 运行Python

```alert type=notice title=注意
Python在Linux/macOS的命令是`python3`，在Windows下的命令是`python`，后续请自行根据操作系统选择合适的命令。
```

安装成功后，打开命令行窗口（Windows下打开PowerShell），敲入`python`后，会出现两种情况：

情况一：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> python                          │
│Python 3.13 ...                                          │
│Type "help", "copyright", "credits" or "license" for ... │
│>>> _                                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

看到类似`Python 3.x`的输出，就说明Python安装成功！

看到提示符变为`>>>`就表示我们已经在Python交互式环境中了，可以输入任何Python代码，回车后会立刻得到执行结果。现在，输入`exit()`并回车，就可以退出Python交互式环境（直接关掉命令行窗口也可以）。

情况二：得到一个错误：“无法将“python”项识别为 cmdlet、函数、脚本文件或可运行程序的名称。”：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> python                          │
│python : The term 'python' is not recognized as ...      │
│...                                                      │
│    + FullyQualifiedErrorId : CommandNotFoundException   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

这是因为Windows会根据一个`Path`的环境变量设定的路径去查找`python.exe`，如果没找到，就会报错。如果在安装时漏掉了勾选`Add Python 3.x to PATH`，那就要手动把`python.exe`所在的路径添加到Path中。

如果你不知道怎么修改环境变量，建议把Python安装程序重新运行一遍，务必记得勾上`Add Python 3.x to PATH`。

### 小结

学会如何把Python安装到计算机中，并且熟练打开和退出Python交互式环境；

在Windows上运行Python时，请先启动PowerShell命令行，然后运行`python`；

在macOS和Linux上运行Python时，请打开终端，然后运行`python3`；

退出Python交互式环境，需要在提示符`>>>`下输入`exit()`并回车确认。
