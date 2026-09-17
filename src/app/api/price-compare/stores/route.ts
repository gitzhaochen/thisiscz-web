import { NextResponse } from 'next/server'
import { listPaknSaveStores } from '../_lib/paknsave'
import { listWoolworthsStores } from '../_lib/woolworths'
import type { StoreDTO } from '../_lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ORIGIN = { latitude: -36.8485, longitude: 174.7633 }

function parseCoord(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) return fallback
  return n
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const city = (searchParams.get('city') || '').trim().toLowerCase()
  const region = (searchParams.get('region') || '').trim().toLowerCase()
  const latitude = parseCoord(searchParams.get('lat') ?? searchParams.get('latitude'), DEFAULT_ORIGIN.latitude, -90, 90)
  const longitude = parseCoord(
    searchParams.get('lng') ?? searchParams.get('longitude'),
    DEFAULT_ORIGIN.longitude,
    -180,
    180,
  )

  try {
    const [paknsave, woolworths] = await Promise.all([
      listPaknSaveStores(),
      listWoolworthsStores({ latitude, longitude }),
    ])

    const filterStore = (store: StoreDTO) => {
      if (!city && !region) return true
      const haystack = `${store.city} ${store.region} ${store.address} ${store.name}`.toLowerCase()
      if (city && !haystack.includes(city)) return false
      if (region && !haystack.includes(region)) return false
      return true
    }

    const stores = [...paknsave, ...woolworths].filter(filterStore).sort((a, b) => {
      if (a.chain !== b.chain) return a.chain === 'paknsave' ? -1 : 1
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY
      if (da !== db) return da - db
      return a.shortName.localeCompare(b.shortName)
    })

    return NextResponse.json({
      stores,
      meta: {
        paknsaveCount: stores.filter((s) => s.chain === 'paknsave').length,
        woolworthsCount: stores.filter((s) => s.chain === 'woolworths').length,
        origin: { latitude, longitude },
      },
    })
  } catch (error) {
    console.error('[price-compare/stores]', error)
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 502 })
  }
}
