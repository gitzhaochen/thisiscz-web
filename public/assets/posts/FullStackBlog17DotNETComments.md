### Full Stack Personal Blog Development 17: DotNET Post Comments Design

> Allows users to comment and reply on blog articles, supporting multi-level nested reply structures, while providing comment list queries, reply count statistics, and permission control.

#### 1. Overview

**Core Features**:

- User create comments (supports commenting on posts and replying to comments)
- Query comment list (supports pagination and filtering by parent comment)
- Query comment reply count
- Delete comments (supports recursive deletion of all child comments)
- Permission control (only comment author or admin can delete)

**Technology Stack**:

- ASP.NET Core Web API
- Entity Framework Core
- JWT Authentication
- Self-Referencing Relationship
- Batch query optimization (avoid N+1 problem)
- Recursive deletion algorithm

#### 2. Create Entity Model (Comment)

Define the comment entity in `Entities/Comment.cs`:

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

**Field Description**:

- `Id`: Primary key, auto-increment
- `UserId`: Comment user ID (associates with IdentityUser)
- `User`: Navigation property, associates with comment user
- `PostId`: Associated post ID
- `Content`: Comment content
- `CreatedAt`: Comment creation time
- `ParentId`: Parent comment ID (optional, `null` means top-level comment)
- `Parent`: Navigation property, associates with parent comment (self-referencing relationship)

**Design Points**:

- Use self-referencing relationship (`ParentId` and `Parent`) to implement multi-level nested replies
- `ParentId` is nullable type (`int?`), `null` means top-level comment
- Supports unlimited level nesting (recommend limiting depth in actual applications)

#### 3. Configure Database Context

In `ApplicationDbContext.cs`:

**3.1 Add DbSet**

```csharp
public DbSet<Comment> Comments { get; set; }
```

**3.2 Configure Relationships**

Configure the relationship between comments and users, and the self-referencing relationship of comments in `OnModelCreating` method:

```csharp
// Configure relationship between Comment entity and IdentityUser (comment user)
modelBuilder.Entity<Comment>()
  .HasOne(c => c.User)
  .WithMany()
  .HasForeignKey(c => c.UserId)
  .OnDelete(DeleteBehavior.Restrict);

// Configure self-referencing relationship of Comment entity (parent comment and child replies)
modelBuilder.Entity<Comment>()
  .HasOne(c => c.Parent)
  .WithMany()
  .HasForeignKey(c => c.ParentId)
  .OnDelete(DeleteBehavior.Restrict);
```

**Configuration Description**:

- **User Relationship**: Each comment belongs to one user, use `Restrict` delete behavior to prevent deleting users with comments
- **Self-Referencing Relationship**: Each comment can have one parent comment and multiple child comments (replies)
- **Delete Behavior**: Use `Restrict` to avoid SQL Server multiple cascade path errors
- **Note**: Deleting parent comment will not automatically delete child comments, need to handle manually at application layer (recursive deletion)

#### 4. Create Database Migration

Run the following command to create migration:

```bash
dotnet ef migrations add Comments
dotnet ef database update
```

#### 5. Create DTOs

**5.1 CommentCreationDTO**

Define create comment request DTO in `DTOs/CommentCreationDTO.cs`:

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

**Field Description**:

- `PostId`: Required, post ID to comment on
- `ParentId`: Optional, parent comment ID (`null` means top-level comment, has value means reply)
- `Content`: Required, comment content, maximum length 500 characters

**5.2 CommentDTO**

Define comment response DTO in `DTOs/CommentDTO.cs`:

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

**Field Description**:

- `Id`: Comment ID
- `UserId`: Comment user ID
- `User`: Comment user information (includes username, email, etc.)
- `PostId`: Associated post ID
- `Content`: Comment content
- `CreatedAt`: Creation time
- `ParentId`: Parent comment ID (optional)
- `Parent`: Parent comment information (optional, usually used to display reply relationship)
- `ReplyCount`: Reply count (how many replies this comment has)

**5.3 CommentQueryDTO**

Define query parameter DTO in `DTOs/CommentQueryDTO.cs`:

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

**Field Description**:

- `PostId`: Required, post ID to query
- `ParentId`: Optional, parent comment ID
  - `null` or not provided: Query all top-level comments for the post
  - Has value: Query all replies for the specified parent comment

#### 6. Configure AutoMapper

Add mapping configuration in `utilities/AutoMapperProfiles.cs`:

```csharp
CreateMap<CommentCreationDTO, Comment>();
CreateMap<Comment, CommentDTO>();
```

**Mapping Description**:

- `CommentCreationDTO` → `Comment`: When creating comment, `UserId` is manually set in controller
- `Comment` → `CommentDTO`: When querying comments, `ReplyCount` is manually calculated in controller

#### 7. Implement Controller Endpoints

Implement comment functionality in `Controllers/CommentsController.cs`:

**7.1 Create Comment Endpoint**

```csharp
[HttpPost("create")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<ActionResult> Create([FromBody] CommentCreationDTO commentCreationDTO)
{
    // Verify post exists
    var _post = await context.Posts.FirstOrDefaultAsync(x => x.Id == commentCreationDTO.PostId);
    if (_post is null)
    {
        return NotFound();
    }

    // Get current user
    var user = await usersService.GetCurrentUser();
    if (user is null)
    {
        return Unauthorized("User not found");
    }

    // If ParentId is specified, verify parent comment exists
    if (commentCreationDTO.ParentId.HasValue)
    {
        var parentComment = await context.Comments
            .FirstOrDefaultAsync(x => x.Id == commentCreationDTO.ParentId.Value);
        if (parentComment is null)
        {
            return BadRequest("Parent comment not found");
        }
    }

    // Map and create comment
    var _comment = mapper.Map<Comment>(commentCreationDTO);
    _comment.UserId = user.Id;

    context.Add(_comment);
    await context.SaveChangesAsync();
    return NoContent();
}
```

**Function Description**:

- Use `[Authorize]` to ensure only logged-in users can create comments
- Verify post exists
- If `ParentId` is specified, verify parent comment exists
- Use AutoMapper to map DTO to entity
- Manually set `UserId` to current user ID

**7.2 Query Comment List Endpoint**

```csharp
[HttpGet]
public async Task<ActionResult<PaginationResult<CommentDTO>>> GetList([FromQuery] CommentQueryDTO query)
{
    var queryable = context.Comments
        .Include(c => c.User)
        .AsQueryable();

    // Filter by parentId: null or not provided means top-level comments, other values mean replies to that parent comment
    if (query.ParentId == null)
    {
        // Query top-level comments (ParentId is null)
        queryable = queryable.Where(c => c.PostId == query.PostId && c.ParentId == null);
    }
    else
    {
        // Query replies to specified parent comment
        queryable = queryable.Where(c => c.PostId == query.PostId && c.ParentId == query.ParentId);
    }

    var totalAmount = await queryable.CountAsync();

    // Get paginated Comment list
    var comments = await queryable
        .OrderByDescending(x => x.CreatedAt)
        .Skip((query.Page - 1) * query.PageSize)
        .Take(query.PageSize)
        .ToListAsync();

    // Get list of all comment IDs
    var commentIds = comments.Select(c => c.Id).ToList();

    // Batch query reply count for each comment (avoid N+1 problem)
    var replyCounts = await context.Comments
        .Where(c => c.ParentId.HasValue && commentIds.Contains(c.ParentId.Value))
        .GroupBy(c => c.ParentId!.Value)
        .Select(g => new { ParentId = g.Key, Count = g.Count() })
        .ToListAsync();

    // Create dictionary of reply counts for quick lookup
    var replyCountDict = replyCounts.ToDictionary(rc => rc.ParentId, rc => rc.Count);

    // Map to DTO and set reply count
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

**Function Description**:

- Use `Include(c => c.User)` to preload user information, avoid N+1 problem
- Filter by `ParentId` parameter:
  - `null`: Query top-level comments
  - Has value: Query replies to specified parent comment
- Support paginated queries
- **Performance Optimization**: Use `GroupBy` to batch query reply counts for all comments, avoid querying each comment separately
- Convert query results to dictionary for efficient subsequent lookups

**7.3 Delete Comment Endpoint**

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

    // Permission check: only comment author or admin can delete
    if (user.Id == _comment.UserId || user.Role == "admin")
    {
        // Recursively delete all child comments
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
/// Recursively delete comment and all its child comments
/// </summary>
private async Task DeleteCommentAndChildren(int commentId)
{
    // Collect all comment IDs to delete (including current comment and all its child comments)
    var commentIdsToDelete = new List<int> { commentId };
    var queue = new Queue<int>();
    queue.Enqueue(commentId);

    // Use breadth-first search (BFS) to collect all child comment IDs
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

    // Batch delete all comments
    var commentsToDelete = await context.Comments
        .Where(c => commentIdsToDelete.Contains(c.Id))
        .ToListAsync();

    context.Comments.RemoveRange(commentsToDelete);
}
```

**Function Description**:

- Use `[Authorize]` to ensure only logged-in users can delete comments
- Verify comment exists
- **Permission Control**: Only comment author (`user.Id == _comment.UserId`) or admin (`user.Role == "admin"`) can delete
- **Recursive Deletion**: Use breadth-first search (BFS) algorithm to collect all child comment IDs, then batch delete
- Avoid using cascade delete, as database is configured with `Restrict`, need to handle manually at application layer

**Recursive Deletion Algorithm Description**:

1. Use queue (Queue) to implement breadth-first search
2. Start from current comment, find all direct child comments
3. Add child comment IDs to queue, continue finding child comments of child comments
4. Collect all comment IDs to delete
5. Finally batch delete all comments to improve performance

#### 8. Performance Optimization Points

**8.1 Avoid N+1 Problem**

- Use `Include(c => c.User)` to preload user information
- Use `GroupBy` to batch query reply counts instead of querying each comment separately

**8.2 Batch Operations**

- Use `RemoveRange` to batch delete when deleting comments, instead of deleting one by one
- Use dictionary (Dictionary) to improve lookup efficiency when querying reply counts

**8.3 Index Optimization**

- Database automatically creates indexes for `ParentId` and `UserId` to improve query performance
