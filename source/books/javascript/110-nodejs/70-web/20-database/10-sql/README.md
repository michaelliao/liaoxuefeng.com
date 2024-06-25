# 操作数据库

在Node.js中，访问不同的数据库需要安装不同的数据库驱动。

因为我们使用Sqlite，所以需要安装Sqlite的驱动。这里我们选择`sqlite3`这个驱动，它内置sqlite。

`sqlite3`通过如下代码可以创建一个`db`对象：

```javascript
// 指定模式打开test.db:
const db = new sqlite3.Database('test.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX);
```

我们传入了`OPEN_CREATE`参数，表示如果数据库不存在则自动创建，在开发模式下非常方便。

`sqlite3`使用回调模式执行查询和更新操作，代码如下：

```javascript
// query:
db.all('SELECT * FROM users WHERE id=?', [1], function (err, rows) {
});
// update:
db.run('UPDATE users SET name=? WHERE id=?', ['Bob', 1], function (err) {
});
```

回调模式写起来非常别扭，由于`sqlite3`没有提供Promise接口，因此无法使用await调用，怎么办？

答案是我们自己封装一个Promise调用，以便通过await来实现异步查询和更新：

```javascript
// db.mjs:
import sqlite3 from 'sqlite3';

export function createDatabase(file) {
    const db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX);
    const wrapper = {
        db: db
    };
    // 执行update:
    wrapper.update = async function (strs, ...params) {
        return new Promise((resolve, reject) => {
            let sql = strs.join('?');
            db.run(sql, ...params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });
    };
    // 执行insert并返回lastID:
    wrapper.insert = async function (strs, ...params) {
        return new Promise((resolve, reject) => {
            let sql = strs.join('?');
            db.run(sql, ...params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    };
    // 查询数据,返回array:
    wrapper.select = async function (strs, ...params) {
        return new Promise((resolve, reject) => {
            let sql = strs.join('?');
            if (debug) {
                console.log(`sql = ${sql}, params = [${params.join(', ')}]`);
            }
            db.all(sql, ...params, function (err, rows) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    };
    // 查询一行数据,不存在返回null:
    wrapper.fetch = async function (strs, ...params) {
        ...
    };
    return wrapper;
}
```

我们复制前面的`koa-mvc`工程，命名为`sql`，准备用实际数据库替换写死的登录逻辑。工程结构如下：

```ascii
sql/
├── app.mjs
├── db.mjs
└── ...
```

通过`npm install sqlite3`安装依赖项并添加依赖：

```json
"sqlite3": "^5.1.7"
```

增加了`db.mjs`，实现了对sqlite数据库的操作。

我们在`app.mjs`中初始化一个`db`对象并绑定到`app.context`中：

```javascript
import { createDatabase } from './db.mjs';

async function initDb() {
    const email = 'admin@example.com';
    const name = 'Bob';
    const password = '123456';
    // 创建db对象:
    const db = createDatabase('test.db');
    // 如果users表不存在则创建表:
    await db.update`CREATE TABLE IF NOT EXISTS users(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL)`;
    // 查询admin用户:
    let user = await db.fetch`SELECT * FROM users WHERE email=${email}`;
    // 用户不存在则自动创建:
    if (user === null) {
        await db.insert`INSERT INTO users (email, name, password) VALUES (${email}, ${name}, ${password})`;
    }
    return db;
}

// 绑定db到app.context:
app.context.db = await initDb();
```

注意到`initDb()`中自动创建表和用户的代码都是为了便于开发。

有了数据库支持，我们就可以把`signin.mjs`写死的代码替换为查询数据库用户：

```javascript
// signin:
async function signin(ctx, next) {
    let email = ctx.request.body.email || '';
    let password = ctx.request.body.password || '';
    // 从数据库查询用户:
    let user = await ctx.db.fetch`SELECT * FROM users WHERE email=${email}`;
    if (user !== null && user.password === password) {
        console.log('signin ok!');
        ctx.render('signin-ok.html', {
            title: 'Sign In OK',
            name: user.name
        });
    } else {
        console.log('signin failed!');
        ctx.render('signin-failed.html', {
            title: 'Sign In Failed'
        });
    }
}
```

观察上述代码，我们查询数据库中某个用户的代码如下：

```javascript
let user = await ctx.db.fetch`SELECT * FROM users WHERE email=${email}`;
```

这是一个[标签函数](../../../../function/tag-function/index.html)，它自动将参数变为如下调用：

```javascript
let user = await ctx.db.fetch(['SELECT * FROM users WHERE email=', ''], email);
```

在函数内部，实际执行的SQL是`SELECT * FROM users WHERE email=?`，因此，通过标签函数，我们总是以参数化形式执行SQL，避免了SQL注入。

执行`node app.mjs`，可以看到页面效果，同时，后台会打印出执行的SQL语句与绑定的参数。

### 参考

参考源码：[sql](sql.zip)

sqlite数据库：[sqlite](https://www.sqlite.org/)

sqlite3文档：[sqlite3](https://github.com/TryGhost/node-sqlite3)
