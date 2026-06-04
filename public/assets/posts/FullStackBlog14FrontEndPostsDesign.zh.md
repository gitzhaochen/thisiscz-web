### 全栈开发个人博客 14：前端帖子设计

> 帖子模块为博客应用提供了完整的帖子浏览功能，支持列表展示、详情查看、分类筛选、分页浏览以及管理员编辑等功能。

#### 1. 概述

**核心功能**：

- 帖子列表展示（支持分页和分类筛选）
- 帖子详情页面（支持 Markdown 渲染）
- 从 AWS S3 读取 Markdown 文件内容
- 国际化支持（中英文切换）
- 管理员编辑功能
- 响应式设计

**技术栈**：

- `@tanstack/react-query`：数据获取和状态管理
- `react-markdown`：Markdown 渲染
- `remark-gfm`：GitHub Flavored Markdown 支持
- `rehype-highlight`：代码高亮
- Next.js：服务端渲染和客户端组件
- `next-intl`：国际化支持

#### 2. 帖子列表页面

**2.1 创建列表页面组件**

在 `src/app/[locale]/posts/page.tsx` 中创建帖子列表页面：

```typescript
'use client'
import PostCard from './components/PostCard'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Pagination } from '@/components/Pagination'
import { useUserStore } from '@/store/userStore'
import { PostCategory, useGetApiPosts } from '@/lib/api/generated'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'

const pageSize = 10
const postCategories = [PostCategory.life, PostCategory.work, PostCategory.crypto, PostCategory.sports] as const

export default function PagePosts() {
  const t = useTranslations('PostCategory')
  const user = useUserStore((state: any) => state.user)
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') || 'all'
  const router = useRouter()
  const pathname = usePathname()

  // 使用生成的 API hook 获取帖子列表
  const { data } = useGetApiPosts({
    page: currentPage,
    pageSize: pageSize,
    category: category === 'all' ? undefined : (category as PostCategory),
  })

  // 处理分类切换
  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    params.set('page', '1') // 切换分类时重置到第一页
    router.push(`${pathname}?${params.toString()}`)
  }

  // 从响应数据中提取分页信息
  const totalPages = data?.totalCount ? Math.ceil(data?.totalCount / pageSize) : 1
  const posts = data?.items || []

  return (
    <div className="page-wrapper py-6">
      {/* 分类筛选 Tabs */}
      <div className="mb-6 flex justify-start">
        <Tabs value={category} onValueChange={handleCategoryChange}>
          <TabsList className="md:gap-2">
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
            {postCategories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {t(cat)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* 帖子列表 */}
      <div className="flex flex-col gap-6">
        {posts.map((post: any) => (
          <PostCard key={post.id} post={post} currentUserId={user?.id} />
        ))}
      </div>

      {/* 分页组件 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
```

**关键功能**：

- 使用 `useGetApiPosts` hook（由 Orval 自动生成）获取帖子列表
- 从 URL 查询参数读取当前页码和分类
- 使用 Tabs 组件实现分类筛选
- 切换分类时自动重置到第一页
- 使用 Pagination 组件实现分页导航

**2.2 URL 参数管理**

- `page`：当前页码（默认为 1）
- `category`：帖子分类（`all`、`life`、`work`、`crypto`、`sports`）
- 使用 Next.js 的 `useSearchParams` 和 `useRouter` 管理 URL 参数

#### 3. PostCard 组件

**3.1 创建 PostCard 组件**

在 `src/app/[locale]/posts/components/PostCard.tsx` 中创建帖子卡片组件：

```typescript
'use client'

import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

type Props = {
  post: any
  currentUserId?: string
}

const PostCard = ({ post, currentUserId }: Props) => {
  const locale = useLocale()

  // 根据当前语言环境选择标题和摘要
  const title = locale === 'zh' ? post.titleZh : post.title
  const summary = locale === 'zh' ? post.summaryZh : post.summary

  return (
    <div key={post.id} className="relative flex flex-col border-b">
      <div className="flex flex-col gap-2 p-2 md:p-3">
        {/* 帖子标题（链接到详情页） */}
        <Link
          href={`/posts/${post.id}`}
          className="line-clamp-1 cursor-pointer text-sm font-bold hover:underline"
        >
          {title}
        </Link>

        {/* 帖子摘要 */}
        <div className="line-clamp-2 text-sm text-gray-500 md:line-clamp-1">
          {summary}
        </div>
      </div>
    </div>
  )
}

export default PostCard
```

**关键功能**：

- 支持国际化：根据 `locale` 显示对应的标题和摘要
- 使用 `Link` 组件（来自 `@/i18n/navigation`）实现国际化路由
- 响应式设计：移动端显示 2 行摘要，桌面端显示 1 行
- 使用 `line-clamp` 实现文本截断

**3.2 国际化支持**

- `title` / `titleZh`：英文/中文标题
- `summary` / `summaryZh`：英文/中文摘要
- 根据 `useLocale()` 返回的语言环境自动选择对应字段

#### 4. 帖子详情页面

**4.1 创建详情页面组件**

在 `src/app/[locale]/posts/[id]/page.tsx` 中创建帖子详情页面：

```typescript
import MarkdownView from '@/components/MarkdownView'
import { PostCategory, PostDTO } from '@/lib/api/generated'
import { apiFetchServer } from '@/lib/apiFetch'
import { __IS_PROD__ } from '@/lib/constants'
import { queryClient } from '@/lib/queryClient'
import { format } from 'date-fns'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import PostAdminActions from '../components/PostAdminActions'

type Props = {
  params: Promise<{ locale: Locale; id: string }>
}

export default async function PagePostsDetail({ params }: Props) {
  const { locale, id } = await params
  const t = await getTranslations('PostCategory')
  const tCommon = await getTranslations('Common')
  setRequestLocale(locale)

  // 在服务端使用 queryClient.fetchQuery 获取数据
  const postDetail: PostDTO = await queryClient.fetchQuery({
    queryKey: ['post', id],
    queryFn: () => apiFetchServer(`/api/posts/${id}`),
  })

  // 尝试从静态文件读取内容
  let markdownContent = locale === 'zh' ? postDetail.contentZh : postDetail.content

  // 尝试根据 title 生成文件名，从 AWS S3 读取
  if (postDetail.title) {
    const fileName = generateFileNameFromTitle(postDetail.title)
    const staticContent = await readAwsMarkdown(fileName, locale)
    if (staticContent) {
      markdownContent = staticContent
    }
  }

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

          {/* 管理员操作 */}
          <div className="mt-6 flex items-center gap-2">
            <PostAdminActions post={postDetail} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

**关键功能**：

- 服务端渲染：使用 `apiFetchServer` 在服务端获取数据
- 使用 `queryClient.fetchQuery` 进行数据获取和缓存
- 支持从数据库字段或 AWS S3 静态文件读取内容
- 显示作者、发布时间、分类等元信息

**4.2 AWS S3 Markdown 文件读取**

实现从 AWS S3 读取 Markdown 文件的功能：

```typescript
/**
 * 从 AWS S3 读取 markdown 文件内容（通过公共 URL）
 * @param fileName 文件名（不包含路径和扩展名）
 * @param locale 语言环境
 * @returns markdown 内容，如果文件不存在则返回 null
 */
async function readAwsMarkdown(fileName: string, locale: Locale): Promise<string | null> {
  try {
    const baseurl = __IS_PROD__
      ? `${process.env.NEXT_PUBLIC_AWS_S3_ASEETSPREFIX}/public/assets`
      : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/assets`

    // 构建文件 URL：先尝试带 locale 的文件，再尝试不带 locale 的文件
    const filePaths = [`${baseurl}/posts/${fileName}.${locale}.md`, `${baseurl}/posts/${fileName}.md`]

    for (const url of filePaths) {
      try {
        const response = await fetch(url, {
          cache: 'no-cache',
        })

        if (response.ok) {
          const content = await response.text()
          if (content) {
            return content
          }
        } else if (response.status === 404) {
          // 文件不存在，继续尝试下一个路径
          continue
        } else {
          console.warn(`从 S3 读取文件失败 (${url}): HTTP ${response.status}`)
          continue
        }
      } catch (error: any) {
        console.warn(`从 S3 读取文件失败 (${url}):`, error.message)
        continue
      }
    }

    return null
  } catch (error: any) {
    console.error('从 AWS S3 读取 markdown 文件失败:', error)
    return null
  }
}
```

**文件读取策略**：

1. 优先尝试读取带语言环境的文件（如 `FullStackBlog01.zh.md`）
2. 如果不存在，尝试读取不带语言环境的文件（如 `FullStackBlog01.md`）
3. 如果都不存在，返回 `null`，使用数据库中的内容

**4.3 文件名生成**

根据帖子标题生成文件名：

```typescript
/**
 * 根据 post title 生成文件名
 * 将标题转换为文件名格式（保留字母数字、点号、连字符和下划线，空格转换为空字符串）
 * 例如："Full Stack Blog 01: Quick Start" -> "FullStackBlog01QuickStart"
 */
function generateFileNameFromTitle(title: string): string {
  return title
    .replace(/[^\w\s.-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '') // 移除所有空格
    .trim()
}
```

#### 5. MarkdownView 组件

**5.1 创建 MarkdownView 组件**

在 `src/components/MarkdownView.tsx` 中创建 Markdown 渲染组件：

```typescript
'use client'

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

const MarkdownView = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </Markdown>
    </div>
  )
}

export default MarkdownView
```

**关键功能**：

- 使用 `react-markdown` 渲染 Markdown 内容
- `remark-gfm`：支持 GitHub Flavored Markdown（表格、任务列表等）
- `rehype-highlight`：代码语法高亮
- 使用 Tailwind CSS 的 `prose` 类实现美观的排版
- 支持暗色模式（`dark:prose-invert`）

**5.2 样式配置**

- `prose`：Tailwind Typography 插件提供的默认样式
- `prose-zinc`：使用 zinc 颜色主题
- `dark:prose-invert`：暗色模式下反转颜色
- `max-w-none`：移除最大宽度限制

#### 6. PostAdminActions 组件

**6.1 创建管理员操作组件**

在 `src/app/[locale]/posts/components/PostAdminActions.tsx` 中创建管理员操作组件：

```typescript
'use client'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/userStore'
import { EditIcon } from 'lucide-react'
import Link from 'next/link'

type Props = {
  post: any
}

const PostAdminActions = ({ post }: Props) => {
  const user = useUserStore((state: any) => state.user)

  return (
    <>
      {user?.role === 'admin' && (
        <Link href={`/admin/addPosts?actionType=edit&id=${post.id}`}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <EditIcon className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </>
  )
}

export default PostAdminActions
```

**关键功能**：

- 使用 `useUserStore` 获取当前用户信息
- 仅在用户角色为 `admin` 时显示编辑按钮
- 点击编辑按钮跳转到管理员编辑页面，携带帖子 ID 和操作类型

**6.2 权限控制**

- 前端权限控制：使用条件渲染 `{user?.role === 'admin' && <Component />}`
- 后端权限验证：编辑操作必须在后端 API 中验证用户权限（参考《全栈开发个人博客 13：前端鉴权设计》）

#### 7. 分页组件

**7.1 Pagination 组件实现**

在 `src/components/Pagination.tsx` 中实现分页组件：

```typescript
'use client'

import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MouseEvent } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page))
  }

  // 生成要显示的页码（最多显示 5 个页码）
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 始终显示第一页
      pages.push(1)

      // 计算中间页码的起始和结束
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // 调整起始和结束页码，确保显示足够的页码
      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // 如果最后一页不在可见范围内，添加省略号
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // 始终显示最后一页
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <ShadcnPagination>
      <PaginationContent>
        {/* 上一页按钮 */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              if (currentPage > 1) {
                handlePageChange(currentPage - 1)
              }
            }}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {/* 页码按钮 */}
        {getPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {page === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                onClick={(e: MouseEvent) => {
                  e.preventDefault()
                  handlePageChange(page as number)
                }}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {/* 下一页按钮 */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              if (currentPage < totalPages) {
                handlePageChange(currentPage + 1)
              }
            }}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  )
}
```

**关键功能**：

- 智能页码显示：最多显示 5 个页码，使用省略号表示更多页码
- 保留 URL 查询参数：切换页码时保留分类等参数
- 禁用状态：第一页时禁用上一页，最后一页时禁用下一页
- 使用 shadcn/ui 的 Pagination 组件作为基础

#### 8. 开发步骤总结

1. **创建帖子列表页面**：
   - 在 `src/app/[locale]/posts/page.tsx` 中创建客户端组件
   - 使用 `useGetApiPosts` hook 获取帖子列表
   - 实现分类筛选（Tabs 组件）
   - 实现分页功能（Pagination 组件）

2. **创建 PostCard 组件**：
   - 在 `src/app/[locale]/posts/components/PostCard.tsx` 中创建
   - 支持国际化（根据 locale 显示对应标题和摘要）
   - 使用 `Link` 组件链接到详情页

3. **创建帖子详情页面**：
   - 在 `src/app/[locale]/posts/[id]/page.tsx` 中创建服务端组件
   - 使用 `apiFetchServer` 在服务端获取帖子详情
   - 实现从 AWS S3 读取 Markdown 文件的逻辑
   - 显示帖子内容、作者、发布时间、分类等信息

4. **创建 MarkdownView 组件**：
   - 在 `src/components/MarkdownView.tsx` 中创建
   - 使用 `react-markdown` 渲染 Markdown
   - 配置 `remark-gfm` 和 `rehype-highlight` 插件
   - 应用 Tailwind Typography 样式

5. **创建 PostAdminActions 组件**：
   - 在 `src/app/[locale]/posts/components/PostAdminActions.tsx` 中创建
   - 根据用户角色条件渲染编辑按钮
   - 链接到管理员编辑页面

6. **实现分页组件**（如果尚未存在）：
   - 在 `src/components/Pagination.tsx` 中创建
   - 实现智能页码显示逻辑
   - 支持 URL 参数管理

7. **配置环境变量**：
   - `NEXT_PUBLIC_AWS_S3_ASEETSPREFIX`：生产环境 S3 资源前缀
   - `NEXT_PUBLIC_APP_BASE_URL`：开发环境应用基础 URL

#### 9. 技术要点

**9.1 服务端渲染 vs 客户端渲染**

- **列表页面**：使用客户端组件（`'use client'`），支持交互操作（分类切换、分页）
- **详情页面**：使用服务端组件，在服务端获取数据，提升 SEO 和首屏加载速度

**9.2 数据获取策略**

- **列表页面**：使用 React Query hooks（`useGetApiPosts`），自动处理缓存和重新获取
- **详情页面**：使用 `queryClient.fetchQuery`，在服务端获取数据并缓存

**9.3 国际化实现**

- 使用 `next-intl` 进行国际化
- 根据 `locale` 选择对应的字段（`title`/`titleZh`、`content`/`contentZh`）
- 使用 `@/i18n/navigation` 的 `Link` 组件实现国际化路由

**9.4 Markdown 内容来源**

1. **数据库字段**：`content` 或 `contentZh`
2. **AWS S3 静态文件**：优先从 S3 读取，如果存在则覆盖数据库内容
3. **文件命名规则**：根据帖子标题生成文件名，支持带语言环境的文件

#### 10. 常见问题

**Q: 为什么详情页面使用服务端组件？**

A: 服务端组件可以在服务端获取数据，提升 SEO 和首屏加载速度。帖子详情内容相对静态，适合服务端渲染。

**Q: 如何自定义 Markdown 样式？**

A: 在 `MarkdownView` 组件中修改 `prose` 类的配置，或使用 Tailwind Typography 的自定义配置。

**Q: 分页组件如何保留其他查询参数？**

A: 使用 `new URLSearchParams(searchParams)` 创建新的参数对象，只修改 `page` 参数，其他参数会自动保留。
