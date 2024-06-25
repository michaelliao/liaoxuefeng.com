# 使用SAX

使用DOM解析XML的优点是用起来省事，但它的主要缺点是内存占用太大。

另一种解析XML的方式是SAX。SAX是Simple API for XML的缩写，它是一种基于流的解析方式，边读取XML边解析，并以事件回调的方式让调用者获取数据。因为是一边读一边解析，所以无论XML有多大，占用的内存都很小。

SAX解析会触发一系列事件：

- startDocument：开始读取XML文档；
- startElement：读取到了一个元素，例如`<book>`；
- characters：读取到了字符；
- endElement：读取到了一个结束的元素，例如`</book>`；
- endDocument：读取XML文档结束。

如果我们用SAX API解析XML，Java代码如下：

```java
InputStream input = Main.class.getResourceAsStream("/book.xml");
SAXParserFactory spf = SAXParserFactory.newInstance();
SAXParser saxParser = spf.newSAXParser();
saxParser.parse(input, new MyHandler());
```

关键代码`SAXParser.parse()`除了需要传入一个`InputStream`外，还需要传入一个回调对象，这个对象要继承自`DefaultHandler`：

```java
class MyHandler extends DefaultHandler {
    public void startDocument() throws SAXException {
        print("start document");
    }

    public void endDocument() throws SAXException {
        print("end document");
    }

    public void startElement(String uri, String localName, String qName, Attributes attributes) throws SAXException {
        print("start element:", localName, qName);
    }

    public void endElement(String uri, String localName, String qName) throws SAXException {
        print("end element:", localName, qName);
    }

    public void characters(char[] ch, int start, int length) throws SAXException {
        print("characters:", new String(ch, start, length));
    }

    public void error(SAXParseException e) throws SAXException {
        print("error:", e);
    }

    void print(Object... objs) {
        for (Object obj : objs) {
            System.out.print(obj);
            System.out.print(" ");
        }
        System.out.println();
    }
}
```

运行SAX解析代码，可以打印出下面的结果：

```plain
start document
start element:  book
characters:
     
start element:  name
characters: Java核心技术
end element:  name
characters:
     
start element:  author
...
```

如果要读取`<name>`节点的文本，我们就必须在解析过程中根据`startElement()`和`endElement()`定位当前正在读取的节点，可以使用栈结构保存，每遇到一个`startElement()`入栈，每遇到一个`endElement()`出栈，这样，读到`characters()`时我们才知道当前读取的文本是哪个节点的。可见，使用SAX API仍然比较麻烦。

### 练习

使用SAX解析XML。

[下载练习](xml-sax.zip)

### 小结

SAX是一种流式解析XML的API；

SAX通过事件触发，读取速度快，消耗内存少；

调用方必须通过回调方法获得解析过程中的数据。
