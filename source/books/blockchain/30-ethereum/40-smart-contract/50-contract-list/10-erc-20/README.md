# ERC-20

[ERC-20](https://eips.ethereum.org/EIPS/eip-20)是以太坊定义的一个合约接口规范，符合该规范的合约被称为以太坊代币。

一个ERC-20合约通过`mapping(address => uint256)`存储一个地址对应的余额：

```solidity
contract MyERC20 {
    mapping(address => uint256) public balanceOf;
}
```

如果要在两个地址间转账，实际上就是对`balanceOf`这个`mapping`的对应的kv进行加减操作：

```solidity
contract MyERC20 {
    mapping(address => uint256) public balanceOf;

    function transfer(address recipient, uint256 amount) public returns (bool) {
        // 不允许转账给0地址:
        require(recipient != address(0), "ERC20: transfer to the zero address");
        // sender的余额必须大于或等于转账额度:
        require(balanceOf[msg.sender] >= amount, "ERC20: transfer amount exceeds balance");
        // 更新sender转账后的额度:
        balanceOf[msg.sender] -= amount;
        // 更新recipient转账后的额度:
        balanceOf[recipient] += amount;
        // 写入日志:
        emit Transfer(sender, recipient, amount);
        return true;
    }
}
```

### 安全性

早期ERC20转账最容易出现的安全漏洞是加减导致的溢出，即两个超大数相加溢出，或者减法得到了负数导致结果错误。从Solidity 0.8版本开始，编译器默认就会检查运算溢出，因此，不要使用早期的Solidity编译即可避免溢出问题。

没有正确实现`transfer()`函数会导致交易成功，却没有任何转账发生，此时外部程序容易误认为已成功，导致假充值：

```solidity
function transfer(address recipient, uint256 amount) public returns (bool) {
    if (balanceOf[msg.sender] >= amount) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    } else {
        return false;
    }
}
```

实际上`transfer()`函数返回`bool`毫无意义，因为条件不满足必须抛出异常回滚交易，这是ERC20接口定义冗余导致部分开发者未能遵守规范导致的。

ERC-20另一个严重的安全性问题来源于重入攻击：

```solidity
function transfer(address recipient, uint256 amount) public returns (bool) {
    require(recipient != address(0), "ERC20: transfer to the zero address");
    uint256 senderBalance = balanceOf[msg.sender];
    require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
    // 此处调用另一个回调:
    callback(msg.sender);
    // 更新转账后的额度:
    balanceOf[msg.sender] = senderBalance - amount;
    balanceOf[recipient] += amount;
    emit Transfer(sender, recipient, amount);
    return true;
}
```

先回调再更新的方式会导致重入攻击，即如果`callback()`调用了外部合约，外部合约回调`transfer()`，会导致重复转账。防止重入攻击的方法是一定要在校验通过后立刻更新数据，不要在校验-更新中插入任何可能执行外部代码的逻辑。
