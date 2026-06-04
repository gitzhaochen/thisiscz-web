// src/lib/auth.ts

import Cookies from 'js-cookie'
import { __IS_DEV__, __IS_PROD__, API_BASE_URL } from './constants'

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken() {
  return null
  //不是相同的顶级域名 种不了cookie 当然也获取不到
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  console.log('Retrying original request with new token...')

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

export function getAccessToken() {
  return Cookies.get('access_token') || null
}

export function clearAuth() {
  Cookies.remove('access_token', { path: '/' })
}

export function setAccessToken(token: string) {
  Cookies.set('access_token', token, {
    expires: 7,
    path: '/',
  })
}
