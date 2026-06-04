import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { __IS_PROD__ } from '@/lib/constants'
console.log('__IS_PROD__', __IS_PROD__)
// 使用 VERCEL_ENV 来区分环境，只在 production 环境使用 S3 CDN
// VERCEL_ENV: 'production' | 'preview' | 'development'
const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  /* config options here */
  images: { unoptimized: true },
}

export default withNextIntl(nextConfig)
