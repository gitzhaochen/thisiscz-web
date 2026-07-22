import { apiFetchServer } from '@/lib/apiFetch'
import { extractImages } from '../parse/_lib/html'
import { uploadImagesToR2 } from './r2-upload'
import { NextRequest, NextResponse } from 'next/server'

type UploadImagesRequest = {
  imageUrls?: string[]
  sourceUrl?: string
  parseSourceUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await apiFetchServer('/api/users/me')
    const role = String(currentUser?.role || '').toLowerCase()
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as UploadImagesRequest
    const imageUrls = Array.isArray(body?.imageUrls) ? body.imageUrls.filter((x) => typeof x === 'string') : []
    const sourceUrl = (body?.sourceUrl || '').trim()
    const parseSourceUrl = (body?.parseSourceUrl || '').trim()
    if (!sourceUrl) {
      return NextResponse.json({ error: 'sourceUrl is required' }, { status: 400 })
    }
    if (!parseSourceUrl) {
      return NextResponse.json({ error: 'parseSourceUrl is required' }, { status: 400 })
    }

    let parsedImageUrls = imageUrls

    if (!parsedImageUrls.length) {
      return NextResponse.json({ imageUrls: [] })
    }

    const uploaded = await uploadImagesToR2(parsedImageUrls, {
      sourceUrl,
      parseSourceUrl,
      keyPrefix: 'web/uploads/cars/xiaohongshu',
    })
    return NextResponse.json({ imageUrls: uploaded })
  } catch (error) {
    console.error('Upload xiaohongshu images error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
