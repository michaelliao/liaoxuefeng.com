#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import secrets

from flask import Flask
from flask import request

app = Flask(__name__)

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")


@app.route("/", methods=["GET", "POST"])
def home():
    return "<h1>Home</h1>"


@app.route("/signin", methods=["GET"])
def signin_form():
    return """<form action="/signin" method="post">
              <p><input name="username"></p>
              <p><input name="password" type="password"></p>
              <p><button type="submit">Sign In</button></p>
              </form>"""


@app.route("/signin", methods=["POST"])
def signin():
    # 需要从request对象读取表单内容：
    username = request.form["username"]
    password = request.form["password"]
    if (
        ADMIN_PASSWORD
        and secrets.compare_digest(username, ADMIN_USERNAME)
        and secrets.compare_digest(password, ADMIN_PASSWORD)
    ):
        return "<h3>Hello, admin!</h3>"
    return "<h3>Bad username or password.</h3>"


if __name__ == "__main__":
    app.run()
