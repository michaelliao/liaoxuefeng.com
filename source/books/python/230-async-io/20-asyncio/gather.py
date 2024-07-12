#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import threading


async def hello(name):
    print("Hello %s! (%s)" % (name, threading.current_thread))
    # 异步调用asyncio.sleep(1):
    await asyncio.sleep(1)
    print("Hello %s again! (%s)" % (name, threading.current_thread))
    return name


async def main():
    L = await asyncio.gather(hello("Bob"), hello("Alice"))
    print(L)


asyncio.run(main())
