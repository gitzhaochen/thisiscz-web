### Full Stack Personal Blog Development 13: Frontend Authorization Design

> The frontend authorization system provides a complete identity verification and authorization mechanism for the blog application, ensuring users can only access functions and resources within their permissions.

#### 1. Overview

**Core Features**:

- JWT Token storage and management
- Automatically include token in API requests
- Automatic token refresh on expiration (reserved interface)
- Global user state management
- Route-level permission protection
- Component-level permission control
- Global error handling and automatic redirect

**Technology Stack**:

- `js-cookie`: Cookie management
- `@tanstack/react-query`: Data fetching and state management
- `zustand`: Global state management
- Next.js: Server-side and client-side component support

#### 2. Token Management

**2.1 Token Storage**

Implement token storage, reading, and clearing in `src/lib/auth.ts`:

```typescript
import Cookies from 'js-cookie'

export function getAccessToken() {
  return Cookies.get('access_token') || null
}

export function setAccessToken(token: string) {
  Cookies.set('access_token', token, {
    expires: 7, // 7 days expiration
    path: '/',
  })
}

export function clearAuth() {
  Cookies.remove('access_token', { path: '/' })
}
```

**Storage Method Description**:

- Use `js-cookie` library to manage cookies
- Token stored in cookie named `access_token`
- Set 7 days expiration time
- Path set to `/` to make it accessible throughout the application

**2.2 Token Refresh Mechanism (Reserved)**

Although `refreshAccessToken` currently returns `null` in the implementation, the refresh mechanism interface is reserved:

```typescript
export async function refreshAccessToken() {
  // Prevent concurrent refresh
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true

  refreshPromise = new Promise(async (resolve) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/refresh`, {
        method: 'POST',
        credentials: 'include', // Must include cookie (HttpOnly refresh token)
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

**Key Points**:

- Use `isRefreshing` flag to prevent concurrent refresh
- Use `refreshPromise` to ensure multiple requests share the same refresh operation
- Automatically update token after successful refresh

#### 3. API Request Authorization

**3.1 Automatically Include Token**

Implement automatic token inclusion in API requests in `src/lib/apiFetch.ts`:

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

  // ====== 401: Try to refresh token ======
  if (res.status === 401) {
    console.warn('Access token expired → refreshing...')

    const newToken = await refreshAccessToken()

    if (!newToken) {
      clearAuth()
      throw new Error('UNAUTHORIZED')
    }

    // retry once
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

**Key Features**:

- Automatically read token from cookie and add to request headers
- Handle 401 errors, automatically try to refresh token
- Clear authentication and throw `UNAUTHORIZED` error when refresh fails
- Automatically retry original request after successful refresh

**3.2 Server-Side API Calls**

Provide server-side version of API call function for use in server components:

```typescript
export async function apiFetchServer(url: string, options: RequestInit = {}) {
  const fullUrl = API_BASE_URL + url

  // Try to get token from cookies
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

**Use Cases**:

- Call APIs in Next.js server components
- Read token from Next.js `cookies()` API
- Support server-side rendering (SSR) scenarios

#### 4. User State Management

**4.1 Global User State**

Use Zustand to manage global user state in `src/store/userStore.ts`:

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

**State Description**:

- `user`: Current logged-in user information (includes `id`, `userName`, `email`, `role`, etc.)
- `setUser`: Method to update user information

**4.2 Get User Information on App Initialization**

Implement automatic user information fetching in `src/components/appInit/index.tsx`:

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
    query: { enabled: !!token }, // Only request when token exists
  })

  useEffect(() => {
    if (user) {
      useUserStore.setState({ user }) // Update global user state
    }
  }, [user])

  useAuthAdmin() // Route protection
  return null
}
```

**Key Points**:

- `enabled: !!token`: Only make request when token exists, avoid unnecessary API calls
- Use `useGetApiUsersMe` (auto-generated by Orval) to get current user information
- Automatically update global state after user information is successfully fetched
- Import `AppInit` component in application root layout

**4.3 Import AppInit in Root Layout**

In `src/app/[locale]/layout.tsx`:

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

#### 5. Route Protection

**5.1 Admin Route Protection Hook**

Implement admin route protection in `src/hooks/useAuthAdmin.ts`:

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

**Protection Logic**:

- Check if current path starts with `/admin`
- Verify if token exists
- Verify if user role is `admin`
- Automatically redirect to homepage if conditions not met

**5.2 Use in AppInit**

Call `useAuthAdmin()` in `AppInit` component to ensure permission check on all page loads.

#### 6. Component-Level Permission Control

**6.1 Conditionally Render Admin Features**

Conditionally render features based on user role in components, for example in `src/components/LayoutHeader/ProfileAction.tsx`:

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

**6.2 Post Management Actions**

In `src/app/[locale]/posts/components/PostAdminActions.tsx`:

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

**6.3 Bookmark Management Actions**

In `src/app/[locale]/bookmarks/components/LinkAdminActions.tsx`:

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

**Permission Control Pattern**:

- Use conditional rendering `{user?.role === 'admin' && <Component />}`
- Only show admin features when user role is `admin`
- Regular users cannot see admin action buttons

#### 7. Global Error Handling

**7.1 QueryClient Global Error Handling**

Configure global error handling in `src/lib/queryClient.ts`:

```typescript
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { clearAuth } from './auth'

// Global error handling function
const handleGlobalError = (error: unknown) => {
  // Check if it's UNAUTHORIZED error (from apiFetch.ts)
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    console.log('Global catch 401 → clear auth and redirect to login')
    clearAuth()
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// Configure queryCache for handling query errors
const queryCache = new QueryCache({
  onError: (error) => {
    handleGlobalError(error)
  },
})

// Configure mutationCache for handling mutation errors
const mutationCache = new MutationCache({
  onError: (error) => {
    handleGlobalError(error)
  },
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Avoid conflict with fetch retry
      refetchOnWindowFocus: false,
    },
  },
  queryCache,
  mutationCache,
})
```

**Error Handling Flow**:

1. `apiFetch` detects 401 error
2. Try to refresh token, throw `UNAUTHORIZED` error after failure
3. QueryClient's global error handler catches error
4. Clear authentication and redirect to login page

**7.2 Error Handling Advantages**:

- Unified handling of authentication errors for all API requests
- Automatically clear expired tokens
- Automatically redirect to login, improving user experience
- Avoid duplicate error handling logic in multiple components

#### 8. Development Steps Summary

1. **Implement Token Management**:
   - Create `src/lib/auth.ts`, implement `getAccessToken`, `setAccessToken`, `clearAuth`
   - Use `js-cookie` to manage cookie storage
   - Reserve token refresh mechanism interface

2. **Implement API Request Authorization**:
   - Automatically add Authorization header in `src/lib/apiFetch.ts`
   - Handle 401 errors, automatically try to refresh token
   - Provide server-side version of `apiFetchServer` function

3. **Create Global User State**:
   - Use Zustand to create `src/store/userStore.ts`
   - Define user state interface and methods

4. **Implement App Initialization**:
   - Create `src/components/appInit/index.tsx`
   - Automatically get user information on app startup
   - Update global user state

5. **Implement Route Protection**:
   - Create `src/hooks/useAuthAdmin.ts` Hook
   - Protect `/admin` routes, verify token and role
   - Call route protection in `AppInit`

6. **Implement Component-Level Permission Control**:
   - Use `useUserStore` to get user information in components that need permissions
   - Use conditional rendering to control feature display
   - Show/hide admin features based on user role

7. **Configure Global Error Handling**:
   - Configure QueryCache and MutationCache in `src/lib/queryClient.ts`
   - Unified handling of `UNAUTHORIZED` errors
   - Automatically clear authentication and redirect to login

8. **Import AppInit in Root Layout**:
   - Import `AppInit` component in `src/app/[locale]/layout.tsx`
   - Ensure user state and route protection are automatically initialized on app startup

#### 9. Security Considerations

1. **Token Security**:
   - Token stored in cookie, set reasonable expiration time (7 days)
   - Use HTTPS in production
   - Consider using HttpOnly cookie to store refresh token (requires same domain)

2. **Permission Verification**:
   - Frontend permission control is only for UI display, cannot replace backend verification
   - All sensitive operations must verify user permissions on the backend
   - Route protection is a user experience optimization, backend APIs must have corresponding permission verification

3. **Error Handling**:
   - Properly handle token expiration
   - Provide friendly error messages
   - Automatically redirect to login to avoid user confusion

4. **User Experience**:
   - Automatically get user information on app startup, no manual refresh needed
   - Automatically redirect when permissions are insufficient, avoid showing error pages
   - Provide clear login status indication

#### 10. Common Issues

**Q: How to refresh token after expiration?**

A: In current implementation, `refreshAccessToken` returns `null`, backend needs to implement `/users/refresh` API. Refresh flow: detect 401 → call refresh API → update token → retry original request.

**Q: Why is user information sometimes not loaded?**

A: Check the following:

- Is `AppInit` component correctly imported in root layout
- Does token exist in cookie
- Is `useGetApiUsersMe`'s `enabled` condition correct
- Is network request successful

**Q: Route protection not working?**

A: Confirm:

- Is `useAuthAdmin` called in `AppInit`
- Is path matching logic correct (`pathname.startsWith('/admin')`)
- Is user state correctly updated

**Q: Permission check in components not accurate?**

A: Ensure:

- Use `useUserStore` to get latest user state
- Check user role field name (`role` vs `Role`)
- Consider user state loading situation (`isLoading`)

**Q: How to get user information in server components?**

A: Use `apiFetchServer` function, which reads token from Next.js `cookies()` API, supports server-side rendering scenarios.

#### 11. Integration with Backend Authorization

The frontend authorization system works together with the backend JWT authentication system (refer to "Full Stack Personal Blog Development 10: JWT and Authorization Design"):

**Authentication Flow**:

1. User logs in via Google (refer to "Full Stack Personal Blog Development 12: Frontend Google Login Integration")
2. Backend validates Google credential, generates JWT Token
3. Frontend saves token to cookie
4. Subsequent API requests automatically include token
5. Backend validates token and extracts user information (email, role, etc.)
6. Return corresponding data or execute corresponding operations based on user role

**Permission Verification Levels**:

- **Frontend**: UI display control, route protection, user experience optimization
- **Backend**: API permission verification, data security, business logic protection

**Important**: Frontend permission control cannot replace backend verification, all sensitive operations must have permission checks on the backend.
