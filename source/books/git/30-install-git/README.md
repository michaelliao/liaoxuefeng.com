# 安装Git

最早Git是在Linux上开发的，很长一段时间内，Git也只能在Linux和Unix系统上跑。不过，现在Git可以在Linux、Unix、Mac和Windows这几大平台上正常运行了。

要使用Git，第一步当然是安装Git了。根据你当前使用的平台来阅读下面的文字：

### 在Linux上安装Git

首先，你可以试着输入`git`，看看系统有没有安装Git：

```plain
$ git
The program 'git' is currently not installed. You can install it by typing:
sudo apt-get install git
```

像上面的命令，有很多Linux会友好地告诉你Git没有安装，还会告诉你如何安装Git。

如果你碰巧用Debian或Ubuntu Linux，通过一条`sudo apt install git`就可以直接完成Git的安装，非常简单。

如果是其他Linux版本，请参考发行版说明，例如，RedHat Linux可以通过命令`sudo yum install git`安装。没有包管理器的发行版可以自行[下载源码](https://github.com/git/git)编译安装，仅适合老鸟。

### 在macOS上安装Git

如果你正在使用Mac做开发，有两种安装Git的方法。

一是先安装包管理器[Homebrew](https://brew.sh/)，然后通过Homebrew安装Git（推荐）：

```plain
$ brew install git
```

第二种方法更简单，但需要下载一个巨大的XCode。直接从AppStore安装Xcode，Xcode集成了Git，不过默认没有安装，你需要运行Xcode，选择菜单“Xcode”->“Preferences”，在弹出窗口中找到“Downloads”，选择“Command Line Tools”，点“Install”就可以完成安装了。

![install-git-by-xcode](xcode.jpg)

### 在Windows上安装Git

在Windows上使用Git，也有两种安装方法。

第一种是直接从Git官网直接[下载安装程序](https://git-scm.com/downloads/win)，然后按默认选项安装即可。安装完成后，在开始菜单里找到“Git”->“Git Bash”，蹦出一个类似命令行窗口的东西，就说明Git安装成功。

![install-git-on-windows](win.jpg)

第二种是先安装一个包管理器，推荐[Scoop](https://scoop.sh/)，然后在PowerShell中通过以下命令安装Git：

```plain
C:\> scoop install git
```

安装完成后，在PowerShell下运行命令`git -v`显示Git版本，可看到如下输出：

```ascii
┌─────────────────────────────────────────────────────────┐
│Windows PowerShell                                 - □ x │
├─────────────────────────────────────────────────────────┤
│Windows PowerShell                                       │
│Copyright (C) Microsoft Corporation. All rights reserved.│
│                                                         │
│PS C:\Users\liaoxuefeng> git -v                          │
│git version 2.48.1.windows.1                             │
│PS C:\Users\liaoxuefeng>                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

使用包管理器安装Git只需一条命令，且升级非常方便。Debian/Ubuntu Linux的APT、macOS的Homebrew、Windows的Scoop在命令行下的安装、升级、卸载命令都是类似的，例如，升级Git，三种包管理器对应的命令分别是：

- sudo apt update git
- brew update git
- scoop update git

可以说熟悉一种包管理器的用法后，在其他平台也可迅速上手，推荐使用。

### 配置Git

安装好Git后，还需要最后一步设置，在命令行输入：

```plain
$ git config --global user.name "Your Name"
$ git config --global user.email "email@example.com"
```

因为Git是分布式版本控制系统，所以，每个机器都必须自报家门：你的名字和Email地址。你也许会担心，如果有人故意冒充别人怎么办？这个不必担心，首先我们相信大家都是善良无知的群众，其次，真的有冒充的也是有办法可查的。

注意`git config`命令的`--global`参数，用了这个参数，表示你这台机器上所有的Git仓库都会使用这个配置，当然也可以对某个仓库指定不同的用户名和Email地址。

```question type=checkbox
Git可以安装在哪些操作系统上？
----
[x] Linux
[x] macOS
[x] Windows
[x] Raspberry Pi
```
