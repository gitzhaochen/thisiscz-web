import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}
