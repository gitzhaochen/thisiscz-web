### Full Stack Personal Blog Development 08: Post API Service Design

> This document provides a detailed overview of the complete development steps for the post API service, including entity models, DTO design, AutoMapper configuration, and controller implementation.

#### 1. Overview

**Core Features**:

- Get post list (supports pagination and category filtering)
- Create new post
- Update post
- Get post details

**Technology Stack**:

- ASP.NET Core Web API
- Entity Framework Core
- AutoMapper (object mapping)
- ASP.NET Core Identity (user association)

#### 2. Create Entity Model (Post)

Define the post entity in `Entities/Post.cs`:

```csharp
using Microsoft.AspNetCore.Identity;

namespace ThisisczApi.Entities;

public enum PostCategory
{
    Life,      // Life
    Work,      // Work
    Crypto,    // Cryptocurrency
    Sports,    // Sports
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

**Key Points**:

- Supports bilingual content (Title/TitleZh, Summary/SummaryZh, Content/ContentZh)
- Associates with `IdentityUser` through `AuthorId`
- Uses enum type `PostCategory` to define categories
- Automatically records creation and update times

#### 3. Create DTOs (Data Transfer Objects)

##### 3.1 PostDTO (Data returned to client)

Define in `DTOs/PostDTO.cs`:

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

##### 3.2 PostCreationDTO (Input when creating post)

Define in `DTOs/PostCreationDTO.cs`:

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

**Description**: Uses data annotations `[Required]` for validation, `Category` and `Title` are required fields.

##### 3.3 PostQueryDTO (Query parameters)

Define in `DTOs/PostQueryDTO.cs`:

```csharp
using ThisisczApi.Entities;

namespace ThisisczApi.DTOs;

public class PostQueryDTO : PaginationDTO
{
    public PostCategory? Category { get; set; }
}
```

Inherits from `PaginationDTO`, includes pagination parameters (`Page`, `PageSize`) and optional category filtering.

##### 3.4 PaginationDTO (Pagination base class)

Define in `DTOs/PaginationDTO.cs`:

```csharp
namespace ThisisczApi.DTOs;

public class PaginationDTO
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
```

#### 4. Configure AutoMapper

Configure mapping relationships in `Utilities/AutoMapperProfiles.cs`:

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
        // Post related mappings
        CreateMap<PostCreationDTO, Post>();
        CreateMap<Post, PostDTO>();

        // User mapping
        CreateMap<IdentityUser, UserDTO>()
            .ForMember(dest => dest.Role, opt => opt.Ignore());
    }
}
```

**Description**:

- `PostCreationDTO` → `Post`: Map from DTO to entity when creating
- `Post` → `PostDTO`: Map from entity to DTO when returning
- `IdentityUser` → `UserDTO`: Map author information

#### 5. Create Controller (PostsController)

Implement the API in `Controllers/PostsController.cs`:

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

    // Implement API methods...
}
```

#### 6. Implement API Methods

##### 6.1 Get Post List (GET /api/posts)

Supports pagination and category filtering:

```csharp
[HttpGet]
public async Task<ActionResult<PaginationResult<PostDTO>>> GetList([FromQuery] PostQueryDTO query)
{
    var queryable = context.Posts.AsQueryable();

    // Category filtering
    if (query.Category.HasValue)
    {
        queryable = queryable.Where(p => p.Category == query.Category.Value);
    }

    var totalCount = await queryable.CountAsync();

    // Paginated query, including author information
    var posts = await queryable
        .Include(p => p.Author)
        .Skip((query.Page - 1) * query.PageSize)
        .Take(query.PageSize)
        .ToListAsync();

    // Map to DTO
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

**Key Points**:

- Use `Include(p => p.Author)` to load author navigation property
- Use `Skip` and `Take` to implement pagination
- Return `PaginationResult<PostDTO>` containing pagination information

##### 6.2 Create Post (POST /api/posts)

```csharp
[HttpPost]
public async Task<ActionResult<PostDTO>> Create([FromBody] PostCreationDTO postCreationDTO)
{
    var user = await usersService.GetCurrentUser();

    // Map DTO to entity
    var post = mapper.Map<Post>(postCreationDTO);
    post.AuthorId = user.Id;

    context.Add(post);
    await context.SaveChangesAsync();

    // Load Author navigation property for mapping to DTO
    await context.Entry(post).Reference(p => p.Author).LoadAsync();

    var postDTO = mapper.Map<PostDTO>(post);
    return postDTO;
}
```

**Key Points**:

- Use AutoMapper to map DTO to entity
- Set `AuthorId` to current user ID
- After saving, manually load `Author` navigation property, otherwise `Author` in DTO may be `null`

##### 6.3 Update Post (PUT /api/posts/{id})

```csharp
[HttpPut("{id:int}")]
public async Task<ActionResult> Update(int id, [FromBody] PostCreationDTO postCreationDTO)
{
    var post = await context.Posts.FirstOrDefaultAsync(x => x.Id == id);
    if (post is null)
    {
        return NotFound();
    }

    // Use AutoMapper to update entity properties
    mapper.Map(postCreationDTO, post);
    post.UpdatedAt = DateTime.Now;

    await context.SaveChangesAsync();
    return NoContent();
}
```

**Key Points**:

- Query entity first, return 404 if not found
- Use `mapper.Map(source, destination)` to update existing entity
- Update `UpdatedAt` timestamp

##### 6.4 Get Post Details (GET /api/posts/{id})

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

**Key Points**:

- Use `Include` to load author information
- Return 404 when entity doesn't exist

#### 7. Register Service Dependencies

Ensure necessary services are registered in `Program.cs`:

```csharp
// AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// DbContext (already configured previously)
builder.Services.AddDbContext<ApplicationDbContext>(...);

// UsersService (for getting current user)
builder.Services.AddScoped<IUsersService, UsersService>();
```

#### 8. Complete Development Steps Summary

1. **Create Entity Model**: Define `Post` entity and `PostCategory` enum
2. **Create DTOs**: Define `PostDTO`, `PostCreationDTO`, `PostQueryDTO`
3. **Configure AutoMapper**: Configure mapping relationships in `AutoMapperProfiles`
4. **Create Controller**: Create `PostsController` and inject dependencies
5. **Implement List API**: Support pagination and category filtering
6. **Implement Create API**: Map from DTO to entity and save
7. **Implement Update API**: Update existing post
8. **Implement Details API**: Get single post by ID

#### 9. Important Notes

- **Navigation Property Loading**: Use `Include` or `LoadAsync` to ensure related data is loaded
- **Data Validation**: Use data annotations in DTOs for validation
- **Pagination Performance**: Use `Skip` and `Take` to implement pagination at database level, avoid loading all data
- **Timestamp Management**: Automatically set `CreatedAt` when creating, manually set `UpdatedAt` when updating
- **Multilingual Support**: Both entities and DTOs support Chinese and English fields for internationalization

#### 10. Related Files

- `Entities/Post.cs`: Post entity definition
- `DTOs/PostDTO.cs`: Return data DTO
- `DTOs/PostCreationDTO.cs`: Creation data DTO
- `DTOs/PostQueryDTO.cs`: Query parameter DTO
- `DTOs/PaginationDTO.cs`: Pagination base class
- `Controllers/PostsController.cs`: Controller implementation
- `Utilities/AutoMapperProfiles.cs`: AutoMapper configuration
- `Utilities/PaginationResult.cs`: Pagination result wrapper
