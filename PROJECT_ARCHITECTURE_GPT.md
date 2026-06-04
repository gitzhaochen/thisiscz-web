# Project Architecture

这份文档用于帮助新的开发者或新的 AI 会话快速理解 `thisiscz-web` 的整体架构、技术栈、目录职责和核心开发约定。

阅读本文件后，应能回答以下问题：

- 项目使用什么技术栈？
- 页面、组件、接口、状态和样式分别放在哪里？
- 如何新增页面、调用后端接口、写通用组件？
- 项目中有哪些需要特别注意的历史逻辑和技术债？

---

## 1. 项目定位

`thisiscz-web` 是一个基于 **Next.js App Router** 的个人网站 / 内容站点项目，包含：

- 多语言首页与简历展示
- Posts 文章列表、文章详情、点赞、评论
- Bookmarks 书签列表、详情与管理
- Admin 后台添加/编辑文章和书签
- AI Talk 语音/文本聊天页面
- Crypto / NZ Spend 等个人工具页面
- 与独立后端 API 的集成
- S3 静态资源上传与生产环境 asset prefix

项目采用 **Next.js 前端 + 独立后端 API + S3 静态资源** 的模式。前端自身也包含少量 Next Route Handler 作为轻量 BFF，例如 DeepSeek 代理和 S3 上传预签名接口。

---

## 2. 技术栈概览

### 2.1 框架与语言

- **Next.js `16.0.7`**
  - 使用 `src/app` App Router。
  - 页面和路由通过文件系统约定生成。
  - 服务端组件与客户端组件混合使用。
- **React `19.2.0`**
- **TypeScript `^5`**
  - `strict: true`
  - 路径别名：`@/* -> ./src/*`
- **包管理器：pnpm**

常用脚本：

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm generate:api
```

其中：

- `pnpm dev` 启动 Next 开发服务。
- `pnpm build` 执行 `next build && node ./scripts/uploadToS3.js`。
- `pnpm generate:api` 通过 Orval 从 Swagger 重新生成接口 hooks。

### 2.2 国际化

项目使用 **`next-intl`**。

核心文件：

- `src/i18n/routing.ts`
  - 定义支持的语言：`en`、`zh`
  - 默认语言：`en`
- `src/i18n/navigation.ts`
  - 基于 `createNavigation(routing)` 包装 `Link`、`redirect`、`useRouter`、`usePathname`
  - 业务内部跳转优先使用这里导出的 API
- `src/i18n/request.ts`
  - 按 locale 加载 `src/messages/{locale}.json`
- `src/messages/en.json`
- `src/messages/zh.json`

路由整体以 `[locale]` 作为顶层业务段，例如：

```text
/en/posts
/zh/posts
/en/bookmarks/1
/zh/admin/addPosts
```

### 2.3 UI 与样式

- **Tailwind CSS v4**
- **shadcn/ui**
  - 配置文件：`components.json`
  - 组件目录：`src/components/ui`
- **Radix UI**
  - 作为 shadcn/ui 的底层 primitive
- **lucide-react**
  - 图标库
- **next-themes**
  - 暗色主题支持
- **sonner**
  - Toast 提示
- **vaul**
  - 移动端 Drawer
- **@tailwindcss/typography**
  - Markdown 内容排版
- **react-markdown + remark-gfm + rehype-highlight + highlight.js**
  - Markdown 渲染与代码高亮

项目没有使用 SCSS / CSS Modules。样式基本全部通过 Tailwind class 写在 JSX 中，全局样式集中在 `src/app/globals.css`。

### 2.4 数据请求与状态

- **TanStack Query v5**
  - 负责远程数据请求、缓存、loading/error 状态。
  - 全局 QueryClient 在 `src/lib/queryClient.ts`。
- **Orval**
  - 从 Swagger 自动生成 React Query hooks。
  - 生成目录：`src/lib/api/generated`
- **原生 fetch**
  - 没有 axios。
  - 统一封装在 `src/lib/apiFetch.ts`。
- **Zustand**
  - 用于轻量全局客户端状态。
  - 当前主要存储登录用户信息：`src/store/userStore.ts`
- **react-hook-form + zod**
  - 用于 Admin 表单。

### 2.5 静态资源与部署

- 生产环境通过 `NEXT_PUBLIC_AWS_S3_ASEETSPREFIX` 配置静态资源前缀。
- `next.config.ts` 中根据 `__IS_PROD__` 设置 `assetPrefix`。
- `scripts/uploadToS3.js` 在 build 后上传：
  - `.next/static`
  - `public`
- 文章 Markdown 与简历 Markdown 会从本地 `public/assets` 或生产 S3 URL 读取。

---

## 3. 顶层目录结构

```text
thisiscz-web/
├─ public/
├─ scripts/
├─ src/
├─ components.json
├─ eslint.config.mjs
├─ next.config.ts
├─ orval.config.ts
├─ package.json
├─ pnpm-lock.yaml
├─ postcss.config.mjs
├─ prettier.config.js
└─ tsconfig.json
```

### 3.1 `public/`

公共静态资源目录，包含：

- posts Markdown
- resume Markdown
- favicon / manifest 之外的公开资源

文章详情页和首页简历页面会根据环境从 `public/assets` 或 S3 读取 Markdown。

### 3.2 `scripts/`

工具脚本目录：

- `uploadToS3.js`
  - build 后上传 `.next/static` 和 `public` 到 S3。
- `md2pdf.js`
  - Markdown 简历转 PDF。

### 3.3 `src/`

核心源码目录，所有业务代码基本都在这里。

```text
src/
├─ app/
├─ components/
├─ hooks/
├─ i18n/
├─ lib/
├─ messages/
├─ store/
├─ types/
└─ proxy.ts
```

---

## 4. `src` 目录说明

### 4.1 `src/app`

Next.js App Router 根目录。

```text
src/app/
├─ [locale]/
├─ api/
├─ globals.css
├─ layout.tsx
├─ page.tsx
├─ favicon.ico
├─ apple-icon.png
└─ manifest.json
```

#### `src/app/layout.tsx`

根 layout，当前只透传 `children`。

真正的应用级 provider 不在这里，而是在 `src/app/[locale]/layout.tsx`。

#### `src/app/page.tsx`

根路径 `/` 入口，会重定向到默认语言：

```ts
redirect('/en')
```

#### `src/app/[locale]`

业务页面的主体目录。所有真正的页面基本都挂在 `[locale]` 下。

```text
src/app/[locale]/
├─ layout.tsx
├─ page.tsx
├─ login/
├─ resume/
├─ aiTalk/
├─ posts/
├─ bookmarks/
├─ crypto/
├─ nzspend/
└─ admin/
```

主要路由：

```text
/{locale}
/{locale}/login
/{locale}/resume
/{locale}/aiTalk
/{locale}/posts
/{locale}/posts/[id]
/{locale}/bookmarks
/{locale}/bookmarks/[id]
/{locale}/crypto/eth
/{locale}/crypto/price
/{locale}/crypto/total
/{locale}/nzspend
/{locale}/admin/addPosts
/{locale}/admin/addBookmarks
```

#### `src/app/[locale]/layout.tsx`

真正的应用外壳。

职责：

- 校验 locale 是否合法。
- 调用 `setRequestLocale(locale)` 支持静态渲染。
- 注入 `<html lang={locale}>`。
- 设置 metadata。
- 注入 Google Analytics。
- 注入全局 providers。
- 渲染全局 Header。
- 渲染 Toast。

Provider 结构大致如下：

```tsx
<ThemeProvider>
  <NextIntlClientProvider>
    <QueryClientProvider>
      <Suspense>
        <AppInit />
        <LayoutHeader />
        {children}
      </Suspense>
    </QueryClientProvider>
    <Toaster />
  </NextIntlClientProvider>
</ThemeProvider>
```

### 4.2 `src/app/api`

Next Route Handler，作为轻量 BFF 使用。

当前主要包括：

```text
src/app/api/
├─ callGpt/route.ts
└─ s3UploadImg/route.ts
```

#### `/api/callGpt`

代理 DeepSeek Chat Completions API，避免在客户端暴露 `DEEPSEEK_API_KEY`。

调用方：`src/app/[locale]/aiTalk/page.tsx`

#### `/api/s3UploadImg`

返回 S3 `presigned post`，用于前端直传图片。

调用方：`src/app/[locale]/admin/addBookmarks/page.tsx`

注意：这个接口当前只检查 `filePath` 是否存在，没有做登录态和 admin 权限校验。

### 4.3 `src/components`

跨页面可复用组件。

```text
src/components/
├─ ui/
├─ LayoutHeader/
├─ appInit/
├─ ClientOnly.tsx
├─ MarkdownView.tsx
├─ Pagination.tsx
├─ QueryClientProvider.tsx
├─ ThemeProvider.tsx
└─ Typewriter.tsx
```

#### `src/components/ui`

shadcn/ui 生成的通用 primitive 组件。

特点：

- 文件名小写，例如 `button.tsx`、`select.tsx`。
- 内部通常使用 Radix UI、CVA、`cn()`。
- 不应该放业务逻辑。
- 修改前要确认是否是 shadcn 原始组件或已定制版本。

#### `src/components/LayoutHeader`

全局顶部导航。

包含：

- `index.tsx`
- `NavMenu.tsx`
- `LocaleSwitcher.tsx`
- `ProfileAction.tsx`
- `ThemeModeToggle.tsx`

导航项集中定义在 `NavMenu.tsx`：

```ts
export const navigation = [
  { name: 'home', href: '/' },
  { name: 'posts', href: '/posts' },
  { name: 'bookmarks', href: '/bookmarks' },
  { name: 'aiTalk', href: '/aiTalk' },
]
```

#### `src/components/appInit`

客户端初始化组件，挂在 `[locale]/layout.tsx` 中。

职责：

- 修复 Safari 100vh 问题。
- 从 cookie 读取 token。
- 调用 `useGetApiUsersMe` 获取当前用户。
- 将用户写入 `useUserStore`。
- 执行 admin 路由守卫。

### 4.4 `src/hooks`

通用 hook 目录。

当前包括：

- `useAuthAdmin.ts`
  - 客户端 admin 路由守卫。
- `useSafari100vh.ts`
  - 修复 Safari 移动端视口高度。

### 4.5 `src/i18n`

国际化配置目录。

```text
src/i18n/
├─ routing.ts
├─ navigation.ts
└─ request.ts
```

新增语言时至少需要改：

- `routing.ts` 中的 `locales`
- `messages/{locale}.json`
- 可能还需要补充静态内容或 Markdown 资源

### 4.6 `src/lib`

基础能力和工具目录。

```text
src/lib/
├─ api/
├─ apiFetch.ts
├─ auth.ts
├─ constants.ts
├─ queryClient.ts
└─ utils.ts
```

#### `src/lib/api/generated`

由 Orval 生成的 API 客户端。

结构：

```text
src/lib/api/generated/
├─ comments/
├─ links/
├─ models/
├─ posts/
├─ users/
├─ index.ts
└─ mutator.ts
```

约定：

- `generated` 下大多数文件不要手动编辑。
- 后端接口变更后运行：

```bash
pnpm generate:api
```

- `mutator.ts` 是 Orval 与项目 fetch 封装之间的桥接层。

#### `src/lib/apiFetch.ts`

统一 API 请求封装。

包含：

- `apiFetch`
  - 客户端请求。
  - 从 cookie 读取 `access_token`。
  - 添加 `Authorization: Bearer <token>`。
  - 401 时尝试 refresh token。
- `apiFetchServer`
  - 服务端组件请求。
  - 从 `next/headers` 的 `cookies()` 读取 `access_token`。

#### `src/lib/auth.ts`

认证 token 工具：

- `getAccessToken`
- `setAccessToken`
- `clearAuth`
- `refreshAccessToken`

注意：当前 `refreshAccessToken` 第一行直接 `return null`，刷新 token 流程实际上已停用。

#### `src/lib/queryClient.ts`

TanStack Query 全局配置。

约定：

- 默认 `retry: false`
- 默认 `refetchOnWindowFocus: false`
- 全局捕获 `UNAUTHORIZED`
- 遇到 `UNAUTHORIZED` 时清 token 并跳转 `/login`

#### `src/lib/utils.ts`

当前主要提供 `cn()`：

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

用于合并 Tailwind class。

### 4.7 `src/messages`

国际化文案。

```text
src/messages/
├─ en.json
└─ zh.json
```

新增 UI 文案时，应优先写入这里，并通过 `useTranslations(namespace)` 获取。

### 4.8 `src/store`

Zustand store 目录。

当前只有：

```text
src/store/userStore.ts
```

用于保存当前登录用户。

### 4.9 `src/types`

全局类型声明。

当前包括：

- `global.d.ts`
- `svgr.d.ts`

### 4.10 `src/proxy.ts`

该文件当前实现了 `next-intl` 中间件逻辑：

```ts
const intlMiddleware = createMiddleware(routing)
return await intlMiddleware(request)
```

注意：Next.js 通常约定中间件文件名为 `middleware.ts`。当前文件名 `proxy.ts` 需要确认在当前 Next 版本中是否被正确识别。若 i18n 路由异常，应优先检查这里。

---

## 5. 核心开发规范

## 5.1 新增页面

### 规则

业务页面优先放在：

```text
src/app/[locale]/<route>/page.tsx
```

例如新增 `about` 页面：

```text
src/app/[locale]/about/page.tsx
```

访问路径：

```text
/en/about
/zh/about
```

### 页面外层布局

普通页面建议使用：

```tsx
export default function PageAbout() {
  return (
    <div className="page-wrapper py-6">
      {/* page content */}
    </div>
  )
}
```

`page-wrapper` 是全局约定，定义在 `src/app/globals.css`。

### Server Component vs Client Component

默认优先使用 Server Component。

只有页面需要以下能力时才加 `'use client'`：

- `useState`
- `useEffect`
- 浏览器 API
- 表单交互
- `useSearchParams`
- Zustand store
- TanStack Query hooks
- Toast
- 用户点击交互

示例：

```tsx
'use client'

export default function ClientPage() {
  return <div />
}
```

### 新增导航入口

如需出现在顶部导航，修改：

```text
src/components/LayoutHeader/NavMenu.tsx
```

并补充：

```text
src/messages/en.json
src/messages/zh.json
```

例如：

```ts
{ name: 'about', href: '/about' }
```

然后在 `Navigation` namespace 中补充 `about` 文案。

---

## 5.2 新增动态路由

动态路由使用 App Router 文件夹约定：

```text
src/app/[locale]/posts/[id]/page.tsx
```

参数类型通常写成：

```ts
type Props = {
  params: Promise<{ locale: Locale; id: string }>
}
```

在服务端组件中读取：

```ts
export default async function Page({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
}
```

如果页面需要国际化静态渲染，应调用：

```ts
setRequestLocale(locale)
```

---

## 5.3 页面内业务组件放置

与某个页面强绑定的组件，放在该路由目录下的 `components`：

```text
src/app/[locale]/posts/components/PostCard.tsx
src/app/[locale]/posts/[id]/components/CommentList.tsx
```

只有跨页面复用的组件才提升到：

```text
src/components/
```

不要把页面私有组件直接放到全局 `src/components`。

---

## 5.4 内部跳转

### 首选：使用 i18n navigation

在带 locale 的业务页面中，内部跳转优先使用：

```ts
import { Link, useRouter, usePathname } from '@/i18n/navigation'
```

例如：

```tsx
<Link href="/posts">Posts</Link>
```

这样可以自动处理当前 locale。

### 谨慎使用 `next/link`

在 `[locale]` 目录下直接使用：

```ts
import Link from 'next/link'
```

可能导致 URL 丢失 locale 前缀，例如生成 `/admin/addPosts` 而不是 `/zh/admin/addPosts`。

除非明确知道原因，否则不要在业务页面里直接使用 `next/link`。

### Query 参数

列表页常用 URL 作为页面状态来源：

```ts
const searchParams = useSearchParams()
const currentPage = Number(searchParams.get('page')) || 1
const category = searchParams.get('category') || 'all'
```

切换分类或分页时通过 `URLSearchParams` 改写 URL。

---

## 5.5 调用后端 API

### 首选：使用 Orval 生成的 hooks

客户端组件中不要手写业务 API fetch，优先使用：

```ts
import { useGetApiPosts } from '@/lib/api/generated'
```

示例：

```tsx
'use client'

import { useGetApiPosts } from '@/lib/api/generated'

export default function PagePosts() {
  const { data, isPending } = useGetApiPosts({
    page: 1,
    pageSize: 10,
  })

  return <div>{isPending ? 'Loading...' : data?.items?.length}</div>
}
```

### Mutation

写入接口使用生成的 mutation hook：

```ts
const { mutate: addPost, isPending } = usePostApiPosts({
  mutation: {
    onSuccess: () => {
      toast.success('Post added successfully')
    },
  },
})

addPost({ data: values })
```

建议新增 mutation 时同时处理：

- `onSuccess`
- `onError`
- 是否需要 `queryClient.invalidateQueries`

### Infinite Query

评论列表使用生成的 infinite query：

```ts
const { data, fetchNextPage, hasNextPage } = useGetApiCommentsInfinite(
  {
    postId: Number(post.id),
    pageSize: 10,
  },
  {
    query: {
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages, lastPageParam) => {
        if ((lastPage?.items?.length ?? 0) < 10) return undefined
        return (lastPageParam || 0) + 1
      },
    },
  },
)
```

### 服务端组件调用接口

Server Component 中不要使用 React Query hooks。使用：

```ts
import { apiFetchServer } from '@/lib/apiFetch'
```

示例：

```ts
const postDetail = await apiFetchServer(`/api/posts/${id}`)
```

注意：不要复用模块级全局 `queryClient.fetchQuery` 做服务端请求缓存，避免跨请求共享缓存带来的数据串扰风险。

### 重新生成 API

当后端 Swagger 变更：

```bash
pnpm generate:api
```

Orval 配置位于：

```text
orval.config.ts
```

输入：

```text
http://localhost:5239/swagger/v1/swagger.json
```

输出：

```text
src/lib/api/generated
```

---

## 5.6 Token 与认证

### Token 存储

当前 token 存在普通 cookie：

```ts
Cookies.set('access_token', token, {
  expires: 7,
  path: '/',
})
```

读取：

```ts
Cookies.get('access_token')
```

清理：

```ts
Cookies.remove('access_token', { path: '/' })
```

### 请求时附带 Token

`apiFetch` 自动添加：

```ts
Authorization: token ? `Bearer ${token}` : ''
```

### 登录流程

当前登录页主要使用 Google OAuth：

1. `GoogleLogin` 获取 credential。
2. 调用 `usePostApiUsersGoogleLogin`。
3. 后端返回 token。
4. `setAccessToken(response.token)` 写 cookie。
5. 通过 `window.location.href` 跳回 `returnTo` 或当前 locale 首页。

### Admin 守卫

当前通过客户端 hook `useAuthAdmin` 判断：

- 路径是否以 `/admin` 开头。
- 是否有 token。
- 当前用户角色是否为 `admin`。

不满足条件则：

```ts
router.replace('/')
```

注意：这是客户端守卫，不是服务端权限校验。敏感接口和 admin 页面仍应依赖后端鉴权。

---

## 5.7 状态管理

### 远程数据

远程接口数据统一交给 TanStack Query：

- 列表数据
- 详情数据
- 评论数据
- 用户信息
- mutation 状态

不要把接口数据复制到 Zustand，除非它确实是跨页面共享的客户端状态。

### 全局用户状态

当前唯一 Zustand store：

```text
src/store/userStore.ts
```

使用方式：

```ts
const user = useUserStore((state) => state.user)
```

初始化由 `AppInit` 完成：

```ts
useUserStore.setState({ user })
```

注意：当前 store 中 `user` 还是 `any`。更理想的做法是使用生成类型 `UserDTO`。

### URL 状态

分页、分类、编辑模式等优先放在 URL query 中：

```text
/posts?page=2&category=work
/admin/addPosts?actionType=edit&id=1
```

这样可以支持刷新、分享和浏览器前进后退。

### 局部 UI 状态

只影响单个组件的状态使用 `useState`，例如：

- 评论输入框
- 回复表单是否展开
- 点赞按钮本地数量
- AI Talk 输入模式
- Drawer open 状态

---

## 5.8 样式规范

### Tailwind 优先

业务组件样式直接写 Tailwind class。

示例：

```tsx
<div className="page-wrapper py-6">
  <div className="flex items-center gap-2 text-sm text-muted-foreground" />
</div>
```

### 全局样式

全局样式集中在：

```text
src/app/globals.css
```

包括：

- Tailwind import
- `tw-animate-css`
- typography plugin
- CSS variables
- dark theme variables
- `.page-wrapper`
- body 基础样式
- highlight.js 背景修正

### 颜色与主题

尽量使用 token class：

```text
bg-background
text-foreground
text-muted-foreground
bg-primary
text-primary-foreground
border-border
```

少直接写硬编码颜色，除非是局部语义色，例如点赞红色：

```text
text-red-500
```

### class 合并

复杂组件或可扩展组件使用：

```ts
import { cn } from '@/lib/utils'
```

shadcn/ui 组件内部已经遵循该约定。

---

## 5.9 组件规范

### UI Primitive

放在：

```text
src/components/ui
```

职责：

- 只提供基础 UI 能力。
- 不依赖业务数据。
- 不直接调用 API。
- 不访问 Zustand store。

### 通用业务组件

放在：

```text
src/components
```

适合：

- Header
- Pagination
- MarkdownView
- Provider
- ClientOnly

### 页面私有组件

放在页面目录下：

```text
src/app/[locale]/posts/components
src/app/[locale]/posts/[id]/components
```

适合：

- PostCard
- LikeAction
- CommentAction
- CommentList
- CommentItem

### 命名

- React 组件：`PascalCase`
- shadcn/ui primitive 文件：通常小写，如 `button.tsx`
- hook：`useXxx`
- store：`xxxStore.ts`

---

## 5.10 表单规范

Admin 表单使用：

- `react-hook-form`
- `zod`
- `@hookform/resolvers/zod`
- shadcn/ui 的 `Form` 系列组件

典型结构：

```ts
const formSchema = z.object({
  title: z.string().min(2),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    title: '',
  },
})
```

表单提交：

```ts
function onSubmit(values: z.infer<typeof formSchema>) {
  addPost({ data: values })
}
```

编辑场景：

- 从 URL 读取 `id`
- 通过 `useGetApiXxxId` 获取详情
- 在 `useEffect` 中 `form.reset(...)`

---

## 5.11 Markdown 内容规范

Markdown 渲染统一使用：

```text
src/components/MarkdownView.tsx
```

该组件内部使用：

- `react-markdown`
- `remark-gfm`
- `rehype-highlight`
- `highlight.js/styles/github-dark.css`
- Tailwind typography class

文章详情页逻辑：

1. 从后端获取 post detail。
2. 默认使用后端返回的 `content` / `contentZh`。
3. 根据 title 生成 Markdown 文件名。
4. 优先尝试从 S3 或本地 public assets 读取 Markdown。
5. 如果读取成功，用静态 Markdown 覆盖后端 content。

生产环境读取：

```text
${NEXT_PUBLIC_AWS_S3_ASEETSPREFIX}/public/assets/posts/...
```

本地读取：

```text
${NEXT_PUBLIC_APP_BASE_URL}/assets/posts/...
```

---

## 6. 重要业务模块说明

### 6.1 Posts

目录：

```text
src/app/[locale]/posts
```

页面：

- `page.tsx`
  - 文章列表
  - 分类 Tabs
  - 分页
  - 预取下一页
- `[id]/page.tsx`
  - 文章详情
  - 服务端获取 post detail
  - 读取 Markdown
  - 显示点赞、评论、admin 编辑入口

组件：

```text
src/app/[locale]/posts/components
├─ PostCard.tsx
├─ LikeAction.tsx
├─ CommentAction.tsx
└─ PostAdminActions.tsx
```

评论组件：

```text
src/app/[locale]/posts/[id]/components
├─ CommentList.tsx
└─ CommentItem.tsx
```

评论逻辑：

- 顶级评论：`CommentList`
- 子评论：`CommentItem` 递归渲染
- 最大回复层级：`level >= 2`
- 评论分页：`useGetApiCommentsInfinite`
- 添加评论：`usePostApiCommentsCreate`
- 删除评论：`useDeleteApiCommentsId`

### 6.2 Bookmarks

目录：

```text
src/app/[locale]/bookmarks
```

页面：

- `page.tsx`
  - 书签列表
  - 分类 Tabs
  - 分页
- `[id]/page.tsx`
  - 书签详情

Admin 相关：

- `src/app/[locale]/admin/addBookmarks/page.tsx`
  - 新增/编辑书签
  - 支持图片上传到 S3

### 6.3 Login

目录：

```text
src/app/[locale]/login/page.tsx
```

当前主要是 Google OAuth 登录。

旧邮箱密码登录代码仍以注释形式保留，属于历史代码。

### 6.4 AI Talk

目录：

```text
src/app/[locale]/aiTalk/page.tsx
```

特点：

- 客户端组件
- 使用 Web Speech API 做语音识别和朗读
- 直接调用 `/api/callGpt`
- 结果用 `MarkdownView` 渲染

注意：

- Web Speech API 浏览器兼容性有限。
- 页面里直接使用 `window`，必须保持客户端组件。

### 6.5 Admin

目录：

```text
src/app/[locale]/admin
```

当前包括：

- `addPosts/page.tsx`
- `addBookmarks/page.tsx`

Admin 页面依赖客户端守卫 `useAuthAdmin`，但仍应将真正权限控制放在后端。

### 6.6 Crypto / NZ Spend

目录：

```text
src/app/[locale]/crypto
src/app/[locale]/nzspend
```

这些是偏个人工具性质的页面，部分文件较大，后续可按计算逻辑、展示组件、数据源拆分。

---

## 7. 已知特殊逻辑与技术债

以下内容是后续维护时需要特别注意的地方。

### 7.1 环境变量与密钥

仓库中存在 `.env.development`、`.env.production`。如果其中包含真实密钥，应立即：

1. 在服务商后台 rotate 密钥。
2. 从 git 历史中清除。
3. 将 env 文件加入 `.gitignore`。
4. 只提交 `.env.example`。

尤其要注意：

- AWS access key
- AWS secret key
- DeepSeek API key
- OpenAI API key

### 7.2 Token 安全

当前 `access_token` 是前端可读 cookie，不是 HttpOnly cookie。

风险：

- 一旦发生 XSS，token 可被读取。
- `refreshAccessToken` 当前已短路，刷新链路不可用。

更安全的方案：

- 后端设置 HttpOnly cookie。
- refresh token 也由后端 cookie 管理。
- 前端不直接读取长期 token。

### 7.3 Admin 只有客户端守卫

当前 admin 页面守卫在客户端 `useEffect` 中完成。

风险：

- 页面 JS / HTML 可能先下发。
- 首屏可能短暂显示 admin 内容。
- Route Handler 如 `/api/s3UploadImg` 没有 admin 校验。

建议：

- 在 `src/app/[locale]/admin/layout.tsx` 中做服务端鉴权。
- 后端 API 必须验证角色。
- 上传预签名接口也应验证权限。

### 7.4 `proxy.ts` 命名风险

当前 next-intl middleware 写在：

```text
src/proxy.ts
```

通常 Next.js 约定中间件文件名是：

```text
src/middleware.ts
```

如果出现 locale 路由异常，应优先检查该文件是否被框架识别。

### 7.5 服务端使用全局 QueryClient

`bookmarks/[id]/page.tsx` 当前通过模块级 `queryClient.fetchQuery` 获取服务端数据。

风险：

- Node 环境中模块级单例可能跨请求共享缓存。
- 多用户请求时存在数据串扰风险。

建议：

- Server Component 直接使用 `apiFetchServer`。
- 或每个请求创建独立 QueryClient。

### 7.6 Query Cache 同步不足

点赞和评论操作常用局部 `useState` 更新数量，没有同步 TanStack Query cache。

可能导致：

- 列表页数量与详情页不同步。
- 返回上一页时看到旧的 like/comment count。

建议：

- mutation 成功后 `invalidateQueries`。
- 或使用 `queryClient.setQueryData` 精准更新缓存。

### 7.7 类型使用不充分

虽然 Orval 已生成 DTO 类型，例如 `UserDTO`、`PostDTO`、`LinkDTO`，但部分业务组件仍大量使用 `any`。

典型位置：

- `userStore.ts`
- `PostCard`
- `CommentList`
- `CommentItem`
- `LikeAction`

建议：

- `userStore.user` 改为 `UserDTO | null`。
- 组件 props 使用生成 DTO。
- 尽量移除 `(state: any)`。

### 7.8 i18n 不完整

部分 UI 文案仍硬编码英文或中文，例如：

- admin 表单 label
- success/error toast
- LikeAction 登录提示
- Login 页面标题和说明

新增文案时应优先写入：

```text
src/messages/en.json
src/messages/zh.json
```

### 7.9 大文件与拆分

以下页面文件偏大：

- `src/app/[locale]/crypto/total/page.tsx`
- `src/app/[locale]/nzspend/page.tsx`
- `src/app/[locale]/admin/addPosts/page.tsx`
- `src/app/[locale]/admin/addBookmarks/page.tsx`

后续可拆分：

- form schema
- 子表单组件
- 计算逻辑
- 展示组件
- 常量配置

### 7.10 死代码

项目中存在一些历史代码：

- `src/app/[locale]/page-old.tsx`
- `login/page.tsx` 中被注释的邮箱密码登录
- admin 页面中的部分注释删除逻辑

建议在确认无用后清理。

---

## 8. 常见任务操作指南

### 8.1 新增一个普通页面

1. 创建：

```text
src/app/[locale]/about/page.tsx
```

2. 页面使用：

```tsx
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="page-wrapper py-6">
      About
    </div>
  )
}
```

3. 如需导航入口，修改 `LayoutHeader/NavMenu.tsx`。
4. 补充 `messages/en.json` 和 `messages/zh.json`。

### 8.2 新增一个客户端交互页面

```tsx
'use client'

import { useState } from 'react'

export default function DemoPage() {
  const [count, setCount] = useState(0)

  return (
    <div className="page-wrapper py-6">
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  )
}
```

注意：客户端页面不能直接使用 `next-intl/server`。

### 8.3 新增接口调用

如果后端已有 Swagger：

1. 确认 Swagger 更新。
2. 运行：

```bash
pnpm generate:api
```

3. 从 `@/lib/api/generated` 引入生成的 hook。

客户端：

```ts
const { data, isPending } = useGetApiXxx()
```

服务端：

```ts
const data = await apiFetchServer('/api/xxx')
```

### 8.4 新增 mutation

```ts
const queryClient = useQueryClient()

const { mutate, isPending } = usePostApiXxx({
  mutation: {
    onSuccess: () => {
      toast.success('Saved')
      queryClient.invalidateQueries({ queryKey: ['/api/xxx'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Request failed')
    },
  },
})
```

注意：生成 hook 的 query key 规则可查看对应 `generated/<tag>/<tag>.ts` 文件里的 `getXxxQueryKey` 方法。

### 8.5 上传图片到 S3

当前约定：

1. 前端调用 `/api/s3UploadImg?filePath=...`
2. 服务端返回 presigned post。
3. 前端用 `FormData` 直接 POST 到 S3。
4. 图片 URL 拼为：

```text
${NEXT_PUBLIC_AWS_S3_ASEETSPREFIX}/${filePath}
```

注意：上传接口应补充权限校验。

### 8.6 新增文案

1. 在 `src/messages/en.json` 添加英文。
2. 在 `src/messages/zh.json` 添加中文。
3. 组件中使用：

```ts
const t = useTranslations('Namespace')
t('key')
```

不要在业务组件里直接硬编码 UI 文案，尤其是会出现在用户界面的文案。

---

## 9. AI 会话协作建议

当开启新的 AI 会话时，建议先让 AI 阅读：

```text
PROJECT_ARCHITECTURE.md
```

然后根据任务再读取相关文件。

例如：

### 如果要改 Posts 评论

优先读取：

```text
src/app/[locale]/posts/[id]/components/CommentList.tsx
src/app/[locale]/posts/[id]/components/CommentItem.tsx
src/lib/api/generated/comments/comments.ts
src/lib/api/generated/models/commentDTO.ts
```

### 如果要改登录/权限

优先读取：

```text
src/app/[locale]/login/page.tsx
src/lib/auth.ts
src/lib/apiFetch.ts
src/components/appInit/index.tsx
src/hooks/useAuthAdmin.ts
src/store/userStore.ts
```

### 如果要改 API 调用方式

优先读取：

```text
src/lib/apiFetch.ts
src/lib/queryClient.ts
src/lib/api/generated/mutator.ts
orval.config.ts
```

### 如果要改样式或组件体系

优先读取：

```text
src/app/globals.css
components.json
src/components/ui/button.tsx
src/lib/utils.ts
src/components/LayoutHeader
```

### 如果要改 i18n 路由

优先读取：

```text
src/i18n/routing.ts
src/i18n/navigation.ts
src/i18n/request.ts
src/proxy.ts
src/app/[locale]/layout.tsx
```

---

## 10. 总结

本项目的核心架构可以概括为：

```text
Next.js App Router
  + next-intl locale 路由
  + Tailwind v4 / shadcn/ui 组件体系
  + Orval 生成 React Query hooks
  + fetch 封装处理 API_BASE_URL 和 Bearer Token
  + Zustand 存当前用户
  + S3 存静态资源和 Markdown
```

新代码应尽量遵循以下原则：

- 页面放在 `src/app/[locale]` 下。
- 内部跳转使用 `@/i18n/navigation`。
- 业务接口优先使用 `@/lib/api/generated` 里的 hooks。
- Server Component 请求接口使用 `apiFetchServer`。
- 客户端全局用户状态使用 `useUserStore`。
- 远程数据缓存交给 TanStack Query。
- 样式优先使用 Tailwind token class。
- 通用 UI 放 `src/components/ui`，通用业务组件放 `src/components`，页面私有组件 colocate 到页面目录。
- 新增用户可见文案时同步维护 `en.json` 和 `zh.json`。
- 敏感权限逻辑不要只依赖客户端守卫，必须由后端或服务端校验。
