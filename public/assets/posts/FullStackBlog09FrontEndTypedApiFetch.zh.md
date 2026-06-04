### 全栈开发个人博客 09：前端接入Api接口，支持类型提示

> 本项目使用 `orval` 工具从后端 OpenAPI 规范自动生成类型安全的 TypeScript API 客户端代码，实现了前端与后端 API 的完全类型同步，提供了完整的类型提示和自动补全功能。

#### 核心配置

##### 1. Orval 配置文件 (`orval.config.ts`)

项目根目录下的 `orval.config.ts` 文件配置了代码生成规则：

```typescript
import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: {
      target: 'http://localhost:5239/swagger/v1/swagger.json', // OpenAPI 规范地址
    },
    output: {
      mode: 'tags-split', // 按标签拆分文件
      target: './src/lib/api/generated', // 生成文件的目标目录
      schemas: './src/lib/api/generated/models', // 类型定义目录
      client: 'react-query', // 生成 React Query hooks
      mock: false,
      override: {
        mutator: {
          path: './src/lib/api/generated/mutator.ts', // 自定义请求处理器
          name: 'customInstance',
        },
        query: {
          useQuery: true, // 生成 useQuery hooks
          useInfinite: true, // 生成无限滚动 hooks
          useInfiniteQueryParam: 'page', // 无限查询的分页参数
          version: 5, // React Query v5
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write', // 生成后自动格式化
    },
  },
})
```

##### 2. 自定义 Mutator (`src/lib/api/generated/mutator.ts`)

Mutator 是 orval 生成的代码与项目实际 API 调用逻辑之间的桥梁，负责处理请求和响应：

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
  // 构建查询参数、处理请求等逻辑
  const response = await apiFetch(fullUrl, {
    method,
    ...(data && { body: JSON.stringify(data) }),
    ...(headers && { headers }),
    signal: config.signal,
  })
  return response as T
}
```

#### 生成的文件结构

运行 `pnpm run generate:api` 后，orval 会在 `src/lib/api/generated/` 目录下生成以下文件：

```
src/lib/api/generated/
├── models/              # TypeScript 类型定义
│   ├── postDTO.ts
│   ├── postCreationDTO.ts
│   └── ...
├── posts/               # Posts 相关的 API hooks
│   └── posts.ts
├── mutator.ts           # 自定义请求处理器
├── index.ts             # 统一导出入口
└── README.md            # 使用说明
```

#### 使用方式

##### 1. 导入生成的 Hooks 和类型

```typescript
import {
  useGetApiPosts, // 查询 hooks
  usePostApiPosts, // 创建 hooks
  PostDTO, // 类型定义
  PostCategory, // 枚举类型
  GetApiPostsParams, // 参数类型
} from '@/lib/api/generated'
```

##### 2. 使用 Query Hooks（数据获取）

```typescript
'use client'
import { useGetApiPosts, PostCategory } from '@/lib/api/generated'

export default function PagePosts() {
  // 自动获得类型提示：params 的类型、返回值的类型
  const { data, isLoading, error } = useGetApiPosts({
    page: 1,
    pageSize: 10,
    category: PostCategory.work,  // 枚举类型，有自动补全
  })

  // data 的类型自动推断为 PostDTOPaginationResult
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

##### 3. 使用 Mutation Hooks（数据修改）

```typescript
import { usePostApiPosts, PostCreationDTO } from '@/lib/api/generated'

function CreatePostForm() {
  const createPost = usePostApiPosts()

  const handleSubmit = async (formData: PostCreationDTO) => {
    try {
      // mutateAsync 的参数类型自动推断为 PostCreationDTO
      const result = await createPost.mutateAsync({
        data: {
          title: formData.title,
          content: formData.content,
          category: formData.category,
        }
      })
      // result 的类型自动推断为 PostDTO
      console.log('Created post:', result)
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  )
}
```

##### 4. 使用 Infinite Query（无限滚动）

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

  // data.pages 是分页数据的数组
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

#### 类型提示的优势

##### 1. 参数类型安全

调用 API hooks 时，IDE 会提供完整的参数类型提示：

```typescript
useGetApiPosts({
  page: 1, // ✅ number 类型
  pageSize: 10, // ✅ number 类型
  category: 'invalid', // ❌ TypeScript 错误：必须是 PostCategory 枚举值
})
```

##### 2. 返回值类型推断

响应数据的类型自动推断，无需手动定义：

```typescript
const { data } = useGetApiPosts()
// data 的类型自动为 PostDTOPaginationResult | undefined

if (data) {
  data.items // ✅ PostDTO[] 类型，有完整提示
  data.totalCount // ✅ number 类型
  data.page // ✅ number 类型
}
```

##### 3. 请求体类型检查

创建或更新数据时，请求体的类型会被严格检查：

```typescript
const createPost = usePostApiPosts()

createPost.mutateAsync({
  data: {
    title: 'My Post', // ✅ string
    content: 'Content here', // ✅ string
    category: PostCategory.work, // ✅ PostCategory 枚举
    invalidField: 'test', // ❌ TypeScript 错误：字段不存在
  },
})
```

#### 工作流程

1. **后端更新 API**：后端开发完成后，Swagger/OpenAPI 规范会自动更新
2. **生成类型代码**：运行 `pnpm run generate:api` 从 OpenAPI 规范生成 TypeScript 代码
3. **使用生成的 Hooks**：在组件中导入并使用生成的 hooks，享受完整的类型提示
4. **类型同步**：当后端 API 变更时，重新运行生成命令即可同步类型定义

#### 总结

通过 orval，本项目实现了：

- ✅ **类型安全**：所有 API 调用都有完整的 TypeScript 类型支持
- ✅ **自动补全**：IDE 提供参数、返回值、枚举值的自动补全
- ✅ **类型同步**：前端类型与后端 API 规范自动同步
- ✅ **开发效率**：减少手动编写类型定义和 API 调用代码
- ✅ **错误预防**：编译时发现类型错误，避免运行时问题

这使得前端开发更加高效、安全，同时保证了代码质量和可维护性。
