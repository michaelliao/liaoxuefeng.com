#!/usr/bin/env python3
# -*- coding: utf-8 -*-


# f是传入的函数:
def add(f, *args):
    s = [f(arg) for arg in args]
    return sum(s)


print(add(abs, 10, -20, 30, -40))
