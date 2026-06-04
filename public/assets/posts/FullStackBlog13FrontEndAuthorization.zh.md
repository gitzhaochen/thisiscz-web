### 全栈开发个人博客 13：前端鉴权设计

> 前端鉴权系统为博客应用提供了完整的身份验证和授权机制，确保用户只能访问其权限范围内的功能和资源。

#### 1. 概述

**核心功能**：

- JWT Token 存储和管理
- API 请求自动携带 Token
- Token 过期自动刷新（预留接口）
- 用户状态全局管理
- 路由级权限保护
- 组件级权限控制
- 全局错误处理和自动跳转

**技术栈**：

- `js-cookie`：Cookie 管理
- `@tanstack/react-query`：数据获取和状态管理
- `zustand`：全局状态管理
- Next.js：服务端和客户端组件支持

#### 2. Token 管理

**2.1 Token 存储**

在 `src/lib/auth.ts` 中实现 Token 的存储、读取和清除：

```typescript
import Cookies from 'js-cookie'

export function getAccessToken() {
  return Cookies.get('access_token') || null
}

export function setAccessToken(token: string) {
  Cookies.set('access_token', token, {
    expires: 7, // 7 天过期
    path: '/',
  })
}

export function clearAuth() {
  Cookies.remove('access_token', { path: '/' })
}
```

**存储方式说明**：

- 使用 `js-cookie` 库管理 Cookie
- Token 存储在名为 `access_token` 的 Cookie 中
- 设置 7 天过期时间
- 路径设置为 `/`，使整个应用可访问

**2.2 Token 刷新机制（预留）**

虽然当前实现中 `refreshAccessToken` 返回 `null`，但已预留刷新机制接口：

```typescript
export async function refreshAccessToken() {
  // 防止并发刷新
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true

  refreshPromise = new Promise(async (resolve) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/refresh`, {
        method: 'POST',
        credentials: 'include', // 必须带 cookie（HttpOnly refresh token）
      })

      if (!res.ok) {
        resolve(null)
        return
      }

      const data = await res.json()
      const newToken = data.token

      setAccessToken(newToken)
      resolve(newToken)
    } catch (err) {
      resolve(null)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })

  return refreshPromise
}
```

**关键点**：

- 使用 `isRefreshing` 标志防止并发刷新
- 使用 `refreshPromise` 确保多个请求共享同一个刷新操作
- 刷新成功后自动更新 Token

#### 3. API 请求鉴权

**3.1 自动携带 Token**

在 `src/lib/apiFetch.ts` 中实现 API 请求自动携带 Token：

```typescript
import { refreshAccessToken, getAccessToken, clearAuth } from './auth'
import { API_BASE_URL } from './constants'

export async function apiFetch(url: string, options: RequestInit = {}) {
  const fullUrl = API_BASE_URL + url
  const token = getAccessToken()

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }

  let res = await fetch(fullUrl, { ...options, headers })

  // ====== 401：尝试 refresh token ======
  if (res.status === 401) {
    console.warn('Access token expired → refreshing...')

    const newToken = await refreshAccessToken()

    if (!newToken) {
      clearAuth()
      throw new Error('UNAUTHORIZED')
    }

    // retry 1 次
    res = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      },
    })
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Request error')
  }

  const data = await res.json().catch(() => null)
  return data
}
```

**关键功能**：

- 自动从 Cookie 读取 Token 并添加到请求头
- 处理 401 错误，自动尝试刷新 Token
- 刷新失败时清除认证并抛出 `UNAUTHORIZED` 错误
- 刷新成功后自动重试原请求

**3.2 服务端 API 调用**

提供服务端版本的 API 调用函数，用于在服务端组件中使用：

```typescript
export async function apiFetchServer(url: string, options: RequestInit = {}) {
  const fullUrl = API_BASE_URL + url

  // 尝试从 cookies 中获取 token
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  }

  const res = await fetch(fullUrl, { ...options, headers })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Request error')
  }

  const data = await res.json().catch(() => null)
  return data
}
```

**使用场景**：

- 在 Next.js 服务端组件中调用 API
- 从 Next.js 的 `cookies()` API 读取 Token
- 支持服务端渲染（SSR）场景

#### 4. 用户状态管理

**4.1 全局用户状态**

使用 Zustand 管理全局用户状态，在 `src/store/userStore.ts` 中：

```typescript
import { create } from 'zustand'

interface UserStore {
  user: any
  setUser: (user: any) => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

**状态说明**：

- `user`：当前登录用户信息（包含 `id`、`userName`、`email`、`role` 等）
- `setUser`：更新用户信息的方法

**4.2 应用初始化时获取用户信息**

在 `src/components/appInit/index.tsx` 中实现用户信息自动获取：

```typescript
'use client'
import useAuthAdmin from '@/hooks/useAuthAdmin'
import { getAccessToken } from '@/lib/auth'
import { useUserStore } from '@/store/userStore'
import { useGetApiUsersMe } from '@/lib/api/generated'
import { useEffect } from 'react'

export default function AppInit() {
  const token = getAccessToken()

  const { data: user, isLoading } = useGetApiUsersMe({
    query: { enabled: !!token }, // 仅在存在 Token 时请求
  })

  useEffect(() => {
    if (user) {
      useUserStore.setState({ user }) // 更新全局用户状态
    }
  }, [user])

  useAuthAdmin() // 路由保护
  return null
}
```

**关键点**：

- `enabled: !!token`：仅在存在 Token 时发起请求，避免不必要的 API 调用
- 使用 `useGetApiUsersMe`（由 Orval 自动生成）获取当前用户信息
- 用户信息获取成功后自动更新全局状态
- 在应用根布局中引入 `AppInit` 组件

**4.3 在根布局中引入 AppInit**

在 `src/app/[locale]/layout.tsx` 中：

```typescript
import AppInit from '@/components/appInit'

export default async function LocaleLayout({ children, params }: Props) {
  return (
    <html>
      <body>
        <AppInit />
        {children}
      </body>
    </html>
  )
}
```

#### 5. 路由保护

**5.1 管理员路由保护 Hook**

在 `src/hooks/useAuthAdmin.ts` 中实现管理员路由保护：

```typescript
import { redirect, usePathname, useRouter } from '@/i18n/navigation'
import { useUserStore } from '@/store/userStore'
import { useEffect } from 'react'
import { getAccessToken } from '@/lib/auth'

export default function useAuthAdmin() {
  const router = useRouter()
  const user = useUserStore((state: any) => state.user)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin') && (!getAccessToken() || (user && user?.role.toLowerCase() !== 'admin'))) {
      router.replace('/')
    }
  }, [user, pathname])
}
```

**保护逻辑**：

- 检查当前路径是否以 `/admin` 开头
- 验证是否存在 Token
- 验证用户角色是否为 `admin`
- 不满足条件时自动跳转到首页

**5.2 在 AppInit 中使用**

在 `AppInit` 组件中调用 `useAuthAdmin()`，确保所有页面加载时都会进行权限检查。

#### 6. 组件级权限控制

**6.1 条件渲染管理员功能**

在组件中根据用户角色条件渲染功能，例如在 `src/components/LayoutHeader/ProfileAction.tsx` 中：

```typescript
'use client'
import { useUserStore } from '@/store/userStore'

export default function ProfileAction() {
  const user = useUserStore((state: any) => state.user)

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="link">
          {user.userName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.role === 'admin' && (
          <>
            <DropdownMenuItem>
              <Link href="/admin/addPosts">Add posts</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/admin/addBookmarks">Add bookmarks</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem>
          <Link href="/posts/mylikes">My likes</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { clearAuth(); location.reload(); }}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button onClick={() => router.replace('/login')}>
      <UserIcon className="h-4 w-4" />
    </Button>
  )
}
```

**6.2 帖子管理操作**

在 `src/app/[locale]/posts/components/PostAdminActions.tsx` 中：

```typescript
'use client'
import { useUserStore } from '@/store/userStore'

const PostAdminActions = ({ post }: Props) => {
  const user = useUserStore((state: any) => state.user)

  return (
    <>
      {user?.role === 'admin' && (
        <Link href={`/admin/addPosts?actionType=edit&id=${post.id}`}>
          <Button variant="ghost" size="icon">
            <EditIcon className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </>
  )
}
```

**6.3 书签管理操作**

在 `src/app/[locale]/bookmarks/components/LinkAdminActions.tsx` 中：

```typescript
'use client'
import { useUserStore } from '@/store/userStore'

const LinkAdminActions = ({ link }: Props) => {
  const user = useUserStore((state: any) => state.user)

  return (
    <>
      {user?.role === 'admin' && (
        <Link href={`/admin/addBookmarks?actionType=edit&id=${link.id}`}>
          <Button variant="outline" size="icon">
            <EditIcon className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </>
  )
}
```

**权限控制模式**：

- 使用条件渲染 `{user?.role === 'admin' && <Component />}`
- 仅在用户角色为 `admin` 时显示管理功能
- 普通用户无法看到管理员操作按钮

#### 7. 全局错误处理

**7.1 QueryClient 全局错误处理**

在 `src/lib/queryClient.ts` 中配置全局错误处理：

```typescript
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { clearAuth } from './auth'

// 全局错误处理函数
const handleGlobalError = (error: unknown) => {
  // 检查是否是 UNAUTHORIZED 错误（来自 apiFetch.ts）
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    console.log('全局捕获 401 → 清除认证并跳转登录')
    clearAuth()
    // 跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// 配置 queryCache 用于处理查询错误
const queryCache = new QueryCache({
  onError: (error) => {
    handleGlobalError(error)
  },
})

// 配置 mutationCache 用于处理变更错误
const mutationCache = new MutationCache({
  onError: (error) => {
    handleGlobalError(error)
  },
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // 避免与 fetch retry 冲突
      refetchOnWindowFocus: false,
    },
  },
  queryCache,
  mutationCache,
})
```

**错误处理流程**：

1. `apiFetch` 检测到 401 错误
2. 尝试刷新 Token，失败后抛出 `UNAUTHORIZED` 错误
3. QueryClient 的全局错误处理器捕获错误
4. 清除认证信息并跳转到登录页

**7.2 错误处理优势**：

- 统一处理所有 API 请求的认证错误
- 自动清除过期 Token
- 自动跳转登录，提升用户体验
- 避免在多个组件中重复处理错误逻辑

#### 8. 开发步骤总结

1. **实现 Token 管理**：
   - 创建 `src/lib/auth.ts`，实现 `getAccessToken`、`setAccessToken`、`clearAuth`
   - 使用 `js-cookie` 管理 Cookie 存储
   - 预留 Token 刷新机制接口

2. **实现 API 请求鉴权**：
   - 在 `src/lib/apiFetch.ts` 中自动添加 Authorization 头
   - 处理 401 错误，自动尝试刷新 Token
   - 提供服务端版本的 `apiFetchServer` 函数

3. **创建全局用户状态**：
   - 使用 Zustand 创建 `src/store/userStore.ts`
   - 定义用户状态接口和方法

4. **实现应用初始化**：
   - 创建 `src/components/appInit/index.tsx`
   - 在应用启动时自动获取用户信息
   - 更新全局用户状态

5. **实现路由保护**：
   - 创建 `src/hooks/useAuthAdmin.ts` Hook
   - 保护 `/admin` 路由，验证 Token 和角色
   - 在 `AppInit` 中调用路由保护

6. **实现组件级权限控制**：
   - 在需要权限的组件中使用 `useUserStore` 获取用户信息
   - 使用条件渲染控制功能显示
   - 根据用户角色显示/隐藏管理功能

7. **配置全局错误处理**：
   - 在 `src/lib/queryClient.ts` 中配置 QueryCache 和 MutationCache
   - 统一处理 `UNAUTHORIZED` 错误
   - 自动清除认证并跳转登录

8. **在根布局中引入 AppInit**：
   - 在 `src/app/[locale]/layout.tsx` 中引入 `AppInit` 组件
   - 确保应用启动时自动初始化用户状态和路由保护

#### 9. 安全注意事项

1. **Token 安全**：
   - Token 存储在 Cookie 中，设置合理的过期时间（7 天）
   - 生产环境使用 HTTPS 传输
   - 考虑使用 HttpOnly Cookie 存储 refresh token（需要同域）

2. **权限验证**：
   - 前端权限控制仅用于 UI 展示，不能替代后端验证
   - 所有敏感操作必须在后端验证用户权限
   - 路由保护是用户体验优化，后端 API 必须有对应的权限验证

3. **错误处理**：
   - 妥善处理 Token 过期情况
   - 提供友好的错误提示
   - 自动跳转登录，避免用户困惑

4. **用户体验**：
   - 应用启动时自动获取用户信息，无需手动刷新
   - 权限不足时自动跳转，避免显示错误页面
   - 提供清晰的登录状态指示

#### 10. 常见问题

**Q: Token 过期后如何刷新？**

A: 当前实现中 `refreshAccessToken` 返回 `null`，需要后端实现 `/users/refresh` 接口。刷新流程：检测到 401 → 调用刷新接口 → 更新 Token → 重试原请求。

**Q: 为什么用户信息有时未加载？**

A: 检查以下几点：

- `AppInit` 组件是否正确引入到根布局
- Token 是否存在于 Cookie 中
- `useGetApiUsersMe` 的 `enabled` 条件是否正确
- 网络请求是否成功

**Q: 路由保护不生效？**

A: 确认：

- `useAuthAdmin` 是否在 `AppInit` 中调用
- 路径匹配逻辑是否正确（`pathname.startsWith('/admin')`）
- 用户状态是否正确更新

**Q: 组件中权限判断不准确？**

A: 确保：

- 使用 `useUserStore` 获取最新用户状态
- 检查用户角色字段名称（`role` vs `Role`）
- 考虑用户状态加载中的情况（`isLoading`）

**Q: 服务端组件如何获取用户信息？**

A: 使用 `apiFetchServer` 函数，它会从 Next.js 的 `cookies()` API 读取 Token，支持服务端渲染场景。

#### 11. 与后端鉴权的配合

前端鉴权系统与后端 JWT 认证系统（参考《全栈开发个人博客 10：JWT 和权限设计》）配合工作：

**认证流程**：

1. 用户通过 Google 登录（参考《全栈开发个人博客 12：前端接入谷歌登录》）
2. 后端验证 Google credential，生成 JWT Token
3. 前端保存 Token 到 Cookie
4. 后续 API 请求自动携带 Token
5. 后端验证 Token 并提取用户信息（email、role 等）
6. 根据用户角色返回相应数据或执行相应操作

**权限验证层级**：

- **前端**：UI 展示控制、路由保护、用户体验优化
- **后端**：API 权限验证、数据安全、业务逻辑保护

**重要**：前端权限控制不能替代后端验证，所有敏感操作必须在后端进行权限检查。
