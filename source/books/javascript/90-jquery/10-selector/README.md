# 选择器

选择器是jQuery的核心。一个选择器写出来类似`$('#dom-id')`。

为什么jQuery要发明选择器？回顾一下DOM操作中我们经常使用的代码：

```javascript
// 按ID查找：
let a = document.getElementById('dom-id');

// 按tag查找：
let divs = document.getElementsByTagName('div');

// 查找<p class="red">：
let ps = document.getElementsByTagName('p');
// 过滤出class="red":
// TODO:

// 查找<table class="green">里面的所有<tr>：
let table = ...
for (let i=0; i<table.children; i++) {
    // TODO: 过滤出<tr>
}
```

这些代码实在太繁琐了，并且，在层级关系中，例如，查找`<table class="green">`里面的所有`<tr>`，一层循环实际上是错的，因为`<table>`的标准写法是：

```html
<table>
    <tbody>
        <tr>...</tr>
        <tr>...</tr>
    </tbody>
</table>
```

很多时候，需要递归查找所有子节点。

jQuery的选择器就是帮助我们快速定位到一个或多个DOM节点。

### 按ID查找

如果某个DOM节点有`id`属性，利用jQuery查找如下：

```javascript
// 查找<div id="abc">:
let div = $('#abc');
```

*注意*，`#abc`以`#`开头。返回的对象是jQuery对象。

什么是jQuery对象？jQuery对象类似数组，它的每个元素都是一个引用了DOM节点的对象。

以上面的查找为例，如果`id`为`abc`的`<div>`存在，返回的jQuery对象如下：

```javascript
[<div id="abc">...</div>]
```

如果`id`为`abc`的`<div>`不存在，返回的jQuery对象如下：

```javascript
[]
```

总之jQuery的选择器不会返回`undefined`或者`null`，这样的好处是你不必在下一行判断`if (div === undefined)`。

jQuery对象和DOM对象之间可以互相转化：

```javascript
let div = $('#abc'); // jQuery对象
let divDom = div.get(0); // 假设存在div，获取第1个DOM元素
let another = $(divDom); // 重新把DOM包装为jQuery对象
```

通常情况下你不需要获取DOM对象，直接使用jQuery对象更加方便。如果你拿到了一个DOM对象，那可以简单地调用`$(aDomObject)`把它变成jQuery对象，这样就可以方便地使用jQuery的API了。

### 按tag查找

按tag查找只需要写上tag名称就可以了：

```javascript
let ps = $('p'); // 返回所有<p>节点
ps.length; // 数一数页面有多少个<p>节点
```

### 按class查找

按class查找注意在class名称前加一个`.`：

```javascript
let a = $('.red'); // 所有节点包含`class="red"`都将返回
// 例如:
// <div class="red">...</div>
// <p class="green red">...</p>
```

通常很多节点有多个class，我们可以查找同时包含`red`和`green`的节点：

```javascript
let a = $('.red.green'); // 注意没有空格！
// 符合条件的节点：
// <div class="red green">...</div>
// <div class="blue green red">...</div>
```

### 按属性查找

一个DOM节点除了`id`和`class`外还可以有很多属性，很多时候按属性查找会非常方便，比如在一个表单中按属性来查找：

```javascript
let email = $('[name=email]'); // 找出<??? name="email">
let passwordInput = $('[type=password]'); // 找出<??? type="password">
let a = $('[items="A B"]'); // 找出<??? items="A B">
```

当属性的值包含空格等特殊字符时，需要用双引号括起来。

按属性查找还可以使用前缀查找或者后缀查找：

```javascript
let icons = $('[name^=icon]'); // 找出所有name属性值以icon开头的DOM
// 例如: name="icon-1", name="icon-2"
let names = $('[name$=with]'); // 找出所有name属性值以with结尾的DOM
// 例如: name="startswith", name="endswith"
```

这个方法尤其适合通过class属性查找，且不受class包含多个名称的影响：

```javascript
let icons = $('[class^="icon-"]'); // 找出所有class包含至少一个以`icon-`开头的DOM
// 例如: class="icon-clock", class="abc icon-home"
```

### 组合查找

组合查找就是把上述简单选择器组合起来使用。如果我们查找`$('[name=email]')`，很可能把表单外的`<div name="email">`也找出来，但我们只希望查找`<input>`，就可以这么写：

```javascript
let emailInput = $('input[name=email]'); // 不会找出<div name="email">
```

同样的，根据tag和class来组合查找也很常见：

```javascript
let tr = $('tr.red'); // 找出<tr class="red ...">...</tr>
```

### 多项选择器

多项选择器就是把多个选择器用`,`组合起来一块选：

```javascript
$('p,div'); // 把<p>和<div>都选出来
$('p.red,p.green'); // 把<p class="red">和<p class="green">都选出来
```

要注意的是，选出来的元素是按照它们在HTML中出现的顺序排列的，而且不会有重复元素。例如，`<p class="red green">`不会被上面的`$('p.red,p.green')`选择两次。

### 练习

使用jQuery选择器分别选出指定元素：

- 仅选择JavaScript
- 仅选择Erlang
- 选择JavaScript和Erlang
- 选择所有编程语言
- 选择名字input
- 选择邮件和名字input

```html
<!-- HTML结构 -->
<div id="test-jquery">
    <p id="para-1" class="color-red">JavaScript</p>
    <p id="para-2" class="color-green">Haskell</p>
    <p class="color-red color-green">Erlang</p>
    <p name="name" class="color-black">Python</p>
    <form class="test-form" target="_blank" action="#0" onsubmit="return false;">
        <legend>注册新用户</legend>
        <fieldset>
            <p><label>名字: <input name="name"></label></p>
            <p><label>邮件: <input name="email"></label></p>
            <p><label>口令: <input name="password" type="password"></label></p>
            <p><button type="submit">注册</button></p>
        </fieldset>
    </form>
</div>
```

<div id="test-jquery">
    <p id="para-1" class="color-red">JavaScript</p>
    <p id="para-2" class="color-green">Haskell</p>
    <p class="color-red color-green">Erlang</p>
    <p name="name" class="color-black">Python</p>
    <form class="test-form" target="_blank" action="#0" onsubmit="return false;">
        <legend>注册新用户</legend>
        <fieldset>
            <p><label>名字: <input name="name"></label></p>
            <p><label>邮件: <input name="email"></label></p>
            <p><label>口令: <input name="password" type="password"></label></p>
            <p><button type="submit">注册</button></p>
        </fieldset>
    </form>
</div>

运行查看结果：

```x-javascript
let selected = null;

selected = ???;

// 高亮结果:
if (!(selected instanceof jQuery)) {
    return console.log('不是有效的jQuery对象!');
}
$('#test-jquery').find('*').css('background-color', '');
selected.css('background-color', '#ff8000');
```
