import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type GeocodeComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GeocodeResult = {
  formatted_address?: string
  address_components?: GeocodeComponent[]
}

function pickComponent(components: GeocodeComponent[], types: string[]) {
  for (const type of types) {
    const hit = components.find((c) => c.types.includes(type))
    if (hit?.long_name) return hit.long_name
  }
  return null
}

function shortLabel(result: GeocodeResult) {
  const components = result.address_components || []
  const suburb = pickComponent(components, [
    'sublocality',
    'sublocality_level_1',
    'neighborhood',
    'suburb',
  ])
  const locality = pickComponent(components, ['locality', 'postal_town'])
  const area = pickComponent(components, ['administrative_area_level_1'])

  if (suburb && locality && suburb !== locality) return `${suburb}, ${locality}`
  if (suburb) return suburb
  if (locality) return locality
  if (area) return area

  const formatted = result.formatted_address?.trim()
  if (!formatted) return null
  return formatted.split(',').slice(0, 2).join(',').trim()
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      label: null,
      latitude: lat,
      longitude: lng,
    })
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('latlng', `${lat},${lng}`)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('language', 'en')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ label: null, latitude: lat, longitude: lng }, { status: 502 })
    }

    const data = (await res.json()) as {
      status?: string
      results?: GeocodeResult[]
    }

    const label =
      data.status === 'OK' && data.results?.length ? shortLabel(data.results[0]) : null

    return NextResponse.json({
      label,
      latitude: lat,
      longitude: lng,
    })
  } catch (error) {
    console.error('[price-compare/location]', error)
    return NextResponse.json({ label: null, latitude: lat, longitude: lng }, { status: 502 })
  }
}
