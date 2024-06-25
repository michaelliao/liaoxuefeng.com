# 使用DAO

在传统的多层应用程序中，通常是Web层调用业务层，业务层调用数据访问层。业务层负责处理各种业务逻辑，而数据访问层只负责对数据进行增删改查。因此，实现数据访问层就是用`JdbcTemplate`实现对数据库的操作。

编写数据访问层的时候，可以使用DAO模式。DAO即Data Access Object的缩写，它没有什么神秘之处，实现起来基本如下：

```java
public class UserDao {

    @Autowired
    JdbcTemplate jdbcTemplate;

    User getById(long id) {
        ...
    }

    List<User> getUsers(int page) {
        ...
    }

    User createUser(User user) {
        ...
    }

    User updateUser(User user) {
        ...
    }

    void deleteUser(User user) {
        ...
    }
}
```

Spring提供了一个`JdbcDaoSupport`类，用于简化DAO的实现。这个`JdbcDaoSupport`没什么复杂的，核心代码就是持有一个`JdbcTemplate`：

```java
public abstract class JdbcDaoSupport extends DaoSupport {

    private JdbcTemplate jdbcTemplate;

    public final void setJdbcTemplate(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        initTemplateConfig();
    }

    public final JdbcTemplate getJdbcTemplate() {
        return this.jdbcTemplate;
    }

    ...
}
```

它的意图是子类直接从`JdbcDaoSupport`继承后，可以随时调用`getJdbcTemplate()`获得`JdbcTemplate`的实例。那么问题来了：因为`JdbcDaoSupport`的`jdbcTemplate`字段没有标记`@Autowired`，所以，子类想要注入`JdbcTemplate`，还得自己想个办法：

```java
@Component
@Transactional
public class UserDao extends JdbcDaoSupport {
    @Autowired
    JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        super.setJdbcTemplate(jdbcTemplate);
    }
}
```

有的童鞋可能看出来了：既然`UserDao`都已经注入了`JdbcTemplate`，那再把它放到父类里，通过`getJdbcTemplate()`访问岂不是多此一举？

如果使用传统的XML配置，并不需要编写`@Autowired JdbcTemplate jdbcTemplate`，但是考虑到现在基本上是使用注解的方式，我们可以编写一个`AbstractDao`，专门负责注入`JdbcTemplate`：

```java
public abstract class AbstractDao extends JdbcDaoSupport {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        super.setJdbcTemplate(jdbcTemplate);
    }
}
```

这样，子类的代码就非常干净，可以直接调用`getJdbcTemplate()`：

```java
@Component
@Transactional
public class UserDao extends AbstractDao {
    public User getById(long id) {
        return getJdbcTemplate().queryForObject(
                "SELECT * FROM users WHERE id = ?",
                new BeanPropertyRowMapper<>(User.class),
                id
        );
    }
    ...
}
```

倘若肯再多写一点样板代码，就可以把`AbstractDao`改成泛型，并实现`getById()`，`getAll()`，`deleteById()`这样的通用方法：

```java
public abstract class AbstractDao<T> extends JdbcDaoSupport {
    private String table;
    private Class<T> entityClass;
    private RowMapper<T> rowMapper;

    public AbstractDao() {
        // 获取当前类型的泛型类型:
        this.entityClass = getParameterizedType();
        this.table = this.entityClass.getSimpleName().toLowerCase() + "s";
        this.rowMapper = new BeanPropertyRowMapper<>(entityClass);
    }

    public T getById(long id) {
        return getJdbcTemplate().queryForObject("SELECT * FROM " + table + " WHERE id = ?", this.rowMapper, id);
    }

    public List<T> getAll(int pageIndex) {
        int limit = 100;
        int offset = limit * (pageIndex - 1);
        return getJdbcTemplate().query("SELECT * FROM " + table + " LIMIT ? OFFSET ?",
                new Object[] { limit, offset },
                this.rowMapper);
    }

    public void deleteById(long id) {
        getJdbcTemplate().update("DELETE FROM " + table + " WHERE id = ?", id);
    }
    ...
}
```

这样，每个子类就自动获得了这些通用方法：

```java
@Component
@Transactional
public class UserDao extends AbstractDao<User> {
    // 已经有了:
    // User getById(long)
    // List<User> getAll(int)
    // void deleteById(long)
}

@Component
@Transactional
public class BookDao extends AbstractDao<Book> {
    // 已经有了:
    // Book getById(long)
    // List<Book> getAll(int)
    // void deleteById(long)
}
```

可见，DAO模式就是一个简单的数据访问模式，是否使用DAO，根据实际情况决定，因为很多时候，直接在Service层操作数据库也是完全没有问题的。

### 练习

使用DAO模式访问数据库。

[下载练习](spring-data-dao.zip)

### 小结

Spring提供了`JdbcDaoSupport`来便于我们实现DAO模式；

可以基于泛型实现更通用、更简洁的DAO模式。
