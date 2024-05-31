#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import functools


def log(func):
    @functools.wraps(func)
    def wrapper(*args, **kw):
        print("call %s():" % func.__name__)
        return func(*args, **kw)

    return wrapper


@log
def now():
    print("2024-6-1 12:34")


now()


def logger(text):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kw):
            print("%s %s():" % (text, func.__name__))
            return func(*args, **kw)

        return wrapper

    return decorator


@logger("DEBUG")
def today():
    print("2024-6-1")


today()
print(today.__name__)
