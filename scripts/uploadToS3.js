const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.production' })

// 环境变量验证
const requiredVars = [
  'APP_AWS_ACCESS_KEY',
  'APP_AWS_SECRET_KEY',
  'APP_AWS_REGION',
  'NEXT_PUBLIC_AWS_S3_BUCKET_NAME_ASSETS',
]

const missingVars = requiredVars.filter((key) => !process.env[key])
if (missingVars.length > 0) {
  console.error(`错误: 缺少必需的环境变量: ${missingVars.join(', ')}`)
  process.exit(1)
}

// Content-Type 映射
const CONTENT_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
}

const getContentType = (filePath) => CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY,
    secretAccessKey: process.env.APP_AWS_SECRET_KEY,
  },
  region: process.env.APP_AWS_REGION,
})

const BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME_ASSETS

// 递归上传目录
async function uploadDir(dirPath) {
  const files = fs.readdirSync(dirPath)
  const uploads = []

  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      uploads.push(uploadDir(filePath))
    } else {
      const key = path.relative(process.cwd(), filePath).replace(/\\/g, '/').replace('.next', '_next')

      uploads.push(
        s3Client
          .send(
            new PutObjectCommand({
              Bucket: BUCKET,
              Key: key,
              Body: fs.readFileSync(filePath),
              ContentType: getContentType(filePath),
            }),
          )
          .then(() => console.log(`✓ ${filePath} -> s3://${BUCKET}/${key}`))
          .catch((err) => {
            console.error(`✗ ${filePath}:`, err.message)
            throw err
          }),
      )
    }
  }

  await Promise.all(uploads)
}

// 检查并上传目录
async function uploadIfExists(dirPath, name) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    try {
      await uploadDir(dirPath)
      console.log(`✓ ${name} 上传完成`)
    } catch (err) {
      console.error(`✗ ${name} 上传失败:`, err.message)
      throw err
    }
  } else {
    console.log(`⊘ 跳过 ${name}: 目录不存在`)
  }
}

// 主函数
async function main() {
  const dirs = [
    [path.join(process.cwd(), '.next/static'), 'assets'],
    [path.join(process.cwd(), 'public'), 'public'],
  ]

  await Promise.all(dirs.map(([dir, name]) => uploadIfExists(dir, name)))
  console.log('✓ 所有上传完成')
}

main().catch((err) => {
  console.error('上传过程出错:', err)
  process.exit(1)
})
