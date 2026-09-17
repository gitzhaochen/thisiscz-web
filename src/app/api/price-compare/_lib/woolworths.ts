import type { ProductHit, StoreDTO } from './types'

const WW_BASE = 'https://www.woolworths.co.nz'
const WW_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'

const DEFAULT_ORIGIN = { latitude: -36.8485, longitude: 174.7633 }

const PRODUCT_SEARCH_QUERY = `
query ProductSearch($searchInput: CompositeSearchInput!) {
  My {
    products(searchInput: $searchInput) {
      results {
        __typename
        ... on ProductSummary {
          sku
          productName
          slug
          imageUrl
          brand
          storeKey
          variants {
            variantKey
            name
            availabilityStatus
            purchaseUnit { unit }
            variantPrice {
              isSpecial
              isClubPrice
              sellingPrice
              wasPrice
              cupPrice
              cupUnit
            }
          }
        }
        ... on SponsoredProduct {
          sku
          productName
          slug
          imageUrl
          brand
          variants {
            variantKey
            name
            availabilityStatus
            purchaseUnit { unit }
            variantPrice {
              isSpecial
              isClubPrice
              sellingPrice
              wasPrice
              cupPrice
              cupUnit
            }
          }
        }
      }
      totalCount
    }
  }
}
`.trim()

const PRODUCT_DETAIL_VARIANT = `
  key
  sku
  volumeSize
  availabilityStatus
  variantPrice { sellingPrice wasPrice cupPrice cupUnit isSpecial isClubPrice }
  assets { url }
`

const PRODUCT_DETAIL_QUERY = `
query ProductDetail($keys: [ID!]!, $storeKey: String!) {
  products(keys: $keys, storeKey: $storeKey) {
    key
    brand
    name
    slug
    variants {
      __typename
      ... on GroceryVariant {${PRODUCT_DETAIL_VARIANT} barcode }
      ... on RegulatedVariant {${PRODUCT_DETAIL_VARIANT} barcode }
      ... on GeneralMerchandiseVariant {${PRODUCT_DETAIL_VARIANT} barcode }
      ... on NonMerchandiseVariant {${PRODUCT_DETAIL_VARIANT} barcode }
      ... on MonetaryVariant {${PRODUCT_DETAIL_VARIANT} }
    }
  }
}
`.trim()

const SEARCH_LOCATIONS_QUERY = `
query SearchLocations($input: LocationsInput!) {
  locations(input: $input) {
    locations {
      id
      name
      storeId
      description
      distance
      address {
        locality { suburb city state postcode country }
        lines { line1 line2 line3 line4 line5 }
      }
      store { storeId name }
    }
  }
}
`.trim()

/** Fallback when the live locations API is blocked; ids are not real storeKeys. */
export const WOOLWORTHS_AUCKLAND_STORES: StoreDTO[] = [
  {
    id: 'ww:takapuna',
    chain: 'woolworths',
    name: 'Woolworths Takapuna',
    shortName: 'Takapuna',
    address: 'Cnr Anzac St & Northcroft St, Takapuna, Auckland',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.7875,
    longitude: 174.7702,
    onlineActive: true,
  },
  {
    id: 'ww:queen-st',
    chain: 'woolworths',
    name: 'Woolworths Metro Queen St',
    shortName: 'Queen St',
    address: 'Quay Street / Queen Street, Auckland CBD',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.8465,
    longitude: 174.7655,
    onlineActive: true,
  },
  {
    id: 'ww:newmarket',
    chain: 'woolworths',
    name: 'Woolworths Newmarket',
    shortName: 'Newmarket',
    address: '277 Broadway, Newmarket, Auckland',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.8698,
    longitude: 174.7766,
    onlineActive: true,
  },
  {
    id: 'ww:albany',
    chain: 'woolworths',
    name: 'Woolworths Albany',
    shortName: 'Albany',
    address: 'Corner Don McKinnon Drive & Corp Drive, Albany',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.7312,
    longitude: 174.7081,
    onlineActive: true,
  },
  {
    id: 'ww:sylvia-park',
    chain: 'woolworths',
    name: 'Woolworths Sylvia Park',
    shortName: 'Sylvia Park',
    address: '286 Mt Wellington Highway, Mt Wellington',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.9138,
    longitude: 174.8412,
    onlineActive: true,
  },
  {
    id: 'ww:ponsonby',
    chain: 'woolworths',
    name: 'Woolworths Ponsonby',
    shortName: 'Ponsonby',
    address: '113 Ponsonby Road, Auckland',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.8572,
    longitude: 174.7455,
    onlineActive: true,
  },
  {
    id: 'ww:st-lukes',
    chain: 'woolworths',
    name: 'Woolworths St Lukes',
    shortName: 'St Lukes',
    address: '80 St Lukes Road, Mount Albert',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.8832,
    longitude: 174.7328,
    onlineActive: true,
  },
  {
    id: 'ww:botany',
    chain: 'woolworths',
    name: 'Woolworths Botany',
    shortName: 'Botany',
    address: '588 Chapel Road, East Tamaki',
    city: 'Auckland',
    region: 'Auckland',
    latitude: -36.9325,
    longitude: 174.9122,
    onlineActive: true,
  },
]

type CookieCache = {
  cookie: string
  expiresAt: number
}

type NearbyCache = {
  key: string
  stores: StoreDTO[]
  expiresAt: number
}

let cookieCache: CookieCache | null = null
let nearbyCache: NearbyCache | null = null
let proxyAgent: unknown | null | undefined

function envWoolworthsCookie() {
  return (process.env.WOOLWORTHS_COOKIE || '').trim()
}

function guestTokenFromCookie(cookie: string) {
  const match = cookie.match(/(?:^|;\s*)__guest__token=([^;]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function envWoolworthsProxy() {
  // Only honor an explicit Woolworths proxy. Do not inherit shell HTTPS_PROXY —
  // Cursor/sandbox proxies often break undici with "Unsupported URL scheme".
  return (process.env.WOOLWORTHS_PROXY || '').trim()
}

async function getFetchDispatcher() {
  const proxyUrl = envWoolworthsProxy()
  if (!proxyUrl) return undefined
  if (proxyAgent === null) return undefined
  if (proxyAgent) return proxyAgent
  try {
    const moduleName = 'undici'
    const undici = (await import(moduleName)) as {
      ProxyAgent: new (url: string) => unknown
    }
    proxyAgent = new undici.ProxyAgent(proxyUrl)
    return proxyAgent
  } catch (error) {
    console.error('[woolworths] failed to init proxy agent', error)
    proxyAgent = null
    return undefined
  }
}

async function wwFetch(url: string, init: RequestInit = {}) {
  const dispatcher = await getFetchDispatcher()
  return fetch(url, {
    ...init,
    ...(dispatcher ? ({ dispatcher } as RequestInit) : {}),
  })
}

function browserHeaders(cookie?: string, extra?: Record<string, string>) {
  const guestToken = cookie ? guestTokenFromCookie(cookie) : null
  return {
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'User-Agent': WW_UA,
    'x-requested-with': 'OnlineShopping.WebApp',
    'x-ui-ver': '7.21.1',
    Origin: WW_BASE,
    Referer: `${WW_BASE}/shop/search/products`,
    ...(cookie ? { Cookie: cookie } : {}),
    ...(guestToken ? { Authorization: `Bearer ${guestToken}` } : {}),
    ...extra,
  }
}

function collectSetCookie(res: Response) {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }
  const single = res.headers.get('set-cookie')
  return single ? [single] : []
}

function mergeCookieJar(existing: string, setCookies: string[]) {
  const jar = new Map<string, string>()
  for (const part of existing.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1))
  }
  for (const raw of setCookies) {
    const first = raw.split(';')[0]?.trim()
    if (!first) continue
    const eq = first.indexOf('=')
    if (eq <= 0) continue
    jar.set(first.slice(0, eq), first.slice(eq + 1))
  }
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

async function bootstrapWoolworthsSession(): Promise<string> {
  const configured = envWoolworthsCookie()
  if (configured) {
    cookieCache = {
      cookie: configured,
      expiresAt: Date.now() + 6 * 60 * 60_000,
    }
    return configured
  }

  if (cookieCache && cookieCache.expiresAt > Date.now() + 60_000) {
    return cookieCache.cookie
  }

  const res = await wwFetch(`${WW_BASE}/`, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': WW_UA,
      'Accept-Language': 'en-NZ,en;q=0.9',
    },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
    redirect: 'follow',
  })

  const cookie = mergeCookieJar('', collectSetCookie(res))
  cookieCache = {
    cookie,
    expiresAt: Date.now() + 20 * 60_000,
  }
  return cookie
}

async function ensureCookie() {
  return bootstrapWoolworthsSession()
}

function rememberCookie(cookie: string, res: Response) {
  if (envWoolworthsCookie()) return
  cookieCache = {
    cookie: mergeCookieJar(cookie, collectSetCookie(res)),
    expiresAt: Date.now() + 20 * 60_000,
  }
}

type GqlVariant = {
  variantKey?: string
  key?: string
  sku?: string
  name?: string
  volumeSize?: string
  availabilityStatus?: string
  barcode?: string | null
  assets?: Array<{ url?: string | null }>
  variantPrice?: {
    isClubPrice?: boolean
    sellingPrice?: number
    wasPrice?: number
    cupPrice?: number
    cupUnit?: string
  }
}

type GqlSearchProduct = {
  __typename?: string
  sku?: string
  productName?: string
  slug?: string
  imageUrl?: string
  brand?: string
  storeKey?: string
  variants?: GqlVariant[]
}

type GqlDetailProduct = {
  key?: string
  brand?: string
  name?: string
  slug?: string
  variants?: GqlVariant[]
}

type WwLocation = {
  id?: string
  name?: string
  storeId?: string | null
  description?: string | null
  distance?: number | null
  address?: {
    locality?: {
      suburb?: string | null
      city?: string | null
      state?: string | null
      postcode?: string | null
    }
    lines?: Record<string, string | null | undefined>
  }
  store?: { storeId?: string; name?: string } | null
}

function shortStoreName(name: string) {
  return name
    .replace(/^Woolworths\s+/i, '')
    .replace(/\s+Woolworths$/i, '')
    .replace(/^Countdown\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function addressLines(lines?: Record<string, string | null | undefined>) {
  if (!lines) return []
  return ['line1', 'line2', 'line3', 'line4', 'line5']
    .map((key) => lines[key]?.trim())
    .filter((line): line is string => Boolean(line))
}

function mapLocation(raw: WwLocation): StoreDTO | null {
  const storeKey = (raw.store?.storeId || raw.storeId || '').trim()
  if (!storeKey) return null
  const name = (raw.store?.name || raw.name || '').trim()
  if (!name) return null
  const lines = addressLines(raw.address?.lines)
  const suburb = raw.address?.locality?.suburb?.trim() || ''
  const city = raw.address?.locality?.city?.trim() || suburb || 'New Zealand'
  const region = raw.address?.locality?.state?.trim() || city
  const distance =
    typeof raw.distance === 'number' && Number.isFinite(raw.distance)
      ? Math.round(raw.distance * 10) / 10
      : null

  return {
    id: `ww:${storeKey}`,
    chain: 'woolworths',
    name,
    shortName: shortStoreName(name),
    address: lines.join(', ') || suburb || name,
    city,
    region,
    latitude: null,
    longitude: null,
    distanceKm: distance,
    onlineActive: true,
  }
}

/** Extract catalogue storeKey from `ww:9171` ids. Slug fallbacks (static list) return null. */
export function unwrapWoolworthsStoreKey(storeId: string): string | null {
  const raw = storeId.startsWith('ww:') ? storeId.slice(3) : storeId
  return /^\d+$/.test(raw) ? raw : null
}

async function graphql<T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
  cookie: string,
): Promise<{ data: T; cookie: string }> {
  const res = await wwFetch(`${WW_BASE}/api/graphql?op-name=${encodeURIComponent(operationName)}`, {
    method: 'POST',
    headers: browserHeaders(cookie, {
      'Content-Type': 'application/json',
      'WNZX-Operation-Name': operationName,
    }),
    body: JSON.stringify({ operationName, query, variables }),
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Woolworths ${operationName} ${res.status}: ${text.slice(0, 160)}`)
  }

  rememberCookie(cookie, res)

  const payload = (await res.json()) as {
    errors?: Array<{ message?: string }>
    data?: T
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).filter(Boolean).join('; ') || `${operationName} error`)
  }
  if (!payload.data) {
    throw new Error(`${operationName} returned empty data`)
  }

  return { data: payload.data, cookie: cookieCache?.cookie || cookie }
}

function normalizeAvailability(status?: string | null) {
  return (status || '').toLowerCase().replace(/[_\s-]+/g, '')
}

/** Woolworths uses enums like InStock / OutOfStock / Available — not "in stock". */
function isWoolworthsInStock(status?: string | null) {
  const s = normalizeAvailability(status)
  if (!s) return true
  if (
    s.includes('outofstock') ||
    s.includes('unavailable') ||
    s.includes('notavailable') ||
    s.includes('notforsale')
  ) {
    return false
  }
  if (s.includes('instock') || s.includes('available') || s.includes('lowstock')) return true
  // Unknown status but priced: treat as ranged/in-stock rather than hide results.
  return true
}

function catalogueSku(sku?: string | null, fallback?: string | null) {
  const raw = String(sku || fallback || '').trim()
  if (!raw) return ''
  // ProductDetail often returns variant keys like "6064244-EA"; catalogue urls use the base sku.
  return raw.replace(/-(EA|KG|PK)$/i, '')
}

function mapSearchProduct(raw: GqlSearchProduct): ProductHit | null {
  const variant = raw.variants?.[0]
  const price = variant?.variantPrice
  const sale = price?.sellingPrice ?? price?.wasPrice
  if (typeof sale !== 'number') return null

  const cupPrice = price?.cupPrice
  const cupUnit = price?.cupUnit
  const unitPriceLabel =
    typeof cupPrice === 'number' && cupUnit ? `$${cupPrice.toFixed(2)}/${cupUnit}` : null
  const sku = catalogueSku(raw.sku, variant?.variantKey)

  return {
    productId: sku,
    name:
      [raw.brand, raw.productName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() ||
      raw.productName ||
      'Unknown',
    brand: raw.brand || null,
    size: variant?.name || null,
    imageUrl: raw.imageUrl || null,
    barcode: null,
    price: sale,
    unitPriceLabel,
    clubPrice: price?.isClubPrice ? sale : null,
    inStock: isWoolworthsInStock(variant?.availabilityStatus),
    productUrl: sku
      ? `${WW_BASE}/shop/product-details/${encodeURIComponent(sku)}${raw.slug ? `/${encodeURIComponent(raw.slug)}` : ''}`
      : null,
  }
}

function mapDetailProduct(raw: GqlDetailProduct, fallback?: ProductHit | null): ProductHit | null {
  const variant = raw.variants?.[0]
  const price = variant?.variantPrice
  const sale = price?.sellingPrice ?? price?.wasPrice
  if (typeof sale !== 'number') return null

  const cupPrice = price?.cupPrice
  const cupUnit = price?.cupUnit
  const unitPriceLabel =
    typeof cupPrice === 'number' && cupUnit ? `$${cupPrice.toFixed(2)}/${cupUnit}` : null
  const sku = catalogueSku(variant?.sku || raw.key, fallback?.productId)
  const imageUrl = variant?.assets?.[0]?.url || fallback?.imageUrl || null

  return {
    productId: sku,
    name:
      [raw.brand, raw.name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() ||
      raw.name ||
      fallback?.name ||
      'Unknown',
    brand: raw.brand || fallback?.brand || null,
    size: variant?.volumeSize || fallback?.size || null,
    imageUrl,
    barcode: variant?.barcode || fallback?.barcode || null,
    price: sale,
    unitPriceLabel,
    clubPrice: price?.isClubPrice ? sale : null,
    inStock: isWoolworthsInStock(variant?.availabilityStatus),
    productUrl: sku
      ? `${WW_BASE}/shop/product-details/${encodeURIComponent(sku)}${raw.slug ? `/${encodeURIComponent(raw.slug)}` : ''}`
      : fallback?.productUrl || null,
  }
}

async function searchCatalogue(query: string, cookie: string): Promise<{ hit: ProductHit | null; storeKey: string | null }> {
  const { data } = await graphql<{
    My?: { products?: { results?: GqlSearchProduct[] } }
  }>('ProductSearch', PRODUCT_SEARCH_QUERY, {
    searchInput: {
      byKeyword: {
        value: query,
        pageIndex: 0,
        pageSize: 8,
        facetFilters: [],
        staticFilters: [],
        sortBy: 'RELEVANCE',
      },
    },
  }, cookie)

  const results = data.My?.products?.results || []
  for (const item of results) {
    if (item.__typename && !['ProductSummary', 'SponsoredProduct'].includes(item.__typename)) continue
    const hit = mapSearchProduct(item)
    if (hit?.productId) {
      return { hit, storeKey: item.storeKey || null }
    }
  }
  return { hit: null, storeKey: null }
}

async function fetchProductAtStore(
  sku: string,
  storeKey: string,
  cookie: string,
  fallback?: ProductHit | null,
): Promise<ProductHit | null> {
  const { data } = await graphql<{ products?: GqlDetailProduct[] }>(
    'ProductDetail',
    PRODUCT_DETAIL_QUERY,
    { keys: [sku], storeKey },
    cookie,
  )

  const product = data.products?.[0]
  if (!product) return null
  return mapDetailProduct(product, fallback)
}

async function fetchNearbyStores(latitude: number, longitude: number, cookie: string): Promise<StoreDTO[]> {
  const { data } = await graphql<{
    locations?: { locations?: WwLocation[] }
  }>('SearchLocations', SEARCH_LOCATIONS_QUERY, {
    input: {
      search: '',
      allStores: false,
      filter: {
        sortingMethod: 'DISTANCE',
        sortingOrder: 'ASCENDING',
        max: 40,
      },
      geolocation: { latitude, longitude },
    },
  }, cookie)

  const seen = new Set<string>()
  const stores: StoreDTO[] = []
  for (const raw of data.locations?.locations || []) {
    const mapped = mapLocation(raw)
    if (!mapped || seen.has(mapped.id)) continue
    seen.add(mapped.id)
    stores.push(mapped)
  }
  return stores
}

export async function listWoolworthsStores(opts?: {
  latitude?: number
  longitude?: number
}): Promise<StoreDTO[]> {
  const latitude = opts?.latitude ?? DEFAULT_ORIGIN.latitude
  const longitude = opts?.longitude ?? DEFAULT_ORIGIN.longitude
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`

  if (nearbyCache && nearbyCache.key === cacheKey && nearbyCache.expiresAt > Date.now()) {
    return nearbyCache.stores
  }

  try {
    const cookie = await ensureCookie()
    const stores = await fetchNearbyStores(latitude, longitude, cookie)
    if (stores.length > 0) {
      nearbyCache = {
        key: cacheKey,
        stores,
        expiresAt: Date.now() + 10 * 60_000,
      }
      return stores
    }
  } catch (error) {
    console.error('[woolworths] nearby stores failed', error)
  }

  return WOOLWORTHS_AUCKLAND_STORES
}

/**
 * Resolve a catalogue match once, then price it at a specific store via ProductDetail(storeKey).
 * Falls back to catalogue price when the store id is not a real storeKey.
 */
export async function searchWoolworthsProduct(storeId: string, query: string): Promise<ProductHit | null> {
  const matched = await resolveWoolworthsMatch(query)
  if (!matched) return null
  return priceWoolworthsAtStore(storeId, matched)
}

export type WoolworthsMatch = {
  hit: ProductHit
  sessionStoreKey: string | null
  cookie: string
}

export async function resolveWoolworthsMatch(query: string): Promise<WoolworthsMatch | null> {
  const cookie = await ensureCookie()
  const { hit, storeKey } = await searchCatalogue(query, cookie)
  if (!hit?.productId) return null
  return { hit, sessionStoreKey: storeKey, cookie: cookieCache?.cookie || cookie }
}

export async function priceWoolworthsAtStore(
  storeId: string,
  matched: WoolworthsMatch,
): Promise<ProductHit | null> {
  const storeKey = unwrapWoolworthsStoreKey(storeId) || matched.sessionStoreKey
  if (!storeKey) return matched.hit

  try {
    return (
      (await fetchProductAtStore(matched.hit.productId, storeKey, matched.cookie, matched.hit)) ||
      matched.hit
    )
  } catch (error) {
    console.error('[woolworths] ProductDetail failed', storeKey, error)
    return matched.hit
  }
}
