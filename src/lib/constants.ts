// 使用 VERCEL_ENV 来区分环境，只在 production 环境使用 S3 CDN
// VERCEL_ENV: 'production' | 'preview' | 'development'
// 如果没有 VERCEL_ENV（本地开发），则使用 NODE_ENV 作为后备
export const __IS_PROD__ =
  process.env.VERCEL_ENV === 'production' ||
  (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production')
export const __IS_PREVIEW__ = process.env.VERCEL_ENV === 'preview'
export const __IS_DEV__ = process.env.NODE_ENV === 'development'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

export const USDT_PRICE_DEFAULT = '6.8'
