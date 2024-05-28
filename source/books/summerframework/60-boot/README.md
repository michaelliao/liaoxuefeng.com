# 实现Boot

虽然基于Summer Framework可以开发一个完整的Web应用程序，但是，开发过程还是涉及到先打包，再复制到Tomcat的webapps目录，再启动Tomcat。在开发过程中，经常需要反复来好多次，每次停止、复制、启动，要调试还要接入远程，搞着搞着就会发现，这种开发模式太麻烦。

直接用Spring Framework开发Web应用也是一样，所以才有了Spring Boot，它最让人省心的一点，就是不用装Tomcat，不用复制war包，打个jar包直接就能跑！

所以，为了简化开发流程，我们也仿照Spring Boot，编写一个`boot`模块，能直接启动运行！

注意Spring Boot除了直接打包运行外，还提供很多其他功能，而Summer Framework的boot模块只提供打包运行功能，无其他额外功能。

下面开始正式开发Summer Framework的boot模块。
