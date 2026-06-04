### Full Stack Personal Blog Development 11: .NET Google Login Integration

> Google OAuth 2.0 allows users to quickly log in to the blog application using their Google account without creating a new account. The system automatically validates Google ID Tokens and creates user accounts on first login.

#### 1. Overview

**Core Features**:

- Google ID Token validation
- Automatic user account creation
- Integration with existing JWT authentication system
- Role assignment based on email (admin/user)

**Technology Stack**:

- Google.Apis.Auth 1.73.0
- ASP.NET Core Identity
- JWT Bearer Authentication
- Google OAuth 2.0

#### 2. Prerequisites

**2.1 Create OAuth 2.0 Credentials in Google Cloud Console**

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing project
3. Enable **Google+ API** or **Google Identity Services**
4. Go to **APIs & Credentials** > **Create Credentials** > **OAuth Client ID**
5. Select application type (Web application)
6. Configure authorized redirect URIs (frontend callback address)
7. Save the **Client ID**

**2.2 Frontend Google Sign-In Integration**

The frontend needs to use Google Identity Services to obtain ID Tokens, then send them to the backend for validation

#### 3. Install Dependencies

Execute in Package Manager Console:

```bash
dotnet add package Google.Apis.Auth --version 1.73.0
```

#### 4. Configure Google Client ID

Add Google configuration in `appsettings.json`:

```json
{
  "Google": {
    "ClientId": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

**Important Notes**:

- Production and development environments should use different Client IDs
- Can override development environment configuration in `appsettings.Development.json`
- Client ID should not be committed to public code repositories

#### 5. Create Google Login DTO

Create `DTOs/GoogleLoginDTO.cs`:

```csharp
using System.ComponentModel.DataAnnotations;
namespace ThisisczApi.DTOs;

public class GoogleLoginDTO
{
  [Required]
  public required string Credential { get; set; }
}
```

**DTO Description**:

- `Credential`: ID Token returned by frontend Google Sign-In (JWT format)

#### 6. Implement Google Login API

Implement Google login API in `UsersController.cs`:

**6.1 Add Necessary Using Statements**

```csharp
using Google.Apis.Auth;
```

**6.2 Implement GoogleLogin Method**

```csharp
[HttpPost("google-login")]
public async Task<ActionResult<AuthenticationResponseDTO>> GoogleLogin([FromBody] GoogleLoginDTO googleLoginDTO)
{
  try
  {
    // Get Google Client ID from configuration
    var googleClientId = configuration["Google:ClientId"];
    if (string.IsNullOrEmpty(googleClientId))
    {
      return BadRequest(new { error = "Google Client ID is not configured" });
    }

    // Validate Google ID Token
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

    // Find or create user
    var user = await userManager.FindByEmailAsync(email);

    if (user == null)
    {
      // First login, automatically create user
      user = new IdentityUser
      {
        Email = payload.Email,
        UserName = payload.Email.Split('@')[0],
        EmailConfirmed = payload.EmailVerified
      };

      // Create user first, save to database
      var createResult = await userManager.CreateAsync(user);
      if (!createResult.Succeeded)
      {
        return BadRequest(createResult.Errors);
      }

      // After user is created successfully, add Claim
      var role = payload.Email == "xxx" ? "admin" : "user";
      await userManager.AddClaimAsync(user, new Claim(RoleClaimType, role));
    }

    // Generate and return JWT Token
    return await BuildAccessTokenAsync(user);
  }
  catch (Exception ex)
  {
    return BadRequest(new { error = "Error validating Google credential", details = ex.Message });
  }
}
```

**Key Implementation Details**:

1. **Validate ID Token**:
   - Use `GoogleJsonWebSignature.ValidateAsync` to validate Google ID Token
   - Validation checks token signature, expiration time, and Audience (Client ID)
   - Returns `GoogleJsonWebSignature.Payload` object on successful validation

2. **Find or Create User**:
   - Find existing user by email
   - If user doesn't exist, automatically create new user
   - Use email prefix as username
   - Set `EmailConfirmed` to `EmailVerified` value returned by Google

3. **Role Assignment**:
   - Automatically assign roles based on email address
   - Example: emails containing "xxx" are assigned "admin", others are "user"
   - Can adjust role assignment logic based on business requirements

4. **Token Generation**:
   - Reuse existing `BuildAccessTokenAsync` method
   - Return standard JWT Token, consistent with regular login flow

#### 7. Development Steps Summary

1. **Create OAuth 2.0 Credentials in Google Cloud Console**: Get Client ID
2. **Install Dependencies**: Add `Google.Apis.Auth` NuGet package
3. **Configure Client ID**: Add Google configuration in `appsettings.json`
4. **Create DTO**: Define `GoogleLoginDTO` to receive ID Token
5. **Implement Login API**: Implement `GoogleLogin` method in `UsersController`
6. **Validate ID Token**: Use `GoogleJsonWebSignature.ValidateAsync` to validate
7. **Find or Create User**: Find user by email, create automatically if doesn't exist
8. **Assign Role**: Assign user role (admin/user) based on business rules
9. **Generate JWT Token**: Reuse existing token generation logic

#### 8. Integration with Existing System

**12.1 Integration with JWT Authentication**

- JWT Token returned after Google login is completely consistent with regular login
- Can use the same `[Authorize]` attributes to protect APIs
- User information is obtained through `GetCurrentUser` API, no need to distinguish login methods

**12.2 Integration with Authorization System**

- Google login users are automatically assigned roles (admin/user)
- Can use `[Authorize(Policy = "IsAdmin")]` to restrict admin APIs
- Role information is stored in Identity Claims, consistent with regular users

**12.3 User Data Consistency**

- All users (Google login and regular login) use the same `IdentityUser` entity
- Email is used as unique identifier to ensure data consistency
- Can mix multiple login methods, system handles automatically
