# 以太坊Delegate Call详解

在以太坊合约中，一个合约可以调用另一个合约，以实现功能模块化。

除了普通的跨合约调用，以太坊还提供了`delegatecall`来跨合约调用。

`delegatecall`跨合约调用与普通跨合约调用不同，它不会改变代码执行的上下文环境，而是基于当前合约的上下文来执行目标合约代码，就像这些代码是当前合约自己的代码一样。

什么是合约上下文？我们以一个简单的示例来说，就可以正确理解`delegatecall`的调用方式。

先编写两个合约：`Target`和`Delegate`，完整代码如下：

```solidity
pragma solidity ^0.8.25;

contract Target {

    event Log(string msg, address thisAddr, address msgSender, uint256 msgValue, address txOrigin);

    string public name = "target";
    uint256 public version = 1;

    function save(string memory _name, uint256 _version) public payable {
        name = _name;
        version = _version;
        emit Log("Target.save", address(this), msg.sender, msg.value, tx.origin);
    }
}

contract Delegate {

    event Log(string msg, address thisAddr, address msgSender, uint256 msgValue, address txOrigin);

    string public name = "delegate";
    uint256 public version = 10;

    Target public target;

    constructor (address _target) {
        target = Target(_target);
    }

    function save(string memory _name, uint256 _version) public payable {
        emit Log("Delegate.save", address(this), msg.sender, msg.value, tx.origin);
        target.save(_name, _version);
    }

    function delegateSave(string memory _name, uint256 _version) public payable {
        emit Log("Delegate.delegateSave", address(this), msg.sender, msg.value, tx.origin);
        (bool success, bytes memory returndata) = address(target).delegatecall(
            abi.encodeWithSelector(
                Target.save.selector,
                _name,
                _version
            )
        );
        if (! success) {
            revert("delegate call failed.");
        }
    }
}
```

这两个合约部署后，`Delegate`地址为`0x2c70...`，`Target`地址为`0xdC31...`，此处地址仅为示例合约部署到某一条ETH链的特定地址，重复本文实验会得到不同的部署地址。

在`Delegate`合约中，编写两个函数：

- `save()`函数，以正常方式调用`Target`合约的`save()`函数；
- `delegateSave()`函数，以`delegatecall`方式调用`Target`合约的`save()`函数。

调用关系如下图所示：

```ascii
 Delegate (0x2c70...)
┌─────────────────────────────┐     Target (0xdC31...)
│save() {                     │    ┌───────────────────┐
│  target.save();─────────────┼───▶│save(n, v) {       │
│}                            │ ┌─▶│  name = n;        │
├─────────────────────────────┤ │  │  version = v;     │
│delegateSave() {             │ │  │}                  │
│  delegateCall(target.save);─┼─┘  └───────────────────┘
│}                            │
└─────────────────────────────┘
```

另外注意到我们在两个合约中均存储了`name`和`version`，并设定了初始值。部署合约后，两个合约的初始状态如下：

```ascii
 Delegate (0x2c70...)   Target (0xdC31...)
┌────────────────────┐ ┌────────────────────┐
│balance = 0         │ │balance = 0         │
├────────────────────┤ ├────────────────────┤
│name = "delegate"   │ │name = "target"     │
├────────────────────┤ ├────────────────────┤
│version = 10        │ │version = 1         │
└────────────────────┘ └────────────────────┘
```

下一步，我们用地址`0x98fd...`这个外部地址调用`Delegate`的`save()`函数，传入参数：

- name = "bob"
- version = 123
- ETH = 0.01

在`Delegate`合约的`save()`函数内部，打印出的日志为：

- msg = "Delegate.save"
- thisAddr = 0x2c70...
- msgSender = 0x98fd...
- msgValue = 0.01
- txOrigin = 0x98fd...

在`Target`合约的`save()`函数内部，打印出的日志为：

- msg = "Target.save"
- thisAddr = 0xdC31...
- msgSender = 0x2c70...
- msgValue = 0
- txOrigin = 0x98fd...

可见，正常调用`Target`合约函数，在`Target`合约内部执行`save()`函数时，`address(this)`总是指向当前合约，`msg.sender`是调用方`Delegate`的地址，`msg.value`不再是外部传入的`0.01`，这就是跨合约调用函数时，上下文会自动切换。

执行后，我们检测两个合约的状态如下：

```ascii
 Delegate (0x2c70...)   Target (0xdC31...)
┌────────────────────┐ ┌────────────────────┐
│balance = 0.01      │ │balance = 0         │
├────────────────────┤ ├────────────────────┤
│name = "delegate"   │ │name = "bob"        │
├────────────────────┤ ├────────────────────┤
│version = 10        │ │version = 123       │
└────────────────────┘ └────────────────────┘
```

可见，`Target`合约的`save()`函数修改了自身状态，不会修改`Delegate`合约的状态，而外部传入的ETH则留在`Delegate`合约中。

现在我们再以外部地址`0x98fd...`调用`Delegate`合约的`delegateSave()`函数，传入参数：

- name = "alice"
- version = 456
- ETH = 0.02

这个时候，`Delegate`合约的`delegateSave()`函数内部，以`delegateCall`调用`Target`合约的`save()`函数，我们先观察执行后两个合约的状态：

```ascii
 Delegate (0x2c70...)   Target (0xdC31...)
┌────────────────────┐ ┌────────────────────┐
│balance = 0.03      │ │balance = 0         │
├────────────────────┤ ├────────────────────┤
│name = "alice"      │ │name = "bob"        │
├────────────────────┤ ├────────────────────┤
│version = 456       │ │version = 123       │
└────────────────────┘ └────────────────────┘
```

注意到`Target`合约的`save()`函数代码如下：

```solidity
function save(string memory _name, uint256 _version) public payable {
    name = _name;
    version = _version;
    emit ...
}
```

但它却并没有修改自身状态，而是把`Delegate`合约的`name`和`version`给改了！

这就是`delegatecall`调用时，不会切换当前上下文，导致`Target`合约的`save()`函数看起来就像是在`Delegate`合约中执行的。

我们检查日志，可以看到`Delegate`合约打印的日志：

```ascii
msg = "Delegate.delegateSave"
thisAddr = 0x2c70...
msgSender = 0x98fd...
msgValue = 0.02
txOrigin = 0x98fd...
```

`Target`合约打印的日志：

```ascii
msg = "Target.save"
thisAddr = 0x2c70...
msgSender = 0x98fd...
msgValue = 0.02
txOrigin = 0x98fd...
```

现在，我们搞明白了，所谓的上下文不切换，就是指`address(this)`不会变，`msg.sender`和`msg.value`也不会变，这将导致执行`Target`合约时，代码：

```solidity
name = _name;
```

根据上下文`address(this)`返回的仍然是`Delegate`合约地址，所以，它修改的实际上是`Delegate`合约的`name`。

因此，我们总结一下`delegatecall`调用的效果，其实就相当于把被调用的`Target.save()`看作是`Delegate`合约的一个内部函数：

```solidity
function delegateSave(string memory _name, uint256 _version) public payable {
    emit Log("Delegate.delegateSave", address(this), msg.sender, msg.value, tx.origin);
    // address(target).delegatecall(...)
    // 相当于把Target.save()的代码搬到这里:
    {
        name = _name;
        version = _version;
    }
}
```

只不过此处的`name`和`version`都是`Delegate`合约的数据，而不是`Target`合约的数据。

什么情况下需要用到`delegatecall`呢？如果一个合约的逻辑需要升级，那么可以把数据放到主合约，把执行逻辑放到单独的合约里，主合约与逻辑合约有相同名称的字段，就可以实现逻辑合约升级，而数据始终存储在主合约中。
