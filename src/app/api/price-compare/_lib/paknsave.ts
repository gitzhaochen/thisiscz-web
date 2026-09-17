import type { ProductHit, StoreDTO } from './types'

const MOBILE_BASE = 'https://api-prod.prod.fsniwaikato.kiwi/prod'
const WEB_GUEST_URL = 'https://www.paknsave.co.nz/api/user/get-current-user'
const EDGE_STORE_URL = 'https://api-prod.paknsave.co.nz/v1/edge/store'
const APP_UA = 'PAKnSAVEApp/4.32.0 (App Version)'
const WEB_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

type TokenCache = {
  accessToken: string
  expiresAt: number
}

let mobileTokenCache: TokenCache | null = null
let webTokenCache: TokenCache | null = null

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PaknSave upstream ${res.status}: ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

export async function getPaknSaveMobileToken(): Promise<string> {
  if (mobileTokenCache && mobileTokenCache.expiresAt > Date.now() + 60_000) {
    return mobileTokenCache.accessToken
  }

  const res = await fetch(`${MOBILE_BASE}/mobile/user/login/guest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': APP_UA,
    },
    body: JSON.stringify({ banner: 'PNS' }),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  const data = await readJson<{ access_token: string; expires_in?: number }>(res)
  mobileTokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 1800) * 1000,
  }
  return mobileTokenCache.accessToken
}

async function getPaknSaveWebToken(): Promise<string> {
  if (webTokenCache && webTokenCache.expiresAt > Date.now() + 60_000) {
    return webTokenCache.accessToken
  }

  const res = await fetch(WEB_GUEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': WEB_UA,
      Origin: 'https://www.paknsave.co.nz',
      Referer: 'https://www.paknsave.co.nz/',
    },
    body: '{}',
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })

  const data = await readJson<{ access_token: string; expires_time?: number; current_time?: number }>(res)
  const ttlMs =
    typeof data.expires_time === 'number' && typeof data.current_time === 'number'
      ? Math.max(60_000, (data.expires_time - data.current_time) * 1000)
      : 25 * 60_000

  webTokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + ttlMs,
  }
  return webTokenCache.accessToken
}

type RawStore = {
  id: string
  name: string
  address?: string
  latitude?: number
  longitude?: number
  onlineActive?: boolean
  physicalAddress?: {
    cityName?: string
    additionalCityName?: string
    regionName?: string
  }
}

function shortStoreName(name: string) {
  return name
    .replace(/^PAK'?nSAVE\s+/i, '')
    .replace(/^PAKnSAVE\s+/i, '')
    .trim()
}

function mapStore(raw: RawStore): StoreDTO {
  const city = raw.physicalAddress?.cityName || raw.physicalAddress?.additionalCityName || ''
  const region = raw.physicalAddress?.regionName || ''
  return {
    id: `pns:${raw.id}`,
    chain: 'paknsave',
    name: raw.name,
    shortName: shortStoreName(raw.name),
    address: raw.address || '',
    city,
    region,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
    onlineActive: raw.onlineActive !== false,
  }
}

export async function listPaknSaveStores(): Promise<StoreDTO[]> {
  try {
    const token = await getPaknSaveWebToken()
    const res = await fetch(EDGE_STORE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': WEB_UA,
        Origin: 'https://www.paknsave.co.nz',
        Referer: 'https://www.paknsave.co.nz/',
      },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
    const data = await readJson<{ stores: RawStore[] }>(res)
    return (data.stores || []).map(mapStore)
  } catch {
    const token = await getPaknSaveMobileToken()
    const res = await fetch(`${MOBILE_BASE}/mobile/store/physical`, {
      headers: {
        Authorization: `Bearer ${token}`,
        access_token: token,
        Accept: 'application/json',
        'User-Agent': APP_UA,
      },
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
    const data = await readJson<{ stores: RawStore[] } | RawStore[]>(res)
    const stores = Array.isArray(data) ? data : data.stores || []
    return stores.map(mapStore)
  }
}

type RawProduct = {
  productId: string
  brand?: string
  name?: string
  units?: string
  price?: number
  unitPrice?: string
  availableInStore?: boolean
  availableInOnline?: boolean
  productImageUrls?: Record<string, string>
}

function mapProduct(raw: RawProduct): ProductHit {
  const cents = typeof raw.price === 'number' ? raw.price : 0
  return {
    productId: raw.productId,
    name: [raw.brand, raw.name].filter(Boolean).join(' ').trim() || raw.name || 'Unknown',
    brand: raw.brand || null,
    size: raw.units || null,
    imageUrl: raw.productImageUrls?.['200'] || raw.productImageUrls?.['400'] || null,
    barcode: null,
    price: cents / 100,
    unitPriceLabel: raw.unitPrice || null,
    clubPrice: null,
    inStock: raw.availableInStore !== false && raw.availableInOnline !== false,
    productUrl: `https://www.paknsave.co.nz/shop/product/${encodeURIComponent(raw.productId)}`,
  }
}

export function unwrapPaknSaveStoreId(storeId: string) {
  return storeId.startsWith('pns:') ? storeId.slice(4) : storeId
}

export async function searchPaknSaveProduct(storeId: string, query: string): Promise<ProductHit | null> {
  const token = await getPaknSaveMobileToken()
  const id = unwrapPaknSaveStoreId(storeId)
  const url = `${MOBILE_BASE}/mobile/ecomm-products/PNS/${id}/search?q=${encodeURIComponent(query)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      access_token: token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': APP_UA,
    },
    body: '[]',
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  })

  const data = await readJson<{ products?: RawProduct[] }>(res)
  const first = data.products?.[0]
  return first ? mapProduct(first) : null
}
