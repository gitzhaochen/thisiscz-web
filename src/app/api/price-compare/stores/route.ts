import { NextResponse } from 'next/server'
import { listPaknSaveStores } from '../_lib/paknsave'
import { listWoolworthsStores } from '../_lib/woolworths'
import type { StoreDTO } from '../_lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const city = (searchParams.get('city') || '').trim().toLowerCase()
  const region = (searchParams.get('region') || '').trim().toLowerCase()

  try {
    const [paknsave, woolworths] = await Promise.all([listPaknSaveStores(), Promise.resolve(listWoolworthsStores())])

    const filterStore = (store: StoreDTO) => {
      if (!city && !region) return true
      const haystack = `${store.city} ${store.region} ${store.address} ${store.name}`.toLowerCase()
      if (city && !haystack.includes(city)) return false
      if (region && !haystack.includes(region)) return false
      return true
    }

    const stores = [...paknsave, ...woolworths].filter(filterStore).sort((a, b) => {
      if (a.chain !== b.chain) return a.chain === 'paknsave' ? -1 : 1
      return a.shortName.localeCompare(b.shortName)
    })

    return NextResponse.json({
      stores,
      meta: {
        paknsaveCount: stores.filter((s) => s.chain === 'paknsave').length,
        woolworthsCount: stores.filter((s) => s.chain === 'woolworths').length,
      },
    })
  } catch (error) {
    console.error('[price-compare/stores]', error)
    return NextResponse.json({ error: 'Failed to load stores' }, { status: 502 })
  }
}
