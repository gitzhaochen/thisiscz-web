### Full-Stack Personal Blog Development 06: .NET Backend Project Design

> Thisiscz API is a Web API project based on .NET 8.0, providing backend services for content management, user authentication, comment system, and other features.

#### 1. Technology Stack

##### Core Framework

- **.NET 8.0** - Target framework
- **ASP.NET Core Web API** - Web API framework
- **Entity Framework Core 9.0.10** - ORM framework
- **SQL Server** - Database (Azure SQL Database)

##### Authentication & Authorization

- **ASP.NET Core Identity** - User identity management
- **JWT Bearer Authentication** - JWT token authentication
- **Google OAuth 2.0** - Google third-party login (Google.Apis.Auth 1.73.0)

##### Utility Libraries

- **AutoMapper 12.0.1** - Object mapping
- **Swashbuckle.AspNetCore 6.4.0** - Swagger/OpenAPI documentation generation
- **Microsoft.IdentityModel.Tokens 8.14.0** - JWT token processing

##### Other Features

- **CORS** - Cross-origin resource sharing support
- **Dependency Injection** - Built-in DI container
- **Code First** - EF Core database migrations

#### 2. Project Structure

```
ThisisczApi/
├── Controllers/          # API Controllers
│   ├── UsersController.cs      # User authentication related endpoints
│   ├── PostsController.cs      # Post management endpoints
│   ├── CommentsController.cs   # Comment management endpoints
│   └── LinksController.cs      # Link management endpoints
├── Entities/             # Entity classes (Database models)
│   ├── Post.cs          # Post entity
│   ├── PostLike.cs      # Post like entity
│   ├── Comment.cs       # Comment entity (supports self-referencing replies)
│   ├── Link.cs          # Link entity
│   └── RefreshToken.cs  # Refresh token entity
├── DTOs/                 # Data Transfer Objects
│   ├── UserDTO.cs
│   ├── PostDTO.cs / PostCreationDTO.cs / PostQueryDTO.cs
│   ├── CommentDTO.cs / CommentCreationDTO.cs / CommentQueryDTO.cs
│   ├── LinkDTO.cs / LinkCreationDTO.cs / LinkQueryDTO.cs
│   └── AuthenticationResponseDTO.cs
├── Services/            # Service layer
│   ├── IUsersService.cs
│   └── UsersService.cs
├── Utilities/           # Utility classes
│   ├── AutoMapperProfiles.cs  # AutoMapper configuration
│   └── PaginationResult.cs    # Pagination result wrapper
├── Migrations/          # EF Core database migration files
├── ApplicationDbContext.cs    # EF Core database context
└── Program.cs           # Application entry point and configuration
```

#### 3. Feature Modules

##### 1. User Authentication Module

- **Google Login**: Supports third-party login via Google OAuth 2.0
- **JWT Authentication**: Uses JWT Bearer Token for identity verification
- **User Information Retrieval**: `GET /api/users/me` - Get current logged-in user information
- **Role Management**: Supports admin and user roles (based on Claims)

##### 2. Post Management Module

- **Post List**: `GET /api/posts` - Supports pagination and category filtering
- **Post Details**: `GET /api/posts/{id}` - Get post details (includes like count, comment count)
- **Create Post**: `POST /api/posts` - Admin only (Policy: "IsAdmin")
- **Update Post**: `PUT /api/posts/{id}` - Admin only
- **Post Like**: `POST /api/posts/postLike` - Supports like/unlike
- **Multi-language Support**: Posts support Chinese and English titles, summaries, and content (Title/TitleZh, Summary/SummaryZh, Content/ContentZh)
- **Category Feature**: Supports four categories: Life (生活), Work (工作), Crypto (加密货币), Sports (运动)

##### 3. Comment System Module

- **Create Comment**: `POST /api/comments/create` - Requires authentication
- **Comment List**: `GET /api/comments` - Supports pagination, can query top-level comments or replies to a specific parent comment
- **Delete Comment**: `DELETE /api/comments/{id}` - Only comment author or admin can delete (recursively deletes child comments)
- **Reply Feature**: Supports nested comment replies (self-referencing relationship)

##### 4. Link Management Module

- **Create Link**: `POST /api/links/create` - Admin only
- **Link List**: `GET /api/links` - Supports pagination and category filtering
- **Link Details**: `GET /api/links/{id}`
- **Update Link**: `PUT /api/links/{id}` - Admin only
- **Delete Link**: `DELETE /api/links/{id}` - Admin only
- **Category Feature**: Supports five categories: Life, Work, Crypto, Sports, Movies

#### 4. Database Design

##### Core Table Structure

###### 1. AspNetUsers (Identity User Table)

- Inherits from ASP.NET Core Identity's `IdentityUser`
- Stores basic user information (Email, UserName, etc.)

###### 2. Posts (Post Table)

```sql
- Id (int, PK)
- Title (string) - English title
- TitleZh (string, nullable) - Chinese title
- Summary (string, nullable) - English summary
- SummaryZh (string, nullable) - Chinese summary
- Content (string, nullable) - English content
- ContentZh (string, nullable) - Chinese content
- AuthorId (string, FK -> AspNetUsers.Id) - Author ID
- CreatedAt (DateTime) - Creation time
- UpdatedAt (DateTime, nullable) - Update time
- Category (PostCategory enum) - Category
```

###### 3. PostLikes (Post Like Table)

```sql
- Id (int, PK)
- PostId (int, FK -> Posts.Id)
- UserId (string, FK -> AspNetUsers.Id)
- CreatedAt (DateTime)
- Unique Index: (PostId, UserId) - Ensures each user can only like each post once
```

###### 4. Comments (Comment Table)

```sql
- Id (int, PK)
- UserId (string, FK -> AspNetUsers.Id) - Comment user
- PostId (int, FK -> Posts.Id) - Belongs to post
- Content (string) - Comment content
- CreatedAt (DateTime) - Creation time
- ParentId (int, nullable, FK -> Comments.Id) - Parent comment ID (supports nested replies)
```

###### 5. Links (Link Table)

```sql
- Id (int, PK)
- Title (string) - Title
- Description (string) - Description
- Url (string) - Link address
- ImageUrl (string) - Image address
- Category (LinkCategory enum) - Category
- UserId (string, FK -> AspNetUsers.Id) - Creator
- CreatedAt (DateTime) - Creation time
- UpdatedAt (DateTime) - Update time
```

###### 6. RefreshTokens (Refresh Token Table)

```sql
- Id (int, PK)
- Token (string) - Refresh token
- UserId (string, FK -> AspNetUsers.Id)
- ExpiresAt (DateTime) - Expiration time
- CreatedAt (DateTime) - Creation time
- IsRevoked (bool) - Whether revoked
```

##### Relationship Design

- **Post ↔ IdentityUser**: Many-to-one (multiple posts belong to one author), Delete behavior: Restrict
- **Comment ↔ IdentityUser**: Many-to-one (multiple comments belong to one user), Delete behavior: Restrict
- **Comment ↔ Comment**: Self-referencing (supports comment replies), Delete behavior: Restrict
- **PostLike ↔ Post**: Many-to-one, Unique constraint (PostId, UserId)
- **PostLike ↔ IdentityUser**: Many-to-one
- **Link ↔ IdentityUser**: Many-to-one, Delete behavior: Restrict

##### Database Configuration

- **Connection String**: Read from `AZURE_SQL_CONNECTIONSTRING` in configuration file
- **Retry Policy**: Connection retry enabled (maximum 5 times, maximum delay 30 seconds)
- **Migration Method**: Code First, manage database structure through EF Core Migrations

#### 5. Configuration

##### Main Configuration Items in appsettings.json

- **ConnectionStrings**: Azure SQL Database connection string
- **Jwt**: JWT configuration (Key, Issuer, Audience, ExpireMinutes)
- **allowedOrigins**: CORS allowed origins (supports multiple domains)
- **Google**: Google OAuth ClientId

#### 6. API Documentation

The project integrates Swagger/OpenAPI. After startup, API documentation can be accessed via `/swagger`.

#### 7. Deployment

- **Database**: Azure SQL Database
- **Backend Deployment**: Azure Web App Services
- **CI/CD**: GitHub Actions (.github/workflows/main_thisisczapi.yml)
