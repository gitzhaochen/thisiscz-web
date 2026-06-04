### 全栈开发个人博客 18：前端帖子评论设计

> 前端帖子评论功能允许用户在博客文章详情页中对帖子进行评论和回复，支持多级嵌套回复结构、无限滚动加载、实时更新评论数量，并提供权限控制（仅评论作者或管理员可删除）。

#### 1. 概述

**核心功能**：

- 用户创建评论（支持对帖子评论和对评论回复）
- 查询评论列表（支持无限滚动加载）
- 显示评论的回复数量
- 删除评论（仅评论作者或管理员可删除）
- 实时更新评论数量
- 支持 URL 参数自动滚动到评论区域
- 权限控制（未登录用户提示登录）

**技术栈**：

- Next.js（服务端和客户端组件）
- `@tanstack/react-query`：数据获取和状态管理（无限滚动）
- `zustand`：全局用户状态管理
- `orval`：自动生成类型安全的 API hooks
- `lucide-react`：图标组件
- `sonner`：Toast 通知
- `date-fns`：日期格式化

#### 2. 数据模型和类型定义

**2.1 CommentDTO 类型**

后端返回的评论数据包含评论相关信息（由 Orval 根据 OpenAPI 规范自动生成）：

```typescript
// src/lib/api/generated/models/commentDTO.ts
export interface CommentDTO {
  id?: number
  userId?: string
  user?: UserDTO
  postId?: number
  content?: string
  createdAt?: string
  parentId?: number | null
  parent?: CommentDTOParent
  replyCount?: number // 回复数量
}
```

**字段说明**：

- `id`：评论 ID
- `userId`：评论用户 ID
- `user`：评论用户信息（包含用户名、邮箱等）
- `postId`：关联的帖子 ID
- `content`：评论内容
- `createdAt`：创建时间
- `parentId`：父评论 ID（`null` 表示顶级评论）
- `parent`：父评论信息（可选）
- `replyCount`：回复数量（该评论有多少条回复）

**2.2 CommentCreationDTO 类型**

创建评论请求的数据类型：

```typescript
// src/lib/api/generated/models/commentCreationDTO.ts
export interface CommentCreationDTO {
  postId: number
  parentId?: number | null // null 表示顶级评论，有值表示回复
  content: string // 最大长度 500 字符
}
```

**字段说明**：

- `postId`：必填，要评论的帖子 ID
- `parentId`：可选，父评论 ID（`null` 表示顶级评论，有值表示回复）
- `content`：必填，评论内容，最大长度 500 字符

#### 3. API 调用实现

**3.1 自动生成的 API Hook**

使用 Orval 根据后端 OpenAPI 规范自动生成类型安全的 API hooks：

**查询评论列表（无限滚动）**：

```typescript
// src/lib/api/generated/comments/comments.ts
export function useGetApiCommentsInfinite<TData = ..., TError = unknown>(
  params: GetApiCommentsParams,
  options?: {
    query?: Partial<UseInfiniteQueryOptions<...>>
    request?: SecondParameter<typeof customInstance>
  },
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError> & { queryKey: DataTag<...> }
```

**创建评论**：

```typescript
export function usePostApiCommentsCreate<TError = unknown, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<...>
    request?: SecondParameter<typeof customInstance>
  },
  queryClient?: QueryClient,
): UseMutationResult<...>
```

**删除评论**：

```typescript
export function useDeleteApiCommentsId<TError = unknown, TContext = unknown>(
  options?: {
    mutation?: UseMutationOptions<...>
    request?: SecondParameter<typeof customInstance>
  },
  queryClient?: QueryClient,
): UseMutationResult<...>
```

**Hook 特点**：

- 类型安全：完全基于 TypeScript 类型定义
- 自动生成：根据 OpenAPI 规范自动生成，无需手动编写
- 支持无限滚动：`useGetApiCommentsInfinite` 支持分页加载
- 支持自定义：可配置 `onSuccess`、`onError` 等回调函数
- 请求状态：提供 `isPending`、`isFetching` 等状态，便于 UI 反馈

#### 4. 评论列表组件实现（CommentList）

**4.1 组件结构**

在 `src/app/[locale]/posts/[id]/components/CommentList.tsx` 中实现评论列表组件：

```typescript
'use client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import React, { useEffect, useState } from 'react'
import CommentItem from './CommentItem'
import { Loader } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useGetApiCommentsInfinite, usePostApiCommentsCreate } from '@/lib/api/generated'

type Props = {
  post: any
}

const COMMENTS_PER_PAGE = 10

const CommentList = ({ post }: Props) => {
  const user = useUserStore((state: any) => state.user)
  const [newComment, setNewComment] = useState('')
  const [commentCount, setCommentCount] = useState(post.commentCount)

  // 无限滚动查询评论列表
  const {
    data: comments,
    isFetching,
    refetch: refetchComments,
    fetchNextPage,
    hasNextPage,
  } = useGetApiCommentsInfinite(
    {
      postId: Number(post.id),
      pageSize: COMMENTS_PER_PAGE,
    },
    {
      query: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if ((lastPage?.items?.length ?? 0) < COMMENTS_PER_PAGE) {
            return undefined // 没有更多数据
          }
          return (lastPageParam || 0) + 1 // 返回下一页页码
        },
      },
    },
  )

  // 创建评论
  const { mutate: addComment, isPending: addingComment } = usePostApiCommentsCreate({
    mutation: {
      onSuccess: () => {
        setNewComment('')
        refetchComments() // 刷新评论列表
        setCommentCount((prev: number) => prev + 1) // 更新评论数量
      },
    },
  })

  const handleCommentDeleted = () => {
    setCommentCount((prev: number) => prev - 1)
    refetchComments()
  }

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user?.id) {
      toast.info('Please login to comment')
      return
    }
    if (!newComment.trim()) return

    await addComment({
      data: {
        content: newComment.trim(),
        postId: Number(post.id),
        parentId: null, // 创建顶级评论
      },
    })
  }

  // URL 参数自动滚动到评论区域
  const searchParams = useSearchParams()
  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo')
    if (scrollTo === 'comments') {
      const commentsElement = document.getElementById('comments')
      if (commentsElement) commentsElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, [searchParams])

  return (
    <div className="mt-8 space-y-4">
      <h4 className="font-semibold" id="comments">
        Comments
      </h4>
      {/* 评论表单 */}
      <form onSubmit={handleSubmitComment} className="max-w-[800px] space-y-2">
        <Textarea
          placeholder="Enter your comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <Button type="submit" disabled={addingComment || !newComment.trim()} size="sm" className="cursor-pointer">
          {addingComment ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
      {/* 评论列表 */}
      {isFetching && (
        <div className="flex justify-center">
          <Loader className="h-4 w-4 animate-spin" />
        </div>
      )}
      <div className="space-y-4">
        {comments?.pages
          .flatMap((page) => page.items)
          .map((comment: any) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              onCommentDeleted={handleCommentDeleted}
              postId={post.id}
              level={0}
            />
          ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            className="cursor-pointer text-gray-500 hover:bg-gray-100"
          >
            load more comments
          </Button>
        </div>
      )}
    </div>
  )
}

export default CommentList
```

**组件功能说明**：

1. **无限滚动查询**：
   - 使用 `useGetApiCommentsInfinite` 实现无限滚动加载
   - `getNextPageParam` 函数计算下一页页码
   - 使用 `flatMap` 将多页数据合并为单个数组
   - `hasNextPage` 判断是否还有更多数据

2. **创建评论**：
   - 使用 `usePostApiCommentsCreate` 创建评论
   - 验证用户是否登录（未登录时提示）
   - 创建成功后清空表单、刷新列表、更新评论数量

3. **评论数量管理**：
   - 使用 `useState` 管理本地评论数量
   - 创建评论时增加数量
   - 删除评论时减少数量

4. **URL 参数自动滚动**：
   - 监听 `scrollTo` URL 参数
   - 当参数为 `comments` 时，自动滚动到评论区域
   - 支持从其他页面跳转并自动定位到评论区域

5. **UI 反馈**：
   - 加载中显示 `Loader` 组件
   - 提交按钮显示加载状态（`Submitting...`）
   - 空内容时禁用提交按钮

#### 5. 评论项组件实现（CommentItem）

**5.1 递归组件设计**

在 `src/app/[locale]/posts/[id]/components/CommentItem.tsx` 中实现评论项组件（支持递归嵌套）：

```typescript
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useGetApiCommentsInfinite, usePostApiCommentsCreate, useDeleteApiCommentsId } from '@/lib/api/generated'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, Loader, Reply, Trash2, User } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  comment: any
  currentUser?: any
  onCommentDeleted?: () => void
  level: number // 嵌套层级
  postId: string
}

const REPLIES_PER_PAGE = 10

const CommentItem = ({ comment, currentUser, onCommentDeleted, level, postId }: Props) => {
  const isMaxLevel = level >= 2 // 限制最大嵌套层级为 2

  const [showReplies, setShowReplies] = useState(false)
  const [repliesCount, setRepliesCount] = useState(comment.replyCount)

  // 查询回复列表（仅在展开时查询）
  const {
    data: repliesData,
    refetch: refetchReplies,
    isLoading: repliesLoading,
    fetchNextPage,
    hasNextPage,
  } = useGetApiCommentsInfinite(
    {
      postId: Number(postId),
      parentId: Number(comment.id!),
      pageSize: REPLIES_PER_PAGE,
    },
    {
      query: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if ((lastPage?.items?.length ?? 0) < REPLIES_PER_PAGE) {
            return undefined
          }
          return (lastPageParam || 0) + 1
        },
        enabled: showReplies, // 仅在展开时查询
      },
    },
  )

  const [showReplyForm, setShowReplyForm] = useState(false)
  const [newReply, setNewReply] = useState('')

  // 删除评论
  const { mutate: deleteComment, isPending: deletingComment } = useDeleteApiCommentsId({
    mutation: {
      onSuccess: () => {
        onCommentDeleted?.()
      },
    },
  })

  const handleCommentDeleted = () => {
    setRepliesCount((prev: number) => prev - 1)
    refetchReplies()
  }

  // 创建回复
  const { mutate: addReply, isPending: addingReply } = usePostApiCommentsCreate({
    mutation: {
      onSuccess: () => {
        setShowReplyForm(false)
        setNewReply('')
        refetchReplies()
        setRepliesCount((prev: number) => prev + 1)
      },
    },
  })

  const handleSubmitReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await addReply({
      data: {
        content: newReply,
        postId: Number(postId),
        parentId: Number(comment.id), // 指定父评论 ID
      },
    })
  }

  return (
    <div
      key={comment.id}
      className={`${level > 0 ? 'border-l-1 border-gray-200 pl-4' : ''} border-b-1 border-gray-200 pb-3`}
    >
      {/* 评论头部：用户信息、时间、删除按钮 */}
      <div className="flex h-8 items-center gap-8">
        <div className="flex items-center text-xs text-gray-500">
          <User className="mr-1 size-3" />
          <span>{comment.user?.userName || 'Anonymous'}</span>
          <span className="mx-2">•</span>
          <span>
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        {/* 权限控制：仅评论作者或管理员可删除 */}
        {(comment.userId === currentUser?.id || currentUser?.role === 'admin') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteComment({ id: Number(comment.id) })}
            disabled={deletingComment}
            className="cursor-pointer text-gray-500 hover:bg-gray-100"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      {/* 评论内容 */}
      <p className="mt-1">{comment.content}</p>

      {/* 评论操作：回复按钮、显示回复按钮 */}
      <div className="mt-1 flex items-center gap-2">
        {!isMaxLevel && (
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer text-gray-500"
            onClick={() => {
              if (!currentUser?.id) {
                toast.info('Please login to reply')
                return
              }
              setShowReplyForm(!showReplyForm)
            }}
          >
            <Reply className="size-3" />
          </Button>
        )}
        {repliesCount > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="link"
              size="sm"
              className="cursor-pointer text-xs text-gray-500"
              onClick={() => setShowReplies(!showReplies)}
            >
              {repliesCount} replies
              {showReplies ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
            </Button>
          </div>
        )}
      </div>

      {/* 回复表单 */}
      <div className="ml-2">
        {showReplyForm && (
          <div className="">
            <form className="max-w-[800px]" onSubmit={handleSubmitReply}>
              <Textarea
                placeholder="Enter your reply..."
                name="reply"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 cursor-pointer text-gray-500"
                  type="submit"
                  disabled={addingReply}
                >
                  {addingReply ? 'replying...' : 'reply'}
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 cursor-pointer text-gray-500"
                  onClick={() => setShowReplyForm(false)}
                >
                  cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 回复列表 */}
        {showReplies && (
          <div className="mt-2">
            {repliesLoading && (
              <div className="flex justify-center">
                <Loader className="h-4 w-4 animate-spin" />
              </div>
            )}
            {repliesData?.pages.flatMap((page) => page.items).length && (
              <div className="replies">
                {repliesData?.pages
                  .flatMap((page) => page.items)
                  .map((reply: any) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUser={currentUser}
                      onCommentDeleted={handleCommentDeleted}
                      level={level + 1} // 递归调用，层级 +1
                      postId={postId}
                    />
                  ))}
              </div>
            )}

            {hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-gray-500"
                onClick={() => fetchNextPage()}
                disabled={repliesLoading}
              >
                load more replies
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentItem
```

**组件功能说明**：

1. **递归组件设计**：
   - 使用 `level` 参数控制嵌套层级
   - 限制最大嵌套层级为 2（`isMaxLevel = level >= 2`）
   - 回复列表中使用 `CommentItem` 递归渲染，`level + 1`

2. **按需加载回复**：
   - 使用 `enabled: showReplies` 控制查询时机
   - 仅在用户点击"显示回复"时才查询回复列表
   - 避免不必要的 API 请求，提升性能

3. **权限控制**：
   - 删除按钮：仅评论作者（`comment.userId === currentUser?.id`）或管理员（`currentUser?.role === 'admin'`）可见
   - 回复按钮：未登录用户点击时提示登录

4. **回复管理**：
   - 使用 `showReplyForm` 控制回复表单显示/隐藏
   - 创建回复时指定 `parentId` 为当前评论 ID
   - 回复成功后刷新回复列表并更新回复数量

5. **UI 设计**：
   - 使用 `border-l` 和 `pl-4` 为嵌套回复添加左侧边框和缩进
   - 使用 `date-fns` 的 `formatDistanceToNow` 显示相对时间（如 "2 hours ago"）
   - 使用 `lucide-react` 图标增强视觉效果

#### 6. 评论操作组件实现（CommentAction）

**6.1 组件结构**

在 `src/app/[locale]/posts/components/CommentAction.tsx` 中实现评论操作组件：

```typescript
'use client'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  post: any
}

const CommentAction = ({ post }: Props) => {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex cursor-pointer items-center gap-1 text-gray-500"
      onClick={() => {
        router.push(`/posts/${post.id}?scrollTo=comments`)
      }}
    >
      <MessageCircle className="h-4 w-4" />
      <span>{post.commentCount}</span>
    </Button>
  )
}

export default CommentAction
```

**组件功能说明**：

- 显示评论数量（`post.commentCount`）
- 点击后跳转到帖子详情页，并自动滚动到评论区域（`?scrollTo=comments`）
- 在帖子列表和详情页中使用，提供快速访问评论的入口

#### 7. 在帖子详情页中集成

**7.1 帖子详情页**

在 `src/app/[locale]/posts/[id]/page.tsx` 中集成评论组件：

```typescript
import CommentAction from '../components/CommentAction'
import LikeAction from '../components/LikeAction'
import PostAdminActions from '../components/PostAdminActions'
import CommentList from './components/CommentList'

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
        {/* 评论列表 */}
        <CommentList post={postDetail} />
      </div>
    </div>
  )
}
```

**集成说明**：

- 在帖子详情页底部显示点赞、评论和管理操作
- `CommentList` 组件在客户端运行（`'use client'`），支持交互操作
- 帖子详情由服务端获取，包含完整的评论数量信息

#### 8. 在帖子列表中集成

**8.1 PostCard 组件**

在 `src/app/[locale]/posts/components/PostCard.tsx` 中集成评论操作组件：

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
- 将 `post` 对象传递给 `CommentAction` 组件
- `post` 对象包含 `commentCount` 字段（由后端 API 返回）

#### 9. 用户体验优化

**9.1 无限滚动加载**

使用 React Query 的 `useInfiniteQuery` 实现无限滚动：

```typescript
const {
  data: comments,
  fetchNextPage,
  hasNextPage,
} = useGetApiCommentsInfinite(
  { postId: Number(post.id), pageSize: COMMENTS_PER_PAGE },
  {
    query: {
      getNextPageParam: (lastPage, allPages, lastPageParam) => {
        if ((lastPage?.items?.length ?? 0) < COMMENTS_PER_PAGE) {
          return undefined // 没有更多数据
        }
        return (lastPageParam || 0) + 1 // 返回下一页页码
      },
    },
  },
)
```

**优势**：

- 按需加载，减少初始加载时间
- 支持"加载更多"按钮，用户可控制加载时机
- 自动管理分页状态，无需手动处理页码

**9.2 按需加载回复**

回复列表仅在用户展开时才查询：

```typescript
const { data: repliesData, isLoading: repliesLoading } = useGetApiCommentsInfinite(
  {
    postId: Number(postId),
    parentId: Number(comment.id!),
    pageSize: REPLIES_PER_PAGE,
  },
  {
    query: {
      enabled: showReplies, // 仅在展开时查询
    },
  },
)
```

**优势**：

- 避免不必要的 API 请求
- 提升页面加载性能
- 减少服务器负载

**9.3 实时更新评论数量**

使用本地状态管理评论数量，创建/删除评论时立即更新：

```typescript
const [commentCount, setCommentCount] = useState(post.commentCount)

// 创建评论成功后
setCommentCount((prev: number) => prev + 1)

// 删除评论后
setCommentCount((prev: number) => prev - 1)
```

**优势**：

- 用户操作后立即看到反馈
- 无需等待 API 响应即可更新 UI
- 提升用户体验

**9.4 URL 参数自动滚动**

支持通过 URL 参数自动滚动到评论区域：

```typescript
const searchParams = useSearchParams()
useEffect(() => {
  const scrollTo = searchParams.get('scrollTo')
  if (scrollTo === 'comments') {
    const commentsElement = document.getElementById('comments')
    if (commentsElement) commentsElement.scrollIntoView({ behavior: 'smooth' })
  }
}, [searchParams])
```

**使用场景**：

- 从帖子列表点击评论按钮，自动跳转并滚动到评论区域
- 支持分享带评论锚点的链接

#### 10. 代码结构

```
src/
├── app/
│   └── [locale]/
│       └── posts/
│           ├── components/
│           │   ├── CommentAction.tsx          # 评论操作组件（显示评论数量）
│           │   ├── PostCard.tsx                # 帖子卡片（包含评论操作）
│           ├── [id]/
│           │   ├── components/
│           │   │   ├── CommentList.tsx        # 评论列表组件
│           │   │   └── CommentItem.tsx         # 评论项组件（递归组件）
│           │   └── page.tsx                    # 帖子详情页（包含评论列表）
│           └── page.tsx                        # 帖子列表页

```

#### 11. 开发步骤总结

1. **配置 Orval 生成 API Hooks**：
   - 确保后端 OpenAPI 规范包含评论相关接口
   - 运行 Orval 生成类型安全的 API hooks
   - 验证生成的 `useGetApiCommentsInfinite`、`usePostApiCommentsCreate`、`useDeleteApiCommentsId` 等 hooks

2. **实现 CommentList 组件**：
   - 创建 `src/app/[locale]/posts/[id]/components/CommentList.tsx`
   - 使用 `useGetApiCommentsInfinite` 实现无限滚动查询
   - 使用 `usePostApiCommentsCreate` 实现创建评论
   - 实现评论表单和评论列表渲染
   - 实现 URL 参数自动滚动功能

3. **实现 CommentItem 组件**：
   - 创建 `src/app/[locale]/posts/[id]/components/CommentItem.tsx`
   - 实现递归组件设计，支持嵌套回复
   - 使用 `enabled` 选项实现按需加载回复
   - 实现回复表单和回复列表渲染
   - 实现删除评论功能（权限控制）
   - 限制最大嵌套层级为 2

4. **实现 CommentAction 组件**：
   - 创建 `src/app/[locale]/posts/components/CommentAction.tsx`
   - 显示评论数量
   - 实现跳转到评论区域的功能

5. **在帖子详情页集成**：
   - 在 `src/app/[locale]/posts/[id]/page.tsx` 中引入 `CommentList` 组件
   - 在帖子操作区域引入 `CommentAction` 组件

6. **在帖子列表中集成**：
   - 在 `src/app/[locale]/posts/components/PostCard.tsx` 中引入 `CommentAction` 组件

#### 12. 常见问题

**Q: 无限滚动不工作？**

A: 检查以下几点：

- `getNextPageParam` 函数是否正确返回下一页页码
- `hasNextPage` 是否正确判断是否还有更多数据
- 后端 API 是否正确返回分页数据

**Q: 回复列表不显示？**

A: 确认：

- `enabled: showReplies` 是否正确设置
- `parentId` 参数是否正确传递
- 后端 API 是否正确返回回复列表

**Q: 删除评论后列表不更新？**

A: 确保：

- `onCommentDeleted` 回调函数正确调用 `refetchComments()`
- 评论数量状态正确更新

**Q: URL 参数自动滚动不工作？**

A: 检查：

- `useSearchParams` 是否正确使用
- `id="comments"` 是否正确设置
- `scrollIntoView` 方法是否正确调用

**Q: 嵌套回复层级限制？**

A: 当前实现限制最大嵌套层级为 2（`level >= 2`），可在 `CommentItem` 组件中修改 `isMaxLevel` 条件调整层级限制。
