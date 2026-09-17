import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listPaknSaveStores, searchPaknSaveProduct } from '../_lib/paknsave'
import { listWoolworthsStores, searchWoolworthsProduct } from '../_lib/woolworths'
import type { ComparedProductDTO, PriceResultDTO, StoreDTO } from '../_lib/types'
import { haversineKm, mapPool } from '../_lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  query: z.string().trim().min(1).max(160),
  storeIds: z.array(z.string().min(1).max(80)).min(1).max(10),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  inStockOnly: z.boolean().optional(),
})

const DEFAULT_ORIGIN = { latitude: -36.8485, longitude: 174.7633 }

function withDistance(store: StoreDTO, originLat: number, originLng: number): number | null {
  if (store.latitude == null || store.longitude == null) return null
  return Math.round(haversineKm(originLat, originLng, store.latitude, store.longitude) * 10) / 10
}

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { query, storeIds, inStockOnly = false } = parsed.data
  const originLat = parsed.data.latitude ?? DEFAULT_ORIGIN.latitude
  const originLng = parsed.data.longitude ?? DEFAULT_ORIGIN.longitude

  try {
    const [paknsaveStores, woolworthsStores] = await Promise.all([
      listPaknSaveStores(),
      Promise.resolve(listWoolworthsStores()),
    ])
    const storeMap = new Map<string, StoreDTO>([...paknsaveStores, ...woolworthsStores].map((s) => [s.id, s]))

    const selected = storeIds.map((id) => storeMap.get(id)).filter((s): s is StoreDTO => Boolean(s))
    if (selected.length === 0) {
      return NextResponse.json({ error: 'No valid stores selected' }, { status: 400 })
    }

    const pnsSelected = selected.filter((s) => s.chain === 'paknsave')
    const wwSelected = selected.filter((s) => s.chain === 'woolworths')

    let wwProduct = null as Awaited<ReturnType<typeof searchWoolworthsProduct>>
    let wwError: string | null = null
    if (wwSelected.length > 0) {
      try {
        wwProduct = await searchWoolworthsProduct(query)
      } catch (error) {
        wwError = error instanceof Error ? error.message : 'Woolworths search failed'
      }
    }

    const pnsResults = await mapPool(pnsSelected, 4, async (store): Promise<PriceResultDTO> => {
      try {
        const product = await searchPaknSaveProduct(store.id, query)
        return {
          storeId: store.id,
          chain: store.chain,
          storeName: store.name,
          shortName: store.shortName,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          distanceKm: withDistance(store, originLat, originLng),
          product,
          error: product ? null : 'No matching product',
          priceScope: 'store',
        }
      } catch (error) {
        return {
          storeId: store.id,
          chain: store.chain,
          storeName: store.name,
          shortName: store.shortName,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          distanceKm: withDistance(store, originLat, originLng),
          product: null,
          error: error instanceof Error ? error.message : 'Search failed',
          priceScope: 'store',
        }
      }
    })

    const wwResults: PriceResultDTO[] = wwSelected.map((store) => ({
      storeId: store.id,
      chain: store.chain,
      storeName: store.name,
      shortName: store.shortName,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      distanceKm: withDistance(store, originLat, originLng),
      product: wwProduct,
      error: wwError || (wwProduct ? null : 'No matching product'),
      priceScope: 'catalogue',
    }))

    let results = [...pnsResults, ...wwResults]
    if (inStockOnly) {
      results = results.filter((r) => r.product?.inStock)
    }

    results.sort((a, b) => {
      const pa = a.product?.price ?? Number.POSITIVE_INFINITY
      const pb = b.product?.price ?? Number.POSITIVE_INFINITY
      if (pa !== pb) return pa - pb
      return (a.distanceKm ?? 999) - (b.distanceKm ?? 999)
    })

    const bestProduct =
      results.find((r) => r.product)?.product || wwProduct || pnsResults.find((r) => r.product)?.product || null

    const comparedProduct: ComparedProductDTO | null = bestProduct
      ? {
          name: bestProduct.name,
          brand: bestProduct.brand,
          size: bestProduct.size,
          imageUrl: bestProduct.imageUrl,
          barcode: bestProduct.barcode,
        }
      : { name: query, brand: null, size: null, imageUrl: null, barcode: null }

    return NextResponse.json({
      query,
      comparedProduct,
      results,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[price-compare/search]', error)
    return NextResponse.json({ error: 'Price comparison failed' }, { status: 502 })
  }
}
