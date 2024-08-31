# 编写UI

我们已经实现了API系统、交易系统、定序系统、行情系统和推送系统，最后就差一个UI系统，让用户可以登录并通过浏览器下订单。UI系统就是一个标准的Web系统，相对比较简单。

UI系统本质上是一个MVC模型的Web系统，我们先引入一个视图的第三方依赖：

```xml
<dependency>
    <groupId>io.pebbletemplates</groupId>
    <artifactId>pebble-spring-boot-starter</artifactId>
    <version>${pebble.version}</version>
</dependency>
```

在`ui.yml`加入最基本的配置：

```yaml
pebble:
  prefix: /templates/
  suffix: .html
```

注意到视图页面都放在`src/main/resources/templates/`目录下。编写`MvcController`，实现登录功能：

```java
@Controller
public class MvcController extends LoggerSupport {
    // 显示登录页
    @GetMapping("/signin")
    public ModelAndView signin(HttpServletRequest request) {
        if (UserContext.getUserId() != null) {
            return redirect("/");
        }
        return prepareModelAndView("signin");
    }

    // 登录
    @PostMapping("/signin")
    public ModelAndView signIn(@RequestParam("email") String email, @RequestParam("password") String password, HttpServletRequest request, HttpServletResponse response) {
        try {
            UserProfileEntity userProfile = userService.signin(email, password);
            // 登录成功后设置Cookie:
            AuthToken token = new AuthToken(userProfile.userId, System.currentTimeMillis() + 1000 * cookieService.getExpiresInSeconds());
            cookieService.setSessionCookie(request, response, token);
        } catch (ApiException e) {
            // 登录失败:
            return prepareModelAndView("signin", Map.of("email", email, "error", "Invalid email or password."));
        } catch (Exception e) {
            // 登录失败:
            return prepareModelAndView("signin", Map.of("email", email, "error", "Internal server error."));
        }
        // 登录成功跳转:
        return redirect("/");
    }
}
```

登录成功后，设置一个Cookie代表用户身份，以`userId:expiresAt:hash`表示。由于计算哈希引入了`HmacKey`，因此，客户端无法伪造Cookie。

继续编写`UIFilter`，用于验证Cookie并把特定用户的身份绑定到`UserContext`中：

```java
public class UIFilter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {
        // 查找Cookie:
        AuthToken auth = cookieService.findSessionCookie(req);
        Long userId = auth == null ? null : auth.userId();
        try (UserContext ctx = new UserContext(userId)) {
            chain.doFilter(request, response);
        }
    }
}
```

我们再编写一个`ProxyFilter`，它的目的是将页面JavaScript对API的调用转发给API系统：

```java
public class ProxyFilter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        Long userId = UserContext.getUserId();
        // 构造一次性Token:
        String authToken = null;
        if (userId != null) {
            AuthToken token = new AuthToken(userId, System.currentTimeMillis() + 60_000);
            authToken = "Bearer " + token.toSecureString(hmacKey);
        }
        // 转发到API并读取响应：
        String responseJson = null;
        try {
            if ("GET".equals(request.getMethod())) {
                Map<String, String[]> params = request.getParameterMap();
                Map<String, String> query = params.isEmpty() ? null : convertParams(params);
                responseJson = tradingApiClient.get(String.class, request.getRequestURI(), authToken, query);
            } else if ("POST".equals(request.getMethod())) {
                responseJson = tradingApiClient.post(String.class, request.getRequestURI(), authToken,
                        readBody(request));
            }
            // 写入响应:
            response.setContentType("application/json;charset=utf-8");
            PrintWriter pw = response.getWriter();
            pw.write(responseJson);
            pw.flush();
        } catch (ApiException e) {
            // 写入错误响应:
            writeApiException(request, response, e);
        } catch (Exception e) {
            // 写入错误响应:
            writeApiException(request, response,
                    new ApiException(ApiError.INTERNAL_SERVER_ERROR, null, e.getMessage()));
        }
    }
}
```

把`ProxyFilter`挂载到`/api/*`，通过UI转发请求的目的是简化页面JavaScript调用API，一是不再需要跨域，二是UI已经经过了登录认证，转发过程中自动生成一次性Token来调用API，这样JavaScript不再关心如何生成`Authorization`头。

下面我们就可以开始编写页面了：

- signin.html：登录页；
- signup.html：注册页；
- index.html：交易页。

页面功能主要由JavaScript实现，我们选择Vue前端框架，最终实现效果如下：

![warpexchange](snapshot.png)

最后，在后台注册时，如果检测到本地开发环境，就自动调用内部API给用户添加一些资产，否则新注册用户无法交易。

### 参考源码

可以从[GitHub](https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-11)或[Gitee](https://gitee.com/liaoxuefeng/warpexchange/tree/main/step-by-step/step-11/)下载源码。

<a class="git-explorer" href="https://github.com/michaelliao/warpexchange/tree/main/step-by-step/step-11">GitHub</a>

### 小结

UI系统是标准的Web系统，除了注册、登录外，主要交易功能均由页面JavaScript实现。UI系统本身不是交易入口，它通过转发JavaScript请求至真正的API入口。
