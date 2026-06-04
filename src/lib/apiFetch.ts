// src/lib/apiFetch.ts

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

/**
 * 服务端版本的 API 调用函数
 * 用于在服务端组件中使用，从 cookies 中读取 token
 */
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
