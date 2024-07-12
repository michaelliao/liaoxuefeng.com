# FAQ

本节列出常见的一些问题。

### 如何获取当前路径

当前路径可以用`'.'`表示，再用`os.path.abspath()`将其转换为绝对路径：

```python
# -*- coding:utf-8 -*-
# test.py

import os

print(os.path.abspath('.'))
```

运行结果：

```plain
$ python3 test.py 
/Users/michael/workspace/testing
```

### 如何获取当前模块的文件名

可以通过特殊变量`__file__`获取：

```python
# -*- coding:utf-8 -*-
# test.py

print(__file__)
```

输出：

```plain
$ python3 test.py
test.py
```

### 如何获取命令行参数

可以通过`sys`模块的`argv`获取：

```python
# -*- coding:utf-8 -*-
# test.py

import sys

print(sys.argv)
```

输出：

```plain
$ python3 test.py -a -s "Hello world"
['test.py', '-a', '-s', 'Hello world']
```

`argv`的第一个元素永远是命令行执行的`.py`文件名。

### 如何获取当前Python命令的可执行文件路径

`sys`模块的`executable`变量就是Python命令可执行文件的路径：

```python
# -*- coding:utf-8 -*-
# test.py

import sys

print(sys.executable)
```

在Mac下的结果：

```plain
$ python3 test.py 
/usr/local/opt/python3/bin/python3.12
```
