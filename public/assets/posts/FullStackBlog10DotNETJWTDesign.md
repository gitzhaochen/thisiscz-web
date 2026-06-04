### Full Stack Personal Blog Development 10: JWT and Authorization Design

> The JWT (JSON Web Token) authentication system provides a secure identity verification and authorization mechanism for the blog application, supporting role-based access control (RBAC).

#### 1. Overview

**Core Features**:

- JWT Token generation and validation
- Role management based on Claims (admin/user)
- Authorization policy definition and application
- Authentication protection for post APIs

**Technology Stack**:

- ASP.NET Core Identity
- JWT Bearer Authentication
- Claims-based Authorization
- Microsoft.IdentityModel.Tokens

#### 2. Configure JWT Authentication Service

Configure JWT authentication service in `Program.cs`:

**2.1 Read JWT Configuration**

```csharp
// Read JWT key from configuration file
var jwtConfig = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtConfig["Key"]!);
```

**2.2 Add Authentication Service**

```csharp
builder.Services.AddAuthentication()
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.Zero
        };
    });
```

**Key Configuration Description**:

- `MapInboundClaims = false`: Disable Claims mapping, use original Claim types
- `ValidateLifetime = true`: Validate token expiration
- `ValidateIssuerSigningKey = true`: Validate signing key
- `ClockSkew = TimeSpan.Zero`: No clock skew tolerance

**2.3 Configure Swagger JWT Support**

Add JWT Bearer authentication support in Swagger configuration for easy testing in Swagger UI:

```csharp
options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
{
    Description = "JWT authorization header using Bearer scheme. Example: \"Authorization: Bearer {token}\"",
    Name = "Authorization",
    In = ParameterLocation.Header,
    Type = SecuritySchemeType.ApiKey,
    Scheme = "Bearer"
});

options.AddSecurityRequirement(new OpenApiSecurityRequirement
{
    {
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference
            {
                Type = ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        },
        Array.Empty<string>()
    }
});
```

**2.4 Configure Middleware Pipeline**

```csharp
app.UseAuthentication();  // Confirm identity
app.UseAuthorization();   // Check permissions
```

**Note**: `UseAuthentication()` must be called before `UseAuthorization()`.

#### 3. Define Authorization Policies

Define authorization policies in `Program.cs`:

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("IsAdmin", policy => policy.RequireClaim("role", "admin"));
});
```

**Authorization Policy Description**:

- `IsAdmin` policy requires the user to have a `role` Claim with value `"admin"`
- Other users have `"user"` role by default

#### 4. Implement JWT Token Generation

Implement JWT token generation logic in `UsersController`:

**4.1 Build Access Token**

```csharp
private async Task<AuthenticationResponseDTO> BuildAccessTokenAsync(IdentityUser user)
{
    var claims = await BuildUserClaimsAsync(user);
    var signingCredentials = GetSigningCredentials();
    var expiration = GetAccessTokenExpiration();

    var securityToken = new JwtSecurityToken(
        issuer: null,
        audience: null,
        claims: claims,
        expires: expiration,
        signingCredentials: signingCredentials);

    var accessToken = new JwtSecurityTokenHandler().WriteToken(securityToken);

    return new AuthenticationResponseDTO
    {
        Token = accessToken,
        Expiration = expiration
    };
}
```

**4.2 Build User Claims**

```csharp
private async Task<List<Claim>> BuildUserClaimsAsync(IdentityUser user)
{
    var claims = new List<Claim>
    {
        new Claim(EmailClaimType, user.Email!)
    };

    // Get user Claims from database (including role)
    var dbClaims = await userManager.GetClaimsAsync(user);
    claims.AddRange(dbClaims);
    return claims;
}
```

**Claims Description**:

- `email`: User email, used to identify user identity
- `role`: User role (admin/user), used for authorization control

**4.3 Get Signing Credentials**

```csharp
private SigningCredentials GetSigningCredentials()
{
    var jwtConfig = configuration.GetSection("Jwt");
    var key = Encoding.UTF8.GetBytes(jwtConfig["Key"]!);
    var signingKey = new SymmetricSecurityKey(key);
    return new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
}
```

**4.4 Get Token Expiration Time**

```csharp
private DateTime GetAccessTokenExpiration()
{
    var jwtConfig = configuration.GetSection("Jwt");
    var expireMinutes = jwtConfig.GetValue<int>("ExpireMinutes", 60);
    return DateTime.UtcNow.AddMinutes(expireMinutes);
}
```

#### 5. Implement User Service

Create `UsersService` for getting the current logged-in user:

**5.1 Interface Definition**

```csharp
public interface IUsersService
{
    Task<UserDTO> GetCurrentUser();
}
```

**5.2 Service Implementation**

```csharp
public class UsersService : IUsersService
{
    private readonly IHttpContextAccessor httpContextAccessor;
    private readonly UserManager<IdentityUser> userManager;
    private const string EmailClaimType = "email";

    public async Task<UserDTO> GetCurrentUser()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            throw new InvalidOperationException("HttpContext is not available.");
        }

        // Get current user's email from JWT token
        var email = httpContext.User.FindFirstValue(EmailClaimType);
        if (string.IsNullOrEmpty(email))
        {
            throw new UnauthorizedAccessException("Invalid token: email not found in token claims.");
        }

        // Find user by email
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found in the system.");
        }

        var _userDTO = mapper.Map<UserDTO>(user);
        return _userDTO;
    }
}
```

**Key Points**:

- Use `IHttpContextAccessor` to access current HTTP context
- Extract `email` from JWT Claims to identify user
- Find user entity through `UserManager`

**5.3 Register Service**

```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUsersService, UsersService>();
```

#### 6. Apply Authentication in Controllers

**6.1 Get Current User Information**

Implement the API for getting current user information in `UsersController`:

```csharp
[HttpGet("me")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<ActionResult<UserDTO>> GetCurrentUser()
{
    var email = User.FindFirstValue(EmailClaimType);
    if (string.IsNullOrEmpty(email))
    {
        return Unauthorized(new { error = "Invalid token: email not found in token claims." });
    }

    var user = await userManager.FindByEmailAsync(email);
    if (user == null)
    {
        return NotFound(new { error = "User not found in the system." });
    }

    var role = User.FindFirstValue(RoleClaimType);
    if (string.IsNullOrEmpty(role))
    {
        var claims = await userManager.GetClaimsAsync(user);
        role = claims.FirstOrDefault(c => c.Type == RoleClaimType)?.Value ?? "user";
    }

    var userDTO = mapper.Map<UserDTO>(user);
    userDTO.Role = role;
    return userDTO;
}
```

**6.2 Apply Authentication to Post APIs**

Apply authorization control in `PostsController`:

**Create Post (Admin Only)**

```csharp
[HttpPost]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "IsAdmin")]
public async Task<ActionResult<PostDTO>> Create([FromBody] PostCreationDTO postCreationDTO)
{
    var user = await usersService.GetCurrentUser();
    var _post = mapper.Map<Post>(postCreationDTO);
    _post.AuthorId = user.Id;
    context.Add(_post);
    await context.SaveChangesAsync();

    await context.Entry(_post).Reference(p => p.Author).LoadAsync();
    var _postDTO = mapper.Map<PostDTO>(_post);
    return _postDTO;
}
```

**Update Post (Admin Only)**

```csharp
[HttpPut("{id:int}")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "IsAdmin")]
public async Task<ActionResult<PostDTO>> Update(int id, [FromBody] PostCreationDTO postCreationDTO)
{
    var _post = await context.Posts.FirstOrDefaultAsync(x => x.Id == id);
    if (_post is null)
    {
        return NotFound();
    }
    mapper.Map(postCreationDTO, _post);
    _post.UpdatedAt = DateTime.Now;
    await context.SaveChangesAsync();
    return NoContent();
}
```

**Post Like (Requires Authentication)**

```csharp
[HttpPost("postLike")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public async Task<ActionResult> PostLike([FromBody] PostLikeCreationDTO postLikeCreationDTO)
{
    var _post = await context.Posts.FirstOrDefaultAsync(x => x.Id == postLikeCreationDTO.PostId);
    if (_post is null)
    {
        return NotFound();
    }
    var user = await usersService.GetCurrentUser();
    // ... like logic
}
```

**Authorization Description**:

- `[Authorize]`: Only requires user to be authenticated (doesn't specify authentication scheme)
- `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]`: Must authenticate via JWT Bearer
- `[Authorize(..., Policy = "IsAdmin")]`: Must authenticate via JWT and have admin role

#### 6. Configuration File Settings

Configure JWT parameters in `appsettings.json`:

```json
{
  "Jwt": {
    "Key": "xxx",
    "Issuer": "yourapp",
    "Audience": "yourapp_users",
    "ExpireMinutes": 2400
  }
}
```

**Configuration Description**:

- `Key`: Key used for signing and validating JWT (production should use more secure keys)
- `ExpireMinutes`: Token expiration time (in minutes)

#### 7. Development Steps Summary

1. **Configure JWT Authentication Service**: Configure JWT Bearer authentication and token validation parameters in `Program.cs`
2. **Define Authorization Policies**: Create `IsAdmin` policy requiring users to have `role: admin` Claim
3. **Implement Token Generation**: Implement `BuildAccessTokenAsync` method in `UsersController`
4. **Build User Claims**: Add user's email and role information to JWT Claims
5. **Create User Service**: Implement `UsersService` for getting current user from JWT Claims
6. **Apply Authorization Attributes**: Use `[Authorize]` attributes on APIs that need protection
7. **Apply Authorization Policies**: Use `Policy = "IsAdmin"` on admin APIs to restrict access
8. **Conditional Authentication Check**: Check if user is logged in on public APIs to provide personalized features

#### 8. Security Considerations

1. **Key Security**: JWT keys should be stored in secure locations (such as Azure Key Vault), should not be committed to code repositories
2. **Token Expiration**: Set reasonable token expiration times to balance security and user experience
3. **HTTPS**: Production environments must use HTTPS to transmit JWT tokens
4. **Claims Minimization**: Only include necessary user information in JWT, avoid sensitive data leakage
5. **Authorization Verification**: Always verify user permissions on the server side, don't rely solely on role information passed from the frontend
