### 全栈开发个人博客 17：DotNET帖子评论设计

> 允许用户对博客文章进行评论和回复，支持多级嵌套回复结构，同时提供评论列表查询、回复数量统计和权限控制。

#### 1. 概述

**核心功能**：

- 用户创建评论（支持对帖子评论和对评论回复）
- 查询评论列表（支持分页和按父评论过滤）
- 查询评论的回复数量
- 删除评论（支持递归删除所有子评论）
- 权限控制（仅评论作者或管理员可删除）

**技术栈**：

- ASP.NET Core Web API
- Entity Framework Core
- JWT 认证
- 自引用关系（Self-Referencing Relationship）
- 批量查询优化（避免 N+1 问题）
- 递归删除算法

#### 2. 创建实体模型（Comment）

在 `Entities/Comment.cs` 中定义评论实体：

```csharp
using Microsoft.AspNetCore.Identity;

namespace ThisisczApi.Entities;

public class Comment
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public IdentityUser User { get; set; } = null!;
    public int PostId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Self reference
    public int? ParentId { get; set; }
    public Comment? Parent { get; set; }
}
```

**字段说明**：

- `Id`：主键，自增
- `UserId`：评论用户的 ID（关联 IdentityUser）
- `User`：导航属性，关联到评论用户
- `PostId`：关联的帖子 ID
- `Content`：评论内容
- `CreatedAt`：评论创建时间
- `ParentId`：父评论 ID（可选，`null` 表示顶级评论）
- `Parent`：导航属性，关联到父评论（自引用关系）

**设计要点**：

- 使用自引用关系（`ParentId` 和 `Parent`）实现多级嵌套回复
- `ParentId` 为可空类型（`int?`），`null` 表示顶级评论
- 支持无限层级嵌套（实际应用中建议限制层级深度）

#### 3. 配置数据库上下文

在 `ApplicationDbContext.cs` 中：

**3.1 添加 DbSet**

```csharp
public DbSet<Comment> Comments { get; set; }
```

**3.2 配置关系**

在 `OnModelCreating` 方法中配置评论与用户的关系，以及评论的自引用关系：

```csharp
// 配置 Comment 实体与 IdentityUser（评论用户）的关系
modelBuilder.Entity<Comment>()
  .HasOne(c => c.User)
  .WithMany()
  .HasForeignKey(c => c.UserId)
  .OnDelete(DeleteBehavior.Restrict);

// 配置 Comment 实体的自引用关系（父评论和子回复）
modelBuilder.Entity<Comment>()
  .HasOne(c => c.Parent)
  .WithMany()
  .HasForeignKey(c => c.ParentId)
  .OnDelete(DeleteBehavior.Restrict);
```

**配置说明**：

- **用户关系**：每个评论属于一个用户，使用 `Restrict` 删除行为，防止删除有评论的用户
- **自引用关系**：每条评论可以有一个父评论，也可以有多个子评论（回复）
- **删除行为**：使用 `Restrict` 避免 SQL Server 的多个级联路径错误
- **注意**：删除父评论时不会自动删除子评论，需要在应用层手动处理（递归删除）

#### 4. 创建数据库迁移

运行以下命令创建迁移：

```bash
dotnet ef migrations add Comments
dotnet ef database update
```

#### 5. 创建 DTO

**5.1 CommentCreationDTO**

在 `DTOs/CommentCreationDTO.cs` 中定义创建评论请求 DTO：

```csharp
using System.ComponentModel.DataAnnotations;

namespace ThisisczApi.DTOs;

public class CommentCreationDTO
{
    [Required(ErrorMessage = "You must fill the {0} field")]
    public int PostId { get; set; }

    public int? ParentId { get; set; }

    [Required(ErrorMessage = "You must fill the {0} field")]
    [StringLength(maximumLength: 500)]
    public required string Content { get; set; } = string.Empty;
}
```

**字段说明**：

- `PostId`：必填，要评论的帖子 ID
- `ParentId`：可选，父评论 ID（`null` 表示顶级评论，有值表示回复）
- `Content`：必填，评论内容，最大长度 500 字符

**5.2 CommentDTO**

在 `DTOs/CommentDTO.cs` 中定义评论响应 DTO：

```csharp
namespace ThisisczApi.DTOs;

public class CommentDTO
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public UserDTO User { get; set; } = null!;

    public int PostId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public int? ParentId { get; set; }
    public CommentDTO? Parent { get; set; }

    public int ReplyCount { get; set; } = 0;
}
```

**字段说明**：

- `Id`：评论 ID
- `UserId`：评论用户 ID
- `User`：评论用户信息（包含用户名、邮箱等）
- `PostId`：关联的帖子 ID
- `Content`：评论内容
- `CreatedAt`：创建时间
- `ParentId`：父评论 ID（可选）
- `Parent`：父评论信息（可选，通常用于显示回复关系）
- `ReplyCount`：回复数量（该评论有多少条回复）

**5.3 CommentQueryDTO**

在 `DTOs/CommentQueryDTO.cs` 中定义查询参数 DTO：

```csharp
using System.ComponentModel.DataAnnotations;

namespace ThisisczApi.DTOs;

public class CommentQueryDTO : PaginationDTO
{
    [Required(ErrorMessage = "You must fill the {0} field")]
    public int PostId { get; set; }
    public int? ParentId { get; set; }
}
```

**字段说明**：

- `PostId`：必填，要查询的帖子 ID
- `ParentId`：可选，父评论 ID
  - `null` 或不传：查询该帖子的所有顶级评论
  - 有值：查询指定父评论的所有回复

#### 6. 配置 AutoMapper

在 `utilities/AutoMapperProfiles.cs` 中添加映射配置：

```csharp
CreateMap<CommentCreationDTO, Comment>();
CreateMap<Comment, CommentDTO>();
```

**映射说明**：

- `CommentCreationDTO` → `Comment`：创建评论时，`UserId` 在控制器中手动设置
- `Comment` → `CommentDTO`：查询评论时，`ReplyCount` 在控制器中手动计算

#### 7. 实现控制器端点

在 `Controllers/CommentsController.cs` 中实现评论功能：

**7.1 创建评论端点**

```csharp
[HttpPost("create")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<ActionResult> Create([FromBody] CommentCreationDTO commentCreationDTO)
{
    // 验证帖子是否存在
    var _post = await context.Posts.FirstOrDefaultAsync(x => x.Id == commentCreationDTO.PostId);
    if (_post is null)
    {
        return NotFound();
    }

    // 获取当前用户
    var user = await usersService.GetCurrentUser();
    if (user is null)
    {
        return Unauthorized("User not found");
    }

    // 如果指定了 ParentId，验证父评论是否存在
    if (commentCreationDTO.ParentId.HasValue)
    {
        var parentComment = await context.Comments
            .FirstOrDefaultAsync(x => x.Id == commentCreationDTO.ParentId.Value);
        if (parentComment is null)
        {
            return BadRequest("Parent comment not found");
        }
    }

    // 映射并创建评论
    var _comment = mapper.Map<Comment>(commentCreationDTO);
    _comment.UserId = user.Id;

    context.Add(_comment);
    await context.SaveChangesAsync();
    return NoContent();
}
```

**功能说明**：

- 使用 `[Authorize]` 确保只有登录用户才能创建评论
- 验证帖子是否存在
- 如果指定了 `ParentId`，验证父评论是否存在
- 使用 AutoMapper 映射 DTO 到实体
- 手动设置 `UserId` 为当前用户 ID

**7.2 查询评论列表端点**

```csharp
[HttpGet]
public async Task<ActionResult<PaginationResult<CommentDTO>>> GetList([FromQuery] CommentQueryDTO query)
{
    var queryable = context.Comments
        .Include(c => c.User)
        .AsQueryable();

    // 根据 parentId 过滤：不传或为 null 表示顶级评论，其他值表示该父评论的回复
    if (query.ParentId == null)
    {
        // 查询顶级评论（ParentId 为 null）
        queryable = queryable.Where(c => c.PostId == query.PostId && c.ParentId == null);
    }
    else
    {
        // 查询指定父评论的回复
        queryable = queryable.Where(c => c.PostId == query.PostId && c.ParentId == query.ParentId);
    }

    var totalAmount = await queryable.CountAsync();

    // 获取分页后的 Comment 列表
    var comments = await queryable
        .OrderByDescending(x => x.CreatedAt)
        .Skip((query.Page - 1) * query.PageSize)
        .Take(query.PageSize)
        .ToListAsync();

    // 获取所有评论的ID列表
    var commentIds = comments.Select(c => c.Id).ToList();

    // 批量查询每条评论的回复数量（避免 N+1 问题）
    var replyCounts = await context.Comments
        .Where(c => c.ParentId.HasValue && commentIds.Contains(c.ParentId.Value))
        .GroupBy(c => c.ParentId!.Value)
        .Select(g => new { ParentId = g.Key, Count = g.Count() })
        .ToListAsync();

    // 创建回复数量的字典以便快速查找
    var replyCountDict = replyCounts.ToDictionary(rc => rc.ParentId, rc => rc.Count);

    // 映射到 DTO 并设置回复数量
    var items = comments.Select(comment =>
    {
        var dto = mapper.Map<CommentDTO>(comment);
        dto.ReplyCount = replyCountDict.GetValueOrDefault(comment.Id, 0);
        return dto;
    }).ToList();

    return new PaginationResult<CommentDTO>
    {
        Page = query.Page,
        PageSize = query.PageSize,
        TotalCount = totalAmount,
        Items = items
    };
}
```

**功能说明**：

- 使用 `Include(c => c.User)` 预加载用户信息，避免 N+1 问题
- 根据 `ParentId` 参数过滤：
  - `null`：查询顶级评论
  - 有值：查询指定父评论的回复
- 支持分页查询
- **性能优化**：使用 `GroupBy` 批量查询所有评论的回复数量，避免对每个评论单独查询
- 将查询结果转换为字典，提高后续查找效率

**7.3 删除评论端点**

```csharp
[HttpDelete("{id:int}")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<ActionResult> Remove(int id)
{
    var _comment = await context.Comments.FirstOrDefaultAsync(x => x.Id == id);
    if (_comment is null)
    {
        return NotFound();
    }

    var user = await usersService.GetCurrentUser();
    if (user is null)
    {
        return Unauthorized("User not found");
    }

    // 权限检查：只有评论作者或管理员可以删除
    if (user.Id == _comment.UserId || user.Role == "admin")
    {
        // 递归删除所有子评论
        await DeleteCommentAndChildren(id);
        await context.SaveChangesAsync();
        return NoContent();
    }
    else
    {
        return BadRequest("Remove is Not Allowed");
    }
}

/// <summary>
/// 递归删除评论及其所有子评论
/// </summary>
private async Task DeleteCommentAndChildren(int commentId)
{
    // 收集所有需要删除的评论ID（包括当前评论及其所有子评论）
    var commentIdsToDelete = new List<int> { commentId };
    var queue = new Queue<int>();
    queue.Enqueue(commentId);

    // 使用广度优先搜索（BFS）收集所有子评论ID
    while (queue.Count > 0)
    {
        var currentId = queue.Dequeue();
        var childIds = await context.Comments
            .Where(c => c.ParentId == currentId)
            .Select(c => c.Id)
            .ToListAsync();

        foreach (var childId in childIds)
        {
            commentIdsToDelete.Add(childId);
            queue.Enqueue(childId);
        }
    }

    // 批量删除所有评论
    var commentsToDelete = await context.Comments
        .Where(c => commentIdsToDelete.Contains(c.Id))
        .ToListAsync();

    context.Comments.RemoveRange(commentsToDelete);
}
```

**功能说明**：

- 使用 `[Authorize]` 确保只有登录用户才能删除评论
- 验证评论是否存在
- **权限控制**：只有评论作者（`user.Id == _comment.UserId`）或管理员（`user.Role == "admin"`）可以删除
- **递归删除**：使用广度优先搜索（BFS）算法收集所有子评论 ID，然后批量删除
- 避免使用级联删除，因为数据库配置为 `Restrict`，需要在应用层手动处理

**递归删除算法说明**：

1. 使用队列（Queue）实现广度优先搜索
2. 从当前评论开始，查找所有直接子评论
3. 将子评论 ID 加入队列，继续查找子评论的子评论
4. 收集所有需要删除的评论 ID
5. 最后批量删除所有评论，提高性能

#### 8. 性能优化要点

**8.1 避免 N+1 问题**

- 使用 `Include(c => c.User)` 预加载用户信息
- 使用 `GroupBy` 批量查询回复数量，而不是对每个评论单独查询

**8.2 批量操作**

- 删除评论时使用 `RemoveRange` 批量删除，而不是逐个删除
- 查询回复数量时使用字典（Dictionary）提高查找效率

**8.3 索引优化**

- 数据库自动为 `ParentId` 和 `UserId` 创建索引，提高查询性能
