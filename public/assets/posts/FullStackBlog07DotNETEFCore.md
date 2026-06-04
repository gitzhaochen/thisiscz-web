### Full Stack Personal Blog Development 07: .NET Database Integration

> The project uses `Entity Framework Core (EF Core)` as the ORM framework, connecting to an `Azure SQL Server` database. It also integrates `ASP.NET Core Identity` for user identity management.

#### 1. Overview

**Technology Stack**:

- EF Core 9.0.10
- SQL Server database provider
- ASP.NET Core Identity
- .NET 8.0

#### 2. Install Required NuGet Packages

The following packages need to be installed in the project file (`ThisisczApi.csproj`):

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.10" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.0.10" />
<PackageReference Include="Microsoft.AspNetCore.Identity.EntityFrameworkCore" Version="8" />
```

**Description**:

- `Microsoft.EntityFrameworkCore.SqlServer`: SQL Server database provider
- `Microsoft.EntityFrameworkCore.Tools`: EF Core tools (for migrations and other operations)
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore`: Identity integration with EF Core

#### 3. Create Database Context (DbContext)

Create the `ApplicationDbContext.cs` file, inheriting from `IdentityDbContext`:

```csharp
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ThisisczApi.Entities;
using Microsoft.AspNetCore.Identity;

namespace ThisisczApi;

public class ApplicationDbContext : IdentityDbContext
{
  public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
  {
  }

  // Define entity collections
  public DbSet<Post> Posts { get; set; }


  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    // Configure entity relationships and constraints
    // ... see details below
  }
}
```

**Key Points**:

- Inherit from `IdentityDbContext` to support Identity user management
- Define entity collections through `DbSet<T>`
- Configure entity relationships and constraints in `OnModelCreating`

#### 4. Configure Database Connection String

Configure the connection string in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "AZURE_SQL_CONNECTIONSTRING": "Server=tcp:xxx.database.windows.net,1433;Initial Catalog=xxxDB;Persist Security Info=False;User ID=xxx;Password=xxx;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

**Connection String Format Description**:

- `Server`: Database server address and port
- `Initial Catalog`: Database name
- `User ID` and `Password`: Database login credentials
- `Encrypt=True`: Enable encrypted connection (required for Azure SQL)
- `Connection Timeout`: Connection timeout in seconds

#### 5. Register DbContext in Program.cs

Configure database services in `Program.cs`:

```csharp
// Read connection string
var connectionString = builder.Configuration.GetConnectionString("AZURE_SQL_CONNECTIONSTRING");

// Register DbContext, configure SQL Server provider and retry policy
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null)));

// Configure Identity
builder.Services.AddIdentityCore<IdentityUser>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
```

**Configuration Description**:

- `AddDbContext`: Register `ApplicationDbContext` as a service
- `UseSqlServer`: Specify SQL Server database provider
- `EnableRetryOnFailure`: Configure retry policy to improve connection stability
- `AddIdentityCore`: Configure Identity core functionality
- `AddEntityFrameworkStores`: Store Identity data in EF Core

#### 6. Database Migration

Use EF Core migration tools to create and apply database migrations:

```bash
# Create migration
dotnet ef migrations add InitialCreate

# Apply migration to database
dotnet ef database update
```

**Migration Description**:

- `migrations add`: Generate migration scripts based on entity models
- `database update`: Apply migrations to the database, creating or updating table structures

#### 7. Complete Steps Summary

1. **Install NuGet Packages**: Add EF Core and Identity related packages
2. **Create DbContext**: Inherit from `IdentityDbContext`, define `DbSet` collections
3. **Configure Connection String**: Set database connection in `appsettings.json`
4. **Register Services**: Register `DbContext` and `Identity` in `Program.cs`
5. **Configure Entity Relationships**: Set foreign keys, indexes, etc. in `OnModelCreating`
6. **Create Migration**: Use `dotnet ef migrations add` to generate migrations
7. **Apply Migration**: Use `dotnet ef database update` to update the database

#### 8. Important Notes

- **Connection String Security**: Production environments should use environment variables or Azure Key Vault to store sensitive information
- **Delete Behavior**: Use `Restrict` to avoid data loss from cascade deletes
- **Retry Policy**: Configure retry mechanism to improve connection stability, suitable for cloud database environments
- **Migration Management**: Create new migrations and apply them after each entity modification

#### 9. Related Files

- `ApplicationDbContext.cs`: Database context definition
- `Program.cs`: Service registration and configuration
- `appsettings.json`: Connection string configuration
- `ThisisczApi.csproj`: NuGet package dependencies
