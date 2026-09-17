export type ChainId = 'paknsave' | 'woolworths'

export type StoreDTO = {
  id: string
  chain: ChainId
  name: string
  shortName: string
  address: string
  city: string
  region: string
  latitude: number | null
  longitude: number | null
  /** Precomputed distance from the request origin (e.g. Woolworths locations API). */
  distanceKm?: number | null
  onlineActive: boolean
}

export type ProductHit = {
  productId: string
  name: string
  brand: string | null
  size: string | null
  imageUrl: string | null
  barcode: string | null
  price: number
  unitPriceLabel: string | null
  clubPrice: number | null
  inStock: boolean
  productUrl: string | null
}

export type PriceResultDTO = {
  storeId: string
  chain: ChainId
  storeName: string
  shortName: string
  address: string
  latitude: number | null
  longitude: number | null
  distanceKm: number | null
  product: ProductHit | null
  error: string | null
  priceScope: 'store' | 'catalogue'
}

export type ComparedProductDTO = {
  name: string
  brand: string | null
  size: string | null
  imageUrl: string | null
  barcode: string | null
}
