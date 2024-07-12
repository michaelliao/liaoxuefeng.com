# J2ME概念解析

J2ME，即Java 2 Micro Edition，是SUN公司推出的在移动设备上运行的微型版Java平台，常见的移动设备有手机，PDA，电子词典，以及各式各样的信息终端如机顶盒等等。

由于移动终端的类型成千上万，而且计算能力差异非常大，不可能像桌面系统那样仅仅两三个版本的JVM即可满足Windows，Linux和Unix系统，因此，J2ME不是一个简单的微型版的JVM。为了满足千差万别的移动设备的需求，SUN定义了一系列的针对不同类型设备的规范，因此，J2ME平台便是由许多的规范组成的集合。

最重要的移动终端当然是手机了，因此，我们主要讨论手机相关的J2ME规范。

## Configuration

SUN把不同的设备按照计算能力分为CLDC（Connected Limited Device Configuration）和CDC（Connected Device Configuration）两大类，这两个Configuration是针对设备软硬件环境严格定义的，比如CLDC1.0定义了内存大小为64-512k，任何设备如果支持CLDC1.0，就必须严格满足定义，不能有可选的或者含糊的功能。

CLDC1.0是针对计算能力非常有限的设备定义的，只支持整数运算，不支持浮点运算，早期的Java手机大部分都支持CLDC1.0，如Nokia 3650，Siemens 6688i。

CLDC1.1则增加了浮点运算，因此，在支持CLDC1.1的设备上，可以使用float和double类型的变量。现在的Java手机很多都能支持CLDC1.1，如Nokia 9500，Siemens S65。

CDC则是针对计算能力比较强的设备定义的，如PPC等，CDC平台的JVM基本上和桌面的JVM很接近了，只是可以使用的Package大大少于J2SE的包。

## Profile

和Configuration相比，Profile更多是针对软件的定义，Profile定义有必须实现的，也有可选的功能，因此，Profile更灵活。

最重要的Profile当然是MIDP（Micro Information Device Profile），MIDP定义了能在Java手机上运行的Java程序的规范，符合MIDP规范的Java小程序被称为MIDlet，可以直接通过无线网络下载到手机并运行。

早期的MIDP1.0规范使我们能在手机上运行有UI界面的Java程序，但是MIDP1.0对游戏的支持不够，必须自己实现许多必须的代码，因此，MIDP2.0规范大大加强了对游戏开发的支持，使开发者编写更少的代码来创建游戏。

MIDP规范的图形界面基本上都是独立于J2SE的AWT和Swing组件，因为目前手机的计算能力还比较有限，但是，随着手机的CPU越来越快，使得AWT和Swing移植到手机上也将成为可能，因此，最新的PBP 1.0（Personal Basic Profile）和PP 1.0（Personal Profile）规范提供了部分AWT和Swing的支持，目前，部分高端PDA已经可以运行PBP和PP的Java程序了。可以预见，将来大部分的AWT和Swing组件都能移植到手机上。

前面已经说过，和Configuration相比，Profile有许多可选包，比较实用的Profile还有在JSR135定义的MMAPI（Mobile Media API），实现多媒体播放功能；在JSR184定义的M3G API（Mobile 3D Graphics API），实现3D功能；在JSR120定义的WMA（Wireless Message API），实现短消息收发。如果你的手机支持某一Profile，如M3G，那么便可以在MIDlet中使用M3G的3D API实现3D游戏。

Profile虽然定义了Java API接口，但是底层如何实现是由各厂商自己决定的，如M3G定义了3D接口，但是底层实现既可以使用硬件加速，也可以由C程序模拟，或者部分由硬件实现，部分由软件实现。

比J2ME更精简的Java平台被SUN称为JavaCard，运行在信用卡等芯片中，实现电子支付等功能，目前SUN还没有把JavaCard并入J2ME平台。
