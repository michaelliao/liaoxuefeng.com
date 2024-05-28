# 签名

签名算法是使用私钥签名，公钥验证的方法，对一个消息的真伪进行确认。如果一个人持有私钥，他就可以使用私钥对任意的消息进行签名，即通过私钥`sk`对消息`message`进行签名，得到`signature`：

```plain
signature = sign(message, sk);
```

签名的目的是为了证明，该消息确实是由持有私钥`sk`的人发出的，任何其他人都可以对签名进行验证。验证方法是，由私钥持有人公开对应的公钥`pk`，其他人用公钥`pk`对消息`message`和签名`signature`进行验证：

```plain
isValid = verify(message, signature, pk);
```

如果验证通过，则可以证明该消息确实是由持有私钥`sk`的人发出的，并且未经过篡改。

数字签名算法在电子商务、在线支付这些领域有非常重要的作用，因为它能通过密码学理论证明：

1. 签名不可伪造，因为私钥只有签名人自己知道，所以其他人无法伪造签名；
2. 消息不可篡改，如果原始消息被人篡改了，对签名进行验证将失败；
3. 签名不可抵赖，如果对签名进行验证通过了，签名人不能抵赖自己曾经发过这一条消息。

简单地说来，数字签名可以防伪造，防篡改，防抵赖。

对消息进行签名，实际上是对消息的哈希进行签名，这样可以使任意长度的消息在签名前先转换为固定长度的哈希数据。对哈希进行签名相当于保证了原始消息的不可伪造性。

我们来看看使用ECDSA如何通过私钥对消息进行签名。关键代码是通过`sign()`方法签名，并获取一个`ECSignature`对象表示签名：

```x-javascript
const bitcoin = require('bitcoinjs-lib');

let
    message = 'a secret message!', // 原始消息
    hash = bitcoin.crypto.sha256(message), // 消息哈希
    wif = 'KwdMAjGmerYanjeui5SHS7JkmpZvVipYvB2LJGU1ZxJwYvP98617',
    keyPair = bitcoin.ECPair.fromWIF(wif);
// 用私钥签名:
let signature = keyPair.sign(hash).toDER(); // ECSignature对象
// 打印签名:
console.log('signature = ' + signature.toString('hex'));
// 打印公钥以便验证签名:
console.log('public key = ' + keyPair.getPublicKeyBuffer().toString('hex'));
```

`ECSignature`对象可序列化为十六进制表示的字符串。

在获得签名、原始消息和公钥的基础上，可以对签名进行验证。验证签名需要先构造一个*不含*私钥的`ECPair`，然后调用`verify()`方法验证签名：

```x-javascript
const bitcoin = require('bitcoinjs-lib');

let signAsStr = '304402205d0b6e817e01e22ba6ab19c0'
              + 'ab9cdbb2dbcd0612c5b8f990431dd063'
              + '4f5a96530220188b989017ee7e830de5'
              + '81d4e0d46aa36bbe79537774d56cbe41'
              + '993b3fd66686'

let
    signAsBuffer = Buffer.from(signAsStr, 'hex'),
    signature = bitcoin.ECSignature.fromDER(signAsBuffer), // ECSignature对象
    message = 'a secret message!', // 原始消息
    hash = bitcoin.crypto.sha256(message), // 消息哈希
    pubKeyAsStr = '02d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645c',
    pubKeyAsBuffer = Buffer.from(pubKeyAsStr, 'hex'),
    pubKeyOnly = bitcoin.ECPair.fromPublicKeyBuffer(pubKeyAsBuffer); // 从public key构造ECPair

// 验证签名:
let result = pubKeyOnly.verify(hash, signature);
console.log('Verify result: ' + result);
```

注意上述代码只引入了公钥，并没有引入私钥。

修改`signAsStr`、`message`和`pubKeyAsStr`的任意一个变量的任意一个字节，再尝试验证签名，看看是否通过。

比特币对交易数据进行签名和对消息进行签名的原理是一样的，只是格式更加复杂。对交易签名确保了只有持有私钥的人才能够花费对应地址的资金。

### 小结

通过私钥可以对消息进行签名，签名可以保证消息防伪造，防篡改，防抵赖。
