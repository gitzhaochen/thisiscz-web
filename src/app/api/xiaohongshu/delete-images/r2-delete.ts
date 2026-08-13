import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3'

const getRequiredEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
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

const collectPublicPrefixKeys = (imageUrls: string[], publicPrefix: string) => {
  const normalizedPrefix = publicPrefix.replace(/\/$/, '')
  return imageUrls.flatMap((imageUrl) => {
    if (!imageUrl.startsWith(`${normalizedPrefix}/`)) return []
    const key = imageUrl.slice(normalizedPrefix.length + 1).replace(/^\/+/, '')
    return key ? [key] : []
  })
}

type DeleteImagesFromR2Options = {
  imageUrls: string[]
}

export const deleteImagesFromR2 = async (options: DeleteImagesFromR2Options) => {
  const imageUrls = options.imageUrls.filter((x) => typeof x === 'string' && x.trim().length > 0)
  if (!imageUrls.length) return []

  const bucket = getRequiredEnv('APP_CLOUDFLARE_R2_BUCKET_NAME')
  const publicPrefix = getRequiredEnv('NEXT_PUBLIC_CLOUDFLARE_R2_ASSETS_PREFIX')
  const r2Client = createR2Client()

  const keys = Array.from(new Set(collectPublicPrefixKeys(imageUrls, publicPrefix)))

  if (!keys.length) return []

  const result = await r2Client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    }),
  )

  if (result.Errors && result.Errors.length > 0) {
    throw new Error(`Delete images from R2 failed: ${result.Errors.map((item) => item.Key).join(', ')}`)
  }

  return keys
}
