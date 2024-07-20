# 如何编写一个JSON解析器

编写一个JSON解析器实际上就是一个函数，它的输入是一个表示JSON的字符串，输出是结构化的对应到语言本身的数据结构。

和XML相比，JSON本身结构非常简单，并且仅有几种数据类型，以Java为例，对应的数据结构是：

- `"string"`：Java的`String`；
- `number`：Java的`Long`或`Double`；
- `true`/`false`：Java的`Boolean`；
- `null`：Java的`null`；
- `[array]`：Java的`List<Object>`或`Object[]`；
- `{"key":"value"}`：Java的`Map<String, Object>`。

解析JSON和解析XML类似，最终都是解析为内存的一个对象。出于效率考虑，使用流的方式几乎是唯一选择，也就是解析器只从头扫描一遍JSON字符串，就完整地解析出对应的数据结构。

本质上解析器就是一个状态机，只要按照JSON定义的格式（参考[https://www.json.org](https://www.json.org/)，正确实现状态转移即可。但是为了简化代码，我们也没必要完整地实现一个字符一个字符的状态转移。

解析器的输入应该是一个字符流，所以，第一步是获得`Reader`，以便能不断地读入下一个字符。

在解析的过程中，我们经常要根据下一个字符来决定状态跳转，此时又涉及到回退的问题，就是某些时候不能用`next()`取下一个字符，而是用`peek()`取下一个字符，但字符流的指针不移动。所以，`Reader`接口不能满足这个需求，应当进一步封装一个`CharReader`，它可以实现：

- `char next()`：读取下一个字符，移动`Reader`指针；
- `char peek()`：读取下一个字符，不移动`Reader`指针；
- `String next(int size)`：读取指定的N个字符并移动指针；
- `boolean hasMore()`：判断流是否结束。

JSON解析比其他文本解析要简单的地方在于，任何JSON数据类型，只需要根据下一个字符即可确定，仔细总结可以发现，如果`peek()`返回的字符是某个字符，就可以期望读取的数据类型：

- `{`：期待一个JSON object；
- `:`：期待一个JSON object的value；
- `,`：期待一个JSON object的下一组key-value，或者一个JSON array的下一个元素；
- `[`：期待一个JSON array；
- `t`：期待一个true；
- `f`：期待一个false；
- `n`：期待一个null；
- `"`：期待一个string；
- `0`~`9`：期待一个number。

但是单个字符要匹配的状态太多了，需要进一步把字符流变为`Token`，可以总结出如下几种`Token`：

- `END_DOCUMENT`：JSON文档结束；
- `BEGIN_OBJECT`：开始一个JSON object；
- `END_OBJECT`：结束一个JSON object；
- `BEGIN_ARRAY`：开始一个JSON array；
- `END_ARRAY`：结束一个JSON array；
- `SEP_COLON`：读取一个冒号；
- `SEP_COMMA`：读取一个逗号；
- `STRING`：一个String；
- `BOOLEAN`：一个true或false；
- `NUMBER`：一个number；
- `NULL`：一个null。

然后，将`CharReader`进一步封装为`TokenReader`，提供以下接口：

* `Token readNextToken()`：读取下一个Token；
* `boolean readBoolean()`：读取一个boolean；
* `Number readNumber()`：读取一个number；
* `String readString()`：读取一个string；
* `void readNull()`：读取一个null。

由于JSON的`Object`和`Array`可以嵌套，在读取过程中，使用一个栈来存储`Object`和`Array`是必须的。每当我们读到一个`BEGIN_OBJECT`时，就创建一个`Map`并压栈；每当读到一个`BEGIN_ARRAY`时，就创建一个`List`并压栈；每当读到一个`END_OBJECT`和`END_ARRAY`时，就弹出栈顶元素，并根据新的栈顶元素判断是否压栈。此外，读到`Object`的Key也必须压栈，读到后面的Value后将Key-Value压入栈顶的`Map`。

如果读到`END_DOCUMENT`时，栈恰好只剩下一个元素，则读取正确，将该元素返回，读取结束。如果栈剩下不止一个元素，则JSON文档格式不正确。

最后，`JsonReader`的核心解析代码`parse()`就是负责从`TokenReader`中不断读取Token，根据当前状态操作，然后设定下一个Token期望的状态，如果与期望状态不符，则JSON的格式无效。起始状态被设定为`STATUS_EXPECT_SINGLE_VALUE | STATUS_EXPECT_BEGIN_OBJECT | STATUS_EXPECT_BEGIN_ARRAY`，即期望读取到单个value、`{`或`[`。循环的退出点是读取到`END_DOCUMENT`时。

```java
public class JsonReader {
    TokenReader reader;

    public Object parse() {
        Stack stack = new Stack();
        int status = STATUS_EXPECT_SINGLE_VALUE | STATUS_EXPECT_BEGIN_OBJECT | STATUS_EXPECT_BEGIN_ARRAY;
        for (;;) {
            Token currentToken = reader.readNextToken();
            switch (currentToken) {
            case BOOLEAN:
                if (hasStatus(STATUS_EXPECT_SINGLE_VALUE)) {
                    // single boolean:
                    Boolean bool = reader.readBoolean();
                    stack.push(StackValue.newJsonSingle(bool));
                    status = STATUS_EXPECT_END_DOCUMENT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_OBJECT_VALUE)) {
                    Boolean bool = reader.readBoolean();
                    String key = stack.pop(StackValue.TYPE_OBJECT_KEY).valueAsKey();
                    stack.peek(StackValue.TYPE_OBJECT).valueAsObject().put(key, bool);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_OBJECT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_ARRAY_VALUE)) {
                    Boolean bool = reader.readBoolean();
                    stack.peek(StackValue.TYPE_ARRAY).valueAsArray().add(bool);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_ARRAY;
                    continue;
                }
                throw new JsonParseException("Unexpected boolean.", reader.reader.readed);

            case NULL:
                if (hasStatus(STATUS_EXPECT_SINGLE_VALUE)) {
                    // single null:
                    reader.readNull();
                    stack.push(StackValue.newJsonSingle(null));
                    status = STATUS_EXPECT_END_DOCUMENT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_OBJECT_VALUE)) {
                    reader.readNull();
                    String key = stack.pop(StackValue.TYPE_OBJECT_KEY).valueAsKey();
                    stack.peek(StackValue.TYPE_OBJECT).valueAsObject().put(key, null);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_OBJECT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_ARRAY_VALUE)) {
                    reader.readNull();
                    stack.peek(StackValue.TYPE_ARRAY).valueAsArray().add(null);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_ARRAY;
                    continue;
                }
                throw new JsonParseException("Unexpected null.", reader.reader.readed);

            case NUMBER:
                if (hasStatus(STATUS_EXPECT_SINGLE_VALUE)) {
                    // single number:
                    Number number = reader.readNumber();
                    stack.push(StackValue.newJsonSingle(number));
                    status = STATUS_EXPECT_END_DOCUMENT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_OBJECT_VALUE)) {
                    Number number = reader.readNumber();
                    String key = stack.pop(StackValue.TYPE_OBJECT_KEY).valueAsKey();
                    stack.peek(StackValue.TYPE_OBJECT).valueAsObject().put(key, number);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_OBJECT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_ARRAY_VALUE)) {
                    Number number = reader.readNumber();
                    stack.peek(StackValue.TYPE_ARRAY).valueAsArray().add(number);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_ARRAY;
                    continue;
                }
                throw new JsonParseException("Unexpected number.", reader.reader.readed);

            case STRING:
                if (hasStatus(STATUS_EXPECT_SINGLE_VALUE)) {
                    // single string:
                    String str = reader.readString();
                    stack.push(StackValue.newJsonSingle(str));
                    status = STATUS_EXPECT_END_DOCUMENT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_OBJECT_KEY)) {
                    String str = reader.readString();
                    stack.push(StackValue.newJsonObjectKey(str));
                    status = STATUS_EXPECT_COLON;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_OBJECT_VALUE)) {
                    String str = reader.readString();
                    String key = stack.pop(StackValue.TYPE_OBJECT_KEY).valueAsKey();
                    stack.peek(StackValue.TYPE_OBJECT).valueAsObject().put(key, str);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_OBJECT;
                    continue;
                }
                if (hasStatus(STATUS_EXPECT_ARRAY_VALUE)) {
                    String str = reader.readString();
                    stack.peek(StackValue.TYPE_ARRAY).valueAsArray().add(str);
                    status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_ARRAY;
                    continue;
                }
                throw new JsonParseException("Unexpected char \'\"\'.", reader.reader.readed);

            case SEP_COLON: // :
                if (status == STATUS_EXPECT_COLON) {
                    status = STATUS_EXPECT_OBJECT_VALUE | STATUS_EXPECT_BEGIN_OBJECT | STATUS_EXPECT_BEGIN_ARRAY;
                    continue;
                }
                throw new JsonParseException("Unexpected char \':\'.", reader.reader.readed);

            case SEP_COMMA: // ,
                if (hasStatus(STATUS_EXPECT_COMMA)) {
                    if (hasStatus(STATUS_EXPECT_END_OBJECT)) {
                        status = STATUS_EXPECT_OBJECT_KEY;
                        continue;
                    }
                    if (hasStatus(STATUS_EXPECT_END_ARRAY)) {
                        status = STATUS_EXPECT_ARRAY_VALUE | STATUS_EXPECT_BEGIN_ARRAY | STATUS_EXPECT_BEGIN_OBJECT;
                        continue;
                    }
                }
                throw new JsonParseException("Unexpected char \',\'.", reader.reader.readed);

            case END_ARRAY:
                if (hasStatus(STATUS_EXPECT_END_ARRAY)) {
                    StackValue array = stack.pop(StackValue.TYPE_ARRAY);
                    if (stack.isEmpty()) {
                        stack.push(array);
                        status = STATUS_EXPECT_END_DOCUMENT;
                        continue;
                    }
                    int type = stack.getTopValueType();
                    if (type == StackValue.TYPE_OBJECT_KEY) {
                        // key: [ CURRENT ] ,}
                        String key = stack.pop(StackValue.TYPE_OBJECT_KEY).valueAsKey();
                        stack.peek(StackValue.TYPE_OBJECT).valueAsObject().put(key, array.value);
                        status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_OBJECT;
                        continue;
                    }
                    if (type == StackValue.TYPE_ARRAY) {
                        // xx, xx, [CURRENT] ,]
                        stack.peek(StackValue.TYPE_ARRAY).valueAsArray().add(array.value);
                        status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_ARRAY;
                        continue;
                    }
                }
                throw new JsonParseException("Unexpected char: \']\'.", reader.reader.readed);

            case END_OBJECT:
                if (hasStatus(STATUS_EXPECT_END_OBJECT)) {
                    StackValue object = stack.pop(StackValue.TYPE_OBJECT);
                    if (stack.isEmpty()) {
                        // root object:
                        stack.push(object);
                        status = STATUS_EXPECT_END_DOCUMENT;
                        continue;
                    }
                    int type = stack.getTopValueType();
                    if (type == StackValue.TYPE_OBJECT_KEY) {
                        String key = stack.pop(StackValue.TYPE_OBJECT_KEY).valueAsKey();
                        stack.peek(StackValue.TYPE_OBJECT).valueAsObject().put(key, object.value);
                        status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_OBJECT;
                        continue;
                    }
                    if (type == StackValue.TYPE_ARRAY) {
                        stack.peek(StackValue.TYPE_ARRAY).valueAsArray().add(object.value);
                        status = STATUS_EXPECT_COMMA | STATUS_EXPECT_END_ARRAY;
                        continue;
                    }
                }
                throw new JsonParseException("Unexpected char: \'}\'.", reader.reader.readed);

            case END_DOCUMENT:
                if (hasStatus(STATUS_EXPECT_END_DOCUMENT)) {
                    StackValue v = stack.pop();
                    if (stack.isEmpty()) {
                        return v.value;
                    }
                }
                throw new JsonParseException("Unexpected EOF.", reader.reader.readed);

            case BEGIN_ARRAY:
                if (hasStatus(STATUS_EXPECT_BEGIN_ARRAY)) {
                    stack.push(StackValue.newJsonArray(this.jsonArrayFactory.createJsonArray()));
                    status = STATUS_EXPECT_ARRAY_VALUE | STATUS_EXPECT_BEGIN_OBJECT | STATUS_EXPECT_BEGIN_ARRAY | STATUS_EXPECT_END_ARRAY;
                    continue;
                }
                throw new JsonParseException("Unexpected char: \'[\'.", reader.reader.readed);

            case BEGIN_OBJECT:
                if (hasStatus(STATUS_EXPECT_BEGIN_OBJECT)) {
                    stack.push(StackValue.newJsonObject(this.jsonObjectFactory.createJsonObject()));
                    status = STATUS_EXPECT_OBJECT_KEY | STATUS_EXPECT_BEGIN_OBJECT | STATUS_EXPECT_END_OBJECT;
                    continue;
                }
                throw new JsonParseException("Unexpected char: \'{\'.", reader.reader.readed);
            }
        }
    }
}
```

详细源码请参考：[https://github.com/michaelliao/jsonstream](https://github.com/michaelliao/jsonstream)。
