# Chaining

还记得jQuery支持链式调用吗？

```javascript
$('a').attr('target', '_blank')
      .append(' <i class="uk-icon-external-link"></i>')
      .click(function () {});
```

如果我们有一组操作，用underscore提供的函数，写出来像这样：

```javascript
_.filter(_.map([1, 4, 9, 16, 25], Math.sqrt), x => x % 2 === 1);
// [1, 3, 5]
```

能不能写成链式调用？

能！

underscore提供了把对象包装成能进行链式调用的方法，就是`chain()`函数：

```x-javascript
let r = _.chain([1, 4, 9, 16, 25])
         .map(Math.sqrt)
         .filter(x => x % 2 === 1)
         .value();
console.log(r); // [1, 3, 5]
```

因为每一步返回的都是包装对象，所以最后一步的结果需要调用`value()`获得最终结果。

### 小结

通过学习underscore，是不是对JavaScript的函数式编程又有了进一步的认识？
