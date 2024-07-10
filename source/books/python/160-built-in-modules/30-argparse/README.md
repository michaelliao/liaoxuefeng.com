# argparse

在命令行程序中，经常需要获取命令行参数。Python内置的`sys.argv`保存了完整的参数列表，我们可以从中解析出需要的参数：

```python
# copy.py
import sys
print(sys.argv)
source = sys.argv[1]
target = sys.argv[2]
# TODO...
```

运行上述`copy.py`，并传入参数，打印如下：

```plain
['copy.py', 'source.txt', 'copy.txt']
```

这种方式能应付简单的参数，但参数稍微复杂点，比如可以使用`-d`复制目录，使用`--filename *.py`过滤文件名等，解析起来就非常麻烦。

为了简化参数解析，我们可以使用内置的[argparse](https://docs.python.org/3/library/argparse.html)库，定义好各个参数类型后，它能直接返回有效的参数。

假设我们想编写一个备份MySQL数据库的命令行程序，需要输入的参数如下：

- host参数：表示MySQL主机名或IP，不输入则默认为`localhost`；
- port参数：表示MySQL的端口号，int类型，不输入则默认为`3306`；
- user参数：表示登录MySQL的用户名，必须输入；
- password参数：表示登录MySQL的口令，必须输入；
- gz参数：表示是否压缩备份文件，不输入则默认为`False`；
- outfile参数：表示备份文件保存在哪，必须输入。

其中，`outfile`是位置参数，而其他则是类似`--user root`这样的“关键字”参数。

用`argparse`来解析参数，一个完整的示例如下：

```python
# backup.py

import argparse

def main():
    # 定义一个ArgumentParser实例:
    parser = argparse.ArgumentParser(
        prog='backup', # 程序名
        description='Backup MySQL database.', # 描述
        epilog='Copyright(r), 2023' # 说明信息
    )
    # 定义位置参数:
    parser.add_argument('outfile')
    # 定义关键字参数:
    parser.add_argument('--host', default='localhost')
    # 此参数必须为int类型:
    parser.add_argument('--port', default='3306', type=int)
    # 允许用户输入简写的-u:
    parser.add_argument('-u', '--user', required=True)
    parser.add_argument('-p', '--password', required=True)
    parser.add_argument('--database', required=True)
    # gz参数不跟参数值，因此指定action='store_true'，意思是出现-gz表示True:
    parser.add_argument('-gz', '--gzcompress', action='store_true', required=False, help='Compress backup files by gz.')


    # 解析参数:
    args = parser.parse_args()

    # 打印参数:
    print('parsed args:')
    print(f'outfile = {args.outfile}')
    print(f'host = {args.host}')
    print(f'port = {args.port}')
    print(f'user = {args.user}')
    print(f'password = {args.password}')
    print(f'database = {args.database}')
    print(f'gzcompress = {args.gzcompress}')

if __name__ == '__main__':
    main()
```

输入有效的参数，则程序能解析出所需的所有参数：

```plain
$ ./backup.py -u root -p hello --database testdb backup.sql
parsed args:
outfile = backup.sql
host = localhost
port = 3306
user = root
password = hello
database = testdb
gzcompress = False
```

缺少必要的参数，或者参数不对，将报告详细的错误信息：

```plain
$ ./backup.py --database testdb backup.sql
usage: backup [-h] [--host HOST] [--port PORT] -u USER -p PASSWORD --database DATABASE outfile
backup: error: the following arguments are required: -u/--user, -p/--password
```

更神奇的是，如果输入`-h`，则打印帮助信息：

```plain
$ ./backup.py -h                          
usage: backup [-h] [--host HOST] [--port PORT] -u USER -p PASSWORD --database DATABASE outfile

Backup MySQL database.

positional arguments:
  outfile

optional arguments:
  -h, --help            show this help message and exit
  --host HOST
  --port PORT
  -u USER, --user USER
  -p PASSWORD, --password PASSWORD
  --database DATABASE
  -gz, --gzcompress     Compress backup files by gz.

Copyright(r), 2023
```

获取有效参数的代码实际上是这一行：

```python
args = parser.parse_args()
```

我们不必捕获异常，`parse_args()`非常方便的一点在于，如果参数有问题，则它打印出错误信息后，结束进程；如果参数是`-h`，则它打印帮助信息后，结束进程。只有当参数全部有效时，才会返回一个[NameSpace](https://docs.python.org/3/library/argparse.html#argparse.Namespace)对象，获取对应的参数就把参数名当作属性获取，非常方便。

可见，使用`argparse`后，解析参数的工作被大大简化了，我们可以专注于定义参数，然后直接获取到有效的参数输入。

### 小结

使用[argparse](https://docs.python.org/3/library/argparse.html)解析参数，只需定义好参数类型，就可以获得有效的参数输入，能大大简化获取命令行参数的工作。
