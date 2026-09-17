import type { ProductHit, StoreDTO } from './types'

const WW_BASE = 'https://www.woolworths.co.nz'
const WW_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'

const PRODUCT_SEARCH_QUERY = `
query ProductSearch($searchInput: CompositeSearchInput!) {
  My {
    products(searchInput: $searchInput) {
      results {
        ... on ProductSummary {
          __typename
          sku
          productName
          slug
          imageUrl
          brand
          variants {
            variantKey
            name
            purchaseUnit { unit }
            variantPrice {
              currency
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
          __typename
          sku
          productName
          slug
          imageUrl
          brand
          variants {
            variantKey
            name
            purchaseUnit { unit }
            variantPrice {
              currency
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

/** Auckland-area Woolworths pickup locations (catalogue pricing; official store list API is account-gated). */
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

type WwProduct = {
  sku?: string
  name?: string
  brand?: string
  barcode?: string
  availabilityStatus?: string
  stockLevel?: number
  price?: {
    salePrice?: number
    originalPrice?: number
    isClubPrice?: boolean
  }
  size?: {
    volumeSize?: string
    cupPrice?: number
    cupMeasure?: string
  }
  images?: {
    small?: string
    big?: string
  }
}

type CookieCache = {
  cookie: string
  expiresAt: number
}

let cookieCache: CookieCache | null = null
let proxyAgent: unknown | null | undefined

function envWoolworthsCookie() {
  return (process.env.WOOLWORTHS_COOKIE || '').trim()
}

function guestTokenFromCookie(cookie: string) {
  const match = cookie.match(/(?:^|;\s*)__guest__token=([^;]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function envWoolworthsProxy() {
  return (process.env.WOOLWORTHS_PROXY || process.env.HTTPS_PROXY || '').trim()
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

/**
 * Prefer manually provided browser cookie (Vercel env `WOOLWORTHS_COOKIE`).
 * Falls back to anonymous homepage bootstrap when unset.
 */
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

function mapRestProduct(raw: WwProduct): ProductHit {
  const sale = raw.price?.salePrice ?? raw.price?.originalPrice ?? 0
  const cupPrice = raw.size?.cupPrice
  const cupMeasure = raw.size?.cupMeasure
  const unitPriceLabel =
    typeof cupPrice === 'number' && cupMeasure ? `$${cupPrice.toFixed(2)}/${cupMeasure}` : null
  const status = (raw.availabilityStatus || '').toLowerCase()
  const inStock = status === 'in stock' || status.includes('in stock') || (raw.stockLevel ?? 0) > 0

  return {
    productId: String(raw.sku || ''),
    name: [raw.brand, raw.name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || raw.name || 'Unknown',
    brand: raw.brand || null,
    size: raw.size?.volumeSize || null,
    imageUrl: raw.images?.big || raw.images?.small || null,
    barcode: raw.barcode || null,
    price: sale,
    unitPriceLabel,
    clubPrice: raw.price?.isClubPrice ? sale : null,
    inStock,
    productUrl: raw.sku ? `${WW_BASE}/shop/productdetails?stockcode=${encodeURIComponent(raw.sku)}` : null,
  }
}

type GqlVariant = {
  variantKey?: string
  name?: string
  variantPrice?: {
    isClubPrice?: boolean
    sellingPrice?: number
    wasPrice?: number
    cupPrice?: number
    cupUnit?: string
  }
}

type GqlProduct = {
  __typename?: string
  sku?: string
  productName?: string
  slug?: string
  imageUrl?: string
  brand?: string
  variants?: GqlVariant[]
}

function mapGraphqlProduct(raw: GqlProduct): ProductHit | null {
  const variant = raw.variants?.[0]
  const price = variant?.variantPrice
  const sale = price?.sellingPrice ?? price?.wasPrice
  if (typeof sale !== 'number') return null

  const cupPrice = price?.cupPrice
  const cupUnit = price?.cupUnit
  const unitPriceLabel =
    typeof cupPrice === 'number' && cupUnit ? `$${cupPrice.toFixed(2)}/${cupUnit}` : null

  return {
    productId: String(raw.sku || variant?.variantKey || ''),
    name: [raw.brand, raw.productName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() || raw.productName || 'Unknown',
    brand: raw.brand || null,
    size: variant?.name || null,
    imageUrl: raw.imageUrl || null,
    barcode: null,
    price: sale,
    unitPriceLabel,
    clubPrice: price?.isClubPrice ? sale : null,
    inStock: true,
    productUrl: raw.sku
      ? `${WW_BASE}/shop/product-details/${encodeURIComponent(raw.sku)}${raw.slug ? `/${encodeURIComponent(raw.slug)}` : ''}`
      : null,
  }
}

async function searchViaRest(query: string, cookie: string): Promise<ProductHit | null> {
  const url = `${WW_BASE}/api/v1/products?target=search&search=${encodeURIComponent(query)}&size=8&page=1&inStockProductsOnly=false`
  const res = await wwFetch(url, {
    headers: browserHeaders(cookie),
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Woolworths REST ${res.status}: ${text.slice(0, 160)}`)
  }

  // Keep manually configured cookies stable; only merge bootstrap cookies.
  if (!envWoolworthsCookie()) {
    cookieCache = {
      cookie: mergeCookieJar(cookie, collectSetCookie(res)),
      expiresAt: Date.now() + 20 * 60_000,
    }
  }

  const data = (await res.json()) as { products?: { items?: WwProduct[] } }
  const first = data.products?.items?.[0]
  return first ? mapRestProduct(first) : null
}

async function searchViaGraphql(query: string, cookie: string): Promise<ProductHit | null> {
  const payload = {
    operationName: 'ProductSearch',
    query: PRODUCT_SEARCH_QUERY,
    variables: {
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
    },
  }

  const res = await wwFetch(`${WW_BASE}/api/graphql?op-name=ProductSearch`, {
    method: 'POST',
    headers: browserHeaders(cookie, {
      'Content-Type': 'application/json',
      'WNZX-Operation-Name': 'ProductSearch',
    }),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Woolworths GraphQL ${res.status}: ${text.slice(0, 160)}`)
  }

  if (!envWoolworthsCookie()) {
    cookieCache = {
      cookie: mergeCookieJar(cookie, collectSetCookie(res)),
      expiresAt: Date.now() + 20 * 60_000,
    }
  }

  const data = (await res.json()) as {
    errors?: Array<{ message?: string }>
    data?: { My?: { products?: { results?: GqlProduct[] } } }
  }

  if (data.errors?.length) {
    throw new Error(data.errors.map((e) => e.message).filter(Boolean).join('; ') || 'GraphQL error')
  }

  const results = data.data?.My?.products?.results || []
  for (const item of results) {
    if (item.__typename && !['ProductSummary', 'SponsoredProduct'].includes(item.__typename)) continue
    const mapped = mapGraphqlProduct(item)
    if (mapped) return mapped
  }
  return null
}

export function listWoolworthsStores(): StoreDTO[] {
  return WOOLWORTHS_AUCKLAND_STORES
}

export async function searchWoolworthsProduct(query: string): Promise<ProductHit | null> {
  const errors: string[] = []
  const existingCookie = cookieCache?.cookie || ''

  // Bootstrap in parallel; do not wait for it before first attempt.
  const cookiePromise = bootstrapWoolworthsSession().catch(() => existingCookie)

  const attempt = async (cookie: string) =>
    Promise.any([searchViaGraphql(query, cookie), searchViaRest(query, cookie)])

  try {
    return await attempt(existingCookie)
  } catch (firstError) {
    if (firstError instanceof AggregateError) {
      for (const err of firstError.errors || []) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    } else if (firstError instanceof Error) {
      errors.push(firstError.message)
    }
  }

  const freshCookie = await cookiePromise
  cookieCache = null
  const retryCookie = (await bootstrapWoolworthsSession().catch(() => freshCookie)) || freshCookie

  try {
    return await attempt(retryCookie)
  } catch (secondError) {
    if (secondError instanceof AggregateError) {
      for (const err of secondError.errors || []) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
    } else if (secondError instanceof Error) {
      errors.push(secondError.message)
    }
  }

  throw new Error(errors.filter(Boolean).slice(0, 2).join(' | ') || 'Woolworths search failed')
}
