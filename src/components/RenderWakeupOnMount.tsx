'use client'

import { useEffect } from 'react'
import { API_BASE_URL } from '@/lib/constants'

const RENDER_HEALTH_URL = `${API_BASE_URL}/api/health/database`

export default function RenderWakeupOnMount() {
  useEffect(() => {
    void fetch(RENDER_HEALTH_URL, {
      method: 'GET',
      cache: 'no-store',
    }).catch(() => {
      // 仅用于唤醒服务，忽略网络失败避免影响页面。
    })
  }, [])

  return null
}
