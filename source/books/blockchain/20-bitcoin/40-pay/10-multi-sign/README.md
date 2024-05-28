# 多重签名

由比特币的签名机制可知，如果丢失了私钥，没有任何办法可以花费对应地址的资金。

这样就使得因为丢失私钥导致资金丢失的风险会很高。为了避免一个私钥的丢失导致地址的资金丢失，比特币引入了多重签名机制，可以实现分散风险的功能。

具体来说，就是假设N个人分别持有N个私钥，只要其中M个人同意签名就可以动用某个“联合地址”的资金。

多重签名地址实际上是一个Script Hash，以2-3类型的多重签名为例，它的创建过程如下：

```x-javascript
const bitcoin = require('bitcoinjs-lib');

let
    pubKey1 = '026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01',
    pubKey2 = '02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9',
    pubKey3 = '03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9',
    pubKeys = [pubKey1, pubKey2, pubKey3].map(s => Buffer.from(s, 'hex')); // 注意把string转换为Buffer

// 创建2-3 RedeemScript:
let redeemScript = bitcoin.script.multisig.output.encode(2, pubKeys);
console.log('Redeem script: ' + redeemScript.toString('hex'));

// 编码:
let scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript));
let address = bitcoin.address.fromOutputScript(scriptPubKey);

console.log('Multisig address: ' + address); // 36NUkt6FWUi3LAWBqWRdDmdTWbt91Yvfu7
```

首先，我们需要所有公钥列表，这里是3个公钥。然后，通过`bitcoin.script.multisig.output.encode()`方法编码为2-3类型的脚本，对这个脚本计算hash160后，使用Base58编码即得到总是以`3`开头的多重签名地址，这个地址实际上是一个脚本哈希后的编码。

```alert type=tip title=多重签名地址
以3开头的地址就是比特币的多重签名地址，但从地址本身无法得知签名所需的M/N。
```

如果我们观察Redeem Script的输出，它的十六进制实际上是：

```plain
52
21 026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01
21 02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9
21 03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9
53
ae
```

翻译成比特币的脚本指令就是：

```plain
OP_2
PUSHDATA(33) 026477115981fe981a6918a6297d9803c4dc04f328f22041bedff886bbc2962e01
PUSHDATA(33) 02c96db2302d19b43d4c69368babace7854cc84eb9e061cde51cfa77ca4a22b8b9
PUSHDATA(33) 03c6103b3b83e4a24a0e33a4df246ef11772f9992663db0c35759a5e2ebf68d8e9
OP_3
OP_CHECKMULTISIG
```

`OP_2`和`OP_3`构成2-3多重签名，这两个指令中间的3个`PUSHDATA(33)`就是我们指定的3个公钥，最后一个`OP_CHECKMULTISIG`表示需要验证多重签名。

发送给多重签名地址的交易创建的是P2SH脚本，而花费多重签名地址的资金需要的脚本就是M个签名+Redeem Script。

注意：从多重签名的地址本身并无法得知该多重签名使用的公钥，以及M-N的具体数值。必须将Redeem Script公示给每个私钥持有人，才能够验证多重签名地址是否正确（即包含了所有人的公钥，以及正确的M-N数值）。要花费多重签名地址的资金，除了M个私钥签名外，必须要有Redeem Script（可由所有人的公钥构造）。只有签名，没有Redeem Script是不能构造出解锁脚本来花费资金的。因此，保存多重签名地址的钱包必须同时保存Redeem Script。

利用多重签名，可以实现：

- 1-2，两人只要有一人同意即可使用资金；
- 2-2，两人必须都同意才可使用资金；
- 2-3，3人必须至少两人同意才可使用资金；
- 4-7，7人中多数人同意才可使用资金。

最常见的多重签名是2-3类型。例如，一个提供在线钱包的服务，为了防止服务商盗取用户的资金，可以使用2-3类型的多重签名地址，服务商持有1个私钥，用户持有两个私钥，一个作为常规使用，一个作为应急使用。这样，正常情况下，用户只需使用常规私钥即可配合服务商完成正常交易，服务商因为只持有1个私钥，因此无法盗取用户资金。如果服务商倒闭或者被黑客攻击，用户可使用自己掌握的两个私钥转移资金。

大型机构的比特币通常都使用多重签名地址以保证安全。例如，某个交易所的3-6多重签名地址[3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r](https://btc.com/btc/address/3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r)。

利用多重签名，可以使得私钥丢失的风险被分散到N个人手中，并且，避免了少数人窃取资金的问题。

比特币的多重签名最多允许15个私钥参与签名，即可实现1-2至15-15的任意组合（1⩽M⩽N⩽15）。

### 小结

多重签名可以实现N个人持有私钥，其中M个人同意即可花费资金的功能。

多重签名降低了单个私钥丢失的风险。

支付比特币到一个多重签名地址实际上是创建一个P2SH输出。
