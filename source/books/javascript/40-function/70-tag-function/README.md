# 标签函数

前面我们介绍了[模板字符串](../../quick-start/string/index.html)，它可以非常方便地引用变量，并合并出最终的字符串：

```x-javascript
let name = '小明';
let age = 20;
let s = `你好, ${name}, 你今年${age}岁了!`;
console.log(s);
```

对于模板字符串，除了方便引用变量构造字符串外，还有一种更强大的功能，即可以使用标签函数（Tag Function）。

什么是标签函数？让我们看一个例子：

```x-javascript
const email = "test@example.com";
const password = 'hello123';

function sql(strings, ...exps) {
    console.log(`SQL: ${strings.join('?')}`);
    console.log(`SQL parameters: ${JSON.stringify(exps)}`);
    return {
        name: '小明',
        age: 20
    };
}

const result = sql`SELECT * FROM users WHERE email=${email} AND password=${password}`;

console.log(JSON.stringify(result));
```

这里出现了一个奇怪的语法：

```javascript
sql`SELECT * FROM users WHERE email=${email} AND password=${password}`
```

模板字符串前面以`sql`开头，实际上这是一个标签函数，上述语法会自动转换为对`sql()`函数的调用。我们关注的是，传入`sql()`函数的参数是什么。

`sql()`函数实际上接收两个参数：

第一个参数`strings`是一个字符串数组，它是`["SELECT * FROM users WHERE email=", " AND password=", ""]`，即除去`${xxx}`剩下的字符组成的数组；

第二个参数`...exps`是一个可变参数，它接收的也是一个数组，但数组的内容是由模板字符串里所有的`${xxx}`的实际值组成，即`["test@example.com", "hello123"]`，因为解析`${email}`得到`"test@example.com"`，解析`${password}`得到`"hello123"`。

标签函数`sql()`实际上是一个普通函数，我们在内部把`strings`拼接成一个SQL字符串，把`...exps`作为参数，就可以实现一个安全的SQL查询，并返回查询结果。此处并没有真正的数据库连接，因此返回一个固定的Object。

标签函数和普通函数的定义区别仅仅在于参数，如果我们想对数据库进行修改，完全可以定义一个标签函数如下：

```javascript
function update(strings, ...exps) {
    let sql = strings.join('?');
    // 执行数据库更新
    // TODO:
}
```

函数调用可以简化为带标签的模板字符串：

```javascript
let id = 123;
let age = 21;
let score = 'A';

update`UPDATE users SET age=${age}, score=${score} WHERE id=${id}`;
```

是不是非常简洁？
