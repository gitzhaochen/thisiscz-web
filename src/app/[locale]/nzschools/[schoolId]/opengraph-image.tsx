import { ImageResponse } from 'next/og'
import type { SchoolDetailDTO } from '@/lib/api/generated'

export const alt = 'New Zealand school profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = {
  params: Promise<{ schoolId: string }>
}

export default async function SchoolOpenGraphImage({ params }: Props) {
  const { schoolId } = await params
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  let school: SchoolDetailDTO | null = null

  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/schools/${schoolId}`, {
        next: { revalidate: 3600 },
      })
      if (response.ok) school = (await response.json()) as SchoolDetailDTO
    } catch {
      school = null
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#111827',
          color: '#f9fafb',
        }}
      >
        <div style={{ fontSize: 30, color: '#93c5fd' }}>ThisIsCZ · NZ Schools</div>
        <div style={{ marginTop: 30, fontSize: 68, fontWeight: 700 }}>{school?.name ?? 'School Profile'}</div>
        <div style={{ marginTop: 22, fontSize: 34, color: '#d1d5db' }}>
          {[school?.city, school?.levelClass, school?.authorityClass].filter(Boolean).join(' · ')}
        </div>
      </div>
    ),
    size,
  )
}
