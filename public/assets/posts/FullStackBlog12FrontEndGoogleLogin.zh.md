### 全栈开发个人博客 12：前端接入谷歌登录

> 谷歌登录功能为博客应用提供了便捷的第三方身份认证方式，用户可以通过 Google 账号快速登录，无需注册新账号。

#### 1. 概述

**核心功能**：

- Google OAuth 2.0 认证流程
- JWT Token 获取和存储
- 用户信息自动同步
- 登录状态持久化

**技术栈**：

- `@react-oauth/google`：Google OAuth React 组件库
- `@tanstack/react-query`：数据获取和状态管理
- `js-cookie`：Cookie 管理
- Orval：自动生成的类型安全 API hooks

#### 2. 安装依赖

安装 Google OAuth React 组件库：

```bash
pnpm add @react-oauth/google
```

**依赖说明**：

- `@react-oauth/google`：提供 `GoogleOAuthProvider` 和 `GoogleLogin` 组件
- 支持弹出窗口和重定向两种登录模式
- 自动处理 Google OAuth 2.0 认证流程

#### 3. 配置 Google OAuth Client ID

**3.1 获取 Google OAuth Client ID**

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID
5. 配置授权重定向 URI（如：`http://localhost:3000`）
6. 获取 Client ID

**3.2 配置环境变量（推荐）**

在项目根目录创建或更新 `.env.local` 文件：

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**注意**：使用 `NEXT_PUBLIC_` 前缀使变量在客户端可访问。

**3.3 读取环境变量（推荐）**

在 `src/lib/constants.ts` 中定义常量：

```typescript
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
```

**注意**：当前实现中 Client ID 直接硬编码在组件中，生产环境建议使用环境变量管理。

#### 4. 实现登录页面组件

在 `src/app/[locale]/login/page.tsx` 中实现登录页面：

**4.1 导入必要的依赖**

```typescript
'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { GoogleLogin } from '@react-oauth/google'
import { usePostApiUsersGoogleLogin } from '@/lib/api/generated'
import { setAccessToken } from '@/lib/auth'
import { useLocale, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
// 如果使用环境变量，从 constants 导入
// import { GOOGLE_CLIENT_ID } from '@/lib/constants'
```

**4.2 使用 Google 登录 Hook**

```typescript
export default function LoginPage() {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const { mutate: googleLogin, isPending: isGoogleLoginPending } = usePostApiUsersGoogleLogin({
    mutation: {
      onSuccess: (response: any) => {
        toast.success('登录成功！')
        setAccessToken(response.token)
        window.location.href = returnTo ? decodeURIComponent(returnTo) : `/${locale}`
      },
      onError: (error: any) => {
        toast.error(error.message || '登录失败，请重试')
      },
    },
  })
```

**关键点**：

- `usePostApiUsersGoogleLogin`：由 Orval 自动生成的类型安全 API hook
- `onSuccess`：登录成功后保存 Token 并跳转
- `onError`：处理登录失败情况
- 支持 `returnTo` 参数，登录后跳转到指定页面

**4.3 渲染 Google 登录组件**

```typescript
return (
  <div className="flex h-[80vh] items-center justify-center px-4">
    <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">Sign In</h2>
        <p className="text-muted-foreground">Please enter your account information</p>
      </div>

      <GoogleOAuthProvider clientId="your-google-client-id.apps.googleusercontent.com">
        <GoogleLogin
          ux_mode="popup"
          onSuccess={(credentialResponse: any) => {
            googleLogin({ data: { credential: credentialResponse.credential } })
          }}
          onError={() => {
            toast.error('Google 登录失败，请重试')
          }}
        />
      </GoogleOAuthProvider>
    </div>
  </div>
)
```

**组件配置说明**：

- `GoogleOAuthProvider`：提供 Google OAuth 上下文，需要包裹所有使用 Google 登录的组件
- `GoogleLogin`：Google 登录按钮组件
- `ux_mode="popup"`：使用弹出窗口模式（可选：`"redirect"` 重定向模式）
- `onSuccess`：登录成功回调，接收 `credentialResponse.credential`（JWT Token）
- `onError`：登录失败回调

#### 5. Token 管理

**5.1 Token 存储**

在 `src/lib/auth.ts` 中实现 Token 存储和读取：

```typescript
import Cookies from 'js-cookie'

export function setAccessToken(token: string) {
  Cookies.set('access_token', token, {
    expires: 7, // 7 天过期
    path: '/',
  })
}

export function getAccessToken() {
  return Cookies.get('access_token') || null
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

**5.2 API 请求自动携带 Token**

在 `src/lib/apiFetch.ts` 中自动在请求头中添加 Token：

```typescript
import { getAccessToken } from './auth'

export async function apiFetch(url: string, options: RequestInit = {}) {
  const fullUrl = API_BASE_URL + url
  const token = getAccessToken()

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }

  const res = await fetch(fullUrl, { ...options, headers })
  // ... 处理响应
}
```

#### 6. 用户状态同步

**6.1 应用初始化时获取用户信息**

在 `src/components/appInit/index.tsx` 中实现用户信息自动获取：

```typescript
'use client'
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

  return null
}
```

**关键点**：

- `enabled: !!token`：仅在存在 Token 时发起请求，避免不必要的 API 调用
- 使用 Zustand 全局状态管理用户信息
- 在应用根布局中引入 `AppInit` 组件

**6.2 在根布局中引入 AppInit**

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

#### 7. 后端 API 接口

前端调用后端 `/api/users/google-login` 接口，传递 Google 返回的 credential：

**请求格式**：

```typescript
POST /api/users/google-login
Content-Type: application/json

{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."
}
```

**响应格式**：

```typescript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2024-01-01T12:00:00Z"
}
```

后端接口会：

1. 验证 Google JWT credential
2. 提取用户信息（邮箱、姓名等）
3. 创建或查找本地用户
4. 生成应用 JWT Token 并返回

#### 8. 开发步骤总结

1. **安装依赖**：安装 `@react-oauth/google` 库
2. **配置 Client ID**：在 Google Cloud Console 创建 OAuth 客户端，获取 Client ID
3. **设置环境变量**：将 Client ID 配置到环境变量中
4. **实现登录组件**：在登录页面中使用 `GoogleOAuthProvider` 和 `GoogleLogin`
5. **调用后端接口**：使用 Orval 生成的 hook 调用 `/api/users/google-login`
6. **处理登录响应**：登录成功后保存 Token 到 Cookie
7. **实现 Token 管理**：创建 `setAccessToken`、`getAccessToken`、`clearAuth` 函数
8. **自动携带 Token**：在 `apiFetch` 中自动在请求头添加 Authorization
9. **同步用户状态**：在应用初始化时获取用户信息并更新全局状态
10. **处理页面跳转**：登录成功后跳转到首页或 `returnTo` 参数指定的页面

#### 9. 安全注意事项

1. **Client ID 安全**：
   - 生产环境使用环境变量存储 Client ID
   - 不要将 Client ID 提交到公开代码仓库
   - 在 Google Cloud Console 中配置正确的授权重定向 URI

2. **Token 安全**：
   - Token 存储在 Cookie 中，设置合理的过期时间
   - 生产环境使用 HTTPS 传输
   - 后端验证 Google credential 的有效性

3. **错误处理**：
   - 妥善处理登录失败情况
   - 提供友好的错误提示
   - 记录错误日志便于排查问题

4. **用户体验**：
   - 显示登录加载状态
   - 支持登录后跳转到原访问页面
   - 提供清晰的登录指引

#### 10. 常见问题

**Q: 登录后 Token 未保存？**

A: 检查 `setAccessToken` 函数是否正确调用，Cookie 设置是否成功。

**Q: API 请求返回 401 未授权？**

A: 确认 Token 是否正确存储在 Cookie 中，`apiFetch` 是否正确添加 Authorization 头。

**Q: Google 登录弹窗被拦截？**

A: 确保浏览器允许弹出窗口，或改用 `ux_mode="redirect"` 重定向模式。

**Q: 用户信息未自动加载？**

A: 检查 `AppInit` 组件是否正确引入，Token 是否存在，`useGetApiUsersMe` 的 `enabled` 条件是否正确。
