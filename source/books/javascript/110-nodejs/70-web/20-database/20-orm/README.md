# 使用ORM

直接使用`sqlite3`提供的接口，我们执行数据库操作时必须提供SQL语句，比较底层。

考虑到数据库表是一个二维表，包含多行多列，例如一个`users`的表：

| id | email             | name  | password |
|----|-------------------|-------|----------|
| 1  | admin@example.com | Bob   | 123456   |
| 2  | lucy@example.com  | Lucy  | abcdef   |
| 3  | alice@example.com | Alice | hello123 |

每一行可以用一个JavaScript对象表示，例如第一行：

```javascript
{
    id: 1,
    email: 'admin@example.com',
    name: 'Bob',
    password: '123456'
}
```

这就是传说中的ORM技术：Object-Relational Mapping，把关系数据库的表结构映射到对象上。是不是很简单？

但是由谁来做这个转换呢？所以ORM框架应运而生。

我们选择Node的ORM框架Sequelize来操作数据库。这样，我们读写的都是JavaScript对象，Sequelize帮我们把对象变成数据库中的行。

用Sequelize查询`users`表，代码像这样：

```javascript
let users = await User.findAll();
```

根据`email`查询一个用户，代码像这样：

```javascript
let user = await User.find({
    where: {
        email: 'admin@example.com'
    }
});
```

Sequelize的所有操作都是Promise，所以我们可以用await实现异步调用。

### 实战

在使用Sequelize操作数据库之前，我们需要告诉Sequelize如何映射数据库中的每一个表。

以`users`表为例，我们需要定义如下：

```javascript
// orm.mjs:
import { Sequelize, DataTypes } from 'sequelize';

// 创建sequelize对象表示已连接到数据库:
export const sequelize = new Sequelize('sqlite:test.db');

// 定义User:
export const User = sequelize.define('User', {
    // 每一列的定义:
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false
    },
    email: {
        unique: true,
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    // 指定表名:
    tableName: 'users'
});
```

在定义列的时候，主键以`primaryKey: true`指定，具有唯一约束的列用`unique: true`表示，数据类型用`DataTypes`表示。

这样Sequelize就有了足够的信息来实现ORM。最后将`sequelize`和`User`对象导出。

我们根据上一节的`sql`工程结构创建`orm`工程，结构如下：

```ascii
sql/
├── app.mjs
├── orm.mjs
└── ...
```

删除了`db.mjs`，增加`orm.mjs`。

然后，通过`npm install sequelize sqlite3`安装依赖项并添加依赖：

```json
"sequelize": "^6.37.3",
"sqlite3": "^5.1.7"
```

在`app.mjs`中，删除相关SQL操作，改为通过Sequelize初始化数据库：

```javascript
import { sequelize, User } from './orm.mjs';

...

async function initDb() {
    // 自动创建数据库表, 仅限开发模式:
    await sequelize.sync();
    // 查询admin用户:
    const email = 'admin@example.com';
    let user = await User.findOne({
        where: {
            email: email
        }
    });
    // 不存在则自动创建:
    if (user === null) {
        await User.create({
            email: email,
            name: 'Bob',
            password: '123456'
        });
    }
}
await initDb();

...
```

使用Sequelize时，无需绑定`app.context`，因为我们主要通过具体的Model比如`User`来操作数据库。修改`signin.mjs`如下：

```javascript
import { User } from '../orm.mjs';

// signin:
async function signin(ctx, next) {
    let email = ctx.request.body.email || '';
    let password = ctx.request.body.password || '';
    // 调用Model.findOne()查询一行记录:
    let user = await User.findOne({
        where: {
            email: email
        }
    });
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

运行`node app.mjs`启动服务器，可以观察到Sequelize访问数据库时打印的SQL语句。这里需要注意的是，Sequelize会为每个Model自动添加一个`createdAt`和`updatedAt`字段，用来记录创建和更新时间。因此，创建的`users`表的SQL语句为：

```sql
CREATE TABLE IF NOT EXISTS `users` (
    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL
);
```

### 常用操作

Sequelize提供了`findAll()`和`findOne()`两种查询，分别返回多行和一行。

`create()`操作可以存储一个对象到数据库的一行记录，`save()`和`destroy()`分别对应更新和删除操作。

Sequelize还提供了一对多等高级ORM功能，具体可以参考官方文档。

### 参考

参考源码：[orm](orm.zip)

Sequelize：[官方网站](https://sequelize.org/)
