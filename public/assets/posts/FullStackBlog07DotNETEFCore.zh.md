### 全栈开发个人博客 07：DotNET接入数据库

> 项目使用 `Entity Framework Core (EF Core)` 作为 ORM 框架，连接 `Azure SQL Server` 数据库。同时集成了 `ASP.NET Core Identity` 进行用户身份管理。

#### 1. 概述

**技术栈**：

- EF Core 9.0.10
- SQL Server 数据库提供程序
- ASP.NET Core Identity
- .NET 8.0

#### 2. 安装必要的 NuGet 包

在项目文件中（`ThisisczApi.csproj`）需要安装以下包：

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.10" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.10" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="8" />
```

**说明**：

- `Microsoft.EntityFrameworkCore.SqlServer`：SQL Server 数据库提供程序
- `Microsoft.EntityFrameworkCore.Tools`：EF Core 工具（用于迁移等操作）
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore`：Identity 与 EF Core 集成

#### 3. 创建数据库上下文（DbContext）

创建 `ApplicationDbContext.cs` 文件，继承自 `IdentityDbContext`：

```csharp
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ThisisczApi.Entities;
using Microsoft.AspNetCore.Identity;

namespace ThisisczApi;

public class ApplicationDbContext : IdentityDbContext
{
  public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
  {
  }

  // 定义实体集合
  public DbSet<Post> Posts { get; set; }


  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    // 配置实体关系和约束
    // ... 详见下文
  }
}
```

**关键点**：

- 继承 `IdentityDbContext` 以支持 Identity 用户管理
- 通过 `DbSet<T>` 定义实体集合
- 在 `OnModelCreating` 中配置实体关系和约束

#### 4. 配置数据库连接字符串

在 `appsettings.json` 中配置连接字符串：

```json
{
  "ConnectionStrings": {
    "AZURE_SQL_CONNECTIONSTRING": "Server=tcp:xxx.database.windows.net,1433;Initial Catalog=xxxDB;Persist Security Info=False;User ID=xxx;Password=xxx;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

**连接字符串格式说明**：

- `Server`：数据库服务器地址和端口
- `Initial Catalog`：数据库名称
- `User ID` 和 `Password`：数据库登录凭据
- `Encrypt=True`：启用加密连接（Azure SQL 必需）
- `Connection Timeout`：连接超时时间（秒）

#### 5. 在 Program.cs 中注册 DbContext

在 `Program.cs` 中配置数据库服务：

```csharp
// 读取连接字符串
var connectionString = builder.Configuration.GetConnectionString("AZURE_SQL_CONNECTIONSTRING");

// 注册 DbContext，配置 SQL Server 提供程序和重试策略
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null)));

// 配置 Identity
builder.Services.AddIdentityCore<IdentityUser>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
```

**配置说明**：

- `AddDbContext`：注册 `ApplicationDbContext` 为服务
- `UseSqlServer`：指定使用 SQL Server 数据库提供程序
- `EnableRetryOnFailure`：配置重试策略，提高连接稳定性
- `AddIdentityCore`：配置 Identity 核心功能
- `AddEntityFrameworkStores`：将 Identity 数据存储到 EF Core

#### 6. 数据库迁移

使用 EF Core 迁移工具创建和应用数据库迁移：

```bash
# 创建迁移
dotnet ef migrations add InitialCreate

# 应用迁移到数据库
dotnet ef database update
```

**迁移说明**：

- `migrations add`：根据实体模型生成迁移脚本
- `database update`：将迁移应用到数据库，创建或更新表结构

#### 7. 完整步骤总结

1. **安装 NuGet 包**：添加 EF Core 和 Identity 相关包
2. **创建 DbContext**：继承 `IdentityDbContext`，定义 `DbSet` 集合
3. **配置连接字符串**：在 `appsettings.json` 中设置数据库连接
4. **注册服务**：在 `Program.cs` 中注册 `DbContext` 和 `Identity`
5. **配置实体关系**：在 `OnModelCreating` 中设置外键、索引等
6. **创建迁移**：使用 `dotnet ef migrations add` 生成迁移
7. **应用迁移**：使用 `dotnet ef database update` 更新数据库

#### 8. 注意事项

- **连接字符串安全**：生产环境应使用环境变量或 Azure Key Vault 存储敏感信息
- **删除行为**：使用 `Restrict` 避免级联删除导致的数据丢失
- **重试策略**：配置重试机制提高连接稳定性，适合云数据库环境
- **迁移管理**：每次修改实体后需要创建新的迁移并应用

#### 9. 相关文件

- `ApplicationDbContext.cs`：数据库上下文定义
- `Program.cs`：服务注册和配置
- `appsettings.json`：连接字符串配置
- `ThisisczApi.csproj`：NuGet 包依赖
