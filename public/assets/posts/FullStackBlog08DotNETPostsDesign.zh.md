### 全栈开发个人博客 08：帖子接口设计

> 本文档详细概述了帖子接口服务的完整开发步骤，包括实体模型、DTO 设计、AutoMapper 配置和控制器实现。

#### 1. 概述

**核心功能**：

- 获取帖子列表（支持分页和分类筛选）
- 创建新帖子
- 更新帖子
- 获取帖子详情

**技术栈**：

- ASP.NET Core Web API
- Entity Framework Core
- AutoMapper（对象映射）
- ASP.NET Core Identity（用户关联）

#### 2. 创建实体模型（Post）

在 `Entities/Post.cs` 中定义帖子实体：

```csharp
using Microsoft.AspNetCore.Identity;

namespace ThisisczApi.Entities;

public enum PostCategory
{
    Life,      // 生活
    Work,      // 工作
    Crypto,    // 加密货币
    Sports,    // 运动
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? Summary { get; set; }
    public string? SummaryZh { get; set; }
    public string? Content { get; set; }
    public string? ContentZh { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public IdentityUser Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public PostCategory Category { get; set; }
}
```

**关键点**：

- 支持中英文双语内容（Title/TitleZh, Summary/SummaryZh, Content/ContentZh）
- 通过 `AuthorId` 关联到 `IdentityUser`
- 使用枚举类型 `PostCategory` 定义分类
- 自动记录创建和更新时间

#### 3. 创建 DTO（数据传输对象）

##### 3.1 PostDTO（返回给客户端的数据）

在 `DTOs/PostDTO.cs` 中定义：

```csharp
using ThisisczApi.Entities;

namespace ThisisczApi.DTOs;

public class PostDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? TitleZh { get; set; }
    public string? Summary { get; set; }
    public string? SummaryZh { get; set; }
    public string? Content { get; set; }
    public string? ContentZh { get; set; }
    public UserDTO Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public PostCategory Category { get; set; }
}
```

##### 3.2 PostCreationDTO（创建帖子时的输入）

在 `DTOs/PostCreationDTO.cs` 中定义：

```csharp
using ThisisczApi.Entities;
using System.ComponentModel.DataAnnotations;

namespace ThisisczApi.DTOs;

public class PostCreationDTO
{
    [Required(ErrorMessage = "You must fill the {0} field")]
    public PostCategory Category { get; set; }

    [Required(ErrorMessage = "You must fill the {0} field")]
    public string Title { get; set; } = string.Empty;

    public string? TitleZh { get; set; }
    public string? Summary { get; set; }
    public string? SummaryZh { get; set; }
    public string? Content { get; set; }
    public string? ContentZh { get; set; }
}
```

**说明**：使用数据注解 `[Required]` 进行验证，`Category` 和 `Title` 为必填字段。

##### 3.3 PostQueryDTO（查询参数）

在 `DTOs/PostQueryDTO.cs` 中定义：

```csharp
using ThisisczApi.Entities;

namespace ThisisczApi.DTOs;

public class PostQueryDTO : PaginationDTO
{
    public PostCategory? Category { get; set; }
}
```

继承自 `PaginationDTO`，包含分页参数（`Page`、`PageSize`）和可选的分类筛选。

##### 3.4 PaginationDTO（分页基类）

在 `DTOs/PaginationDTO.cs` 中定义：

```csharp
namespace ThisisczApi.DTOs;

public class PaginationDTO
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
```

#### 4. 配置 AutoMapper

在 `Utilities/AutoMapperProfiles.cs` 中配置映射关系：

```csharp
using AutoMapper;
using ThisisczApi.Entities;
using ThisisczApi.DTOs;

namespace ThisisczApi.Utilities;

public class AutoMapperProfiles : Profile
{
    public AutoMapperProfiles()
    {
        ConfigureMappings();
    }

    private void ConfigureMappings()
    {
        // Post 相关映射
        CreateMap<PostCreationDTO, Post>();
        CreateMap<Post, PostDTO>();

        // User 映射
        CreateMap<IdentityUser, UserDTO>()
            .ForMember(dest => dest.Role, opt => opt.Ignore());
    }
}
```

**说明**：

- `PostCreationDTO` → `Post`：创建时从 DTO 映射到实体
- `Post` → `PostDTO`：返回时将实体映射到 DTO
- `IdentityUser` → `UserDTO`：映射作者信息

#### 5. 创建控制器（PostsController）

在 `Controllers/PostsController.cs` 中实现接口：

```csharp
using Microsoft.AspNetCore.Mvc;
using ThisisczApi.Entities;
using ThisisczApi.Services;
using ThisisczApi.DTOs;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ThisisczApi.Utilities;

namespace ThisisczApi.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController : ControllerBase
{
    private readonly ApplicationDbContext context;
    private readonly IMapper mapper;
    private readonly IUsersService usersService;

    public PostsController(
        ApplicationDbContext context,
        IMapper mapper,
        IUsersService usersService)
    {
        this.context = context;
        this.mapper = mapper;
        this.usersService = usersService;
    }

    // 实现接口方法...
}
```

#### 6. 实现接口方法

##### 6.1 获取帖子列表（GET /api/posts）

支持分页和分类筛选：

```csharp
[HttpGet]
public async Task<ActionResult<PaginationResult<PostDTO>>> GetList([FromQuery] PostQueryDTO query)
{
    var queryable = context.Posts.AsQueryable();

    // 分类筛选
    if (query.Category.HasValue)
    {
        queryable = queryable.Where(p => p.Category == query.Category.Value);
    }

    var totalCount = await queryable.CountAsync();

    // 分页查询，包含作者信息
    var posts = await queryable
        .Include(p => p.Author)
        .Skip((query.Page - 1) * query.PageSize)
        .Take(query.PageSize)
        .ToListAsync();

    // 映射到 DTO
    var items = posts.Select(post => mapper.Map<PostDTO>(post)).ToList();

    return new PaginationResult<PostDTO>
    {
        Page = query.Page,
        PageSize = query.PageSize,
        TotalCount = totalCount,
        Items = items
    };
}
```

**关键点**：

- 使用 `Include(p => p.Author)` 加载作者导航属性
- 使用 `Skip` 和 `Take` 实现分页
- 返回 `PaginationResult<PostDTO>` 包含分页信息

##### 6.2 创建帖子（POST /api/posts）

```csharp
[HttpPost]
public async Task<ActionResult<PostDTO>> Create([FromBody] PostCreationDTO postCreationDTO)
{
    var user = await usersService.GetCurrentUser();

    // 映射 DTO 到实体
    var post = mapper.Map<Post>(postCreationDTO);
    post.AuthorId = user.Id;

    context.Add(post);
    await context.SaveChangesAsync();

    // 加载 Author 导航属性以便映射到 DTO
    await context.Entry(post).Reference(p => p.Author).LoadAsync();

    var postDTO = mapper.Map<PostDTO>(post);
    return postDTO;
}
```

**关键点**：

- 使用 AutoMapper 将 DTO 映射到实体
- 设置 `AuthorId` 为当前用户 ID
- 保存后需要手动加载 `Author` 导航属性，否则 DTO 中的 `Author` 可能为 `null`

##### 6.3 更新帖子（PUT /api/posts/{id}）

```csharp
[HttpPut("{id:int}")]
public async Task<ActionResult> Update(int id, [FromBody] PostCreationDTO postCreationDTO)
{
    var post = await context.Posts.FirstOrDefaultAsync(x => x.Id == id);
    if (post is null)
    {
        return NotFound();
    }

    // 使用 AutoMapper 更新实体属性
    mapper.Map(postCreationDTO, post);
    post.UpdatedAt = DateTime.Now;

    await context.SaveChangesAsync();
    return NoContent();
}
```

**关键点**：

- 先查询实体，不存在则返回 404
- 使用 `mapper.Map(source, destination)` 更新现有实体
- 更新 `UpdatedAt` 时间戳

##### 6.4 获取帖子详情（GET /api/posts/{id}）

```csharp
[HttpGet("{id:int}")]
public async Task<ActionResult<PostDTO>> GetDetail(int id)
{
    var post = await context.Posts
        .Include(p => p.Author)
        .FirstOrDefaultAsync(x => x.Id == id);

    if (post is null)
    {
        return NotFound();
    }

    var postDTO = mapper.Map<PostDTO>(post);
    return postDTO;
}
```

**关键点**：

- 使用 `Include` 加载作者信息
- 实体不存在时返回 404

#### 7. 注册服务依赖

确保在 `Program.cs` 中已注册必要的服务：

```csharp
// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// DbContext（已在之前配置）
builder.Services.AddDbContext<ApplicationDbContext>(...);

// UsersService（用于获取当前用户）
builder.Services.AddScoped<IUsersService, UsersService>();
```

#### 8. 完整开发步骤总结

1. **创建实体模型**：定义 `Post` 实体和 `PostCategory` 枚举
2. **创建 DTO**：定义 `PostDTO`、`PostCreationDTO`、`PostQueryDTO`
3. **配置 AutoMapper**：在 `AutoMapperProfiles` 中配置映射关系
4. **创建控制器**：创建 `PostsController` 并注入依赖
5. **实现列表接口**：支持分页和分类筛选
6. **实现创建接口**：从 DTO 映射到实体并保存
7. **实现更新接口**：更新现有帖子
8. **实现详情接口**：根据 ID 获取单个帖子

#### 9. 注意事项

- **导航属性加载**：使用 `Include` 或 `LoadAsync` 确保关联数据被加载
- **数据验证**：在 DTO 中使用数据注解进行验证
- **分页性能**：使用 `Skip` 和 `Take` 在数据库层面实现分页，避免加载全部数据
- **时间戳管理**：创建时自动设置 `CreatedAt`，更新时手动设置 `UpdatedAt`
- **多语言支持**：实体和 DTO 都支持中英文字段，便于国际化

#### 10. 相关文件

- `Entities/Post.cs`：帖子实体定义
- `DTOs/PostDTO.cs`：返回数据 DTO
- `DTOs/PostCreationDTO.cs`：创建数据 DTO
- `DTOs/PostQueryDTO.cs`：查询参数 DTO
- `DTOs/PaginationDTO.cs`：分页基类
- `Controllers/PostsController.cs`：控制器实现
- `Utilities/AutoMapperProfiles.cs`：AutoMapper 配置
- `Utilities/PaginationResult.cs`：分页结果封装
