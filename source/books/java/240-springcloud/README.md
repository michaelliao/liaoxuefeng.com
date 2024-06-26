# Spring Cloud开发

Spring是JavaEE的一个轻量级开发框架，主营IoC和AOP，集成JDBC、ORM、MVC等功能便于开发。

Spring Boot是基于Spring，提供开箱即用的积木式组件，目的是提升开发效率。

那么Spring Cloud是啥？

Spring Cloud顾名思义是跟云相关的，云程序实际上就是指分布式应用程序，所以Spring Cloud就是为了让分布式应用程序编写更方便，更容易而提供的一组基础设施，它的核心是Spring框架，利用Spring Boot的自动配置，力图实现最简化的分布式应用程序开发。

![springcloud](springcloud.png)

Spring Cloud包含了一大堆技术组件，既有开源社区开发的组件，也有商业公司开发的组件，既有持续更新迭代的组件，也有即将退役不再维护的组件。

本章会介绍如何基于Spring Cloud创建分布式应用程序，但并不会面面俱到地介绍所有组件，而是挑选几个核心组件，演示如何构造一个基本的分布式应用程序。
