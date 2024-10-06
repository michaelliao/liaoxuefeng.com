# crypto

crypto模块的目的是为了提供通用的加密和哈希算法。用纯JavaScript代码实现这些功能不是不可能，但速度会非常慢。Nodejs用C/C++实现这些算法后，通过cypto这个模块暴露为JavaScript接口，这样用起来方便，运行速度也快。

### MD5和SHA1

MD5是一种常用的哈希算法，用于给任意数据一个“签名”。这个签名通常用一个十六进制的字符串表示：

```javascript
import crypto from 'node:crypto';

const hash = crypto.createHash('md5');

// 可任意多次调用update():
hash.update('Hello, world!');
hash.update('Hello, nodejs!');

console.log(hash.digest('hex')); // 7e1977739c748beac0c0fd14fd26a544
```

`update()`方法默认字符串编码为`UTF-8`，也可以传入Buffer。

如果要计算SHA1，只需要把`'md5'`改成`'sha1'`，就可以得到SHA1的结果。还可以使用更安全的`sha256`和`sha512`。

### Hmac

Hmac算法也是一种哈希算法，它可以利用MD5或SHA1等哈希算法。不同的是，Hmac还需要一个密钥：

```javascript
import crypto from 'node:crypto';

const hmac = crypto.createHmac('sha256', 'secret-key');

hmac.update('Hello, world!');
hmac.update('Hello, nodejs!');

console.log(hmac.digest('hex')); // 80f7e22570...
```

只要密钥发生了变化，那么同样的输入数据也会得到不同的签名，因此，可以把Hmac理解为用随机数“增强”的哈希算法。

### AES

AES是一种常用的对称加密算法，加解密都用同一个密钥。crypto模块提供了AES支持，但是需要自己封装好函数，便于使用：

```javascript
import crypto from 'node:crypto';

function aes_encrypt(key, iv, msg) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    // input encoding: utf8
    // output encoding: hex
    let encrypted = cipher.update(msg, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function aes_decrypt(key, iv, encrypted) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// key的长度必须为32bytes:
let key = 'Passw0rdPassw0rdPassw0rdPassw0rd';
// iv的长度必须为16bytes:
let iv = 'a1b2c3d4e5f6g7h8';
let msg = 'Hello, world!';
// 加密:
let encrypted_msg = aes_encrypt(key, iv, msg);
// 解密:
let decrypted_msg = aes_decrypt(key, iv, encrypted_msg);

console.log(`AES encrypt: ${encrypted_msg}`);
console.log(`AES decrypt: ${decrypted_msg}`);
```

运行结果如下：

```
AES encrypt: 11cd65e5fe7e7448b491efabee2f326a
AES decrypt: Hello, world!
```

可以看出，加密后的字符串通过解密又得到了原始内容。

注意到AES有很多不同的算法，如`aes192`，`aes-128-ecb`，`aes-256-cbc`等，AES除了密钥外还可以指定IV（Initial Vector），不同的系统只要IV不同，用相同的密钥加密相同的数据得到的加密结果也是不同的。加密结果通常有两种表示方法：hex和base64，这些功能Node.js全部都支持，但是在应用中要注意，如果加解密双方一方用Nodejs，另一方用Java、PHP等其它语言，需要仔细测试。如果无法正确解密，要确认双方是否遵循同样的AES算法，密钥和IV是否相同，加密后的数据是否统一为hex或base64格式。

### Diffie-Hellman

DH算法是一种密钥交换协议，它可以让双方在不泄漏密钥的情况下协商出一个密钥来。DH算法基于数学原理，比如小明和小红想要协商一个密钥，可以这么做：

1. 小明先选一个素数和一个底数，例如，素数`p=97`，底数`g=5`（底数是p的一个原根），再选择一个秘密整数`a=123`，计算`A=g^a mod p=34`，然后大声告诉小红：`p=97，g=5，A=34`；
2. 小红收到小明发来的`p`，`g`，`A`后，也选一个秘密整数`b=456`，然后计算`B=g^b mod p=75`，并大声告诉小明：`B=75`；
3. 小明自己计算出`s=B^a mod p=22`，小红也自己计算出`s=A^b mod p=22`，因此，最终协商的密钥`s`为`22`。

在这个过程中，密钥`22`并不是小明告诉小红的，也不是小红告诉小明的，而是双方协商计算出来的。第三方只能知道`p=97`，`g=5`，`A=34`，`B=75`，由于不知道双方选的秘密整数`a=123`和`b=456`，因此无法计算出密钥`22`。

用crypto模块实现DH算法如下：

```javascript
import crypto from 'node:crypto';

// xiaoming's keys:
let ming = crypto.createDiffieHellman(512);
let ming_keys = ming.generateKeys();

let prime = ming.getPrime();
let generator = ming.getGenerator();

console.log('Prime: ' + prime.toString('hex'));
console.log('Generator: ' + generator.toString('hex'));

// xiaohong's keys:
let hong = crypto.createDiffieHellman(prime, generator);
let hong_keys = hong.generateKeys();

// exchange and generate secret:
let ming_secret = ming.computeSecret(hong_keys);
let hong_secret = hong.computeSecret(ming_keys);

// print secret:
console.log('Secret of Xiao Ming: ' + ming_secret.toString('hex'));
console.log('Secret of Xiao Hong: ' + hong_secret.toString('hex'));
```

运行后，可以得到如下输出：

```plain
Prime: a8224c...deead3
Generator: 02
Secret of Xiao Ming: 695308...d519be
Secret of Xiao Hong: 695308...d519be
```

注意每次输出都不一样，因为素数的选择是随机的。

### RSA

RSA算法是一种非对称加密算法，即由一个私钥和一个公钥构成的密钥对，通过私钥加密，公钥解密，或者通过公钥加密，私钥解密。其中，公钥可以公开，私钥必须保密。

RSA算法是1977年由Ron Rivest、Adi Shamir和Leonard Adleman共同提出的，所以以他们三人的姓氏的头字母命名。

当小明给小红发送信息时，可以用小明自己的私钥加密，小红用小明的公钥解密，也可以用小红的公钥加密，小红用她自己的私钥解密，这就是非对称加密。相比对称加密，非对称加密只需要每个人各自持有自己的私钥，同时公开自己的公钥，不需要像AES那样由两个人共享同一个密钥。

在使用Node进行RSA加密前，我们先要准备好私钥和公钥。

首先，在命令行执行以下命令以生成一个RSA密钥对：

```plain
openssl genrsa -aes256 -out rsa-key.pem 2048
```

根据提示输入密码，这个密码是用来加密RSA密钥的，加密方式指定为AES256，生成的RSA的密钥长度是2048位。执行成功后，我们获得了加密的`rsa-key.pem`文件。

第二步，通过上面的`rsa-key.pem`加密文件，我们可以导出原始的私钥，命令如下：

```plain
openssl rsa -in rsa-key.pem -outform PEM -out rsa-prv.pem
```

输入第一步的密码，我们获得了解密后的私钥。

类似的，我们用下面的命令导出原始的公钥：

```plain
openssl rsa -in rsa-key.pem -outform PEM -pubout -out rsa-pub.pem
```

这样，我们就准备好了原始私钥文件`rsa-prv.pem`和原始公钥文件`rsa-pub.pem`，编码格式均为PEM。

下面，使用`crypto`模块提供的方法，即可实现非对称加解密。

首先，我们用私钥加密，公钥解密：

```javascript
import fs from 'node:fs';
import crypto from 'node:crypto';

// 从文件加载key:
function loadKey(file) {
    // key实际上就是PEM编码的字符串:
    return fs.readFileSync(file, 'utf8');
}

let
    prvKey = loadKey('./rsa-prv.pem'),
    pubKey = loadKey('./rsa-pub.pem'),
    message = 'Hello, world!';

// 使用私钥加密:
let enc_by_prv = crypto.privateEncrypt(prvKey, Buffer.from(message, 'utf8'));
console.log(enc_by_prv.toString('hex'));

let dec_by_pub = crypto.publicDecrypt(pubKey, enc_by_prv);
console.log(dec_by_pub.toString('utf8'));
```

执行后，可以得到解密后的消息，与原始消息相同。

接下来我们使用公钥加密，私钥解密：

```javascript
// 使用公钥加密:
let enc_by_pub = crypto.publicEncrypt(pubKey, Buffer.from(message, 'utf8'));
console.log(enc_by_pub.toString('hex'));

// 使用私钥解密:
let dec_by_prv = crypto.privateDecrypt(prvKey, enc_by_pub);
console.log(dec_by_prv.toString('utf8'));
```

执行得到的解密后的消息仍与原始消息相同。

如果我们把`message`字符串的长度增加到很长，例如1M，这时，执行RSA加密会得到一个类似这样的错误：`data too large for key size`，这是因为RSA加密的原始信息必须小于Key的长度。那如何用RSA加密一个很长的消息呢？实际上，RSA并不适合加密大数据，而是先生成一个随机的AES密码，用AES加密原始信息，然后用RSA加密AES口令，这样，实际使用RSA时，给对方传的密文分两部分，一部分是AES加密的密文，另一部分是RSA加密的AES口令。对方用RSA先解密出AES口令，再用AES解密密文，即可获得明文。

### 证书

crypto模块也可以处理数字证书。数字证书通常用在SSL连接，也就是Web的https连接。一般情况下，https连接只需要处理服务器端的单向认证，如无特殊需求（例如自己作为Root给客户发认证证书），建议用反向代理服务器如Nginx等Web服务器去处理证书。

### 参考源码

- [crypto常用算法](crypto.zip)
