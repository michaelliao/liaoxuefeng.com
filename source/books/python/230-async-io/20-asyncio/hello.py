#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio


async def hello():
    print("Hello!")
    # 异步调用asyncio.sleep(1):
    await asyncio.sleep(1)
    print("Hello again!")


asyncio.run(hello())
