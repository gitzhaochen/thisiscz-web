import { apiFetch } from '@/lib/apiFetch'

export const customInstance = async <T>(
  config: {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    params?: any
    data?: any
    headers?: Record<string, string>
    signal?: AbortSignal
  },
  options?: any,
): Promise<T> => {
  const { url, method, params, data, headers } = config

  // 构建查询参数
  let fullUrl = url
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      fullUrl += `?${queryString}`
    }
  }

  const response = await apiFetch(fullUrl, {
    method,
    ...(data && { body: JSON.stringify(data) }),
    ...(headers && { headers }),
    signal: config.signal,
  })

  return response as T
}

export default customInstance

