# 动画

用JavaScript实现动画，原理非常简单：我们只需要以固定的时间间隔（例如，0.1秒），每次把DOM元素的CSS样式修改一点（例如，高宽各增加10%），看起来就像动画了。

但是要用JavaScript手动实现动画效果，需要编写非常复杂的代码。如果想要把动画效果用函数封装起来便于复用，那考虑的事情就更多了。

使用jQuery实现动画，代码已经简单得不能再简化了：只需要一行代码！

让我们先来看看jQuery内置的几种动画样式：

### show / hide

直接以无参数形式调用`show()`和`hide()`，会显示和隐藏DOM元素。但是，只要传递一个时间参数进去，就变成了动画：

```javascript
let div = $('#test-show-hide');
div.hide(3000); // 在3秒钟内逐渐消失
```

时间以毫秒为单位，但也可以是`'slow'`，`'fast'`这些字符串：

```javascript
let div = $('#test-show-hide');
div.show('slow'); // 在0.6秒钟内逐渐显示
```

`toggle()`方法则根据当前状态决定是`show()`还是`hide()`。

效果实测：

<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0">
    <div style="padding: 10px 0">
        <button type="button" onclick="$('#test-show-hide').hide('slow');">hide('slow')</button>
        <button type="button" onclick="$('#test-show-hide').show('slow');">show('slow')</button>
        <button type="button" onclick="$('#test-show-hide').toggle('slow');">toggle('slow')</button>
    </div>
    <div style="height: 128px;">
        <div id="test-show-hide" style="width: 128px; height: 128px; background-color: #ccc; background-image: url(hello.png)"></div>
    </div>
</div>

### slideUp / slideDown

你可能已经看出来了，`show()`和`hide()`是从左上角逐渐展开或收缩的，而`slideUp()`和`slideDown()`则是在垂直方向逐渐展开或收缩的。

`slideUp()`把一个可见的DOM元素收起来，效果跟拉上窗帘似的，`slideDown()`相反，而`slideToggle()`则根据元素是否可见来决定下一步动作：

```javascript
let div = $('#test-slide');
div.slideUp(3000); // 在3秒钟内逐渐向上消失
```

效果实测：

<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0">
    <div style="padding: 10px 0">
        <button type="button" onclick="$('#test-slide').slideUp('slow');">slideUp('slow')</button>
        <button type="button" onclick="$('#test-slide').slideDown('slow');">slideDown('slow')</button>
        <button type="button" onclick="$('#test-slide').slideToggle('slow');">slideToggle('slow')</button>
    </div>
    <div style="height: 128px;">
        <div id="test-slide" style="width: 128px; height: 128px; background-color: #ccc; background-image: url(hello.png)"></div>
    </div>
</div>

### fadeIn / fadeOut

`fadeIn()`和`fadeOut()`的动画效果是淡入淡出，也就是通过不断设置DOM元素的`opacity`属性来实现，而`fadeToggle()`则根据元素是否可见来决定下一步动作：

```javascript
let div = $('#test-fade');
div.fadeOut('slow'); // 在0.6秒内淡出
```

<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0">
    <div style="padding: 10px 0">
        <button type="button" onclick="$('#test-fade').fadeOut('slow');">fadeOut('slow')</button>
        <button type="button" onclick="$('#test-fade').fadeIn('slow');">fadeIn('slow')</button>
        <button type="button" onclick="$('#test-fade').fadeToggle('slow');">fadeToggle('slow')</button>
    </div>
    <div style="height: 128px;">
        <div id="test-fade" style="width: 128px; height: 128px; background-color: #ccc; background-image: url(hello.png)"></div>
    </div>
</div>

### 自定义动画

如果上述动画效果还不能满足你的要求，那就祭出最后大招：`animate()`，它可以实现任意动画效果，我们需要传入的参数就是DOM元素最终的CSS状态和时间，jQuery在时间段内不断调整CSS直到达到我们设定的值：

```javascript
let div = $('#test-animate');
div.animate({
    opacity: 0.25,
    width: '256px',
    height: '256px'
}, 3000); // 在3秒钟内CSS过渡到设定值
```

`animate()`还可以再传入一个函数，当动画结束时，该函数将被调用：

```javascript
let div = $('#test-animate');
div.animate({
    opacity: 0.25,
    width: '256px',
    height: '256px'
}, 3000, function () {
    console.log('动画已结束');
    // 恢复至初始状态:
    $(this).css('opacity', '1.0').css('width', '128px').css('height', '128px');
});
```

实际上这个回调函数参数对于基本动画也是适用的。

有了`animate()`，你就可以实现各种自定义动画效果了：

<script>
function customAnimate() {
    $('#test-animate').animate({
        opacity: 0.25,
        width: '256px',
        height: '256px'
    }, 3000, function() {
        $(this).css('opacity', '1.0').css('width', '128px').css('height', '128px');
    });
}
</script>

<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0">
    <div style="padding: 10px 0">
        <button type="button" onclick="customAnimate();">animate()</button>
    </div>
    <div style="height: 256px;">
        <div id="test-animate" style="width: 128px; height: 128px; background-color: #ccc; background-image: url(hello.png); background-repeat: no-repeat; background-position: center center;"></div>
    </div>
</div>

### 串行动画

jQuery的动画效果还可以串行执行，通过`delay()`方法还可以实现暂停，这样，我们可以实现更复杂的动画效果，而代码却相当简单：

```javascript
let div = $('#test-animates');
// 动画效果：slideDown - 暂停 - 放大 - 暂停 - 缩小
div.slideDown(2000)
   .delay(1000)
   .animate({
       width: '256px',
       height: '256px'
   }, 2000)
   .delay(1000)
   .animate({
       width: '128px',
       height: '128px'
   }, 2000);
}
</script>
```

因为动画需要执行一段时间，所以jQuery必须不断返回新的Promise对象才能后续执行操作。简单地把动画封装在函数中是不够的。

效果实测：

<script>
function animates() {
    $('#test-animates')
        .hide()
        .slideDown(2000)
        .delay(1000)
        .animate({
            width: '256px',
            height: '256px'
        }, 2000)
        .delay(1000)
        .animate({
            width: '128px',
            height: '128px'
        }, 2000);
}
</script>

<div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0">
    <div style="padding: 10px 0">
        <button type="button" onclick="animates();">animate</button>
    </div>
    <div style="height: 256px;">
        <div id="test-animates" style="width: 128px; height: 128px; background-color: #ccc; background-image: url(hello.png); background-repeat: no-repeat; background-position: center center;"></div>
    </div>
</div>

### 为什么有的动画没有效果

你可能会遇到，有的动画如`slideUp()`根本没有效果。这是因为jQuery动画的原理是逐渐改变CSS的值，如`height`从`100px`逐渐变为`0`。但是很多不是block性质的DOM元素，对它们设置`height`根本就不起作用，所以动画也就没有效果。

此外，jQuery也没有实现对`background-color`的动画效果，用`animate()`设置`background-color`也没有效果。这种情况下可以使用CSS3的`transition`实现动画效果。

### 练习

在执行删除操作时，给用户显示一个动画比直接调用`remove()`要更好。请在表格删除一行的时候添加一个淡出的动画效果：

<table id="test-table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Address</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
    <tr><td>Bart Simpson</td><td>bart.s@primary.school</td><td>Springfield</td><td>Active</td></tr><tr><td>Michael Scofield</td><td>m.scofield@escape.org</td><td>Fox River</td><td>Locked</td></tr><tr><td>Optimus Prime</td><td>prime@cybertron.org</td><td>Cybertron</td><td>Active</td></tr><tr><td>Peter Parker</td><td>spider@movie.org</td><td>New York</td><td>Active</td></tr><tr><td>Thor Odinson</td><td>thor@asgard.org</td><td>Asgard</td><td>Active</td></tr></tbody>
</table>

```x-javascript
function deleteFirstTR() {
    let tr = $('#test-table>tbody>tr:visible').first();
    // TODO:
    tr.remove();
}

deleteFirstTR();
```
