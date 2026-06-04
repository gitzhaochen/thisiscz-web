### 全栈开发个人博客 15：DotNET帖子按赞设计

> 帖子点赞功能允许用户对博客文章进行点赞和取消点赞操作，同时提供点赞数量统计和当前用户点赞状态查询。

#### 1. 概述

**核心功能**：

- 用户点赞/取消点赞帖子
- 查询帖子点赞数量
- 查询当前用户是否已点赞
- 在帖子列表和详情中显示点赞总数

**技术栈**：

- ASP.NET Core Web API
- Entity Framework Core
- JWT 认证
- 批量查询优化（避免 N+1 问题）

#### 2. 创建实体模型（PostLike）

在 `Entities/PostLike.cs` 中定义点赞实体：

```csharp
using Microsoft.AspNetCore.Identity;

namespace ThisisczApi.Entities;

public class PostLike
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

**字段说明**：

- `Id`：主键，自增
- `PostId`：关联的帖子 ID
- `UserId`：点赞用户的 ID（关联 IdentityUser）
- `CreatedAt`：点赞创建时间

#### 3. 配置数据库上下文

在 `ApplicationDbContext.cs` 中：

**3.1 添加 DbSet**

```csharp
public DbSet<PostLike> PostLikes { get; set; }
```

**3.2 配置唯一索引**

在 `OnModelCreating` 方法中配置唯一索引，确保每个用户对每篇帖子只能点赞一次：

```csharp
// （同一对 PostId 和 UserId 只能出现一次）
modelBuilder.Entity<PostLike>()
    .HasIndex(x => new { x.PostId, x.UserId })
    .IsUnique();
```

#### 4. 创建数据库迁移

运行以下命令创建迁移：

```bash
dotnet ef migrations add PostLikes
```

迁移文件 `Migrations/20251202133936_PostLikes.cs` 会创建：

- `PostLikes` 表，包含 `Id`、`PostId`、`UserId`、`CreatedAt` 字段
- 复合唯一索引 `IX_PostLikes_PostId_UserId`

应用迁移：

```bash
dotnet ef database update
```

#### 5. 创建 DTO

**5.1 PostLikeCreationDTO**

在 `DTOs/PostLikeCreationDTO.cs` 中定义点赞请求 DTO：

```csharp
namespace ThisisczApi.DTOs;

public class PostLikeCreationDTO
{
    public int PostId { get; set; }
    public bool IsLiked { get; set; }
}
```

**字段说明**：

- `PostId`：要点赞的帖子 ID
- `IsLiked`：`true` 表示点赞，`false` 表示取消点赞

**5.2 更新 PostDTO**

在 `DTOs/PostDTO.cs` 中添加点赞相关字段：

```csharp
public class PostDTO
{
    // ... 其他字段 ...
    public int LikeCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    // ... 其他字段 ...
}
```

**字段说明**：

- `LikeCount`：帖子的点赞总数
- `IsLikedByCurrentUser`：当前登录用户是否已点赞（未登录时为 `false`）

#### 6. 实现控制器端点

在 `Controllers/PostsController.cs` 中实现点赞功能：

**6.1 点赞/取消点赞端点**

```csharp
[HttpPost("postLike")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<ActionResult> PostLike([FromBody] PostLikeCreationDTO postLikeCreationDTO)
{
    // 验证帖子是否存在
    var _post = await context.Posts.FirstOrDefaultAsync(x => x.Id == postLikeCreationDTO.PostId);
    if (_post is null)
    {
        return NotFound();
    }

    // 获取当前用户
    var user = await usersService.GetCurrentUser();

    // 检查用户是否已点赞
    var isExist = await context.PostLikes
        .AnyAsync(x => x.UserId == user.Id && x.PostId == postLikeCreationDTO.PostId);

    if (postLikeCreationDTO.IsLiked)
    {
        // 点赞操作
        if (!isExist)
        {
            var _postLike = new PostLike
            {
                PostId = postLikeCreationDTO.PostId,
                UserId = user.Id
            };
            context.Add(_postLike);
            await context.SaveChangesAsync();
            return NoContent();
        }
        else
        {
            return BadRequest("User already liked");
        }
    }
    else
    {
        // 取消点赞操作
        if (!isExist)
        {
            return BadRequest("User already unliked");
        }
        else
        {
            var _postLike = await context.PostLikes
                .FirstOrDefaultAsync(x => x.UserId == user.Id && x.PostId == postLikeCreationDTO.PostId);
            if (_postLike != null)
            {
                context.Remove(_postLike);
                await context.SaveChangesAsync();
            }
            return NoContent();
        }
    }
}
```

**功能说明**：

- 使用 `[Authorize]` 确保只有登录用户才能点赞
- 验证帖子是否存在
- 检查用户是否已点赞，防止重复操作
- 根据 `IsLiked` 参数执行点赞或取消点赞

**6.2 在帖子列表中查询点赞信息**

在 `GetAll` 方法中添加批量查询，避免 N+1 问题：

```csharp
[HttpGet]
public async Task<ActionResult<PaginationResult<PostDTO>>> GetAll([FromQuery] PostQueryDTO query)
{
    // ... 获取帖子列表 ...
    var postIds = posts.Select(p => p.Id).ToList();

    // 一次性查询所有 Post 的点赞数量（使用 GroupBy 避免 N+1 问题）
    var likeCounts = await context.PostLikes
        .Where(pl => postIds.Contains(pl.PostId))
        .GroupBy(pl => pl.PostId)
        .Select(g => new { PostId = g.Key, Count = g.Count() })
        .ToDictionaryAsync(x => x.PostId, x => x.Count);

    // 查询当前用户是否已点赞（如果用户已登录）
    Dictionary<int, bool> userLikedPosts = new Dictionary<int, bool>();
    if (User.Identity?.IsAuthenticated == true)
    {
        var user = await usersService.GetCurrentUser();
        if (user != null)
        {
            var likedPostIds = await context.PostLikes
                .Where(pl => postIds.Contains(pl.PostId) && pl.UserId == user.Id)
                .Select(pl => pl.PostId)
                .ToListAsync();

            userLikedPosts = likedPostIds.ToDictionary(id => id, _ => true);
        }
    }

    // 映射到 DTO 并设置点赞信息
    var items = posts.Select(post =>
    {
        var postDTO = mapper.Map<PostDTO>(post);
        postDTO.LikeCount = likeCounts.GetValueOrDefault(post.Id, 0);
        postDTO.IsLikedByCurrentUser = userLikedPosts.GetValueOrDefault(post.Id, false);
        return postDTO;
    }).ToList();

    // ... 返回结果 ...
}
```

**性能优化说明**：

- 使用 `GroupBy` 批量查询所有帖子的点赞数量，避免对每个帖子单独查询
- 一次性查询当前用户点赞的所有帖子 ID，避免逐个检查
- 将查询结果转换为字典，提高后续查找效率

**6.3 在帖子详情中查询点赞信息**

在 `GetDetail` 方法中添加点赞信息查询：

```csharp
[HttpGet("{id:int}")]
public async Task<ActionResult<PostDTO>> GetDetail(int id)
{
    var _post = await context.Posts
        .Include(p => p.Author)
        .FirstOrDefaultAsync(x => x.Id == id);

    if (_post is null)
    {
        return NotFound();
    }

    // 查询点赞数量
    var likeCount = await context.PostLikes.CountAsync(x => x.PostId == id);

    // 查询当前用户是否已点赞（如果用户已登录）
    bool isLikedByCurrentUser = false;
    if (User.Identity?.IsAuthenticated == true)
    {
        var user = await usersService.GetCurrentUser();
        if (user != null)
        {
            isLikedByCurrentUser = await context.PostLikes
                .AnyAsync(x => x.PostId == id && x.UserId == user.Id);
        }
    }

    // 映射到 DTO 并设置点赞信息
    var _postDTO = mapper.Map<PostDTO>(_post);
    _postDTO.LikeCount = likeCount;
    _postDTO.IsLikedByCurrentUser = isLikedByCurrentUser;

    return _postDTO;
}
```
