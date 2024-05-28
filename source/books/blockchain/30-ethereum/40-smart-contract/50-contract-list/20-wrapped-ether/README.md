# Wrapped Ether

如果一个合约既支持ETH付款，也支持ERC-20代币付款，我们会发现这两种付款方式处理逻辑是不一样的：

```solidity
contract Shop {
    function pay(uint productId) public payable {
        // pay ETH...
    }
    function pay(uint productId, address erc, uint256 amount) public {
        // pay ERC...
    }
}
```

两种逻辑混在一起用，代码就会复杂，就容易出问题。

一个简单的解决方法是将ETH也变成一种代币，可以用一个简单的`WETH`合约实现：

```solidity
contract WETH {
    string public name     = "Wrapped Ether";
    string public symbol   = "WETH";
    uint8  public decimals = 18;

    mapping (address => uint) public  balanceOf;

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
    }

    function withdraw(uint wad) public {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender] -= wad;
        msg.sender.transfer(wad);
    }

    ...
}
```

这样，处理ETH付款就可以简单地将它变成WETH，然后走同一种逻辑：

```solidity
contract Shop {
    function pay(uint productId) public payable {
        // ETH -> WETH:
        WETH.deposit.value(msg.value)();
        _pay(productId, address(this), WETH.address, msg.value);
    }

    function pay(uint productId, address erc, uint256 amount) public {
        _pay(productId, msg.sender, erc, amount);
    }

    function _pay(uint productId, address sender, address erc, uint256 amount) private {
        // pay ERC...
    }
}
```

不需要自己实现WETH，因为以太坊主网已经有一个通用的[WETH](https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2)。

### 小结

通过WETH，将ETH变成ERC20代币，可以简化处理代币的逻辑。
