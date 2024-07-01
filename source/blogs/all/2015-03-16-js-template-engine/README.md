# 编写一个简单的JavaScript模板引擎

随着Nodejs的流行，JavaScript在前端和后端都开始流行起来。有许多成熟的JavaScript模板引擎，例如[Nunjucks](https://mozilla.github.io/nunjucks/)，既可以用在后端，又可以用在前端。

不过很多时候，前端模板仅仅需要简单地创建一个HTML片段，用Nunjucks这种全功能模板有点大材小用。我们来尝试自己编写一个简单的前端模板引擎，实际上并不复杂。

在编写前端模板引擎代码之前，我们应该想好如何来调用它，即这个模板引擎的接口应该是什么样的。我们希望这样调用它：

```javascript
// 创建一个模板引擎:
var tpl = new Template('<p>Today: { date }</p>\n<a href="/{ user.id|safe }">{ user.company }</a>');
// 渲染得到HTML片段:
var model = {
    date: 20150316,
    user: {
        id: 'A-000&001',
        company: 'AT&T'
    }
};
var html = tpl.render(model);
console.log(html);
// <p>Today: 20150316</p>
// <a href="/A-000&001">AT&amp;T</a>
```

因此，一个模板引擎就是把一个字符串中的变量用`model`的变量替换掉，就完成了。

像Nunjucks这种类Jinja2的模板引擎，它可以替换`{{ model.prop }}`这样的变量。

我们选用`{ model.prop }`来实现我们自己的变量替换，基本思想是用一个正则表达式来匹配`{ xxx.xxx }`：

```javascript
var re = /\{\s*([a-zA-Z\.\_0-9()]+)\s*\}/m
var match = re.exec('a { template } string');
```

如果正则匹配成功，则`match`不为空，`match[0]`是匹配到的字符串`{ template }`，`match[1]`是捕获的变量`template`，`match.index`是匹配的索引。

只要不断地匹配到变量，然后用`model`的内容替换，就可以得到最终的HTML。但是，分析`user.addr.zipcode`然后去`model`中查找并不容易。而且，模板应该可以预编译，这样，后续渲染速度就会很快。

JavaScript允许用`new Function('source')`来通过字符串创建一个函数，这个函数和我们用`function ()`定义的函数是一模一样的，因此，一个模板引擎的编译过程就是创建一个函数，然后调用该函数就实现了模板渲染。

需要编译的函数代码应该像这样：

```javascript
function () {
    var r = [];
    r.push('<p>Today: ');
    r.push(this.date);
    r.push('</p>\n<a href="/');
    r.push(this.user.id);
    r.push('">');
    r.push(this.user.company);
    r.push('</a>');
    return r.join('');
}
```

注意到变量名从`variable.prop`变成了`this.variable.prop`，是因为调用该函数时我们会把`model`绑定到`this`变量上。

因此，模板引擎的代码如下：

```javascript
function Template(tpl) {
    var
        fn,
        match,
        code = ['var r=[];'],
        re = /\{\s*([a-zA-Z\.\_0-9()]+)\s*\}/m,
        addLine = function (text) {
            code.push('r.push(\'' + text.replace(/\'/g, '\\\'').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '\');');
        };
    while (match = re.exec(tpl)) {
        if (match.index > 0) {
            addLine(tpl.slice(0, match.index));
        }
        code.push('r.push(this.' + match[1] + ');');
        tpl = tpl.substring(match.index + match[0].length);
    }
    addLine(tpl);
    code.push('return r.join(\'\');');
    // 创建函数:
    fn = new Function(code.join('\n'));
    // 用render()调用函数并绑定this参数：
    this.render = function (model) {
        return fn.apply(model);
    };
}
```

现在，这个简单的模板引擎已经可以工作了。但是它还有几个小问题需要解决，一是默认的变量在替换时应该做HTML转义，二是如果某些不需要转义的变量，可以用`{ user.id|safe }`这样的表达式表示`user.id`无需转义。

经过HTML转义和`{ variable|safe }`处理的最终代码如下：

```javascript
function Template(tpl) {
    var
        fn,
        match,
        code = ['var r=[];\nvar _html = function (str) { return str.replace(/&/g, \'&amp;\').replace(/"/g, \'&quot;\').replace(/\'/g, \'&#39;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\'); };'],
        re = /\{\s*([a-zA-Z\.\_0-9()]+)(\s*\|\s*safe)?\s*\}/m,
        addLine = function (text) {
            code.push('r.push(\'' + text.replace(/\'/g, '\\\'').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '\');');
        };
    while (match = re.exec(tpl)) {
        if (match.index > 0) {
            addLine(tpl.slice(0, match.index));
        }
        if (match[2]) {
            code.push('r.push(String(this.' + match[1] + '));');
        }
        else {
            code.push('r.push(_html(String(this.' + match[1] + ')));');
        }
        tpl = tpl.substring(match.index + match[0].length);
    }
    addLine(tpl);
    code.push('return r.join(\'\');');
    fn = new Function(code.join('\n'));
    this.render = function (model) {
        return fn.apply(model);
    };
}
```

现在就可以用我们预设的代码来使用这个模板引擎了。不过，把模板写在字符串中也不是一个好办法。最佳解决方案是利用`<script>`标签，把模板写在里面，注意一定要加上`type="text/plain"`：

```html
<script id="tpl" type="text/plain">
    <p>Today: { date }</p>
    <a href="/{ user.id|safe }">{ user.company }</a>
</script>
```

然后，用jQuery来获得模板内容并渲染：

```javascript
var tpl = new Template($('#tpl').html());
var s = tpl.render({
    date: 20150101,
    user: {
        id: 'A-000&001',
        company: 'AT&T'
    }
});
$('#other').html(s);
```

这样，我们就用不到30行代码实现了一个简单的JavaScript模板引擎。
