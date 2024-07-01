# 快速排序算法

快速排序是一种基于分治的算法，其基本思想是将一个大数组按照一个基准数分成左右两份，左边的部份都不大于基准数，右边的部分都不小于基准数。然后，对这两份再分别应用快速排序，直到分到只剩2个数为止。

快速排序在通常情况下是最快的排序算法，以下是用Python实现的一个例子：

```python
#!/usr/bin/env python
# -*-coding: utf8 -*-

'''    
Quick sort

@author: Michael Liao
'''

from random import Random

def quick_sort(arr):
    if len(arr) > 1:
        qsort(arr, 0, len(arr) - 1)

def qsort(arr, start, end):
    base = arr[start]
    pl = start
    pr = end
    while pl < pr:
        while pl < pr and arr[pr] >= base:
            pr -= 1
        if pl == pr:
            break
        else:
            arr[pl], arr[pr] = arr[pr], arr[pl]

        while pl < pr and arr[pl] <= base:
            pl += 1
        if pl == pr:
            break
        else:
            arr[pl], arr[pr] = arr[pr], arr[pl]

    # now pl == pr
    if pl - 1 > start:
        qsort(arr, start, pl - 1)
    if pr + 1 < end:
        qsort(arr, pr + 1, end)

r = Random()
a = []
for i in range(20):
    a.append(r.randint(0, 100))

print a
quick_sort(a)
print a
```

快速排序是一种不稳定排序，而冒泡排序则是稳定排序。

稳定排序是指如果排序前有两个相同的数，比如对`[a=10, b=10, c=2]`排序，`a`和`b`相等，排序前`a`在`b`的前面，稳定排序后结果为`[c, a, b]`，`a`仍然在`b`的前面，而不稳定排序则不保证相等的两个数位置不会交换，排序结果可能变为`[c, b, a]`。
