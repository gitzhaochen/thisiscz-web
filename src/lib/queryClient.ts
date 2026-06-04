// src/lib/queryClient.ts
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
