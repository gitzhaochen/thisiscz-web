import { apiFetchServer } from '@/lib/apiFetch'
import { deleteImagesFromR2 } from './r2-delete'
import { NextRequest, NextResponse } from 'next/server'

type DeleteImagesRequest = {
  imageUrls?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await apiFetchServer('/api/users/me')
    const role = String(currentUser?.role || '').toLowerCase()
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as DeleteImagesRequest
    const imageUrls = Array.isArray(body?.imageUrls) ? body.imageUrls.filter((x) => typeof x === 'string') : []
    if (!imageUrls.length) {
      return NextResponse.json({ deletedKeys: [] })
    }

    const deletedKeys = await deleteImagesFromR2({
      imageUrls,
    })
    return NextResponse.json({ deletedKeys })
  } catch (error) {
    console.error('Delete xiaohongshu images error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
