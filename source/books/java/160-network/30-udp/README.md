# UDP编程

和TCP编程相比，UDP编程就简单得多，因为UDP没有创建连接，数据包也是一次收发一个，所以没有流的概念。

在Java中使用UDP编程，仍然需要使用Socket，因为应用程序在使用UDP时必须指定网络接口（IP）和端口号。注意：UDP端口和TCP端口虽然都使用0~65535，但他们是两套独立的端口，即一个应用程序用TCP占用了端口1234，不影响另一个应用程序用UDP占用端口1234。

### 服务器端

在服务器端，使用UDP也需要监听指定的端口。Java提供了`DatagramSocket`来实现这个功能，代码如下：

```java
DatagramSocket ds = new DatagramSocket(6666); // 监听指定端口
for (;;) { // 无限循环
    // 数据缓冲区:
    byte[] buffer = new byte[1024];
    DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
    ds.receive(packet); // 收取一个UDP数据包
    // 收取到的数据存储在buffer中，由packet.getOffset(), packet.getLength()指定起始位置和长度
    // 将其按UTF-8编码转换为String:
    String s = new String(packet.getData(), packet.getOffset(), packet.getLength(), StandardCharsets.UTF_8);
    // 发送数据:
    byte[] data = "ACK".getBytes(StandardCharsets.UTF_8);
    packet.setData(data);
    ds.send(packet);
}
```

服务器端首先使用如下语句在指定的端口监听UDP数据包：

```java
DatagramSocket ds = new DatagramSocket(6666);
```

如果没有其他应用程序占据这个端口，那么监听成功，我们就使用一个无限循环来处理收到的UDP数据包：

```java
for (;;) {
    ...
}
```

要接收一个UDP数据包，需要准备一个`byte[]`缓冲区，并通过`DatagramPacket`实现接收：

```java
byte[] buffer = new byte[1024];
DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
ds.receive(packet);
```

假设我们收取到的是一个`String`，那么，通过`DatagramPacket`返回的`packet.getOffset()`和`packet.getLength()`确定数据在缓冲区的起止位置：

```java
String s = new String(packet.getData(), packet.getOffset(), packet.getLength(), StandardCharsets.UTF_8);
```

当服务器收到一个DatagramPacket后，通常必须立刻回复一个或多个UDP包，因为客户端地址在DatagramPacket中，每次收到的DatagramPacket可能是不同的客户端，如果不回复，客户端就收不到任何UDP包。

发送UDP包也是通过`DatagramPacket`实现的，发送代码非常简单：

```java
byte[] data = ...
packet.setData(data);
ds.send(packet);
```

### 客户端

和服务器端相比，客户端使用UDP时，只需要直接向服务器端发送UDP包，然后接收返回的UDP包：

```java
DatagramSocket ds = new DatagramSocket();
ds.setSoTimeout(1000);
ds.connect(InetAddress.getByName("localhost"), 6666); // 连接指定服务器和端口
// 发送:
byte[] data = "Hello".getBytes();
DatagramPacket packet = new DatagramPacket(data, data.length);
ds.send(packet);
// 接收:
byte[] buffer = new byte[1024];
packet = new DatagramPacket(buffer, buffer.length);
ds.receive(packet);
String resp = new String(packet.getData(), packet.getOffset(), packet.getLength());
ds.disconnect();
// 关闭:
ds.close();
```

客户端打开一个`DatagramSocket`使用以下代码：

```java
DatagramSocket ds = new DatagramSocket();
ds.setSoTimeout(1000);
ds.connect(InetAddress.getByName("localhost"), 6666);
```

客户端创建`DatagramSocket`实例时并不需要指定端口，而是由操作系统自动指定一个当前未使用的端口。紧接着，调用`setSoTimeout(1000)`设定超时1秒，意思是后续接收UDP包时，等待时间最多不会超过1秒，否则在没有收到UDP包时，客户端会无限等待下去。这一点和服务器端不一样，服务器端可以无限等待，因为它本来就被设计成长时间运行。

注意到客户端的`DatagramSocket`还调用了一个`connect()`方法“连接”到指定的服务器端。不是说UDP是无连接的协议吗？为啥这里需要`connect()`？

这个`connect()`方法不是真连接，它是为了在客户端的`DatagramSocket`实例中保存服务器端的IP和端口号，确保这个`DatagramSocket`实例只能往指定的地址和端口发送UDP包，不能往其他地址和端口发送。这么做不是UDP的限制，而是Java内置了安全检查。

后续的收发数据和服务器端是一致的。通常来说，客户端必须先发UDP包，因为客户端不发UDP包，服务器端就根本不知道客户端的地址和端口号。

如果客户端认为通信结束，就可以调用`disconnect()`断开连接：

```java
ds.disconnect();
```

注意到`disconnect()`也不是真正地断开连接，它只是清除了客户端`DatagramSocket`实例记录的远程服务器地址和端口号，这样，`DatagramSocket`实例就可以连接另一个服务器端。

如果客户端希望向两个不同的服务器发送UDP包，有两种方法：

1. 客户端可以创建两个`DatagramSocket`实例，用`connect()`连接到不同的服务器；
2. 客户端也可以不调用`connect()`方法，而是在创建`DatagramPacket`的时候指定服务器地址，这样可以用一个`DatagramSocket`实例发送`DatagramPacket`到不同的服务器。

不调用`connect()`方法的代码如下：

```java
DatagramSocket ds = new DatagramSocket();
ds.setSoTimeout(1000);
// 发送到localhost:6666:
byte[] data1 = "Hello".getBytes();
var packet1 = new DatagramPacket(data1, data1.length, InetAddress.getByName("localhost"), 6666);
ds.send(packet1);
// 发送到localhost:8888:
byte[] data2 = "Hi".getBytes();
var packet2 = new DatagramPacket(data2, data2.length, InetAddress.getByName("localhost"), 8888);
ds.send(packet2);
// 关闭:
ds.close();
```

### 练习

使用UDP实现服务器和客户端通信。

[下载练习](network-datagram.zip)

### 小结

使用UDP协议通信时，服务器和客户端双方无需建立连接：

- 服务器端用`DatagramSocket(port)`监听端口；
- 客户端使用`DatagramSocket.connect()`指定远程地址和端口；
- 双方通过`receive()`和`send()`读写数据；
- `DatagramSocket`没有IO流接口，数据被直接写入`byte[]`缓冲区。
