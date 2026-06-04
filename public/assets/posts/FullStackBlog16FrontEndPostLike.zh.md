### 全栈开发个人博客 16：前端帖子点赞设计

> 前端帖子点赞功能允许用户在博客文章列表和详情页中对帖子进行点赞和取消点赞操作，实时显示点赞数量和当前用户的点赞状态。

#### 1. 概述

**核心功能**：

- 用户点赞/取消点赞帖子
- 实时显示帖子点赞数量
- 显示当前用户是否已点赞（红色高亮）
- 未登录用户点击时提示登录
- 点赞操作时禁用按钮，防止重复点击
- 乐观更新（Optimistic Update）提升用户体验

**技术栈**：

- Next.js（服务端和客户端组件）
- `@tanstack/react-query`：数据获取和状态管理
- `zustand`：全局用户状态管理
- `orval`：自动生成类型安全的 API hooks
- `lucide-react`：图标组件
- `sonner`：Toast 通知

#### 2. 数据模型和类型定义

**2.1 PostDTO 类型**

后端返回的帖子数据包含点赞相关信息（由 Orval 根据 OpenAPI 规范自动生成）：

```typescript
// src/lib/api/generated/models/postDTO.ts
export interface PostDTO {
  id?: number
  title?: string
  titleZh?: string | null
  summary?: string | null
  summaryZh?: string | null
  content?: string | null
  contentZh?: string | null
  author?: UserDTO
  createdAt?: string
  updatedAt?: string | null
  likeCount?: number // 点赞总数
  isLikedByCurrentUser?: boolean // 当前用户是否已点赞
  commentCount?: number
  category?: PostCategory
}
```

**字段说明**：

- `likeCount`：帖子的点赞总数（后端通过批量查询优化，避免 N+1 问题）
- `isLikedByCurrentUser`：当前登录用户是否已点赞（未登录时为 `false`）

**2.2 PostLikeCreationDTO 类型**

点赞请求的数据类型：

```typescript
// src/lib/api/generated/models/postLikeCreationDTO.ts
export interface PostLikeCreationDTO {
  postId?: number
  isLiked?: boolean // true 表示点赞，false 表示取消点赞
}
```

#### 3. API 调用实现

**3.1 自动生成的 API Hook**

使用 Orval 根据后端 OpenAPI 规范自动生成类型安全的 API hooks：

```typescript
// src/lib/api/generated/posts/posts.ts
export const usePostApiPostsPostLike = <TError = unknown, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof postApiPostsPostLike>>,
      TError,
      { data: PostLikeCreationDTO },
      TContext
    >
    request?: SecondParameter<typeof customInstance>
  },
  queryClient?: QueryClient,
): UseMutationResult<...> => {
  const mutationOptions = getPostApiPostsPostLikeMutationOptions(options)
  return useMutation(mutationOptions, queryClient)
}
```

**Hook 特点**：

- 类型安全：完全基于 TypeScript 类型定义
- 自动生成：根据 OpenAPI 规范自动生成，无需手动编写
- 支持自定义：可配置 `onSuccess`、`onError` 等回调函数
- 请求状态：提供 `isPending` 状态，便于 UI 反馈

#### 4. 点赞组件实现

**4.1 LikeAction 组件**

在 `src/app/[locale]/posts/components/LikeAction.tsx` 中实现点赞组件：

```typescript
'use client'
import { Button } from '@/components/ui/button'
import { usePostApiPostsPostLike } from '@/lib/api/generated'
import { Heart } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { useUserStore } from '@/store/userStore'

type Props = {
  post: any
}

const LikeAction = ({ post }: Props) => {
  const user = useUserStore((state: any) => state.user)
  const locale = useLocale()
  const [isLiked, setIsLiked] = useState<boolean>(post.isLikedByCurrentUser)
  const [likeCount, setLikeCount] = useState<number>(post.likeCount)

  const { mutate: likePost, isPending: likingPost } = usePostApiPostsPostLike({
    mutation: {
      onSuccess: () => {
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      },
    },
  })

  const { mutate: unlikePost, isPending: unlikingPost } = usePostApiPostsPostLike({
    mutation: {
      onSuccess: () => {
        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      },
    },
  })

  const handleLikeToggle = () => {
    if (!user?.id) {
      toast.info('Please login to like this post')
      return
    }
    if (isLiked) {
      unlikePost({ data: { postId: Number(post.id), isLiked: false } })
    } else {
      likePost({ data: { postId: Number(post.id), isLiked: true } })
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={likingPost || unlikingPost}
      className={`flex cursor-pointer items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{likeCount}</span>
    </Button>
  )
}

export default LikeAction
```

**组件功能说明**：

1. **状态管理**：
   - `isLiked`：当前用户是否已点赞（从 `post.isLikedByCurrentUser` 初始化）
   - `likeCount`：点赞数量（从 `post.likeCount` 初始化）

2. **用户认证检查**：
   - 使用 `useUserStore` 获取当前用户信息
   - 未登录用户点击时显示提示信息（使用 `toast.info`）

3. **点赞/取消点赞操作**：
   - 使用两个独立的 `usePostApiPostsPostLike` hooks
   - 分别处理点赞和取消点赞的成功回调
   - 在 `onSuccess` 中更新本地状态（乐观更新）

4. **UI 反馈**：
   - 已点赞时显示红色（`text-red-500`）和填充的心形图标（`fill-current`）
   - 未点赞时显示灰色（`text-gray-500`）和空心图标
   - 请求进行中时禁用按钮（`disabled={likingPost || unlikingPost}`）

5. **图标和样式**：
   - 使用 `lucide-react` 的 `Heart` 图标
   - 已点赞时图标填充，未点赞时图标空心
   - 使用 Tailwind CSS 类名控制样式

#### 5. 在帖子列表中集成

**5.1 PostCard 组件**

在 `src/app/[locale]/posts/components/PostCard.tsx` 中集成点赞组件：

```typescript
'use client'

import { Link } from '@/i18n/navigation'
import LikeAction from './LikeAction'
import CommentAction from './CommentAction'
import { useLocale } from 'next-intl'

type Props = {
  post: any
  currentUserId?: string
}

const PostCard = ({ post, currentUserId }: Props) => {
  const locale = useLocale()
  const title = locale === 'zh' ? post.titleZh : post.title
  const summary = locale === 'zh' ? post.summaryZh : post.summary

  return (
    <div key={post.id} className="relative flex flex-col border-b">
      <div className="flex flex-col gap-2 p-2 md:p-3">
        <Link href={`/posts/${post.id}`} className="line-clamp-1 cursor-pointer text-sm font-bold hover:underline">
          {title}
        </Link>
        <div className="line-clamp-2 text-sm text-gray-500 md:line-clamp-1">{summary}</div>
        <div className="flex items-center gap-2">
          <LikeAction post={post} />
          <CommentAction post={post} />
        </div>
      </div>
    </div>
  )
}

export default PostCard
```

**集成说明**：

- 在帖子卡片底部显示点赞和评论操作
- 将 `post` 对象传递给 `LikeAction` 组件
- `post` 对象包含 `likeCount` 和 `isLikedByCurrentUser` 字段（由后端 API 返回）

**5.2 帖子列表页面**

在帖子列表页面中，后端 API 通过批量查询优化返回所有帖子的点赞信息（参考《全栈开发个人博客 14：帖子按赞设计》），避免 N+1 问题：

```typescript
// 后端返回的帖子列表已包含点赞信息
const posts: PostDTO[] = await apiFetchServer('/api/posts?page=1&pageSize=10')
// 每个 post 包含：
// - likeCount: 点赞总数
// - isLikedByCurrentUser: 当前用户是否已点赞
```

#### 6. 在帖子详情页中集成

**6.1 帖子详情页**

在 `src/app/[locale]/posts/[id]/page.tsx` 中集成点赞组件：

```typescript
import LikeAction from '../components/LikeAction'
import CommentAction from '../components/CommentAction'
import PostAdminActions from '../components/PostAdminActions'

export default async function PagePostsDetail({ params }: Props) {
  const { locale, id } = await params

  // 在服务端获取帖子详情
  const postDetail: PostDTO = await queryClient.fetchQuery({
    queryKey: ['post', id],
    queryFn: () => apiFetchServer(`/api/posts/${id}`),
  })

  return (
    <div className="page-wrapper py-6">
      <div className="">
        <div key={postDetail.id!} className="relative flex flex-col gap-6">
          {/* 帖子内容 */}
          <div className="">
            <MarkdownView content={markdownContent || ''} />
          </div>

          {/* 作者和发布时间 */}
          <div className="text-muted-foreground flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span>{postDetail.author?.userName}</span>
              <span>{format(postDetail.createdAt!, 'yyyy.MM.dd HH:mm')}</span>
            </div>
            <div>
              {tCommon('category')}: {t(postDetail.category as PostCategory) || ''}
            </div>
          </div>

          {/* 点赞、评论和管理操作 */}
          <div className="mt-6 flex items-center gap-2">
            <LikeAction post={postDetail} />
            <CommentAction post={postDetail} />
            <PostAdminActions post={postDetail} />
          </div>
        </div>
        <CommentList post={postDetail} />
      </div>
    </div>
  )
}
```

**集成说明**：

- 在帖子详情页底部显示点赞、评论和管理操作
- 帖子详情由服务端获取，包含完整的点赞信息
- `LikeAction` 组件在客户端运行（`'use client'`），支持交互操作

#### 7. 用户体验优化

**7.1 乐观更新（Optimistic Update）**

点赞组件使用乐观更新策略，在 API 请求成功前就更新 UI：

```typescript
const { mutate: likePost, isPending: likingPost } = usePostApiPostsPostLike({
  mutation: {
    onSuccess: () => {
      setIsLiked(true)
      setLikeCount((prev) => prev + 1) // 立即更新 UI
    },
  },
})
```

**优势**：

- 用户点击后立即看到反馈，无需等待网络请求
- 提升用户体验，减少感知延迟
- 如果请求失败，可以在 `onError` 中回滚状态

**7.2 防止重复点击**

在请求进行中时禁用按钮：

```typescript
<Button
  onClick={handleLikeToggle}
  disabled={likingPost || unlikingPost}  // 请求进行中时禁用
  // ...
>
```

#### 8. 代码结构

```
src/
├── app/
│   └── [locale]/
│       └── posts/
│           ├── components/
│           │   ├── LikeAction.tsx          # 点赞组件
│           │   ├── PostCard.tsx            # 帖子卡片（包含点赞）
│           ├── [id]/
│           │   └── page.tsx                # 帖子详情页（包含点赞）
│           └── page.tsx                    # 帖子列表页
└── store/
    └── userStore.ts                        # 用户状态管理
```
