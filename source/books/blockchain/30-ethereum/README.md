# 以太坊

以太坊（Ethereum）是一个支持智能合约的区块链平台，它与比特币最大的不同是，以太坊通过一个虚拟机（EVM）可以运行智能合约。

以太坊是[Vitalik Buterin](https://vitalik.ca/)（维塔利克·布特林，人称V神）在2013年提出的概念，Vitalik最早参与了比特币社区的开发，并希望比特币把功能受限的脚本扩展成图灵完全的编程环境，但没有得到比特币开发社区的认同，于是他决定另起炉灶，打造一个新的区块链平台，目标是运行去中心化的程序。

以太坊从2015年正式启动并运行，期间经历过DAO攻击造成的硬分叉。和比特币类似，以太坊也通过PoW进行挖矿，后改为PoS挖矿，其挖出的平台币叫以太币（Ether），目前每个区块奖励是2 Ether，约13~15秒左右出一个块。

和比特币相比，以太坊在以下几点上有所不同：

### 账户模型

比特币使用的[UTXO模型](../bitcoin/utxo/index.html)是一种对开发友好、易于实现清结算的模型，但对用户不友好，因为普通用户所认知的账户是一个账号、对应余额变动的模型。以太坊的账户模型和比特币不同，它就是余额模型，即交易引发账户余额的变动，这与传统金融账户一致。

### 智能合约

从比特币的[可编程支付原理](../bitcoin/pay/index.html)可知，任何支付实际上都是在执行比特币脚本，只有脚本成功执行，支付才能成功。

以太坊的交易与之类似，并且更进一步，它实现了一个图灵完备的脚本语言，运行在EVM（Ethereum Virtual Machine，以太坊虚拟机）中，任何人都可以编写合法的脚本来执行任意逻辑（有很多限制），例如，定义一种新的代币，抵押贷款等。
