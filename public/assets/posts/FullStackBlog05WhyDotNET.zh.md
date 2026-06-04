### 全栈开发个人博客05：为啥选择.NET作为网站后端语言

> 选择 .NET（ASP.NET Core）作为个人博客后端，不是因为“微软好”或“语言高级”，而是因为 它在真实生产环境里具备几个非常硬核的优势。下面我从 性能、开发效率、部署成本、架构、生态、扩展性 等维度给你清晰说明，为什么我会选 .NET 作为博客的后端。

#### 1. 性能极高（世界前几，不吹牛）

ASP.NET Core 在 TechEmpower Benchmarks 中长期位列前几名，常年与这些语言并列：

- Rust（Actix）
- Go（Fiber）
- Java（Netty）

相比：

| 后端框架              | QPS（简化比较） |
| --------------------- | --------------- |
| ASP.NET Core 🚀       | 极高            |
| Node.js (Express)     | 中等            |
| Python (Django/Flask) | 较低            |
| PHP (Laravel)         | 较低            |

#### 2. 内置强大的 Web API 框架（不用装一堆第三方包）

ASP.NET Core Web API 开箱即用，很多功能你写两行代码就能用：

- JWT 认证
- Model Validation
- Model Binding
- Logging
- DI（依赖注入）系统
- Filters / Middlewares
- Swagger 自动生成
- EF Core ORM
- 强类型配置

#### 3. EF Core ORM 使用体验非常舒服

EF Core 是当今最强 ORM 之一，写起来都非常自然：

- 支持 SQL Server / PostgreSQL / MySQL / SQLite / CosmosDB
- 支持关系映射（1对多、多对多）
- 支持自动迁移
- 支持 include、select、分页等 LINQ 查询

#### 4. 结构化、清晰的项目分层（不会乱）

ASP.NET API 非常适合：

- Controllers
- Services
- Entities
- DTOs
- AutoMapper

这让你后端代码：可维护，可扩展，可测试，不会越写越乱

#### 5. 身份认证与安全性强（比大多数框架安全）

.NET 内置：

- 强类型输入验证，只需给 DTO 加特性，系统会自动验证
- TLS/HTTPS 默认支持
- JWT Bearer middleware
- Identity 模块

实现以下功能，.NET 都有成熟方案。

- 注册登录
- JWT
- AccessToken + RefreshToken
- 权限控制
- Google 登录

#### 6. 部署容易、成本低（Azure 很好用）

Azure与Github集成，提交代码自动部署：

- Azure App Service（12个月免费使用）
- Azure SQL（12个月免费使用）

#### 7. 强类型语言（TypeScript 是弱化版的 C#）

我的前端技术栈（React + TS），学习 .NET 的转化非常自然：

- 泛型（Generics）
- 接口（Interface）
- 类型系统
- DTO map
- async/await
- Lambda 表达式

TypeScript 的很多概念都来自 C#。

所以使用 .NET 写大型或中型后端很舒服。
