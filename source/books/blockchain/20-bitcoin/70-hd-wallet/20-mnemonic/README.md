# 助记词

从HD钱包的创建方式可知，要创建一个HD钱包，我们必须首先有一个确定的512bit（64字节）的随机数种子。

如果用电脑生成一个64字节的随机数作为种子当然是可以的，但是恐怕谁也记不住。

如果自己想一个句子，例如`bitcoin is awesome`，然后计算SHA-512获得这个64字节的种子，虽然是可行的，但是其安全性取决于自己想的句子到底有多随机。像`bitcoin is awesome`本质上就是3个英文单词构成的随机数，长度太短，所以安全性非常差。

为了解决初始化种子的易用性问题，[BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)规范提出了一种通过助记词来推算种子的算法：

以英文单词为例，首先，挑选2048个常用的英文单词，构造一个数组：

```javascript
const words = ['abandon', 'ability', 'able', ..., 'zoo'];
```

然后，生成128~256位随机数，注意随机数的总位数必须是32的倍数。例如，生成的256位随机数以16进制表示为：

```plain
179e5af5ef66e5da5049cd3de0258c5339a722094e0fdbbbe0e96f148ae80924
```

在随机数末尾加上校验码，校验码取SHA-256的前若干位，并使得总位数凑成11的倍数。上述随机数校验码的二进制表示为`00010000`。

将随机数+校验码按每11 bit一组，得到范围是0~2047的24个整数，把这24个整数作为索引，就得到了最多24个助记词，例如：

```plain
bleak version runway tell hour unfold donkey defy digital abuse glide please omit much cement sea sweet tenant demise taste emerge inject cause link
```

由于在生成助记词的过程中引入了校验码，所以，助记词如果弄错了，软件可以提示用户输入的助记词可能不对。

生成助记词的过程是计算机随机产生的，用户只要记住这些助记词，就可以根据助记词推算出HD钱包的种子。

```alert type=caution title=警告
千万不要自己挑选助记词，原因一是随机性太差，二是缺少校验。
```

生成助记词可以使用[bip39](https://github.com/bitcoinjs/bip39)这个JavaScript库：

```x-javascript
const bip39 = require('bip39');

let words = bip39.generateMnemonic(256);
console.log(words);

console.log('is valid mnemonic? ' + bip39.validateMnemonic(words));
```

运行上述代码，每次都会得到随机生成的不同的助记词。

如果想用中文作助记词也是可以的，给`generateMnemonic()`传入一个中文助记词数组即可：

```x-javascript
const bip39 = require('bip39');

// 第二个参数rng可以为null:
let words = bip39.generateMnemonic(256, null, bip39.wordlists.chinese_simplified);
console.log(words);
```

注意：同样索引的中文和英文生成的HD种子是不同的。各种语言的助记词定义在[bip-0039-wordlists.md](https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md)。

### 根据助记词推算种子

根据助记词推算种子的算法是PBKDF2，使用的哈希函数是Hmac-SHA512，其中，输入是助记词的UTF-8编码，并设置Key为`mnemonic`+用户口令，循环2048次，得到最终的64字节种子。上述助记词加上口令`bitcoin`得到的HD种子是：

```plain
b59a8078d4ac5c05b0c92b775b96a466cd136664bfe14c1d49aff3ccc94d52dfb1d59ee628426192eff5535d6058cb64317ef2992c8b124d0f72af81c9ebfaaa
```

该种子即为HD钱包的种子。

```alert type=caution title=助记词口令
要特别注意：用户除了需要记住助记词外，还可以额外设置一个口令。HD种子的生成依赖于助记词和口令，丢失助记词或者丢失口令（如果设置了口令的话）都将导致HD钱包丢失！
```

用JavaScript代码实现为：

```x-javascript
const bip39 = require('bip39');

let words = bip39.generateMnemonic(256);
console.log(words);

let seedBuffer = bip39.mnemonicToSeed(words);
let seedAsHex = seedBuffer.toString('hex');
// or use bip39.mnemonicToSeedHex(words)
console.log(seedAsHex);
```

根据助记词和口令生成HD种子的方法是在`mnemonicToSeed()`函数中传入password：

```x-javascript
const bip39 = require('bip39');

let words = bip39.generateMnemonic(256);
console.log(words);

let password = 'bitcoin';

let seedAsHex = bip39.mnemonicToSeedHex(words, password);
console.log(seedAsHex);
```

从助记词算法可知，只要确定了助记词和口令，生成的HD种子就是确定的。

如果两个人的助记词相同，那么他们的HD种子也是相同的。这也意味着如果把助记词抄在纸上，一旦泄漏，HD种子就泄漏了。

如果在助记词的基础上设置了口令，那么只知道助记词，不知道口令，也是无法推算出HD种子的。

把助记词抄在纸上，口令记在脑子里，这样，泄漏了助记词也不会导致HD种子被泄漏，但要牢牢记住口令。

最后，我们使用助记词+口令的方式来生成一个HD钱包的HD种子并计算出根扩展私钥：

```x-javascript
const
    bitcoin = require('bitcoinjs-lib'),
    bip39 = require('bip39');

let
    words = 'bleak version runway tell hour unfold donkey defy digital abuse glide please omit much cement sea sweet tenant demise taste emerge inject cause link',
    password = 'bitcoin';

// 计算seed:
let seedHex = bip39.mnemonicToSeedHex(words, password);
console.log('seed: ' + seedHex); // b59a8078...c9ebfaaa

// 生成root:
let root = bitcoin.HDNode.fromSeedHex(seedHex);
console.log('xprv: ' + root.toBase58()); // xprv9s21ZrQH...uLgyr9kF
console.log('xpub: ' + root.neutered().toBase58()); // xpub661MyMwA...oy32fcRG

// 生成派生key:
let child0 = root.derivePath("m/44'/0'/0'/0/0");
console.log("prv m/44'/0'/0'/0/0: " + child0.keyPair.toWIF()); // KzuPk3PXKdnd6QwLqUCK38PrXoqJfJmACzxTaa6TFKzPJR7H7AFg
console.log("pub m/44'/0'/0'/0/0: " + child0.getAddress()); // 1PwKkrF366RdTuYsS8KWEbGxfP4bikegcS
```

可以通过[https://iancoleman.io/bip39/](https://iancoleman.io/bip39/)在线测试BIP-39并生成HD钱包。请注意，该网站仅供测试使用。生成正式使用的HD钱包必须在*可信任的离线环境*下操作。

### 小结

BIP-39规范通过使用助记词+口令来生成HD钱包的种子，用户只需记忆助记词和口令即可随时恢复HD钱包。

丢失助记词或者丢失口令均会导致HD钱包丢失。
