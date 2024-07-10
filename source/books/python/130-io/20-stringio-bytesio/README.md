# StringIO和BytesIO

### StringIO

很多时候，数据读写不一定是文件，也可以在内存中读写。

`StringIO`顾名思义就是在内存中读写`str`。

要把`str`写入`StringIO`，我们需要先创建一个`StringIO`，然后，像文件一样写入即可：

```plain
>>> from io import StringIO
>>> f = StringIO()
>>> f.write('hello')
5
>>> f.write(' ')
1
>>> f.write('world!')
6
>>> print(f.getvalue())
hello world!
```

`getvalue()`方法用于获得写入后的`str`。

要读取`StringIO`，可以用一个`str`初始化`StringIO`，然后，像读文件一样读取：

```plain
>>> from io import StringIO
>>> f = StringIO('Hello!\nHi!\nGoodbye!')
>>> while True:
...     s = f.readline()
...     if s == '':
...         break
...     print(s.strip())
...
Hello!
Hi!
Goodbye!
```

### BytesIO

`StringIO`操作的只能是`str`，如果要操作二进制数据，就需要使用`BytesIO`。

`BytesIO`实现了在内存中读写`bytes`，我们创建一个``Bytes`IO`，然后写入一些bytes：

```plain
>>> from io import BytesIO
>>> f = BytesIO()
>>> f.write('中文'.encode('utf-8'))
6
>>> print(f.getvalue())
b'\xe4\xb8\xad\xe6\x96\x87'
```

请注意，写入的不是`str`，而是经过UTF-8编码的`bytes`。

和`StringIO`类似，可以用一个`bytes`初始化`BytesIO`，然后，像读文件一样读取：

```plain
>>> from io import BytesIO
>>> f = BytesIO(b'\xe4\xb8\xad\xe6\x96\x87')
>>> f.read()
b'\xe4\xb8\xad\xe6\x96\x87'
```

### 小结

`StringIO`和`BytesIO`是在内存中操作`str`和`bytes`的方法，使得和读写文件具有一致的接口。

### 参考源码

[do_stringio.py](do_stringio.py)

[do_bytesio.py](do_bytesio.py)
