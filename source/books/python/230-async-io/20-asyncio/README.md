# 使用asyncio

`asyncio`是Python 3.4版本引入的标准库，直接内置了对异步IO的支持。

`asyncio`的编程模型就是一个消息循环。`asyncio`模块内部实现了`EventLoop`，把需要执行的协程扔到`EventLoop`中执行，就实现了异步IO。

用`asyncio`提供的`@asyncio.coroutine`可以把一个`generator`标记为`coroutine`类型，然后在`coroutine`内部用`yield from`调用另一个`coroutine`实现异步操作。

为了简化并更好地标识异步IO，从Python 3.5开始引入了新的语法`async`和`await`，可以让`coroutine`的代码更简洁易读。

用`asyncio`实现`Hello world`代码如下：

```python
import asyncio

async def hello():
    print("Hello world!")
    # 异步调用asyncio.sleep(1):
    await asyncio.sleep(1)
    print("Hello again!")

asyncio.run(hello())
```

`async`把一个函数变成`coroutine`类型，然后，我们就把这个`async`函数扔到`asyncio.run()`中执行。执行结果如下：

```plain
Hello!
(等待约1秒)
Hello again!
```

`hello()`会首先打印出`Hello world!`，然后，`await`语法可以让我们方便地调用另一个`async`函数。由于`asyncio.sleep()`也是一个`async`函数，所以线程不会等待`asyncio.sleep()`，而是直接中断并执行下一个消息循环。当`asyncio.sleep()`返回时，就接着执行下一行语句。

把`asyncio.sleep(1)`看成是一个耗时1秒的IO操作，在此期间，主线程并未等待，而是去执行`EventLoop`中其他可以执行的`async`函数了，因此可以实现并发执行。

上述`hello()`还没有看出并发执行的特点，我们改写一下，让两个`hello()`同时并发执行：

```python
# 传入name参数:
async def hello(name):
    # 打印name和当前线程:
    print("Hello %s! (%s)" % (name, threading.current_thread))
    # 异步调用asyncio.sleep(1):
    await asyncio.sleep(1)
    print("Hello %s again! (%s)" % (name, threading.current_thread))
    return name
```

用`asyncio.gather()`同时调度多个`async`函数：

```python
async def main():
    L = await asyncio.gather(hello("Bob"), hello("Alice"))
    print(L)

asyncio.run(main())
```

执行结果如下：

```plain
Hello Bob! (<function current_thread at 0x10387d260>)
Hello Alice! (<function current_thread at 0x10387d260>)
(等待约1秒)
Hello Bob again! (<function current_thread at 0x10387d260>)
Hello Alice again! (<function current_thread at 0x10387d260>)
['Bob', 'Alice']
```

从结果可知，用`asyncio.run()`执行`async`函数，所有函数均由同一个线程执行。两个`hello()`是并发执行的，并且可以拿到`async`函数执行的结果（即`return`的返回值）。

如果把`asyncio.sleep()`换成真正的IO操作，则多个并发的IO操作实际上可以由一个线程并发执行。

我们用`asyncio`的异步网络连接来获取sina、sohu和163的网站首页：

```python
import asyncio

async def wget(host):
    print(f"wget {host}...")
    # 连接80端口:
    reader, writer = await asyncio.open_connection(host, 80)
    # 发送HTTP请求:
    header = f"GET / HTTP/1.0\r\nHost: {host}\r\n\r\n"
    writer.write(header.encode("utf-8"))
    await writer.drain()

    # 读取HTTP响应:
    while True:
        line = await reader.readline()
        if line == b"\r\n":
            break
        print("%s header > %s" % (host, line.decode("utf-8").rstrip()))
    # Ignore the body, close the socket
    writer.close()
    await writer.wait_closed()
    print(f"Done {host}.")

async def main():
    await asyncio.gather(wget("www.sina.com.cn"), wget("www.sohu.com"), wget("www.163.com"))

asyncio.run(main())
```

执行结果如下：

```plain
wget www.sohu.com...
wget www.sina.com.cn...
wget www.163.com...
(等待一段时间)
(打印出sohu的header)
www.sohu.com header > HTTP/1.1 200 OK
www.sohu.com header > Content-Type: text/html
...
(打印出sina的header)
www.sina.com.cn header > HTTP/1.1 200 OK
www.sina.com.cn header > Date: Wed, 20 May 2015 04:56:33 GMT
...
(打印出163的header)
www.163.com header > HTTP/1.0 302 Moved Temporarily
www.163.com header > Server: Cdn Cache Server V2.0
...
```

可见3个连接由一个线程并发执行3个`async`函数完成。

### 小结

`asyncio`提供了完善的异步IO支持，用`asyncio.run()`调度一个`coroutine`；

在一个`async`函数内部，通过`await`可以调用另一个`async`函数，这个调用看起来是串行执行的，但实际上是由`asyncio`内部的消息循环控制；

在一个`async`函数内部，通过`await asyncio.gather()`可以并发执行若干个`async`函数。

### 参考源码

[hello.py](hello.py)

[gather.py](gather.py)

[wget.py](wget.py)
