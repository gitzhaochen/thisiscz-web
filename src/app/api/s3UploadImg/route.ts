import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
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
    })

    const post = await createPresignedPost(s3Client, {
      Bucket: bucket,
      Key: filePath,
      Expires: 60, // seconds
      Conditions: [
        ['content-length-range', 0, 5048576], // up to 5 MB
      ],
    })

    return NextResponse.json(post)
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handler(request)
}
