#!/usr/bin/env python3
# -*- coding: utf-8 -*-


def foo(s):
    return 10 / int(s)


def bar(s):
    return foo(s) * 2


def main():
    bar("0")


main()
