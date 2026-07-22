import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import crypto from 'node:crypto'
import { Readable } from 'node:stream'

const getRequiredEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const inferExtension = (url: string, contentType?: string | null) => {
  const fromUrl = (() => {
    try {
      const pathname = new URL(url).pathname || ''
      const match = pathname.match(/\.([a-zA-Z0-9]{2,5})$/)?.[1]?.toLowerCase()
      if (match) {
        if (match === 'jpeg') return 'jpg'
        return match
      }
    } catch {
      // noop
    }
    return ''
  })()
  if (fromUrl) return fromUrl

  const type = (contentType || '').toLowerCase()
  if (type.includes('jpeg')) return 'jpg'
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  if (type.includes('gif')) return 'gif'
  if (type.includes('avif')) return 'avif'
  return 'jpg'
}

const createR2Client = () => {
  const accessKeyId = getRequiredEnv('APP_CLOUDFLARE_R2_ACCESS_KEY_ID')
  const secretAccessKey = getRequiredEnv('APP_CLOUDFLARE_R2_SECRET_ACCESS_KEY')
  const endpoint = getRequiredEnv('APP_CLOUDFLARE_R2_ENDPOINT')

  return new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint,
    region: 'auto',
    forcePathStyle: true,
  })
}

const MAX_IMAGE_BYTES = Number(process.env.XHS_PARSE_MAX_IMAGE_BYTES || 10 * 1024 * 1024)
const MAX_UPLOAD_IMAGES = 5

type UploadImagesToR2Options = {
  sourceUrl: string
  parseSourceUrl: string
  keyPrefix?: string
}

export const uploadImagesToR2 = async (imageUrls: string[], options: UploadImagesToR2Options) => {
  if (!imageUrls.length) return imageUrls
  const limitedImageUrls = imageUrls.slice(0, MAX_UPLOAD_IMAGES)
  const sourceUrl = options.sourceUrl
  const parseSourceUrl = options.parseSourceUrl
  const keyPrefix = (options.keyPrefix || 'web/uploads/cars/xiaohongshu').replace(/^\/+|\/+$/g, '')

  const bucket = getRequiredEnv('APP_CLOUDFLARE_R2_BUCKET_NAME')
  const publicPrefix = getRequiredEnv('NEXT_PUBLIC_CLOUDFLARE_R2_ASSETS_PREFIX').replace(/\/$/, '')
  const r2Client = createR2Client()

  const uploaded = await Promise.all(
    limitedImageUrls.map(async (url, index) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
            Referer: sourceUrl,
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          console.warn('Download source image failed:', response.status, url)
          return url
        }

        const contentLengthHeader = response.headers.get('content-length')
        const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null
        if (contentLength !== null && Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
          console.warn('Skip oversized source image:', contentLength, url)
          return url
        }

        if (!response.body) {
          console.warn('Download source image body is empty:', url)
          return url
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const extension = inferExtension(url, contentType)
        const hash = crypto.createHash('sha1').update(`${parseSourceUrl}`).digest('hex').slice(0, 16)
        const key = `${keyPrefix}/${hash}_${index + 1}.${extension}`

        await r2Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: Readable.fromWeb(response.body as any),
            ContentType: contentType,
            ContentLength: contentLength || undefined,
          }),
        )

        return `${publicPrefix}/${key}`
      } catch (error) {
        console.warn('Upload source image to R2 failed:', error)
        return url
      }
    }),
  )

  return uploaded
}
