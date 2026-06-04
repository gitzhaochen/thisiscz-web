### Full-Stack Personal Blog Development 02: Frontend Internationalization

> `next-intl` is an internationalization library for Next.js applications that simplifies multi-language support. It manages translation content through APIs like `useTranslations` and `getTranslations`, supports static rendering at build time, and can be used in both server and client components.

#### 1. Install Dependencies

```bash
pnpm add next-intl
```

#### 2. Configure Routing Rules

Create `src/i18n/routing.ts` file to define the list of supported languages and default language:

```tsx
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // List of supported languages
  locales: ['en', 'zh'],

  // Default language (used when no matching language is found)
  defaultLocale: 'en',
})

export type Locale = (typeof routing.locales)[number]
```

#### 3. Configure Navigation Utilities

Create `src/i18n/navigation.ts` file to export navigation APIs that consider internationalized routing:

```tsx
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Lightweight Next.js navigation API wrapper that considers routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
```

#### 4. Configure Request Handling

Create `src/i18n/request.ts` file to handle language detection and message loading on requests:

```tsx
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // Usually corresponds to the `[locale]` segment
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    // Dynamically import translation files for the corresponding language
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

#### 5. Configure Next.js Plugin

Integrate the next-intl plugin in `next.config.ts`:

```tsx
// next.config.ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  /* Other configuration options */
}

export default withNextIntl(nextConfig)
```

#### 6. Configure Middleware

Create `src/proxy.ts` (or `middleware.ts`) file to handle route-level language detection and redirection:

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
  // Match all paths except:
  // - Those starting with `/api`, `/trpc`, `/_next`, or `/_vercel`
  // - Files containing dots (e.g., `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
```

#### 7. Create Translation Files

Create JSON files for each language in the `src/messages/` directory:

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

#### 8. Configure App Router Structure

Move application routes under the `[locale]` dynamic segment:

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
    page.tsx  # Root path redirect
```

#### 9. Configure Root Layout

Configure in `src/app/[locale]/layout.tsx`:

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

// Generate static parameters for all languages, supporting static rendering
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Generate metadata (SEO)
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

  // Validate if the language is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
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

#### 10. Configure Root Path Redirect

Redirect to default language in `src/app/page.tsx`:

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation'

// Redirect to default language when accessing `/`
export default function RootPage() {
  redirect('/en')
}
```

#### 11. Use setRequestLocale in Pages

Set the request locale in all server-side page components:

```tsx
// src/app/[locale]/page.tsx
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params

  // Enable static rendering
  setRequestLocale(locale)

  return <div>{/* Page content */}</div>
}
```

#### 12. Use Translations in Server Components

Use `getTranslations` to get the translation function:

```tsx
// src/app/[locale]/posts/[id]/page.tsx
import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'

export default async function PostDetail({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)

  // Get translation function for specified namespace
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

#### 13. Use Translations in Client Components

Use `useTranslations` and `useLocale` hooks:

```tsx
// src/app/[locale]/posts/page.tsx
'use client'
import { useTranslations } from 'next-intl'

export default function PagePosts() {
  // Get translation function for specified namespace
  const t = useTranslations('PostCategory')

  return (
    <div>
      <span>{t('life')}</span>
    </div>
  )
}
```

#### 14. Use Internationalized Navigation

Use navigation APIs exported from `@/i18n/navigation` in client components:

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

#### 15. Implement Language Switcher

Create a language switcher component that uses `router.replace` to switch languages while preserving the current path:

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
      // Switch language, preserving current path and parameters
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

#### 16. Complete File Structure

The file structure after configuration is as follows:

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
    ├── proxy.ts (or middleware.ts)
    └── app/
        ├── page.tsx
        └── [locale]/
            ├── layout.tsx
            ├── page.tsx
            └── ...
```

#### Summary

Through the above steps, we have completed the internationalization configuration for the Next.js application:

1. **Routing Configuration**: Defined supported languages and default language
2. **Middleware**: Automatically detects and redirects to the correct language path
3. **Static Rendering**: Supports static generation through `generateStaticParams` and `setRequestLocale`
4. **Translation Usage**: Use `getTranslations` on the server, `useTranslations` on the client
5. **Navigation**: Use internationalization-aware `Link` and `router` components
6. **Language Switching**: Preserve current path when switching languages

After this configuration, the application supports multiple languages with URL formats like `/en/posts` or `/zh/posts`, and supports static generation and SEO optimization.
