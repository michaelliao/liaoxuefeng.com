# 使用mvnw

我们使用Maven时，基本上只会用到`mvn`这一个命令。有些童鞋可能听说过`mvnw`，这个是啥？

`mvnw`是Maven Wrapper的缩写。因为我们安装Maven时，默认情况下，系统所有项目都会使用全局安装的这个Maven版本。但是，对于某些项目来说，它可能必须使用某个特定的Maven版本，这个时候，就可以使用Maven Wrapper，它可以负责给这个特定的项目安装指定版本的Maven，而其他项目不受影响。

简单地说，Maven Wrapper就是给一个项目提供一个独立的，指定版本的Maven给它使用。

### 安装Maven Wrapper

安装Maven Wrapper最简单的方式是在项目的根目录（即`pom.xml`所在的目录）下运行安装命令：

```plain
$ mvn wrapper:wrapper
```

它会自动使用最新版本的Maven。如果要指定使用的Maven版本，使用下面的安装命令指定版本，例如`3.9.0`：

```plain
$ mvn wrapper:wrapper -Dmaven=3.9.0
```

安装后，查看项目结构：

```ascii
my-project
├── .mvn
│   └── wrapper
│       └── maven-wrapper.properties
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   └── resources
    └── test
        ├── java
        └── resources
```

发现多了`mvnw`、`mvnw.cmd`和`.mvn`目录，我们只需要把`mvn`命令改成`mvnw`就可以使用跟项目关联的Maven。例如：

```plain
mvnw clean package
```

在Linux或macOS下运行时需要加上`./`：

```plain
$ ./mvnw clean package
```

Maven Wrapper的另一个作用是把项目的`mvnw`、`mvnw.cmd`和`.mvn`提交到版本库中，可以使所有开发人员使用统一的Maven版本。

### 练习

使用mvnw编译hello项目。

[下载练习](maven-wrapper.zip)

### 小结

使用Maven Wrapper，可以为一个项目指定特定的Maven版本。
