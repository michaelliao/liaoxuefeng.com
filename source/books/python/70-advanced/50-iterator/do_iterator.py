#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from collections.abc import Iterable, Iterator


def g():
    yield 1
    yield 2
    yield 3


print("Iterable? [1, 2, 3]:", isinstance([1, 2, 3], Iterable))
print("Iterable? 'abc':", isinstance("abc", Iterable))
print("Iterable? 123:", isinstance(123, Iterable))
print("Iterable? g():", isinstance(g(), Iterable))

print("Iterator? [1, 2, 3]:", isinstance([1, 2, 3], Iterator))
print("Iterator? iter([1, 2, 3]):", isinstance(iter([1, 2, 3]), Iterator))
print("Iterator? 'abc':", isinstance("abc", Iterator))
print("Iterator? 123:", isinstance(123, Iterator))
print("Iterator? g():", isinstance(g(), Iterator))
