### Full Stack Personal Blog Development 15: .NET Post Like Design

> The post like functionality allows users to like and unlike blog articles, while providing like count statistics and current user like status queries.

#### 1. Overview

**Core Features**:

- User like/unlike posts
- Query post like count
- Query if current user has liked
- Display total like count in post list and details

**Technology Stack**:

- ASP.NET Core Web API
- Entity Framework Core
- JWT Authentication
- Batch query optimization (avoid N+1 problem)

#### 2. Create Entity Model (PostLike)

Define the like entity in `Entities/PostLike.cs`:

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

**Field Description**:

- `Id`: Primary key, auto-increment
- `PostId`: Associated post ID
- `UserId`: User ID who liked (associates with IdentityUser)
- `CreatedAt`: Like creation time

#### 3. Configure Database Context

In `ApplicationDbContext.cs`:

**3.1 Add DbSet**

```csharp
public DbSet<PostLike> PostLikes { get; set; }
```

**3.2 Configure Unique Index**

Configure unique index in `OnModelCreating` method to ensure each user can only like each post once:

```csharp
// (Same pair of PostId and UserId can only appear once)
modelBuilder.Entity<PostLike>()
    .HasIndex(x => new { x.PostId, x.UserId })
    .IsUnique();
```

#### 4. Create Database Migration

Run the following command to create migration:

```bash
dotnet ef migrations add PostLikes
```

The migration file `Migrations/20251202133936_PostLikes.cs` will create:

- `PostLikes` table, containing `Id`, `PostId`, `UserId`, `CreatedAt` fields
- Composite unique index `IX_PostLikes_PostId_UserId`

Apply migration:

```bash
dotnet ef database update
```

#### 5. Create DTOs

**5.1 PostLikeCreationDTO**

Define like request DTO in `DTOs/PostLikeCreationDTO.cs`:

```csharp
namespace ThisisczApi.DTOs;

public class PostLikeCreationDTO
{
    public int PostId { get; set; }
    public bool IsLiked { get; set; }
}
```

**Field Description**:

- `PostId`: Post ID to like
- `IsLiked`: `true` means like, `false` means unlike

**5.2 Update PostDTO**

Add like-related fields in `DTOs/PostDTO.cs`:

```csharp
public class PostDTO
{
    // ... other fields ...
    public int LikeCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    // ... other fields ...
}
```

**Field Description**:

- `LikeCount`: Total like count for the post
- `IsLikedByCurrentUser`: Whether current logged-in user has liked (false when not logged in)

#### 6. Implement Controller Endpoints

Implement like functionality in `Controllers/PostsController.cs`:

**6.1 Like/Unlike Endpoint**

```csharp
[HttpPost("postLike")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<ActionResult> PostLike([FromBody] PostLikeCreationDTO postLikeCreationDTO)
{
    // Verify post exists
    var _post = await context.Posts.FirstOrDefaultAsync(x => x.Id == postLikeCreationDTO.PostId);
    if (_post is null)
    {
        return NotFound();
    }

    // Get current user
    var user = await usersService.GetCurrentUser();

    // Check if user has already liked
    var isExist = await context.PostLikes
        .AnyAsync(x => x.UserId == user.Id && x.PostId == postLikeCreationDTO.PostId);

    if (postLikeCreationDTO.IsLiked)
    {
        // Like operation
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
        // Unlike operation
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

**Function Description**:

- Use `[Authorize]` to ensure only logged-in users can like
- Verify post exists
- Check if user has already liked to prevent duplicate operations
- Execute like or unlike based on `IsLiked` parameter

**6.2 Query Like Information in Post List**

Add batch query in `GetAll` method to avoid N+1 problem:

```csharp
[HttpGet]
public async Task<ActionResult<PaginationResult<PostDTO>>> GetAll([FromQuery] PostQueryDTO query)
{
    // ... get post list ...
    var postIds = posts.Select(p => p.Id).ToList();

    // Query like counts for all posts at once (use GroupBy to avoid N+1 problem)
    var likeCounts = await context.PostLikes
        .Where(pl => postIds.Contains(pl.PostId))
        .GroupBy(pl => pl.PostId)
        .Select(g => new { PostId = g.Key, Count = g.Count() })
        .ToDictionaryAsync(x => x.PostId, x => x.Count);

    // Query if current user has liked (if user is logged in)
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

    // Map to DTO and set like information
    var items = posts.Select(post =>
    {
        var postDTO = mapper.Map<PostDTO>(post);
        postDTO.LikeCount = likeCounts.GetValueOrDefault(post.Id, 0);
        postDTO.IsLikedByCurrentUser = userLikedPosts.GetValueOrDefault(post.Id, false);
        return postDTO;
    }).ToList();

    // ... return result ...
}
```

**Performance Optimization Description**:

- Use `GroupBy` to batch query like counts for all posts, avoid querying each post separately
- Query all post IDs liked by current user at once, avoid checking one by one
- Convert query results to dictionary for efficient subsequent lookups

**6.3 Query Like Information in Post Details**

Add like information query in `GetDetail` method:

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

    // Query like count
    var likeCount = await context.PostLikes.CountAsync(x => x.PostId == id);

    // Query if current user has liked (if user is logged in)
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

    // Map to DTO and set like information
    var _postDTO = mapper.Map<PostDTO>(_post);
    _postDTO.LikeCount = likeCount;
    _postDTO.IsLikedByCurrentUser = isLikedByCurrentUser;

    return _postDTO;
}
```
