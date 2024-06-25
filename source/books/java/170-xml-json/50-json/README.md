# 使用JSON

前面我们讨论了XML这种数据格式。XML的特点是功能全面，但标签繁琐，格式复杂。在Web上使用XML现在越来越少，取而代之的是JSON这种数据结构。

JSON是JavaScript Object Notation的缩写，它去除了所有JavaScript执行代码，只保留JavaScript的对象格式。一个典型的JSON如下：

```json
{
    "id": 1,
    "name": "Java核心技术",
    "author": {
        "firstName": "Abc",
        "lastName": "Xyz"
    },
    "isbn": "1234567",
    "tags": ["Java", "Network"]
}
```

JSON作为数据传输的格式，有几个显著的优点：

- JSON只允许使用UTF-8编码，不存在编码问题；
- JSON只允许使用双引号作为key，特殊字符用`\`转义，格式简单；
- 浏览器内置JSON支持，如果把数据用JSON发送给浏览器，可以用JavaScript直接处理。

因此，JSON适合表示层次结构，因为它格式简单，仅支持以下几种数据类型：

- 键值对：`{"key": value}`
- 数组：`[1, 2, 3]`
- 字符串：`"abc"`
- 数值（整数和浮点数）：`12.34` 
- 布尔值：`true`或`false`
- 空值：`null`

浏览器直接支持使用JavaScript对JSON进行读写：

```javascript
// JSON string to JavaScript object:
jsObj = JSON.parse(jsonStr);

// JavaScript object to JSON string:
jsonStr = JSON.stringify(jsObj);
```

所以，开发Web应用的时候，使用JSON作为数据传输，在浏览器端非常方便。因为JSON天生适合JavaScript处理，所以，绝大多数REST API都选择JSON作为数据传输格式。

现在问题来了：使用Java如何对JSON进行读写？

在Java中，针对JSON也有标准的JSR 353 API，但是我们在前面讲XML的时候发现，如果能直接在XML和JavaBean之间互相转换是最好的。类似的，如果能直接在JSON和JavaBean之间转换，那么用起来就简单多了。

常用的用于解析JSON的第三方库有：

- Jackson
- GSON
- JSON-lib
- ...

注意到上一节提到的那个可以解析XML的浓眉大眼的Jackson也可以解析JSON！因此我们只需要引入以下Maven依赖：

- com.fasterxml.jackson.core:jackson-databind:2.12.0

就可以使用下面的代码解析一个JSON文件：

```java
InputStream input = Main.class.getResourceAsStream("/book.json");
ObjectMapper mapper = new ObjectMapper();
// 反序列化时忽略不存在的JavaBean属性:
mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
Book book = mapper.readValue(input, Book.class);
```

核心代码是创建一个`ObjectMapper`对象。关闭`DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`功能使得解析时如果JavaBean不存在该属性时解析不会报错。

把JSON解析为JavaBean的过程称为反序列化。如果把JavaBean变为JSON，那就是序列化。要实现JavaBean到JSON的序列化，只需要一行代码：

```java
String json = mapper.writeValueAsString(book);
```

要把JSON的某些值解析为特定的Java对象，例如`LocalDate`，也是完全可以的。例如：

```json
{
    "name": "Java核心技术",
    "pubDate": "2016-09-01"
}
```

要解析为：

```java
public class Book {
    public String name;
    public LocalDate pubDate;
}
```

只需要引入标准的JSR 310关于JavaTime的数据格式定义至Maven：

- com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.12.0

然后，在创建`ObjectMapper`时，注册一个新的`JavaTimeModule`：

```java
ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
```

有些时候，内置的解析规则和扩展的解析规则如果都不满足我们的需求，还可以自定义解析。

举个例子，假设`Book`类的`isbn`是一个`BigInteger`：

```java
public class Book {
	public String name;
	public BigInteger isbn;
}
```

但JSON数据并不是标准的整形格式：

```json
{
    "name": "Java核心技术",
    "isbn": "978-7-111-54742-6"
}
```

直接解析，肯定报错。这时，我们需要自定义一个`IsbnDeserializer`，用于解析含有非数字的字符串：

```java
public class IsbnDeserializer extends JsonDeserializer<BigInteger> {
    public BigInteger deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        // 读取原始的JSON字符串内容:
        String s = p.getValueAsString();
        if (s != null) {
            try {
                return new BigInteger(s.replace("-", ""));
            } catch (NumberFormatException e) {
                throw new JsonParseException(p, s, e);
            }
        }
        return null;
    }
}
```

然后，在`Book`类中使用注解标注：

```java
public class Book {
    public String name;
    // 表示反序列化isbn时使用自定义的IsbnDeserializer:
    @JsonDeserialize(using = IsbnDeserializer.class)
    public BigInteger isbn;
}
```

类似的，自定义序列化时我们需要自定义一个`IsbnSerializer`，然后在`Book`类中标注`@JsonSerialize(using = ...)`即可。

### 反序列化

在反序列化时，Jackson要求Java类需要一个默认的无参数构造方法，否则，无法直接实例化此类。存在带参数构造方法的类，如果要反序列化，注意再提供一个无参数构造方法。

对于`enum`字段，Jackson按String类型处理，即：

```java
class Book {
    public DayOfWeek start = MONDAY;
}
```

序列化为：

```json
{
    "start": "MONDAY"
}
```

对于`record`类型，Jackson会自动找出它的带参数构造方法，并根据JSON的key进行匹配，可直接反序列化。对`record`类型的支持需要版本`2.12.0`以上。

### 练习

使用Jackson解析JSON。

[下载练习](json-jackson.zip)

### 小结

JSON是轻量级的数据表示方式，常用于Web应用；

Jackson可以实现JavaBean和JSON之间的转换；

可以通过Module扩展Jackson能处理的数据类型；

可以自定义`JsonSerializer`和`JsonDeserializer`来定制序列化和反序列化。
