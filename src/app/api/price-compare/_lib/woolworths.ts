import type { ProductHit, StoreDTO } from './types'

const WW_BASE = 'https://www.woolworths.co.nz'
const WW_HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'x-requested-with': 'OnlineShopping.WebApp',
  Origin: 'https://www.woolworths.co.nz',
  Referer: 'https://www.woolworths.co.nz/',
}

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
  productTag?: {
    tagType?: string
  } | null
}

function mapProduct(raw: WwProduct): ProductHit {
  const sale = raw.price?.salePrice ?? raw.price?.originalPrice ?? 0
  const cupPrice = raw.size?.cupPrice
  const cupMeasure = raw.size?.cupMeasure
  const unitPriceLabel =
    typeof cupPrice === 'number' && cupMeasure ? `$${cupPrice.toFixed(2)}/${cupMeasure}` : null

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
    inStock: (raw.availabilityStatus || '').toLowerCase().includes('stock') || (raw.stockLevel ?? 0) > 0,
    productUrl: raw.sku ? `${WW_BASE}/shop/productdetails?stockcode=${encodeURIComponent(raw.sku)}` : null,
  }
}

export function listWoolworthsStores(): StoreDTO[] {
  return WOOLWORTHS_AUCKLAND_STORES
}

export async function searchWoolworthsProduct(query: string): Promise<ProductHit | null> {
  const url = `${WW_BASE}/api/v1/products?target=search&search=${encodeURIComponent(query)}&size=8&page=1&inStockProductsOnly=false`
  const res = await fetch(url, {
    headers: WW_HEADERS,
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Woolworths upstream ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    products?: { items?: WwProduct[] }
  }
  const items = data.products?.items || []
  const first = items[0]
  return first ? mapProduct(first) : null
}
