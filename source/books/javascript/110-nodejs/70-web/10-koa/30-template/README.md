# 使用Nunjucks

Nunjucks是什么东东？其实它是一个模板引擎。

那什么是模板引擎？

模板引擎就是基于模板配合数据构造出字符串输出的一个组件。比如下面的函数就是一个模板引擎：

```javascript
function examResult (data) {
    return `${data.name}同学一年级期末考试语文${data.chinese}分，数学${data.math}分，位于年级第${data.ranking}名。`
}
```

如果我们输入数据如下：

```javascript
examResult({
    name: '小明',
    chinese: 78,
    math: 87,
    ranking: 999
});
```

该模板引擎把模板字符串里面对应的变量替换以后，就可以得到以下输出：

```plain
小明同学一年级期末考试语文78分，数学87分，位于年级第999名。
```

模板引擎最常见的输出就是输出网页，也就是HTML文本。当然，也可以输出任意格式的文本，比如Text，XML，Markdown等等。

有同学要问了：既然JavaScript的模板字符串可以实现模板功能，那为什么我们还需要另外的模板引擎？

因为JavaScript的模板字符串必须写在JavaScript代码中，要想写出新浪首页这样复杂的页面，是非常困难的。

输出HTML有几个特别重要的问题需要考虑：

#### 转义

对特殊字符要转义，避免受到XSS攻击。比如，如果变量`name`的值不是`小明`，而是`小明<script>...</script>`，模板引擎输出的HTML到了浏览器，就会自动执行恶意JavaScript代码。

#### 格式化

对不同类型的变量要格式化，比如，货币需要变成`$12,345.00`这样的格式，日期需要变成`2016-01-01`这样的格式。

#### 简单逻辑

模板还需要能执行一些简单逻辑，比如，要按条件输出内容，需要if实现如下输出：

```plain
{{ name }}同学，
{% if score >= 90 %}
    成绩优秀，应该奖励
{% elif score >=60 %}
    成绩良好，继续努力
{% else %}
    不及格，建议回家打屁股
{% endif %}
```

所以，我们需要一个功能强大的模板引擎，来完成页面输出的功能。

### Nunjucks

我们选择Nunjucks作为模板引擎。Nunjucks是Mozilla开发的一个纯JavaScript编写的模板引擎，既可以用在Node环境下，又可以运行在浏览器端。但是，主要还是运行在Node环境下，因为浏览器端有更好的模板解决方案，例如MVVM框架。

如果你使用过Python的模板引擎[jinja2](../../../../../python/web/jinja)，那么使用Nunjucks就非常简单，两者的语法几乎是一模一样的，因为Nunjucks就是用JavaScript重新实现了jinjia2。

从上面的例子我们可以看到，虽然模板引擎内部可能非常复杂，但是使用一个模板引擎是非常简单的，因为本质上我们只需要构造这样一个函数：

```javascript
function render(view, model) {
    // TODO:...
}
```

其中，`view`是模板的名称（又称为视图），因为可能存在多个模板，需要选择其中一个。`model`就是数据，在JavaScript中，它就是一个简单的Object。`render`函数返回一个字符串，就是模板的输出。

下面我们来使用Nunjucks这个模板引擎来编写几个HTML模板，并且用实际数据来渲染模板并获得最终的HTML输出。

我们创建一个`use-nunjucks`的VS Code工程结构如下：

```ascii
use-nunjucks/
├── app.mjs
├── package-lock.json
├── package.json
└── view
    ├── base.html    <-- HTML模板文件
    ├── extend.html  <-- HTML模板文件
    └── hello.html   <-- HTML模板文件
```

其中，模板文件存放在`view`目录中。

我们先用`npm install nunjucks`安装依赖项并在`package.json`中添加`nunjucks`的依赖：

```javascript
"nunjucks": "^3.2.4"
```

注意，模板引擎是可以独立使用的，并不需要依赖koa。

紧接着，我们要编写使用Nunjucks的函数`render`。怎么写？方法是查看Nunjucks的[官方文档](https://mozilla.github.io/nunjucks/)，仔细阅读后，在`app.js`中编写代码如下：

```javascript
import nunjucks from 'nunjucks';

function createEnv(path, { autoescape = true, noCache = false, watch = false, throwOnUndefined = false }, filters = {}) {
    const loader = new nunjucks.FileSystemLoader(path, {
        noCache: noCache,
        watch: watch
    });
    const env = new nunjucks.Environment(loader, {
        autoescape: autoescape,
        throwOnUndefined: throwOnUndefined
    });
    for (let name in filters) {
        env.addFilter(name, filters[name]);
    }
    return env;
}

const env = createEnv('view', {
    noCache: true
}, {
    hex: function (n) {
        return '0x' + n.toString(16);
    }
});
```

变量`env`就表示Nunjucks模板引擎对象，它有一个`render(view, model)`方法，正好传入`view`和`model`两个参数，并返回字符串。

创建`env`需要的参数可以查看文档获知。我们用关键字参数作为默认值，最后使用`new nunjucks.FileSystemLoader('view')`创建一个文件系统加载器，从`view`目录读取模板。

我们编写一个`hello.html`模板文件，放到`view`目录下，内容如下：

```html
<h1>Hello {{ name }}</h1>
```

然后，我们就可以用下面的代码来渲染这个模板：

```javascript
const s = env.render('hello.html', { name: '小明' });
console.log(s);
```

获得输出如下：

```html
<h1>Hello 小明</h1>
```

咋一看，这和使用JavaScript模板字符串没啥区别嘛。不过，试试：

```javascript
const s = env.render('hello.html', { name: '<script>alert("小明")</script>' });
console.log(s);
```

获得输出如下：

```html
<h1>Hello &lt;script&gt;alert("小明")&lt;/script&gt;</h1>
```

这样就避免了输出恶意脚本。

此外，可以使用Nunjucks提供的功能强大的tag，编写条件判断、循环等功能，例如：

```html
<!-- 循环输出名字 -->
<body>
    <h3>Fruits List</h3>
    {% for f in fruits %}
    <p>{{ f }}</p>
    {% endfor %}
</body>
```

Nunjucks模板引擎最强大的功能在于模板的继承。仔细观察各种网站可以发现，网站的结构实际上是类似的，头部、尾部都是固定格式，只有中间页面部分内容不同。如果每个模板都重复头尾，一旦要修改头部或尾部，那就需要改动所有模板。

更好的方式是使用继承。先定义一个基本的网页框架`base.html`：

```html
<html><body>
{% block header %} <h3>Unnamed</h3> {% endblock %}
{% block body %} <div>No body</div> {% endblock %}
{% block footer %} <div>copyright</div> {% endblock %}
</body>
```

`base.html`定义了三个可编辑的块，分别命名为`header`、`body`和`footer`。子模板可以有选择地对块进行重新定义：

```html
{% extends 'base.html' %}

{% block header %}<h1>{{ header }}</h1>{% endblock %}

{% block body %}<p>{{ body }}</p>{% endblock %}
```

然后，我们对子模板进行渲染：

```javascript
console.log(env.render('extend.html', {
    header: 'Hello',
    body: 'bla bla bla...'
}));
```

输出HTML如下：

```html
<html><body>
<h1>Hello</h1>
<p>bla bla bla...</p>
<div>copyright</div> <-- footer没有重定义，所以仍使用父模板的内容
</body>
```

### 性能

最后我们要考虑一下Nunjucks的性能。

对于模板渲染本身来说，速度是非常非常快的，因为就是拼字符串嘛，纯CPU操作。

性能问题主要出现在从文件读取模板内容这一步。这是一个IO操作，在Node.js环境中，我们知道，单线程的JavaScript最不能忍受的就是同步IO，但Nunjucks默认就使用同步IO读取模板文件。

好消息是Nunjucks会缓存已读取的文件内容，也就是说，模板文件最多读取一次，就会放在内存中，后面的请求是不会再次读取文件的，只要我们指定了`noCache: false`这个参数。

在开发环境下，可以关闭cache，这样每次重新加载模板，便于实时修改模板。在生产环境下，一定要打开cache，这样就不会有性能问题。

Nunjucks也提供了异步读取的方式，但是这样写起来很麻烦，有简单的写法我们就不会考虑复杂的写法。保持代码简单是可维护性的关键。

### 参考源码

[use-nunjucks](use-nunjucks.zip)
