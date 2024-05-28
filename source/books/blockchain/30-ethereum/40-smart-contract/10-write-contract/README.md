# 编写合约

以太坊的智能合约就是一段由EVM虚拟机执行的字节码，类似于Java虚拟机执行Java字节码。直接编写字节码非常困难，通常都是由编译器负责把高级语言编译为字节码。

编写以太坊合约最常用的高级语言是Solidity，这是一种类似JavaScript语法的高级语言。通过Solidity的[官方网站](https://soliditylang.org/)可以快速上手，我们不会详细讨论Solidity的语法细节，这里给出一个简单的投票合约：

```solidity
// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.7;

contract Vote {

    event Voted(address indexed voter, uint8 proposal);

    mapping(address => bool) public voted;

    uint256 public endTime;

    uint256 public proposalA;
    uint256 public proposalB;
    uint256 public proposalC;

    constructor(uint256 _endTime) {
        endTime = _endTime;
    }

    function vote(uint8 _proposal) public {
        require(block.timestamp < endTime, "Vote expired.");
        require(_proposal >= 1 && _proposal <= 3, "Invalid proposal.");
        require(!voted[msg.sender], "Cannot vote again.");
        voted[msg.sender] = true;
        if (_proposal == 1) {
            proposalA ++;
        }
        else if (_proposal == 2) {
            proposalB ++;
        }
        else if (_proposal == 3) {
            proposalC ++;
        }
        emit Voted(msg.sender, _proposal);
    }

    function votes() public view returns (uint256) {
        return proposalA + proposalB + proposalC;
    }
}
```

Solidity注释和JavaScript一致，第一行通常是版权声明的注释，然后声明编译器版本：

```solidity
pragma solidity =0.8.7; // 指定编译器版本为0.8.7
```

也可以指定版本范围，如：

```solidity
pragma solidity >=0.8.0 <0.9.0; // 指定编译器版本为0.8.x
```

紧接着，由关键字`contract`声明一个合约：

```solidity
contract Vote {
    ... // 合约代码
}
```

虽然一个Solidity文件可以包含多个合约，但最好还是遵循一个文件一个合约，且文件名保持与合约一致。这里的合约名是`Vote`。

熟悉面向对象编程的小伙伴对类、成员变量、成员方法一定不陌生。一个合约就相当于一个类，合约内部可以有成员变量：

```solidity
contract Vote {
    // 记录已投票的地址:
    mapping(address => bool) public voted;

    // 记录投票终止时间:
    uint256 public endTime;

    // 记录得票数量:
    uint256 public proposalA;
    uint256 public proposalB;
    uint256 public proposalC;

    ...
}
```

Solidity支持整型（细分为`uint256`、`uint128`、`uint8`等）、`bytes32`类型、映射类型（相当于Java的Map）、布尔型（`true`或`false`）和特殊的`address`类型表示一个以太坊地址。

以太坊合约*不支持*浮点数类型，是为了保证每个节点运行合约都能得到完全相同的结果。浮点数运算在不同的ISA体系下存在表示方式、运算精度的不同，无法保证两个节点执行浮点运算会得到相同的结果。

所有的成员变量都默认初始化为`0`或`false`（针对bool）或空（针对mapping）。

如果某个成员变量要指定初始值，那么需要在构造函数中赋值：

```solidity
contract Vote {
    ...

    // 构造函数:
    constructor(uint256 _endTime) {
        endTime = _endTime; // 设定成员变量endTime为指定参数值
    }

    ...
}
```

以太坊合约支持读、写两种类型的成员函数，以`view`修饰的函数是只读函数，它不会修改成员变量，即不会改变合约的状态：

```solidity
contract Vote {
    ...

    function votes() public view returns (uint256) {
        return proposalA + proposalB + proposalC;
    }

    ...
}
```

没有`view`修饰的函数是写入函数，它会修改成员变量，即改变了合约的状态：

```solidity
contract Vote {
    ...

    function vote(uint8 _proposal) public {
        require(block.timestamp < endTime, "Vote expired.");
        require(_proposal >= 1 && _proposal <= 3, "Invalid proposal.");
        require(!voted[msg.sender], "Cannot vote again.");
        // 给mapping增加一个key-value:
        voted[msg.sender] = true;
        if (_proposal == 1) {
            // 修改proposalA:
            proposalA ++;
        }
        else if (_proposal == 2) {
            // 修改proposalB:
            proposalB ++;
        }
        else if (_proposal == 3) {
            // 修改proposalC:
            proposalC ++;
        }
        emit Voted(msg.sender, _proposal);
    }

    ...
}
```

合约可以定义事件（Event），我们在Vote合约中定义了一个`Voted`事件：

```solidity
contract Vote {
    // Voted事件，有两个相关值:
    event Voted(address indexed voter, uint8 proposal);

    ...
}
```

只定义事件还不够，触发事件必须在合约的写函数中通过`emit`关键字实现。当调用`vote()`写方法时，会触发`Voted`事件：

```solidity
contract Vote {
    ...

    function vote(uint8 _proposal) public {
        ...
        emit Voted(msg.sender, _proposal);
    }

    ...
}
```

事件可用来通知外部感兴趣的第三方，他们可以在区块链上监听产生的事件，从而确认合约某些状态发生了改变。

以上就是用Solidity编写一个完整的合约所涉及的几个要素：

- 声明版权（可选）；
- 声明编译器版本；
- 以contract关键字编写一个合约；
- 可以包含若干成员变量；
- 可以在构造函数中对成员变量初始化（可选）；
- 可以编写只读方法；
- 可以编写写入方法；
- 可以声明Event并在写入方法中触发。

函数又可以用`public`或`private`修饰。顾名思义，`public`函数可以被外部调用，而`private`函数不能被外部调用，他们只能被`public`函数在内部调用。

### 合约执行流程

当一个合约编写完成并成功编译后，我们就可以把它部署到以太坊上。合约部署后将自动获得一个地址，通过该地址即可访问合约。

把`contract Vote {...}`看作一个类，部署就相当于一个实例化。如果部署两次，将得到两个不同的地址，相当于实例化两次，两个部署后的合约对应的成员变量是完全独立的，互不影响。

构造函数在部署合约时就会立刻执行，且仅执行一次。合约部署后就无法调用构造函数。

任何外部账户都可以发起对合约的函数调用。如果调用只读方法，因为不改变合约状态，所以任何时刻都可以调用，且不需要签名，也不需要消耗Gas。但如果调用写入方法，就需要签名提交一个交易，并消耗一定的Gas。

在一个交易中，只能调用一个合约的一个写入方法。无需考虑并发和同步的问题，因为以太坊交易的写入是严格串行的。

### 验证

由于任何外部账户都可以发起对合约的函数调用，所以任何验证工作都必须在函数内部自行完成。最常用的`require()`可以断言一个条件，如果断言失败，将抛出错误并中断执行。

常用的检查包括几类：

参数检查：

```solidity
// 参数必须为1,2,3:
require(_proposal >= 1 && _proposal <= 3, "Invalid proposal.");
```

条件检查：

```solidity
// 当前区块时间必须小于设定的结束时间:
require(block.timestamp < endTime, "Vote expired.");
```

调用方检查：

```solidity
// msg.sender表示调用方地址:
require(!voted[msg.sender], "Cannot vote again.");
```

以太坊合约具备类似数据库事务的特点，如果中途执行失败，则整个合约的状态保持不变，不存在修改某个成员变量后，后续断言失败导致部分修改生效的问题：

```solidity
function increment() {
    // 假设a,b均为成员变量:
    a++;
    emit AChanged(a);
    // 如果下面的验证失败，a不会被更新，也没有AChanged事件发生:
    require(b < 10, 'b >= 10');
    b++;
}
```

即合约如果执行失败，其状态不会发生任何变化，也不会有任何事件发生，仅仅是调用方白白消耗了一定的Gas。

### 小结

编写一个以太坊合约相当于编写一个类，一个合约可以包含多个成员变量和若干函数，以及可选的构造函数；

部署一个合约相当于实例化，部署时刻将执行构造函数；

任何外部账户均可发起对合约函数的调用，但一个交易仅限一个函数调用；

所有检查都必须在合约的函数内部完成。
