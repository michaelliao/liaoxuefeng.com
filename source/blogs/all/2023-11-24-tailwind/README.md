# 现代CSS框架：Tailwind CSS

[Tailwind CSS](https://tailwindcss.com/)是一个与Bootstrap、Element等不同的CSS框架，它没有类似`btn`这样的组件样式，而是基于Utility构建的一套CSS。

Tailwind CSS的理念是提供一套完整的，最小单位的工具类CSS，再由设计师将它们组合起来。

例如，`p-4`表示`padding:1rem`，`bg-white`表示`background-color:#fff`，`flex`表示`display:flex`。总之，从CSS类名可以非常直观地映射到一个具体的定义。

而要构造出一个自定义样式的按钮，则需要组合使用多个Tailwind CSS提供的Utility CSS，例如：

```html
<button
    class="px-4 py-2 m-4 text-bold bg-slate-200 border border-slate-300"
>Submit</button>
```

乍一看这样写不如Bootstrap的`<button class="btn">`，然而从CSS样式名称可以很容易地看到Button的样式，并且修改非常简单直观，而不需要去覆盖Bootstrap预定义的`btn`。

Tailwind CSS的另一个创新之处就是对于`hover:`、`focus:`等状态类做了非常简单的扩展，例如，给Button加上`hover:`改变背景色和边框：

```html
<button
    class="bg-slate-200 hover:bg-slate-300 border border-slate-300 hover:border-slate-400"
>Submit</button>
```

或者，根据深色模式自动调整颜色，仅需加上`dark:`修饰：

```html
<button
    class="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
>Submit</button>
```

Tailwind CSS提供的命令行工具会自动根据`hover:`、`dark:`等前缀生成对应的CSS样式，这种写法比SASS和LESS还要简单。

如果页面有很多Button，需要统一样式，难道需要在每个Button的class中重复一大串样式名吗？

为了复用一组样式，Tailwind提供了一种简单的自定义样式的方式，例如，把上述样式简化为`btn-submit`：

```html
<button class="btn-submit">Submit</button>
```

仅需用`@apply`指令告诉Tailwind CSS：

```css
.btn-submit {
    @apply bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700;
}
```

实际上，使用Tailwind CSS，几乎不会用到手写原始的Style：

```css
.foo {
    width: 123px;
}
```

因为即使是`width: 123px`这样的样式，也可以用`w-[123px]`表示：

```html
<div class="w-[123px] text-center">...</div>
```

Tailwind CSS负责将`w-[123px]`转换为`width: 123px`。

理解了Tailwind CSS的设计理念，以及如何组合并自定义样式，可以非常快速地定义出符合设计的样式。甚至在浏览器打开开发者工具，查看Bootstrap的Button，可以用Tailwind CSS快速复刻出相同样式的Button。

和Bootstrap这类直接提供组件的CSS框架相比，Tailwind CSS介于组件和原始CSS之间，它适合需要自定义CSS、希望能有自己风格的网站。越来越多的前端框架如Next.js都推荐使用Tailwind CSS，Tailwind CSS有望成为最流行的CSS框架。
