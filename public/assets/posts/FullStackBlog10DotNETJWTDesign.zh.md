### 全栈开发个人博客 10：JWT 和权限设计

> JWT（JSON Web Token）认证系统为博客应用提供了安全的身份验证和授权机制，支持基于角色的访问控制（RBAC）。

#### 1. 概述

**核心功能**：

- JWT Token 生成和验证
- 基于 Claims 的角色管理（admin/user）
- 权限策略定义和应用
- 帖子接口的鉴权保护

**技术栈**：

- ASP.NET Core Identity
- JWT Bearer Authentication
- Claims-based Authorization
- Microsoft.IdentityModel.Tokens

#### 2. 配置 JWT 认证服务

在 `Program.cs` 中配置 JWT 认证服务：

**2.1 读取 JWT 配置**

```csharp
// 从配置文件读取 JWT 密钥
var jwtConfig = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtConfig["Key"]!);
```

**2.2 添加认证服务**

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

**关键配置说明**：

- `MapInboundClaims = false`：禁用 Claims 映射，使用原始 Claim 类型
- `ValidateLifetime = true`：验证 Token 有效期
- `ValidateIssuerSigningKey = true`：验证签名密钥
- `ClockSkew = TimeSpan.Zero`：不设置时钟偏差容忍度

**2.3 配置 Swagger JWT 支持**

在 Swagger 配置中添加 JWT Bearer 认证支持，方便在 Swagger UI 中测试：

```csharp
options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
{
    Description = "JWT 授权头使用 Bearer 方案。例如: \"Authorization: Bearer {token}\"",
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

**2.4 配置中间件管道**

```csharp
app.UseAuthentication();  // 确认身份
app.UseAuthorization();   // 检查权限
```

**注意**：`UseAuthentication()` 必须在 `UseAuthorization()` 之前调用。

#### 3. 定义权限策略

在 `Program.cs` 中定义权限策略：

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("IsAdmin", policy => policy.RequireClaim("role", "admin"));
});
```

**权限策略说明**：

- `IsAdmin` 策略要求用户必须拥有 `role` Claim，且值为 `"admin"`
- 其他用户默认拥有 `"user"` 角色

#### 4. 实现 JWT Token 生成

在 `UsersController` 中实现 JWT Token 生成逻辑：

**4.1 构建 Access Token**

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

**4.2 构建用户 Claims**

```csharp
private async Task<List<Claim>> BuildUserClaimsAsync(IdentityUser user)
{
    var claims = new List<Claim>
    {
        new Claim(EmailClaimType, user.Email!)
    };

    // 从数据库获取用户的 Claims（包括 role）
    var dbClaims = await userManager.GetClaimsAsync(user);
    claims.AddRange(dbClaims);
    return claims;
}
```

**Claims 说明**：

- `email`：用户邮箱，用于标识用户身份
- `role`：用户角色（admin/user），用于权限控制

**4.3 获取签名凭据**

```csharp
private SigningCredentials GetSigningCredentials()
{
    var jwtConfig = configuration.GetSection("Jwt");
    var key = Encoding.UTF8.GetBytes(jwtConfig["Key"]!);
    var signingKey = new SymmetricSecurityKey(key);
    return new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
}
```

**4.4 获取 Token 过期时间**

```csharp
private DateTime GetAccessTokenExpiration()
{
    var jwtConfig = configuration.GetSection("Jwt");
    var expireMinutes = jwtConfig.GetValue<int>("ExpireMinutes", 60);
    return DateTime.UtcNow.AddMinutes(expireMinutes);
}
```

#### 5. 实现用户服务

创建 `UsersService` 用于获取当前登录用户：

**5.1 接口定义**

```csharp
public interface IUsersService
{
    Task<UserDTO> GetCurrentUser();
}
```

**5.2 服务实现**

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

        // 从 JWT token 中获取当前用户的 email
        var email = httpContext.User.FindFirstValue(EmailClaimType);
        if (string.IsNullOrEmpty(email))
        {
            throw new UnauthorizedAccessException("Invalid token: email not found in token claims.");
        }

        // 通过 email 查找用户
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

**关键点**：

- 使用 `IHttpContextAccessor` 访问当前 HTTP 上下文
- 从 JWT Claims 中提取 `email` 来标识用户
- 通过 `UserManager` 查找用户实体

**5.3 注册服务**

```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUsersService, UsersService>();
```

#### 6. 在控制器中应用鉴权

**6.1 获取当前用户信息**

在 `UsersController` 中实现获取当前用户信息的接口：

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

**6.2 帖子接口鉴权应用**

在 `PostsController` 中应用权限控制：

**创建帖子（仅管理员）**

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

**更新帖子（仅管理员）**

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

**帖子点赞（需要认证）**

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
    // ... 点赞逻辑
}
```

**权限说明**：

- `[Authorize]`：仅要求用户已认证（不限定认证方式）
- `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]`：必须通过 JWT Bearer 认证
- `[Authorize(..., Policy = "IsAdmin")]`：必须通过 JWT 认证且拥有 admin 角色

#### 6. 配置文件设置

在 `appsettings.json` 中配置 JWT 参数：

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

**配置说明**：

- `Key`：用于签名和验证 JWT 的密钥（生产环境应使用更安全的密钥）
- `ExpireMinutes`：Token 过期时间（分钟）

#### 7. 开发步骤总结

1. **配置 JWT 认证服务**：在 `Program.cs` 中配置 JWT Bearer 认证和 Token 验证参数
2. **定义权限策略**：创建 `IsAdmin` 策略，要求用户拥有 `role: admin` Claim
3. **实现 Token 生成**：在 `UsersController` 中实现 `BuildAccessTokenAsync` 方法
4. **构建用户 Claims**：将用户的 email 和 role 信息添加到 JWT Claims 中
5. **创建用户服务**：实现 `UsersService` 用于从 JWT Claims 中获取当前用户
6. **应用鉴权特性**：在需要保护的接口上使用 `[Authorize]` 特性
7. **应用权限策略**：在管理员接口上使用 `Policy = "IsAdmin"` 限制访问
8. **条件性认证检查**：在公开接口中检查用户是否已登录，以提供个性化功能

#### 8. 安全注意事项

1. **密钥安全**：JWT 密钥应存储在安全的位置（如 Azure Key Vault），不应提交到代码仓库
2. **Token 过期**：设置合理的 Token 过期时间，平衡安全性和用户体验
3. **HTTPS**：生产环境必须使用 HTTPS 传输 JWT Token
4. **Claims 最小化**：只在 JWT 中包含必要的用户信息，避免敏感数据泄露
5. **权限验证**：始终在服务端验证用户权限，不要仅依赖前端传递的角色信息
