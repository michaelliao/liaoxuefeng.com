# venv

在开发Python应用程序的时候，系统安装的Python3只有一个版本：3.x。所有第三方的包都会被`pip`安装到Python3的`site-packages`目录下。

如果我们要同时开发多个应用程序，那这些应用程序都会共用一个Python，就是安装在系统的Python 3。如果应用A需要jinja 2.7，而应用B需要jinja 2.6怎么办？

这种情况下，每个应用可能需要各自拥有一套“独立”的Python运行环境。`venv`就是用来为一个应用创建一套“隔离”的Python运行环境。

首先，我们假定要开发一个新的项目`project101`，需要一套独立的Python运行环境，可以这么做：

第一步，创建目录，这里把Python虚拟运行环境命名为`proj101env`，因此目录名为`proj101env`：

```plain
$ mkdir proj101env
$ cd proj101env/
proj101env$
```

第二步，创建一个独立的Python运行环境：

```plain
proj101env$ python3 -m venv .
```

查看当前目录，可以发现有几个文件夹和一个`pyvenv.cfg`文件：

```plain
proj101env$ ls
bin  include  lib  pyvenv.cfg
```

命令`python3 -m venv <目录>`就可以创建一个独立的Python运行环境。观察`bin`目录的内容，里面有`python3`、`pip3`等可执行文件，实际上是链接到Python系统目录的软链接。

继续进入`bin`目录，Linux/Mac用`source activate`，Windows用`activate.bat`激活该venv环境：

```plain
proj101env$ cd bin
bin$ source activate
(proj101env) bin$
```

注意到命令提示符变了，有个`(proj101env)`前缀，表示当前环境是一个名为`proj101env`的Python环境。

下面正常安装各种第三方包，并运行`python`命令：

```plain
(proj101env) bin$ pip3 install jinja2
...
Successfully installed jinja2-xxx

(proj101env) bin$ python3
>>> import jinja2
>>> exit()
```

在`venv`环境下，用`pip`安装的包都被安装到`proj101env`这个环境下，具体目录是`proj101env/lib/python3.x/site-packages`，因此，系统Python环境不受任何影响。也就是说，`proj101env`环境是专门针对`project101`这个应用创建的。

退出当前的`proj101env`环境，使用`deactivate`命令：

```plain
(proj101env) bin$ deactivate
bin$
```

此时就回到了正常的环境，现在`pip`或`python`均是在系统Python环境下执行。

完全可以针对每个应用创建独立的Python运行环境，这样就可以对每个应用的Python环境进行隔离。

`venv`是如何创建“独立”的Python运行环境的呢？原理很简单，就是把系统Python链接或复制一份到`venv`的环境，用命令`source activate`进入一个`venv`环境时，`venv`会修改相关环境变量，让命令`python`和`pip`均指向当前的`venv`环境。

如果不再使用某个`venv`，例如`proj101env`，删除它也很简单。首先确认该`venv`没有处于“激活”状态，然后直接把整个目录`proj101env`删掉就行。

### 小结

`venv`为应用提供了隔离的Python运行环境，解决了不同应用间安装多版本的冲突问题。
