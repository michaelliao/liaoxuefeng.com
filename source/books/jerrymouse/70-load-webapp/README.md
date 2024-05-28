# 加载Web App

到目前为止，我们已经实现了`ServletContext`容器，支持`Servlet`、`Filter`和`Listener`组件，支持`HttpSession`，但是，加载`Servlet`、`Filter`和`Listener`组件时，是写死在服务器里面的`IndexServlet`、`LogFilter`和`HelloHttpSessionListener`这样的类。

而一个正常的Web服务器是从外部加载这些组件的，根据Servlet规范，Web App开发者完成了`Servlet`、`Filter`和`Listener`等组件后，需要按规范把它们打包成`.war`文件。`.war`文件本质上就是一个jar包，但它的目录组织如下：

```ascii
hello-webapp
├── WEB-INF
│   ├── classes
│   │   └── com
│   │       └── example
│   │           ├── filter
│   │           │   └── LogFilter.class
│   │           ├── listener
│   │           │   ├── HelloHttpSessionListener.class
│   │           │   └── HelloServletContextAttributeListener.class
│   │           ├── servlet
│   │           │   ├── HelloServlet.class
│   │           │   └── IndexServlet.class
│   │           └── util
│   │               └── DateUtil.class
│   └── lib
│       ├── logback-classic-1.4.6.jar
│       ├── logback-core-1.4.6.jar
│       └── slf4j-api-2.0.4.jar
├── contact.html
└── favicon.ico
```

Servlet规范规定，一个`.war`包解压后，目录`/WEB-INF/classes`存放所有编译后的`.class`文件，目录`/WEB-INF/lib`存放所有依赖的第三方jar包，其他文件可按任意目录存放。

Web服务器通常会提供一个用于访问文件的Servlet，对于以`/WEB-INF/`开头的路径，Web服务器会拒绝访问，其他路径则按正常文件访问，因此，路径`/contact.html`可以被访问到，而路径`/WEB-INF/contact.html`则不能被访问到。注意这个限制是针对浏览器发出的请求的路径限制，如果在Servlet内部读写`/WEB-INF/`目录下的文件则没有任何限制。利用这个限制，很多MVC框架的模版页通常会存放在`/WEB-INF/templates`目录下。

以上是关于`.war`包的目录规范。我们要把写死的`Servlet`、`Filter`和`Listener`组件从服务器项目中摘出来，单独实现一个`.war`包，然后，我们需要实现服务器启动后动态加载`war`包，就实现了一个比较完善的Web服务器。
