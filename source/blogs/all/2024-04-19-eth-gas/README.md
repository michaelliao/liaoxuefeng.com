# 以太坊如何实现代付GAS

本文简单讨论以太坊如何实现GAS代付，即在钱包没有ETH的情况下与以太坊交互。

首先，我们明确几个概念：

用户地址：也称为EOA（Externally Owned Account），即外部控制账户，也就是用户持有私钥控制的地址。

合约地址：即合约部署后的地址，没有私钥。

以太坊的交易分为两类：

1. 用户把以太坊发送到另一个地址；
2. 用户与合约进行交互。

因为合约不能主动发起调用，所以，合约与合约交互，实际上是用户调用合约A，合约A调用合约B的内部流程，不存在独立的合约与合约交互。

针对情况1，用户地址没有ETH作为GAS是不行的，因为发送不了转账交易。

针对情况2，用户与合约交互，也需要地址有ETH作为GAS，才能调用合约。

举个例子，以一个简单的ERC20合约为例：

```solidity
class SimpleERC20 {
    function transfer(address to, uint256 value) public returns (bool) {
        uint256 balance = balanceOf[msg.sender];
        ...
    }
}
```

假设用户A希望调用`transfer()`函数，也是需要GAS的，而且，由于`transfer()`内部有调用方身份认证，其他人发起的调用，和用户A调用，执行的逻辑不同。

所以，用户A直接调用某个合约，是没法实现GAS代付的，因为以太坊的GAS费，要求必须由调用方出。在不改协议的情况下，第三方无法帮用户A代付GAS。

但是，有一种曲线救国的方法，可以实现GAS代付。

让我们假设用户A并不直接持有上述`SimpleERC20`的资产，而是控制一个合约A，由合约A持有`SimpleERC20`的资产。对`SimpleERC20`进行调用时，是合约A对`SimpleERC20`的调用，此时，可以在合约A上实现GAS代付。

```solidity
contract A {
    address owner = 0xA1B2...; // 用户A的地址
    function transfer(address to, uint256 amount) public {
        require(msg.sender == owner);
        SimpleERC20(0x...).transfer(to, amount);
    }
}
```

有以太坊开发经验的同学会指出，上述代码会检查调用者是否是用户A的地址，所以，没办法由用户B调用。

如果用户B能调用合约A的`transfer()`函数，就相当于帮用户A支付了GAS，完成了最终对`SimpleERC20.transfer()`的调用。

所以，我们需要修改一下鉴权逻辑，实现用户B可以调用，同时，通过增加一个签名，确保调用是用户A授权的：

```solidity
contract A {
    address owner = 0xA1B2...; // 用户A的地址
    function transfer(address to, uint256 amount, bytes memory sigature) public {
        // 当前msg.sender可能是用户B，因此需要验证签名:
        bytes32 hash = keccak256(abi.encodePacked(to, amount));
        address addr = ECDSA.recover(hash, signature);
        // 确认签名是用户A的地址:
        require(addr == owner, "Not owner");
        SimpleERC20(0x...).transfer(to, amount);
    }
}
```

经过改造后，用户A先对数据进行签名，然后，用户B来调用合约A的`transfer()`函数，就可以帮用户A支付GAS，完成`SimpleERC20.transfer()`的调用。

有以太坊丰富开发经验的同学会指出，上述调用是写死的，如果要调用其他合约，比如Uniswap，怎么办？

我们可以实现一个更通用的`execute()`函数，让用户A传入函数调用的数据和签名，改造代码如下：

```solidity
contract A {
    address owner = 0xA1B2...; // 用户A的地址
    function execute(address targetContract, bytes calldata data, bytes memory sigature) public returns (bytes) {
        // 验证签名:
        bytes32 hash = keccak256(abi.encodePacked(targetContract, data));
        address addr = ECDSA.recover(hash, signature);
        require(addr == owner, "Not owner");
        // 调用目标合约:
        (bool success, bytes memory result) = targetContract.call(data);
        // 检查调用是否成功
        require(success, "Failed");
        // 如果调用成功，返回结果
        return result;
    }
}
```

更有经验的同学会指出，如果第三方多次调用`execute`，比如对`SimpleERC20.transfer()`的调用，可以把`SimpleERC20`的资产转没了。

只对calldata签名，无法防止重放攻击。为了防止重放攻击，可以给合约A加上`state`状态：

```solidity
contract A {
    address owner = 0xA1B2...; // 用户A的地址
    uint256 state public;
    function execute(address targetContract, bytes calldata data, bytes memory sigature) public returns (bytes) {
        // 验证包含state的签名:
        bytes32 hash = keccak256(abi.encodePacked(state, targetContract, data));
        address addr = ECDSA.recover(hash, signature);
        require(addr == owner, "Not owner");
        state ++;
        // 调用目标合约:
        (bool success, bytes memory result) = targetContract.call(data);
        // 检查调用是否成功
        require(success, "Failed");
        // 如果调用成功，返回结果
        return result;
    }
}
```

用户A在签名时，首先获取合约A的`state`，在签名中包含`state`，即可防止重放攻击。

这样，我们就实现了一个可以由第三方代付GAS的合约调用。

延伸思考：如何让用户在没有ETH的情况下，拥有一个自己完全控制的合约，还能实现GAS代付？这个问题我们后续再继续讨论。

## 小结

在以太坊上，如果不修改现有协议，实现GAS代付需要的条件是：

1. 用户拥有一个完全控制的合约，以合约身份与目标合约交互；
2. 资产由用户控制的合约持有，而非用户地址；
3. 用户通过签名，让第三方调用自己控制的合约，从而实现GAS代付，并间接完成对目标合约的调用。
