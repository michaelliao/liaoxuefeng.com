# struct

准确地讲，Python没有专门处理字节的数据类型。但由于`b'str'`可以表示字节，所以，字节数组＝二进制`str`。而在C语言中，我们可以很方便地用`struct`、`union`来处理字节，以及字节和`int`，`float`的转换。

在Python中，比方说要把一个32位无符号整数变成字节，也就是4个长度的`bytes`，你得配合位运算符这么写：

```plain
>>> n = 10240099
>>> b1 = (n & 0xff000000) >> 24
>>> b2 = (n & 0xff0000) >> 16
>>> b3 = (n & 0xff00) >> 8
>>> b4 = n & 0xff
>>> bs = bytes([b1, b2, b3, b4])
>>> bs
b'\x00\x9c@c'
```

非常麻烦。如果换成浮点数就无能为力了。

好在Python提供了一个`struct`模块来解决`bytes`和其他二进制数据类型的转换。

`struct`的`pack`函数把任意数据类型变成`bytes`：

```plain
>>> import struct
>>> struct.pack('>I', 10240099)
b'\x00\x9c@c'
```

`pack`的第一个参数是处理指令，`'>I'`的意思是：

`>`表示字节顺序是big-endian，也就是网络序，`I`表示4字节无符号整数。

后面的参数个数要和处理指令一致。

`unpack`把`bytes`变成相应的数据类型：

```plain
>>> struct.unpack('>IH', b'\xf0\xf0\xf0\xf0\x80\x80')
(4042322160, 32896)
```

根据`>IH`的说明，后面的`bytes`依次变为`I`：4字节无符号整数和`H`：2字节无符号整数。

所以，尽管Python不适合编写底层操作字节流的代码，但在对性能要求不高的地方，利用`struct`就方便多了。

`struct`模块定义的数据类型可以参考Python官方文档：

[https://docs.python.org/3/library/struct.html#format-characters](https://docs.python.org/3/library/struct.html#format-characters)

Windows的位图文件（.bmp）是一种非常简单的文件格式，我们来用`struct`分析一下。

首先找一个bmp文件，没有的话用“画图”画一个。

读入前30个字节来分析：

```plain
>>> s = b'\x42\x4d\x38\x8c\x0a\x00\x00\x00\x00\x00\x36\x00\x00\x00\x28\x00\x00\x00\x80\x02\x00\x00\x68\x01\x00\x00\x01\x00\x18\x00'
```

BMP格式采用小端方式存储数据，文件头的结构按顺序如下：

两个字节：`'BM'`表示Windows位图，`'BA'`表示OS/2位图；
一个4字节整数：表示位图大小；
一个4字节整数：保留位，始终为0；
一个4字节整数：实际图像的偏移量；
一个4字节整数：Header的字节数；
一个4字节整数：图像宽度；
一个4字节整数：图像高度；
一个2字节整数：始终为1；
一个2字节整数：颜色数。

所以，组合起来用`unpack`读取：

```plain
>>> struct.unpack('<ccIIIIIIHH', s)
(b'B', b'M', 691256, 0, 54, 40, 640, 360, 1, 24)
```

结果显示，`b'B'`、`b'M'`说明是Windows位图，位图大小为640x360，颜色数为24。

请编写一个`bmpinfo.py`，可以检查任意文件是否是位图文件，如果是，打印出图片大小和颜色数。

```python
import base64, struct
bmp_data = base64.b64decode('Qk1oAgAAAAAAADYAAAAoAAAAHAAAAAoAAAABABAAAAAAADICAAASCwAAEgsAA' +
                   'AAAAAAAAAAA/3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3/' +
                   '/f/9//3//f/9//3//f/9/AHwAfAB8AHwAfAB8AHwAfP9//3//fwB8AHwAfAB8/3//f/9/A' +
                   'HwAfAB8AHz/f/9//3//f/9//38AfAB8AHwAfAB8AHwAfAB8AHz/f/9//38AfAB8/3//f/9' +
                   '//3//fwB8AHz/f/9//3//f/9//3//f/9/AHwAfP9//3//f/9/AHwAfP9//3//fwB8AHz/f' +
                   '/9//3//f/9/AHwAfP9//3//f/9//3//f/9//38AfAB8AHwAfAB8AHwAfP9//3//f/9/AHw' +
                   'AfP9//3//f/9//38AfAB8/3//f/9//3//f/9//3//fwB8AHwAfAB8AHwAfAB8/3//f/9//' +
                   '38AfAB8/3//f/9//3//fwB8AHz/f/9//3//f/9//3//f/9/AHwAfP9//3//f/9/AHwAfP9' +
                   '//3//fwB8AHz/f/9/AHz/f/9/AHwAfP9//38AfP9//3//f/9/AHwAfAB8AHwAfAB8AHwAf' +
                   'AB8/3//f/9/AHwAfP9//38AfAB8AHwAfAB8AHwAfAB8/3//f/9//38AfAB8AHwAfAB8AHw' +
                   'AfAB8/3//f/9/AHwAfAB8AHz/fwB8AHwAfAB8AHwAfAB8AHz/f/9//3//f/9//3//f/9//' +
                   '3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//3//f/9//38AAA==')

def bmp_info(data):
    return {
        'width': 200,
        'height': 100,
        'color': 24
    }

# 测试
bi = bmp_info(bmp_data)
assert bi['width'] == 28
assert bi['height'] == 10
assert bi['color'] == 16
print('ok')
```

### 参考源码

[check_bmp.py](check_bmp.py)
