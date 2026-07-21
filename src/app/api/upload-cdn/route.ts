import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { apiFetchServer } from '@/lib/apiFetch'
import { NextRequest, NextResponse } from 'next/server'

const getRequiredEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const sanitizePathPart = (value: string) => value.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '')

const ensureAdmin = async () => {
  const currentUser = await apiFetchServer('/api/users/me')
  const role = String(currentUser?.role || '').toLowerCase()
  return role === 'admin'
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

export async function GET(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const fileType = searchParams.get('fileType') || undefined
    const filePathParam = searchParams.get('filePath')?.trim()
    const filePath = filePathParam ? sanitizePathPart(filePathParam) : ''

    if (!filePath) {
      return NextResponse.json({ error: 'filePath is required' }, { status: 400 })
    }

    const bucket = getRequiredEnv('APP_CLOUDFLARE_R2_BUCKET_NAME')
    const s3Client = createR2Client()
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: fileType,
    })
    const putUrl = await getSignedUrl(s3Client as any, putCommand as any, { expiresIn: 60 })

    return NextResponse.json({ url: putUrl, filePath })
  } catch (error) {
    console.error('Upload CDN sign error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
