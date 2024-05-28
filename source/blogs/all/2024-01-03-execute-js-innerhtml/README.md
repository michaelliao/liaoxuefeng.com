# 设置innerHTML并执行JavaScript

当我们使用AJAX动态加载部分页面时，经常使用innerHTML来更新页面：

```javascript
document.getElementById('child').innerHTML = `<p>Hello, this is a dynamic page.</p>`;
```

然而，使用innerHTML时，如果加载的HTML片段中含有`<script>`标签，浏览器是不会执行这些JavaScript的：

```javascript
document.getElementById('child').innerHTML = `
<p>Hello, this is a dynamic page.</p>
<script>
    alert('Hello!');
</script>
`;
```

如果我们确信加载的HTML片段是可信的，也想执行内嵌的JavaScript代码，应该怎么做？

实际上浏览器解析innerHTML后，已经生成了完整的DOM结构，包括`<script>`节点，只是没有执行而已。因此，我们可以通过扫描`<script>`节点，把它们复制一遍，替换旧的`<script>`节点，就可以触发浏览器执行。

以下代码来自Stackoverflow [^stackoverflow]：

[^stackoverflow]: Stackoverflow: [Executing script elements inserted with .innerHTML](https://stackoverflow.com/a/47614491)

```javascript
const dom = document.getElementById('child');
dom.innerHTML = `
<p>Hello, this is a dynamic page.</p>
<script>
    alert('Hello!');
</script>
`;
// 循环所有<script>节点:
Array.from(dom.querySelectorAll('script'))
    .forEach(oldScriptEl => {
        // 创建一个新的<script>节点:
        const newScriptEl = document.createElement('script');
        // 复制attributes:
        Array.from(oldScriptEl.attributes).forEach(attr => {
            newScriptEl.setAttribute(attr.name, attr.value);
        });
        // 复制text:
        const scriptText = document.createTextNode(oldScriptEl.innerHTML);
        // 在原始位置替换原始<script>节点:
        newScriptEl.appendChild(scriptText);
        oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
    });
```

最后，封装一个`setInnerHTML()`函数，我们就获得了一个可执行JavaScript的`innerHTML`版本：

```javascript
function setInnerHTML(dom, html) {
    dom.innerHTML = html;
    Array.from(dom.querySelectorAll('script'))
        .forEach(oldScriptEl => {
            const newScriptEl = document.createElement('script');
            Array.from(oldScriptEl.attributes).forEach(attr => {
                newScriptEl.setAttribute(attr.name, attr.value);
            });
            const scriptText = document.createTextNode(oldScriptEl.innerHTML);
            newScriptEl.appendChild(scriptText);
            oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
        });
}
```
