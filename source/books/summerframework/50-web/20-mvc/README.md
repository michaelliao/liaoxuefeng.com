# 实现MVC

上一节我们把Web应用程序的流程跑通了，因此，本节重点就在如何继续开发`DispatcherServlet`，因为整个MVC的处理都是在`DispatcherServlet`内部完成的。

要处理MVC，我们先定义`@Controller`和`@RestController`：

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Controller {
    String value() default "";
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface RestController {
    String value() default "";
}
```

以及`@GetMapping`、`@PostMapping`等注解，来标识MVC处理的方法。

`DispatcherServlet`内部负责从IoC容器找出所有`@Controller`和`@RestController`定义的Bean，扫描它们的方法，找出`@GetMapping`和`@PostMapping`标识的方法，这样就有了一个处理特定URL的处理器，我们抽象为`Dispatcher`：

```java
class Dispatcher {
    // 是否返回REST:
    boolean isRest;
    // 是否有@ResponseBody:
    boolean isResponseBody;
    // 是否返回void:
    boolean isVoid;
    // URL正则匹配:
    Pattern urlPattern;
    // Bean实例:
    Object controller;
    // 处理方法:
    Method handlerMethod;
    // 方法参数:
    Param[] methodParameters;
}
```

方法参数也需要根据`@RequestParam`、`@RequestBody`等抽象出`Param`类型：

```java
class Param {
    // 参数名称:
    String name;
    // 参数类型:
    ParamType paramType;
    // 参数Class类型:
    Class<?> classType;
    // 参数默认值
    String defaultValue;
}
```

一共有4种类型的参数，我们用枚举`ParamType`定义：

- `PATH_VARIABLE`：路径参数，从URL中提取；
- `REQUEST_PARAM`：URL参数，从URL Query或Form表单提取；
- `REQUEST_BODY`：REST请求参数，从Post传递的JSON提取；
- `SERVLET_VARIABLE`：`HttpServletRequest`等Servlet API提供的参数，直接从`DispatcherServlet`的方法参数获得。

这样，`DispatcherServlet`通过反射拿到一组`Dispatcher`对象，在`doGet()`和`doPost()`方法中，依次匹配URL：

```java
public class DispatcherServlet extends HttpServlet {

    List<Dispatcher> getDispatchers = new ArrayList<>();
    List<Dispatcher> postDispatchers = new ArrayList<>();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String url = req.getRequestURI();
        // 依次匹配每个Dispatcher的URL:
        for (Dispatcher dispatcher : getDispatchers) {
            Result result = dispatcher.process(url, req, resp);
            // 匹配成功并处理后:
            if (result.processed()) {
                // 处理结果
                ...
                return;
            }
        }
        // 未匹配到任何Dispatcher:
        resp.sendError(404, "Not Found");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        ...
    }
}
```

这里不能用`Map<String, Dispatcher>`的原因在于我们要处理类似`/hello/{name}`这样的URL，没法使用精确查找，只能使用正则匹配。

`Dispatcher`处理后返回类型包括：

- `void`或`null`：表示内部已处理完毕；
- `String`：如果以`redirect:`开头，则表示一个重定向；
- `String`或`byte[]`：如果配合`@ResponseBody`，则表示返回值直接写入响应；
- `ModelAndView`：表示这是一个MVC响应，包含Model和View名称，后续用模板引擎处理后写入响应；
- 其它类型：如果是`@RestController`，则序列化为JSON后写入响应。

不符合上述要求的返回类型则报500错误。

这些处理逻辑都十分简单，我们重点看看如何处理`ModelAndView`类型，即MVC响应。

为了处理`ModelAndView`，我们需要一个模板引擎，因此，抽象出`ViewResolver`接口：

```java
public interface ViewResolver {
    // 初始化ViewResolver:
    void init();

    // 渲染:
    void render(String viewName, Map<String, Object> model, HttpServletRequest req, HttpServletResponse resp);
}
```

Spring内置FreeMarker引擎，因此我们也把FreeMarker集成进来，写一个`FreeMarkerViewResolver`：

```java
public class FreeMarkerViewResolver implements ViewResolver {

    final String templatePath;
    final String templateEncoding;
    final ServletContext servletContext;

    Configuration config;

    public FreeMarkerViewResolver(ServletContext servletContext, String templatePath, String templateEncoding) {
        this.servletContext = servletContext;
        this.templatePath = templatePath;
        this.templateEncoding = templateEncoding;
    }

    @Override
    public void init() {
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_32);
        cfg.setOutputFormat(HTMLOutputFormat.INSTANCE);
        cfg.setDefaultEncoding(this.templateEncoding);
        cfg.setTemplateLoader(new ServletTemplateLoader(this.servletContext, this.templatePath));
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.HTML_DEBUG_HANDLER);
        cfg.setAutoEscapingPolicy(Configuration.ENABLE_IF_SUPPORTED_AUTO_ESCAPING_POLICY);
        cfg.setLocalizedLookup(false);
        var ow = new DefaultObjectWrapper(Configuration.VERSION_2_3_32);
        ow.setExposeFields(true);
        cfg.setObjectWrapper(ow);
        this.config = cfg;
    }

    @Override
    public void render(String viewName, Map<String, Object> model, HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Template templ = null;
        try {
            templ = this.config.getTemplate(viewName);
        } catch (Exception e) {
            throw new ServerErrorException("View not found: " + viewName);
        }
        PrintWriter pw = resp.getWriter();
        try {
            templ.process(model, pw);
        } catch (TemplateException e) {
            throw new ServerErrorException(e);
        }
        pw.flush();
    }
}
```

这样我们就可以在`DispatcherServlet`内部，把处理ModelAndView和ViewResolver结合起来，最终向`HttpServletResponse`中输出HTML，完成HTTP请求的处理。

为了简化Web应用程序配置，我们提供一个`WebMvcConfiguration`配置：

```java
@Configuration
public class WebMvcConfiguration {
    private static ServletContext servletContext = null;
    static void setServletContext(ServletContext ctx) {
        servletContext = ctx;
    }

    @Bean(initMethod = "init")
    ViewResolver viewResolver( //
            @Autowired ServletContext servletContext, //
            @Value("${summer.web.freemarker.template-path:/WEB-INF/templates}") String templatePath, //
            @Value("${summer.web.freemarker.template-encoding:UTF-8}") String templateEncoding) {
        return new FreeMarkerViewResolver(servletContext, templatePath, templateEncoding);
    }

    @Bean
    ServletContext servletContext() {
        return Objects.requireNonNull(servletContext, "ServletContext is not set.");
    }
}
```

默认创建一个`ViewResolver`和`ServletContext`，注意`ServletContext`本身实际上是由Servlet容器提供的，但我们把它放入IoC容器，是因为许多涉及到Web的组件，如`ViewResolver`，需要注入`ServletContext`，才能从指定配置加载文件。

最后，整理代码，添加一些能方便用户开发的额外功能，例如处理静态文件等功能，我们的Web MVC模块就开发完毕！

### 注意事项

在整个HTTP处理流程中，入口是`DispatcherServlet`的`service()`方法，整个流程如下：

1. Servlet容器调用`DispatcherServlet`的`service()`方法处理HTTP请求；
2. `service()`根据GET或POST调用`doGet()`或`doPost()`方法；
3. 根据URL依次匹配`Dispatcher`，匹配后调用`process()`方法，获得返回值；
4. 根据返回值写入响应：
    1. void或null返回值无需写入响应；
    2. String或byte[]返回值直接写入响应（或重定向）；
    3. REST类型写入JSON序列化结果；
    4. ModelAndView类型调用ViewResolver写入渲染结果。
5. 未匹配到判断是否静态资源：
    1. 符合静态目录（默认`/static/`）则读取文件，写入文件内容；
    2. 网站图标（默认`/favicon.ico`）则读取`.ico`文件，写入文件内容；
6. 其他情况返回404。

由于在处理的每一步都可以向`HttpServletResponse`写入响应，因此，后续步骤写入时，应判断前面的步骤是否已经写入并发送了HTTP Header。`isCommitted()`方法就是干这个用的：

```java
if (!resp.isCommitted()) {
    resp.resetBuffer();
    writeTo(resp);
}
```

### 测试

`DispatcherServlet`处理HTTP请求时，一些组件是Servlet容器提供的，如：

- HttpServletRequest；
- HttpServletResponse；
- HttpSession；
- ServletContext。

要模拟这些对象用[Mockito](https://site.mockito.org/)之类的框架代码量也很大，我们可以借用Spring提供的test模块，它实现了完善的MockHttpServletRequest、MockServletContext等对象，便于测试。我们导入：

- org.springframework:spring-test:6.0.0
- org.springframework:spring-web:6.0.0

注意设置`<scope>test</scope>`，即仅在测试代码中用到了Spring提供的Mock对象，业务代码并不会用到Spring的任何功能。一个简单的测试用例如下：

```java
@Test
void getGreeting() throws ServletException, IOException {
    // 创建MockHttpServletRequest:
    var req = createMockRequest("GET", "/greeting", null, Map.of("name", "Bob"));
    // 创建MockHttpServletResponse:
    var resp = createMockResponse();
    // 处理请求:
    this.dispatcherServlet.service(req, resp);
    // 验证200响应:
    assertEquals(200, resp.getStatus());
    // 验证响应内容:
    assertEquals("Hello, Bob", resp.getContentAsString());
}
```

### 参考源码

可以从[GitHub](https://github.com/michaelliao/summer-framework/tree/master/framework/summer-web)或[Gitee](https://gitee.com/liaoxuefeng/summer-framework/tree/master/framework/summer-web)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/summer-framework/tree/master/framework/summer-web">GitHub</a>
