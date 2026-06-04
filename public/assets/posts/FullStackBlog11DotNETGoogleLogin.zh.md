### 全栈开发个人博客 11：DotNET 接入谷歌登录

> Google OAuth 2.0 允许用户使用 Google 账号快速登录博客应用，无需创建新账号。系统会自动验证 Google ID Token，并在首次登录时自动创建用户账号。

#### 1. 概述

**核心功能**：

- Google ID Token 验证
- 自动用户账号创建
- 与现有 JWT 认证系统集成
- 基于邮箱的角色分配（admin/user）

**技术栈**：

- Google.Apis.Auth 1.73.0
- ASP.NET Core Identity
- JWT Bearer Authentication
- Google OAuth 2.0

#### 2. 前置准备

**2.1 在 Google Cloud Console 创建 OAuth 2.0 凭据**

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API** 或 **Google Identity Services**
4. 进入 **API 和凭据** > **创建凭据** > **OAuth 客户端 ID**
5. 选择应用类型（Web 应用）
6. 配置授权重定向 URI（前端回调地址）
7. 保存 **客户端 ID**（Client ID）

**2.2 前端集成 Google Sign-In**

前端需要使用 Google Identity Services 获取 ID Token，然后发送到后端验证

#### 3. 安装依赖包

在 Package Manager Console 中执行：

```bash
dotnet add package Google.Apis.Auth --version 1.73.0
```

#### 4. 配置 Google Client ID

在 `appsettings.json` 中添加 Google 配置：

```json
{
  "Google": {
    "ClientId": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

**重要提示**：

- 生产环境和开发环境应使用不同的 Client ID
- 可以在 `appsettings.Development.json` 中覆盖开发环境配置
- Client ID 不应提交到公开的代码仓库

#### 5. 创建 Google 登录 DTO

创建 `DTOs/GoogleLoginDTO.cs`：

```csharp
using System.ComponentModel.DataAnnotations;
namespace ThisisczApi.DTOs;

public class GoogleLoginDTO
{
  [Required]
  public required string Credential { get; set; }
}
```

**DTO 说明**：

- `Credential`：前端 Google Sign-In 返回的 ID Token（JWT 格式）

#### 6. 实现 Google 登录接口

在 `UsersController.cs` 中实现 Google 登录接口：

**6.1 添加必要的 using 语句**

```csharp
using Google.Apis.Auth;
```

**6.2 实现 GoogleLogin 方法**

```csharp
[HttpPost("google-login")]
public async Task<ActionResult<AuthenticationResponseDTO>> GoogleLogin([FromBody] GoogleLoginDTO googleLoginDTO)
{
  try
  {
    // 从配置中获取 Google Client ID
    var googleClientId = configuration["Google:ClientId"];
    if (string.IsNullOrEmpty(googleClientId))
    {
      return BadRequest(new { error = "Google Client ID is not configured" });
    }

    // 验证 Google ID Token
    var settings = new GoogleJsonWebSignature.ValidationSettings
    {
      Audience = new[] { googleClientId }
    };

    var payload = await GoogleJsonWebSignature.ValidateAsync(googleLoginDTO.Credential, settings);
    var email = payload.Email;

    if (string.IsNullOrEmpty(email))
    {
      return BadRequest(new { error = "Email not found in Google credential" });
    }

    // 查找或创建用户
    var user = await userManager.FindByEmailAsync(email);

    if (user == null)
    {
      // 首次登录，自动创建用户
      user = new IdentityUser
      {
        Email = payload.Email,
        UserName = payload.Email.Split('@')[0],
        EmailConfirmed = payload.EmailVerified
      };

      // 先创建用户，保存到数据库
      var createResult = await userManager.CreateAsync(user);
      if (!createResult.Succeeded)
      {
        return BadRequest(createResult.Errors);
      }

      // 用户创建成功后，再添加 Claim
      var role = payload.Email == "xxx" ? "admin" : "user";
      await userManager.AddClaimAsync(user, new Claim(RoleClaimType, role));
    }

    // 生成并返回 JWT Token
    return await BuildAccessTokenAsync(user);
  }
  catch (Exception ex)
  {
    return BadRequest(new { error = "Error validating Google credential", details = ex.Message });
  }
}
```

**关键实现说明**：

1. **验证 ID Token**：
   - 使用 `GoogleJsonWebSignature.ValidateAsync` 验证 Google ID Token
   - 验证时会检查 Token 的签名、过期时间和 Audience（Client ID）
   - 验证成功返回 `GoogleJsonWebSignature.Payload` 对象

2. **用户查找或创建**：
   - 通过邮箱查找现有用户
   - 如果用户不存在，自动创建新用户
   - 使用邮箱前缀作为用户名
   - 设置 `EmailConfirmed` 为 Google 返回的 `EmailVerified` 值

3. **角色分配**：
   - 根据邮箱地址自动分配角色
   - 示例中：包含 "xxx" 的邮箱分配为 "admin"，其他为 "user"
   - 可以根据业务需求调整角色分配逻辑

4. **Token 生成**：
   - 复用现有的 `BuildAccessTokenAsync` 方法
   - 返回标准的 JWT Token，与普通登录流程一致

#### 7. 开发步骤总结

1. **在 Google Cloud Console 创建 OAuth 2.0 凭据**：获取 Client ID
2. **安装依赖包**：添加 `Google.Apis.Auth` NuGet 包
3. **配置 Client ID**：在 `appsettings.json` 中添加 Google 配置
4. **创建 DTO**：定义 `GoogleLoginDTO` 接收 ID Token
5. **实现登录接口**：在 `UsersController` 中实现 `GoogleLogin` 方法
6. **验证 ID Token**：使用 `GoogleJsonWebSignature.ValidateAsync` 验证
7. **查找或创建用户**：根据邮箱查找用户，不存在则自动创建
8. **分配角色**：根据业务规则分配用户角色（admin/user）
9. **生成 JWT Token**：复用现有的 Token 生成逻辑

#### 8. 与现有系统的集成

**12.1 与 JWT 认证集成**

- Google 登录成功后返回的 JWT Token 与普通登录完全一致
- 可以使用相同的 `[Authorize]` 特性保护接口
- 用户信息通过 `GetCurrentUser` 接口获取，无需区分登录方式

**12.2 与权限系统集成**

- Google 登录用户自动分配角色（admin/user）
- 可以使用 `[Authorize(Policy = "IsAdmin")]` 限制管理员接口
- 角色信息存储在 Identity Claims 中，与普通用户一致

**12.3 用户数据一致性**

- 所有用户（Google 登录和普通登录）使用相同的 `IdentityUser` 实体
- 邮箱作为唯一标识，确保数据一致性
- 可以混合使用多种登录方式，系统自动处理
