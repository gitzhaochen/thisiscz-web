import { NextResponse } from 'next/server'
import { RecognizeError, recognizeProductFromImage } from '../_lib/recognize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('image')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'image file is required' }, { status: 400 })
    }

    const mimeType = file.type || 'image/jpeg'
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 4MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const result = await recognizeProductFromImage({ base64, mimeType })

    return NextResponse.json({
      productName: result.productName,
      brand: result.brand ?? null,
      size: result.size ?? null,
      barcode: result.barcode ?? null,
      confidence: result.confidence,
    })
  } catch (error) {
    if (error instanceof RecognizeError) {
      const status =
        error.code === 'missing_api_key'
          ? 503
          : error.code === 'invalid_image'
            ? 400
            : error.code === 'timeout'
              ? 504
              : 502
      return NextResponse.json({ error: error.code }, { status })
    }

    console.error('[price-compare/recognize]', error)
    return NextResponse.json({ error: 'Recognition failed' }, { status: 500 })
  }
}
