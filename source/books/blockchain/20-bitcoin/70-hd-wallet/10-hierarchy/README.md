# 钱包层级

HD钱包算法决定了只要给定根扩展私钥，整棵树的任意节点的扩展私钥都可以计算出来。

我们来看看如何利用[bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)这个JavaScript库来计算HD地址：

```x-javascript
const bitcoin = require('bitcoinjs-lib');

let
    xprv = 'xprv9s21ZrQH143K4EKMS3q1vbJo564QAbs98BfXQME6nk8UCrnXnv8vWg9qmtup3kTug96p5E3AvarBhPMScQDqMhEEm41rpYEdXBL8qzVZtwz',
    root = bitcoin.HDNode.fromBase58(xprv);

// m/0:
let m_0 = root.derive(0);
console.log("xprv m/0: " + m_0.toBase58());
console.log("xpub m/0: " + m_0.neutered().toBase58());
console.log(" prv m/0: " + m_0.keyPair.toWIF());
console.log(" pub m/0: " + m_0.keyPair.getAddress());

// m/1:
let m_1 = root.derive(1);
console.log("xprv m/1: " + m_1.toBase58());
console.log("xpub m/1: " + m_1.neutered().toBase58());
console.log(" prv m/1: " + m_1.keyPair.toWIF());
console.log(" pub m/1: " + m_1.keyPair.getAddress());
```

注意到以`xprv`开头的`xprv9s21ZrQH...`是512位扩展私钥的Base58编码，解码后得到的就是原始扩展私钥。

可以从某个xpub在没有xprv的前提下直接推算子公钥：

```x-javascript
const bitcoin = require('bitcoinjs-lib');

let
    xprv = 'xprv9s21ZrQH143K4EKMS3q1vbJo564QAbs98BfXQME6nk8UCrnXnv8vWg9qmtup3kTug96p5E3AvarBhPMScQDqMhEEm41rpYEdXBL8qzVZtwz',
    root = bitcoin.HDNode.fromBase58(xprv);

// m/0:
let
    m_0 = root.derive(0),
    xprv_m_0 = m_0.toBase58(),
    xpub_m_0 = m_0.neutered().toBase58();

// 方法一：从m/0的扩展私钥推算m/0/99的公钥地址:
let pub_99a = bitcoin.HDNode.fromBase58(xprv_m_0).derive(99).getAddress();

// 方法二：从m/0的扩展公钥推算m/0/99的公钥地址:
let pub_99b = bitcoin.HDNode.fromBase58(xpub_m_0).derive(99).getAddress();

// 比较公钥地址是否相同:
console.log(pub_99a);
console.log(pub_99b);
```

但不能从xpub推算硬化的子公钥：

```x-javascript
const bitcoin = require('bitcoinjs-lib');

let
    xprv = 'xprv9s21ZrQH143K4EKMS3q1vbJo564QAbs98BfXQME6nk8UCrnXnv8vWg9qmtup3kTug96p5E3AvarBhPMScQDqMhEEm41rpYEdXBL8qzVZtwz',
    root = bitcoin.HDNode.fromBase58(xprv);

// m/0:
let
    m_0 = root.derive(0),
    xprv_m_0 = m_0.toBase58(),
    xpub_m_0 = m_0.neutered().toBase58();

// 从m/0的扩展私钥推算m/0/99'的公钥地址:
let pub_99a = bitcoin.HDNode.fromBase58(xprv_m_0).deriveHardened(99).getAddress();
console.log(pub_99a);

// 不能从m/0的扩展公钥推算m/0/99'的公钥地址:
bitcoin.HDNode.fromBase58(xpub_m_0).deriveHardened(99).getAddress();
```

### BIP-44

HD钱包理论上有无限的层级，对使用secp256k1算法的任何币都适用。但是，如果一种钱包使用`m/1/2/x`，另一种钱包使用`m/3/4/x`，没有一种统一的规范，就会乱套。

比特币的[BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)规范定义了一种如何派生私钥的标准，它本身非常简单：

```plain
m / purpose' / coin_type' / account' / change / address_index
```

其中，`purpose`总是`44`，`coin_type`在[SLIP-44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)中定义，例如，`0=BTC`，`2=LTC`，`60=ETH`等。`account`表示用户的某个“账户”，由用户自定义索引，`change=0`表示外部交易，`change=1`表示内部交易，`address_index`则是真正派生的索引为0～2<sup>31</sup>的地址。

例如，某个比特币钱包给用户创建的一组HD地址实际上是：

- m/44'/0'/0'/0/0
- m/44'/0'/0'/0/1
- m/44'/0'/0'/0/2
- m/44'/0'/0'/0/3
- ...

如果是莱特币钱包，则用户的HD地址是：

- m/44'/2'/0'/0/0
- m/44'/2'/0'/0/1
- m/44'/2'/0'/0/2
- m/44'/2'/0'/0/3
- ...

### 小结

实现了BIP-44规范的钱包可以管理所有币种。相同的根扩展私钥在不同钱包上派生的一组地址都是相同的。
