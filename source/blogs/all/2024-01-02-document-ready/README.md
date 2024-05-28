# jQuery的document.ready()平替

使用jQuery时，`$(document).ready()`是非常常用的写法，它把初始化函数委托给jQuery，并等到页面DOM初始化完成后自动调用。

![document.ready](document-ready.png)

可以反复调用`$(document).ready()`，jQuery会按顺序依次调用传入的初始化函数。

在GitSite中，页面没有引入jQuery，因此，需要一个类似`$(document).ready()`的函数来完成初始化。GitSite定义了一个`documentReady()`函数来实现类似的功能：

```javascript
// equivalent of $(document).ready(fn):
function documentReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(fn, 0);
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}
```

上述代码通过判断`document.readyState`来确认页面是否初始化完毕，如果页面已就绪，则直接调用`setTimeout()`异步执行传入的函数，否则，监听`DOMContentLoaded`事件。

`documentReady()`函数的实现非常简单，因为GitSite是基于HTML5构建的，它仅支持现代浏览器，不支持古老的IE。

相比之下，jQuery的`$(document).ready()`更复杂，因为它需要兼容更多的浏览器。
