### 全栈开发个人博客02：前端国际化

> `next-intl` 是一个用于 Next.js 应用的国际化库，简化了多语言支持，通过 `useTranslations` 和 `getTranslations` 等 API 来管理翻译内容，支持构建时静态渲染，服务端组件和客户端组件都可以使用。

#### 1. 安装依赖

```bash
pnpm add next-intl
```

#### 2. 配置路由规则

创建 `src/i18n/routing.ts` 文件，定义支持的语言列表和默认语言：

```tsx
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // 支持的语言列表
  locales: ['en', 'zh'],

  // 默认语言（当没有匹配的语言时使用）
  defaultLocale: 'en',
})

export type Locale = (typeof routing.locales)[number]
```

#### 3. 配置导航工具

创建 `src/i18n/navigation.ts` 文件，导出考虑国际化路由的导航 API：

```tsx
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// 轻量级的 Next.js 导航 API 包装器，考虑路由配置
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
```

#### 4. 配置请求处理

创建 `src/i18n/request.ts` 文件，处理请求时的语言检测和消息加载：

```tsx
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // 通常对应 `[locale]` 段
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    // 动态导入对应语言的翻译文件
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

#### 5. 配置 Next.js 插件

在 `next.config.ts` 中集成 next-intl 插件：

```tsx
// next.config.ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  /* 其他配置选项 */
}

export default withNextIntl(nextConfig)
```

#### 6. 配置中间件

创建 `src/proxy.ts`（或 `middleware.ts`）文件，处理路由级别的语言检测和重定向：

```tsx
// src/proxy.ts
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import type { NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  const intlMiddleware = createMiddleware(routing)
  return await intlMiddleware(request)
}

export const config = {
  // 匹配所有路径，除了：
  // - 以 `/api`, `/trpc`, `/_next` 或 `/_vercel` 开头的
  // - 包含点号的文件（如 `favicon.ico`）
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
```

#### 7. 创建翻译文件

在 `src/messages/` 目录下创建各语言的 JSON 文件：

```json
// src/messages/en.json
{
  "Common": {
    "siteTitle": "ThisIsCZ",
    "description": "Here, you will embark on a journey...",
    "category": "Category"
  },
  "LocaleSwitcher": {
    "zh": "简体中文",
    "en": "English",
    "label": "Language"
  },
  "Navigation": {
    "home": "Home",
    "posts": "Posts",
    "bookmarks": "Bookmarks"
  }
}
```

```json
// src/messages/zh.json
{
  "Common": {
    "siteTitle": "CZ的世界",
    "description": "在这里，你将踏上一段...",
    "category": "分类"
  },
  "LocaleSwitcher": {
    "zh": "简体中文",
    "en": "English",
    "label": "语言"
  },
  "Navigation": {
    "home": "首页",
    "posts": "帖子",
    "bookmarks": "书签"
  }
}
```

#### 8. 配置 App Router 结构

将应用路由移动到 `[locale]` 动态段下：

```
src/
  app/
    [locale]/
      layout.tsx
      page.tsx
      posts/
        page.tsx
        [id]/
          page.tsx
    page.tsx  # 根路径重定向
```

#### 9. 配置根布局

在 `src/app/[locale]/layout.tsx` 中配置：

```tsx
// src/app/[locale]/layout.tsx
import { routing } from '@/i18n/routing'
import { hasLocale, Locale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}

// 为所有语言生成静态参数，支持静态渲染
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// 生成元数据（SEO）
export async function generateMetadata(props: Omit<Props, 'children'>) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: 'Common' })

  return {
    title: t('siteTitle'),
    description: t('description'),
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // 验证语言是否有效
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // 启用静态渲染
  setRequestLocale(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
```

#### 10. 配置根路径重定向

在 `src/app/page.tsx` 中重定向到默认语言：

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation'

// 当访问 `/` 时重定向到默认语言
export default function RootPage() {
  redirect('/en')
}
```

#### 11. 在页面中使用 setRequestLocale

在所有服务端页面组件中设置请求语言：

```tsx
// src/app/[locale]/page.tsx
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params

  // 启用静态渲染
  setRequestLocale(locale)

  return <div>{/* 页面内容 */}</div>
}
```

#### 12. 在服务端组件中使用翻译

使用 `getTranslations` 获取翻译函数：

```tsx
// src/app/[locale]/posts/[id]/page.tsx
import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'

export default async function PostDetail({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  // 获取指定命名空间的翻译函数
  const t = await getTranslations('PostCategory')
  const tCommon = await getTranslations('Common')

  return (
    <div>
      <span>
        {tCommon('category')}: {t(postDetail.category)}
      </span>
    </div>
  )
}
```

#### 13. 在客户端组件中使用翻译

使用 `useTranslations` 和 `useLocale` hooks：

```tsx
// src/app/[locale]/posts/page.tsx
'use client'
import { useTranslations } from 'next-intl'

export default function PagePosts() {
  // 获取指定命名空间的翻译函数
  const t = useTranslations('PostCategory')

  return (
    <div>
      <span>{t('life')}</span>
    </div>
  )
}
```

#### 14. 使用国际化导航

在客户端组件中使用 `@/i18n/navigation` 导出的导航 API：

```tsx
// src/components/LayoutHeader/NavMenu.tsx
'use client'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export const PcNavMenu = () => {
  const pathname = usePathname()
  const i18nNav = useTranslations('Navigation')

  return (
    <div>
      <Link href="/posts">{i18nNav('posts')}</Link>
    </div>
  )
}
```

#### 15. 实现语言切换器

创建语言切换组件，使用 `router.replace` 切换语言并保留当前路径：

```tsx
// src/components/LayoutHeader/LocaleSwitcher.tsx
'use client'
import { useParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { Locale, routing } from '@/i18n/routing'
import { Languages } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

function LocaleSwitcherSelect({ defaultValue, items, label }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  function onChange(value: string) {
    const nextLocale = value as Locale
    startTransition(() => {
      // 切换语言，保留当前路径和参数
      router.replace({ pathname, params }, { locale: nextLocale })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="hover:bg-accent hover:text-accent-foreground cursor-pointer p-2 transition-colors">
          <Languages className="size-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.value} onClick={() => onChange(item.value)}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher')
  const locale = useLocale()

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      items={routing.locales.map((locale) => ({
        value: locale,
        label: t(locale),
      }))}
      label={t('label')}
    />
  )
}
```

#### 16. 完整文件结构

配置完成后的文件结构如下：

```
├── messages/
│   ├── en.json
│   └── zh.json
├── next.config.ts
└── src/
    ├── i18n/
    │   ├── routing.ts
    │   ├── navigation.ts
    │   └── request.ts
    ├── proxy.ts (或 middleware.ts)
    └── app/
        ├── page.tsx
        └── [locale]/
            ├── layout.tsx
            ├── page.tsx
            └── ...
```

#### 总结

通过以上步骤，我们完成了 Next.js 应用的国际化配置：

1. **路由配置**：定义了支持的语言和默认语言
2. **中间件**：自动检测和重定向到正确的语言路径
3. **静态渲染**：通过 `generateStaticParams` 和 `setRequestLocale` 支持静态生成
4. **翻译使用**：服务端使用 `getTranslations`，客户端使用 `useTranslations`
5. **导航**：使用国际化感知的 `Link` 和 `router` 组件
6. **语言切换**：保留当前路径切换语言

这样配置后，应用支持多语言，URL 格式为 `/en/posts` 或 `/zh/posts`，并且支持静态生成和 SEO 优化。
