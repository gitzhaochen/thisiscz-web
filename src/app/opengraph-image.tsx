import { ImageResponse } from 'next/og'

export const alt = 'ThisIsCZ – New Zealand schools and practical guides'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
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
        <div style={{ fontSize: 34, color: '#93c5fd' }}>ThisIsCZ</div>
        <div style={{ marginTop: 28, fontSize: 72, fontWeight: 700 }}>New Zealand Schools</div>
        <div style={{ marginTop: 20, fontSize: 32, color: '#d1d5db' }}>
          School profiles, EQI, enrolment and university entrance data
        </div>
      </div>
    ),
    size,
  )
}
