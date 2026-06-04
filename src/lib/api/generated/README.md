# 生成的 API 客户端

此目录包含从 OpenAPI 规范自动生成的 TypeScript 类型和 React Query hooks。

## 使用方法

### 导入生成的 hooks 和类型

```typescript
import { useGetApiLinks, usePostApiLinksCreate, LinkDTO } from '@/lib/api/generated'
```

### 使用 Query Hooks

```typescript
// 获取链接列表
const { data, isLoading, error } = useGetApiLinks({
  page: 1,
  pageSize: 20,
  category: 'work'
})

// 获取单个链接
const { data: link } = useGetApiLinksId(linkId)
```

### 使用 Mutation Hooks

```typescript
// 创建链接
const createLink = usePostApiLinksCreate()

const handleCreate = async () => {
  await createLink.mutateAsync({
    data: {
      title: 'Example',
      url: 'https://example.com',
      category: 'work'
    }
  })
}
```

### 使用 Infinite Query

```typescript
// 无限滚动加载
const { data, fetchNextPage, hasNextPage } = useGetApiLinksInfinite({
  pageSize: 20,
  category: 'work'
})
```

## 重新生成

当 API 规范更新时，运行以下命令重新生成：

```bash
pnpm run generate:api
```

## 注意事项

- 所有生成的文件都在 `src/lib/api/generated/` 目录下
- 不要手动编辑生成的文件
- `mutator.ts` 文件可以自定义，用于配置 API 请求的行为

