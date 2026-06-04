### 全栈开发个人博客06：.NET后端项目设计

> Thisiscz API 是一个基于 .NET 8.0 的 Web API 项目，提供内容管理、用户认证、评论系统等功能的后端服务。

#### 1. 技术选型

##### 核心框架

- **.NET 8.0** - 目标框架
- **ASP.NET Core Web API** - Web API 框架
- **Entity Framework Core 9.0.10** - ORM 框架
- **SQL Server** - 数据库（Azure SQL Database）

##### 认证与授权

- **ASP.NET Core Identity** - 用户身份管理
- **JWT Bearer Authentication** - JWT 令牌认证
- **Google OAuth 2.0** - Google 第三方登录（Google.Apis.Auth 1.73.0）

##### 工具库

- **AutoMapper 12.0.1** - 对象映射
- **Swashbuckle.AspNetCore 6.4.0** - Swagger/OpenAPI 文档生成
- **Microsoft.IdentityModel.Tokens 8.14.0** - JWT 令牌处理

##### 其他特性

- **CORS** - 跨域资源共享支持
- **依赖注入** - 内置 DI 容器
- **Code First** - EF Core 数据库迁移

#### 2. 项目结构

```
ThisisczApi/
├── Controllers/          # API 控制器
│   ├── UsersController.cs      # 用户认证相关接口
│   ├── PostsController.cs      # 帖子管理接口
│   ├── CommentsController.cs   # 评论管理接口
│   └── LinksController.cs      # 链接管理接口
├── Entities/             # 实体类（数据库模型）
│   ├── Post.cs          # 帖子实体
│   ├── PostLike.cs      # 帖子点赞实体
│   ├── Comment.cs       # 评论实体（支持自引用回复）
│   ├── Link.cs          # 链接实体
│   └── RefreshToken.cs  # 刷新令牌实体
├── DTOs/                 # 数据传输对象
│   ├── UserDTO.cs
│   ├── PostDTO.cs / PostCreationDTO.cs / PostQueryDTO.cs
│   ├── CommentDTO.cs / CommentCreationDTO.cs / CommentQueryDTO.cs
│   ├── LinkDTO.cs / LinkCreationDTO.cs / LinkQueryDTO.cs
│   └── AuthenticationResponseDTO.cs
├── Services/            # 服务层
│   ├── IUsersService.cs
│   └── UsersService.cs
├── Utilities/           # 工具类
│   ├── AutoMapperProfiles.cs  # AutoMapper 配置
│   └── PaginationResult.cs    # 分页结果封装
├── Migrations/          # EF Core 数据库迁移文件
├── ApplicationDbContext.cs    # EF Core 数据库上下文
└── Program.cs           # 应用程序入口和配置
```

#### 3. 功能模块

##### 1. 用户认证模块

- **Google 登录**：支持通过 Google OAuth 2.0 进行第三方登录
- **JWT 认证**：使用 JWT Bearer Token 进行身份验证
- **用户信息获取**：`GET /api/users/me` - 获取当前登录用户信息
- **角色管理**：支持 admin 和 user 两种角色（基于 Claims）

##### 2. 帖子管理模块

- **帖子列表**：`GET /api/posts` - 支持分页、分类筛选
- **帖子详情**：`GET /api/posts/{id}` - 获取帖子详情（包含点赞数、评论数）
- **创建帖子**：`POST /api/posts` - 仅管理员可创建（Policy: "IsAdmin"）
- **更新帖子**：`PUT /api/posts/{id}` - 仅管理员可更新
- **帖子点赞**：`POST /api/posts/postLike` - 支持点赞/取消点赞
- **多语言支持**：帖子支持中英文标题、摘要、内容（Title/TitleZh, Summary/SummaryZh, Content/ContentZh）
- **分类功能**：支持 Life（生活）、Work（工作）、Crypto（加密货币）、Sports（运动）四种分类

##### 3. 评论系统模块

- **创建评论**：`POST /api/comments/create` - 需要认证
- **评论列表**：`GET /api/comments` - 支持分页，可查询顶级评论或指定父评论的回复
- **删除评论**：`DELETE /api/comments/{id}` - 仅评论作者或管理员可删除（递归删除子评论）
- **回复功能**：支持评论的嵌套回复（自引用关系）

##### 4. 链接管理模块

- **创建链接**：`POST /api/links/create` - 仅管理员可创建
- **链接列表**：`GET /api/links` - 支持分页、分类筛选
- **链接详情**：`GET /api/links/{id}`
- **更新链接**：`PUT /api/links/{id}` - 仅管理员可更新
- **删除链接**：`DELETE /api/links/{id}` - 仅管理员可删除
- **分类功能**：支持 Life、Work、Crypto、Sports、Movies 五种分类

#### 4. 数据库设计

##### 核心表结构

###### 1. AspNetUsers（Identity 用户表）

- 继承自 ASP.NET Core Identity 的 `IdentityUser`
- 存储用户基本信息（Email、UserName 等）

###### 2. Posts（帖子表）

```sql
- Id (int, PK)
- Title (string) - 英文标题
- TitleZh (string, nullable) - 中文标题
- Summary (string, nullable) - 英文摘要
- SummaryZh (string, nullable) - 中文摘要
- Content (string, nullable) - 英文内容
- ContentZh (string, nullable) - 中文内容
- AuthorId (string, FK -> AspNetUsers.Id) - 作者ID
- CreatedAt (DateTime) - 创建时间
- UpdatedAt (DateTime, nullable) - 更新时间
- Category (PostCategory enum) - 分类
```

###### 3. PostLikes（帖子点赞表）

```sql
- Id (int, PK)
- PostId (int, FK -> Posts.Id)
- UserId (string, FK -> AspNetUsers.Id)
- CreatedAt (DateTime)
- 唯一索引：(PostId, UserId) - 确保每个用户对每篇帖子只能点赞一次
```

###### 4. Comments（评论表）

```sql
- Id (int, PK)
- UserId (string, FK -> AspNetUsers.Id) - 评论用户
- PostId (int, FK -> Posts.Id) - 所属帖子
- Content (string) - 评论内容
- CreatedAt (DateTime) - 创建时间
- ParentId (int, nullable, FK -> Comments.Id) - 父评论ID（支持嵌套回复）
```

###### 5. Links（链接表）

```sql
- Id (int, PK)
- Title (string) - 标题
- Description (string) - 描述
- Url (string) - 链接地址
- ImageUrl (string) - 图片地址
- Category (LinkCategory enum) - 分类
- UserId (string, FK -> AspNetUsers.Id) - 创建者
- CreatedAt (DateTime) - 创建时间
- UpdatedAt (DateTime) - 更新时间
```

###### 6. RefreshTokens（刷新令牌表）

```sql
- Id (int, PK)
- Token (string) - 刷新令牌
- UserId (string, FK -> AspNetUsers.Id)
- ExpiresAt (DateTime) - 过期时间
- CreatedAt (DateTime) - 创建时间
- IsRevoked (bool) - 是否已撤销
```

##### 关系设计

- **Post ↔ IdentityUser**：多对一（多个帖子属于一个作者），删除行为：Restrict
- **Comment ↔ IdentityUser**：多对一（多个评论属于一个用户），删除行为：Restrict
- **Comment ↔ Comment**：自引用（支持评论回复），删除行为：Restrict
- **PostLike ↔ Post**：多对一，唯一约束（PostId, UserId）
- **PostLike ↔ IdentityUser**：多对一
- **Link ↔ IdentityUser**：多对一，删除行为：Restrict

##### 数据库配置

- **连接字符串**：从配置文件的 `AZURE_SQL_CONNECTIONSTRING` 读取
- **重试策略**：启用连接重试（最多 5 次，最大延迟 30 秒）
- **迁移方式**：Code First，通过 EF Core Migrations 管理数据库结构

#### 5. 配置说明

##### appsettings.json 主要配置项

- **ConnectionStrings**：Azure SQL Database 连接字符串
- **Jwt**：JWT 配置（Key、Issuer、Audience、ExpireMinutes）
- **allowedOrigins**：CORS 允许的源（支持多个域名）
- **Google**：Google OAuth ClientId

#### 6. API 文档

项目集成了 Swagger/OpenAPI，`dotnet watch` 启动后可通过 `http://localhost:5239/swagger/index.html` 访问 API 文档。

#### 7. 部署

- 数据库：Azure SQL Database
- 后端部署：Azure Web App Services
- CI/CD：GitHub Actions（.github/workflows/main_thisisczapi.yml）
