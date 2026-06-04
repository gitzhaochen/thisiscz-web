import { S3Client } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { NextRequest, NextResponse } from 'next/server'

async function handler(req: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = req.nextUrl.searchParams
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const s3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY!,
        secretAccessKey: process.env.APP_AWS_SECRET_KEY!,
      },
      region: process.env.APP_AWS_REGION,
    })

    const post = await createPresignedPost(s3Client, {
      Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME_ASSETS!,
      Key: filePath,
      Expires: 60, // seconds
      Conditions: [
        ['content-length-range', 0, 5048576], // up to 1 MB
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
