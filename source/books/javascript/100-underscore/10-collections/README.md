# Collections

underscore为集合类对象提供了一致的接口。集合类是指Array和Object，暂不支持Map和Set。

### map/filter

和`Array`的`map()`与`filter()`类似，但是underscore的`map()`和`filter()`可以作用于Object。当作用于Object时，传入的函数为`function (value, key)`，第一个参数接收value，第二个参数接收key：

```x-javascript
let obj = {
    name: 'bob',
    school: 'No.1 middle school',
    address: 'xueyuan road'
};

let upper = _.map(obj, function (value, key) {
    return ???;
});

console.log(JSON.stringify(upper));
```

你也许会想，为啥对Object作`map()`操作的返回结果是`Array`？应该是Object才合理啊！把`_.map`换成`_.mapObject`再试试。

### every / some

当集合的所有元素都满足条件时，`_.every()`函数返回`true`，当集合的至少一个元素满足条件时，`_.some()`函数返回`true`：

```javascript
// 所有元素都大于0？
_.every([1, 4, 7, -3, -9], (x) => x > 0); // false
// 至少一个元素大于0？
_.some([1, 4, 7, -3, -9], (x) => x > 0); // true
```

当集合是Object时，我们可以同时获得value和key：

```x-javascript
let obj = {
    name: 'bob',
    school: 'No.1 middle school',
    address: 'xueyuan road'
};

// 判断key和value是否全部是小写：
let r1 = _.every(obj, function (value, key) {
    return ???;
});
let r2 = _.some(obj, function (value, key) {
    return ???;
});

console.log('every key-value are lowercase: ' + r1 + '\nsome key-value are lowercase: ' + r2);
```

### max / min

这两个函数直接返回集合中最大和最小的数：

```javascript
let arr = [3, 5, 7, 9];
_.max(arr); // 9
_.min(arr); // 3

// 空集合会返回-Infinity和Infinity，所以要先判断集合不为空：
_.max([])
-Infinity
_.min([])
Infinity
```

注意，如果集合是Object，`max()`和`min()`只作用于value，忽略掉key：

```javascript
_.max({ a: 1, b: 2, c: 3 }); // 3
```

### groupBy

`groupBy()`把集合的元素按照key归类，key由传入的函数返回：

```javascript
let scores = [20, 81, 75, 40, 91, 59, 77, 66, 72, 88, 99];
let groups = _.groupBy(scores, function (x) {
    if (x < 60) {
        return 'C';
    } else if (x < 80) {
        return 'B';
    } else {
        return 'A';
    }
});
// 结果:
// {
//   A: [81, 91, 88, 99],
//   B: [75, 77, 66, 72],
//   C: [20, 40, 59]
// }
```

可见`groupBy()`用来分组是非常方便的。

### shuffle / sample

`shuffle()`用洗牌算法随机打乱一个集合：

```javascript
// 注意每次结果都不一样：
_.shuffle([1, 2, 3, 4, 5, 6]); // [3, 5, 4, 6, 2, 1]
```

`sample()`则是随机选择一个或多个元素：

```javascript
// 注意每次结果都不一样：
// 随机选1个：
_.sample([1, 2, 3, 4, 5, 6]); // 2
// 随机选3个：
_.sample([1, 2, 3, 4, 5, 6], 3); // [6, 1, 4]
```

更多完整的函数请参考underscore的文档：[https://underscorejs.org/#collections](https://underscorejs.org/#collections)
