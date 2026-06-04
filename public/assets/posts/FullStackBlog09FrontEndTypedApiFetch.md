### Full Stack Personal Blog Development 09: Frontend API Integration with Type Support

> This project uses the `orval` tool to automatically generate type-safe TypeScript API client code from the backend OpenAPI specification, achieving complete type synchronization between frontend and backend APIs, providing full type hints and autocomplete functionality.

#### Core Configuration

##### 1. Orval Configuration File (`orval.config.ts`)

The `orval.config.ts` file in the project root configures code generation rules:

```typescript
import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: {
      target: 'http://localhost:5239/swagger/v1/swagger.json', // OpenAPI specification address
    },
    output: {
      mode: 'tags-split', // Split files by tags
      target: './src/lib/api/generated', // Target directory for generated files
      schemas: './src/lib/api/generated/models', // Type definition directory
      client: 'react-query', // Generate React Query hooks
      mock: false,
      override: {
        mutator: {
          path: './src/lib/api/generated/mutator.ts', // Custom request handler
          name: 'customInstance',
        },
        query: {
          useQuery: true, // Generate useQuery hooks
          useInfinite: true, // Generate infinite scroll hooks
          useInfiniteQueryParam: 'page', // Pagination parameter for infinite queries
          version: 5, // React Query v5
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write', // Auto-format after generation
    },
  },
})
```

##### 2. Custom Mutator (`src/lib/api/generated/mutator.ts`)

The Mutator is a bridge between orval-generated code and the project's actual API calling logic, responsible for handling requests and responses:

```typescript
import { apiFetch } from '@/lib/apiFetch'

export const customInstance = async <T>(
  config: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    params?: any
    data?: any
    headers?: Record<string, string>
    signal?: AbortSignal
  },
  options?: any,
): Promise<T> => {
  // Build query parameters, handle requests, etc.
  const response = await apiFetch(fullUrl, {
    method,
    ...(data && { body: JSON.stringify(data) }),
    ...(headers && { headers }),
    signal: config.signal,
  })
  return response as T
}
```

#### Generated File Structure

After running `pnpm run generate:api`, orval will generate the following files in the `src/lib/api/generated/` directory:

```
src/lib/api/generated/
├── models/              # TypeScript type definitions
│   ├── postDTO.ts
│   ├── postCreationDTO.ts
│   └── ...
├── posts/               # Posts-related API hooks
│   └── posts.ts
├── mutator.ts           # Custom request handler
├── index.ts             # Unified export entry
└── README.md            # Usage instructions
```

#### Usage

##### 1. Import Generated Hooks and Types

```typescript
import {
  useGetApiPosts, // Query hooks
  usePostApiPosts, // Create hooks
  PostDTO, // Type definitions
  PostCategory, // Enum types
  GetApiPostsParams, // Parameter types
} from '@/lib/api/generated'
```

##### 2. Use Query Hooks (Data Fetching)

```typescript
'use client'
import { useGetApiPosts, PostCategory } from '@/lib/api/generated'

export default function PagePosts() {
  // Automatically get type hints: parameter types, return value types
  const { data, isLoading, error } = useGetApiPosts({
    page: 1,
    pageSize: 10,
    category: PostCategory.work,  // Enum type with autocomplete
  })

  // data type is automatically inferred as PostDTOPaginationResult
  const posts = data?.items || []
  const totalCount = data?.totalCount || 0

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  )
}
```

##### 3. Use Mutation Hooks (Data Modification)

```typescript
import { usePostApiPosts, PostCreationDTO } from '@/lib/api/generated'

function CreatePostForm() {
  const createPost = usePostApiPosts()

  const handleSubmit = async (formData: PostCreationDTO) => {
    try {
      // mutateAsync parameter type is automatically inferred as PostCreationDTO
      const result = await createPost.mutateAsync({
        data: {
          title: formData.title,
          content: formData.content,
          category: formData.category,
        }
      })
      // result type is automatically inferred as PostDTO
      console.log('Created post:', result)
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  )
}
```

##### 4. Use Infinite Query (Infinite Scroll)

```typescript
import { useGetApiPostsInfinite } from '@/lib/api/generated'

function InfinitePostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetApiPostsInfinite({
    pageSize: 20,
    category: PostCategory.life,
  })

  // data.pages is an array of paginated data
  const allPosts = data?.pages.flatMap((page) => page.items) || []

  return (
    <div>
      {allPosts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

#### Advantages of Type Hints

##### 1. Parameter Type Safety

When calling API hooks, the IDE provides complete parameter type hints:

```typescript
useGetApiPosts({
  page: 1, // ✅ number type
  pageSize: 10, // ✅ number type
  category: 'invalid', // ❌ TypeScript error: must be PostCategory enum value
})
```

##### 2. Return Value Type Inference

Response data types are automatically inferred, no manual definition needed:

```typescript
const { data } = useGetApiPosts()
// data type is automatically PostDTOPaginationResult | undefined

if (data) {
  data.items // ✅ PostDTO[] type with complete hints
  data.totalCount // ✅ number type
  data.page // ✅ number type
}
```

##### 3. Request Body Type Checking

When creating or updating data, request body types are strictly checked:

```typescript
const createPost = usePostApiPosts()

createPost.mutateAsync({
  data: {
    title: 'My Post', // ✅ string
    content: 'Content here', // ✅ string
    category: PostCategory.work, // ✅ PostCategory enum
    invalidField: 'test', // ❌ TypeScript error: field doesn't exist
  },
})
```

#### Workflow

1. **Backend Updates API**: After backend development is complete, the Swagger/OpenAPI specification is automatically updated
2. **Generate Type Code**: Run `pnpm run generate:api` to generate TypeScript code from the OpenAPI specification
3. **Use Generated Hooks**: Import and use generated hooks in components, enjoying complete type hints
4. **Type Synchronization**: When backend APIs change, re-run the generation command to synchronize type definitions

#### Summary

Through orval, this project achieves:

- ✅ **Type Safety**: All API calls have complete TypeScript type support
- ✅ **Autocomplete**: IDE provides parameter, return value, and enum value autocomplete
- ✅ **Type Synchronization**: Frontend types automatically synchronize with backend API specifications
- ✅ **Development Efficiency**: Reduces manual writing of type definitions and API calling code
- ✅ **Error Prevention**: Catch type errors at compile time, avoiding runtime issues

This makes frontend development more efficient and secure, while ensuring code quality and maintainability.
