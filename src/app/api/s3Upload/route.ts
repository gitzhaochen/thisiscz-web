import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { apiFetchServer } from '@/lib/apiFetch'
import { NextRequest, NextResponse } from 'next/server'

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function handler(req: NextRequest) {
  try {
    // 在签名上传前校验当前用户是否为 admin
    const currentUser = await apiFetchServer('/api/users/me')
    const role = String(currentUser?.role || '').toLowerCase()
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 获取查询参数
    const searchParams = req.nextUrl.searchParams
    const filePath = searchParams.get('filePath')
    const fileType = searchParams.get('fileType')

    if (!filePath) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const accessKeyId = getRequiredEnv('APP_CLOUDFLARE_R2_ACCESS_KEY_ID')
    const secretAccessKey = getRequiredEnv('APP_CLOUDFLARE_R2_SECRET_ACCESS_KEY')
    const endpoint = getRequiredEnv('APP_CLOUDFLARE_R2_ENDPOINT')
    const bucket = getRequiredEnv('APP_CLOUDFLARE_R2_BUCKET_NAME')

    const s3Client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      region: 'auto',
      forcePathStyle: true,
    })

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      ContentType: fileType || undefined,
    })

    const putUrl = await getSignedUrl(s3Client as any, putCommand as any, { expiresIn: 60 })

    return NextResponse.json({ url: putUrl })
  } catch (error) {
    console.error('R2 upload sign error:', error)
    const message = error instanceof Error ? error.message : ''
    if (message.includes('UNAUTHORIZED') || message.includes('401')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (message.includes('Forbidden') || message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}
