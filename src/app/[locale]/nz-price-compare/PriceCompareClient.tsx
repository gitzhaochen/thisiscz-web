'use client'

import { Camera, CheckSquare, Crosshair, Loader2, Pencil, Square, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CurrentLocationLabel } from './CurrentLocationLabel'

type ChainId = 'paknsave' | 'woolworths'
type ChainFilter = ChainId | 'all'
type SortMode = 'price' | 'distance'

type StoreDTO = {
  id: string
  chain: ChainId
  name: string
  shortName: string
  address: string
  city: string
  region: string
  latitude: number | null
  longitude: number | null
  distanceKm?: number | null
  onlineActive: boolean
}

type ProductHit = {
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
}

type PriceResultDTO = {
  storeId: string
  chain: ChainId
  storeName: string
  shortName: string
  address: string
  distanceKm: number | null
  product: ProductHit | null
  error: string | null
  priceScope: 'store' | 'catalogue'
}

type ComparedProductDTO = {
  name: string
  brand: string | null
  size: string | null
  imageUrl: string | null
  barcode: string | null
}

const DEFAULT_QUERY = ''
const AUCKLAND = { lat: -36.8485, lng: 174.7633 }
const DEFAULT_PAKNSAVE = 4
const DEFAULT_WOOLWORTHS = 2
const MAX_SELECTED_STORES = 10

function formatPrice(value: number) {
  return value.toFixed(2)
}

function chainBadgeClass(chain: ChainId) {
  return chain === 'paknsave' ? 'bg-[#FDB913] text-[#0F172A]' : 'bg-[#1E7E34] text-white'
}

function chainDotClass(chain: ChainId | 'all') {
  if (chain === 'all') return 'bg-gradient-to-r from-[#FDB913] to-[#1E7E34]'
  return chain === 'paknsave' ? 'bg-[#FDB913]' : 'bg-[#1E7E34]'
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function storeDistanceKm(store: StoreDTO, origin: { lat: number; lng: number }) {
  if (typeof store.distanceKm === 'number') return store.distanceKm
  if (store.latitude == null || store.longitude == null) return Number.POSITIVE_INFINITY
  return haversineKm(origin.lat, origin.lng, store.latitude, store.longitude)
}

function sortStoresByDistance(stores: StoreDTO[], origin: { lat: number; lng: number }) {
  return [...stores].sort((a, b) => storeDistanceKm(a, origin) - storeDistanceKm(b, origin))
}

function pickNearestDefaults(stores: StoreDTO[], origin: { lat: number; lng: number }) {
  const nearest = (chain: ChainId, count: number) =>
    sortStoresByDistance(
      stores.filter((s) => s.chain === chain),
      origin,
    )
      .slice(0, count)
      .map((s) => s.id)

  return [...nearest('paknsave', DEFAULT_PAKNSAVE), ...nearest('woolworths', DEFAULT_WOOLWORTHS)]
}

export default function PriceCompareClient() {
  const t = useTranslations('PageNzPriceCompare')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [stores, setStores] = useState<StoreDTO[]>([])
  const [storesLoading, setStoresLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [chainFilter, setChainFilter] = useState<ChainFilter>('all')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [recognizing, setRecognizing] = useState(false)
  const [recognizedLabel, setRecognizedLabel] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('price')
  const [results, setResults] = useState<PriceResultDTO[]>([])
  const [comparedProduct, setComparedProduct] = useState<ComparedProductDTO | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [searching, startSearchTransition] = useTransition()
  const [origin, setOrigin] = useState(AUCKLAND)
  const selectionTouchedRef = useRef(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStoresLoading(true)
        const params = new URLSearchParams({
          lat: String(origin.lat),
          lng: String(origin.lng),
        })
        const res = await fetch(`/api/price-compare/stores?${params}`)
        if (!res.ok) throw new Error('stores failed')
        const data = (await res.json()) as { stores: StoreDTO[] }
        if (cancelled) return
        setStores(data.stores || [])
      } catch {
        if (!cancelled) toast.error(t('errors.stores'))
      } finally {
        if (!cancelled) setStoresLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [origin.lat, origin.lng, t])

  useEffect(() => {
    if (!stores.length) return
    if (!selectionTouchedRef.current) {
      setSelectedIds(pickNearestDefaults(stores, origin))
      return
    }
    setSelectedIds((prev) => {
      const valid = new Set(stores.map((s) => s.id))
      const kept = prev.filter((id) => valid.has(id))
      return kept.length > 0 ? kept : pickNearestDefaults(stores, origin)
    })
  }, [origin, stores])

  const filteredStores = useMemo(
    () => sortStoresByDistance(chainFilter === 'all' ? stores : stores.filter((s) => s.chain === chainFilter), origin),
    [stores, chainFilter, origin],
  )

  const chainStats = useMemo(() => {
    const forChain = (chain: ChainId) => {
      const available = stores.filter((s) => s.chain === chain)
      const selected = available.filter((s) => selectedIds.includes(s.id))
      return { available: available.length, selected: selected.length }
    }
    const paknsave = forChain('paknsave')
    const woolworths = forChain('woolworths')
    return {
      all: {
        available: paknsave.available + woolworths.available,
        selected: paknsave.selected + woolworths.selected,
      },
      paknsave,
      woolworths,
    }
  }, [stores, selectedIds])

  const activeChainStats = chainStats[chainFilter]

  const runSearch = useCallback(
    (searchQuery: string, storeIds: string[]) => {
      const q = searchQuery.trim()
      if (!q) {
        toast.error(t('errors.emptyQuery'))
        return
      }
      if (storeIds.length === 0) {
        toast.error(t('errors.noStores'))
        return
      }

      startSearchTransition(async () => {
        try {
          const res = await fetch('/api/price-compare/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: q,
              storeIds,
              latitude: origin.lat,
              longitude: origin.lng,
              inStockOnly,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'search failed')
          setResults(data.results || [])
          setComparedProduct(data.comparedProduct || null)
          setUpdatedAt(data.updatedAt || new Date().toISOString())
        } catch {
          toast.error(t('errors.search'))
        }
      })
    },
    [inStockOnly, origin.lat, origin.lng, t],
  )

  const sortedResults = useMemo(() => {
    const list = [...results]
    if (sortMode === 'distance') {
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    } else {
      list.sort((a, b) => (a.product?.price ?? 9999) - (b.product?.price ?? 9999))
    }
    return list
  }, [results, sortMode])

  const lowestPrice = useMemo(() => {
    const prices = results.map((r) => r.product?.price).filter((p): p is number => typeof p === 'number')
    return prices.length ? Math.min(...prices) : null
  }, [results])

  async function onPickImage(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('errors.invalidImage'))
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setRecognizing(true)
    setRecognizedLabel(null)

    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch('/api/price-compare/recognize', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'recognize failed')
      const name = String(data.productName || '').trim()
      if (!name) throw new Error('empty')
      setQuery(name)
      setRecognizedLabel(name)
      runSearch(name, selectedIds)
    } catch {
      toast.error(t('errors.recognize'))
    } finally {
      setRecognizing(false)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  function openCamera() {
    cameraInputRef.current?.click()
  }

  function toggleStore(id: string) {
    selectionTouchedRef.current = true
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id))
      return
    }
    if (selectedIds.length >= MAX_SELECTED_STORES) {
      toast.error(t('errors.maxStores', { max: MAX_SELECTED_STORES }))
      return
    }
    setSelectedIds((prev) => [...prev, id])
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col pb-28 font-[family-name:var(--font-kiwi-body)]">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-[family-name:var(--font-kiwi-headline)] text-lg font-bold tracking-tight text-[#131b2e] sm:text-2xl">
            <span className="text-[#006948]">Grocery Price</span> Compare
          </h1>
          <CurrentLocationLabel latitude={origin.lat} longitude={origin.lng} />
        </div>
        <p className="mt-2 text-sm text-[#3d4a42]">{t('intro')}</p>
      </header>

      <section className="flex flex-col gap-2">
        {(recognizing || recognizedLabel) && (
          <div className="flex items-center justify-between rounded-full bg-[#006948]/10 px-3 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              {recognizing ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#006948] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#006948]" />
                </span>
              ) : null}
              <span className="truncate text-[11px] font-bold text-[#006948]">
                {recognizing
                  ? t('aiRecognizing', { name: recognizedLabel || '…' })
                  : t('aiRecognized', { name: recognizedLabel || '' })}
              </span>
            </div>
            <button type="button" className="shrink-0 text-xs font-semibold text-[#006948]" onClick={openCamera}>
              {t('retake')}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded-xl bg-white p-1.5 shadow-sm">
          <button
            type="button"
            aria-label={t('captureAria')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#006948]/10 text-[#006948] active:scale-95"
            onClick={openCamera}
          >
            {recognizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          </button>
          <div className="flex min-w-0 flex-1 items-center rounded-lg bg-[#f2f3ff] px-2 py-1">
            <input
              className="w-full bg-transparent font-[family-name:var(--font-kiwi-headline)] text-base font-semibold text-[#131b2e] outline-none"
              placeholder={t('queryPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch(query, selectedIds)
              }}
            />
            {query ? (
              <button
                type="button"
                aria-label={t('clearAria')}
                className="text-[#3d4a42] hover:text-[#131b2e]"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg bg-[#006948] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
            disabled={searching}
            onClick={() => runSearch(query, selectedIds)}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('compare')}
          </button>
          <span className="sr-only">
            <Pencil className="h-4 w-4" />
          </span>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPickImage(e.target.files?.[0] || null)}
        />
      </section>

      <section className="mt-3">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#eaedff] p-1">
          {(
            [
              ['all', t('tabs.all')],
              ['paknsave', t('tabs.yellow')],
              ['woolworths', t('tabs.green')],
            ] as const
          ).map(([id, label]) => {
            const active = chainFilter === id
            const stats = chainStats[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => setChainFilter(id)}
                className={`flex items-center justify-center gap-1 rounded-lg px-1 py-2 text-[13px] font-semibold transition-all sm:gap-1.5 sm:text-sm ${
                  active ? 'bg-white text-[#131b2e] shadow-sm' : 'text-[#3d4a42] hover:bg-white/60'
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${chainDotClass(id)}`} />
                <span className="truncate">{label}</span>
                <span className="rounded-full bg-[#e2e7ff] px-1.5 py-0.5 font-mono text-[11px] text-[#3d4a42]">
                  {t('tabStoreCount', { selected: stats.selected, available: stats.available })}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold tracking-wider text-[#3d4a42] uppercase">
            {t('storeLibrary', {
              selected: activeChainStats.selected,
              available: activeChainStats.available,
              totalSelected: selectedIds.length,
              max: MAX_SELECTED_STORES,
            })}
          </span>
          <label className="flex cursor-pointer items-center gap-1 text-xs text-[#3d4a42]">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded accent-[#006948]"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            {t('inStockOnly')}
          </label>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {storesLoading ? (
            <span className="text-xs text-[#3d4a42]">{t('loadingStores')}</span>
          ) : (
            filteredStores.map((store) => {
              const selected = selectedIds.includes(store.id)
              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => toggleStore(store.id)}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold shadow-sm ${
                    selected ? 'bg-white text-[#131b2e]' : 'bg-[#eaedff] text-[#3d4a42] opacity-70'
                  }`}
                >
                  {selected ? (
                    <CheckSquare className="h-4 w-4 text-[#006948]" />
                  ) : (
                    <Square className="h-4 w-4 text-[#6d7a72]" />
                  )}
                  <span className={`h-2 w-2 rounded-full ${chainDotClass(store.chain)}`} />
                  {store.chain === 'paknsave' ? `PAK'nSAVE ${store.shortName}` : `Woolworths ${store.shortName}`}
                </button>
              )
            })
          )}
        </div>
      </section>

      {comparedProduct || previewUrl ? (
        <section className="mt-3">
          <div className="relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex gap-3">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f2f3ff] p-1.5">
                {(previewUrl || comparedProduct?.imageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl || comparedProduct?.imageUrl || ''}
                    alt=""
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                )}
                {comparedProduct?.size ? (
                  <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1 py-0.5 font-mono text-[9px] font-bold">
                    {comparedProduct.size}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded bg-[#006948]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#006948]">
                    {searching ? t('comparing') : t('compared')}
                  </span>
                  {comparedProduct?.barcode ? (
                    <span className="font-mono text-[11px] text-[#3d4a42]">
                      {t('barcode')}: {comparedProduct.barcode}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-1 truncate font-[family-name:var(--font-kiwi-headline)] text-base font-semibold text-[#131b2e]">
                  {comparedProduct?.name || query}
                </h2>
                <p className="text-xs text-[#3d4a42]">{comparedProduct?.brand || t('editableHint')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[#f2f3ff] px-2 py-1.5 text-[11px] text-[#3d4a42]">
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#006948]" /> : null}
              {updatedAt ? t('justUpdated') : t('readyToCompare')}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-[family-name:var(--font-kiwi-headline)] text-base font-semibold text-[#131b2e]">
            {t('resultTitle', { count: sortedResults.length })}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSortMode('price')}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                sortMode === 'price' ? 'bg-[#eaedff] text-[#131b2e]' : 'bg-white text-[#3d4a42] shadow-sm'
              }`}
            >
              {t('sortPrice')}
            </button>
            <button
              type="button"
              onClick={() => setSortMode('distance')}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                sortMode === 'distance' ? 'bg-[#eaedff] text-[#131b2e]' : 'bg-white text-[#3d4a42] shadow-sm'
              }`}
            >
              {t('sortDistance')}
              <Crosshair className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {!searching && sortedResults.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#bccac0] bg-white/70 p-6 text-center text-sm text-[#3d4a42]">
            {t('emptyResults')}
          </div>
        ) : null}

        {sortedResults.map((row) => {
          const isBest = lowestPrice != null && row.product != null && Math.abs(row.product.price - lowestPrice) < 0.001
          const delta = lowestPrice != null && row.product != null ? row.product.price - lowestPrice : null

          return (
            <article
              key={row.storeId}
              className={`flex flex-col gap-1 rounded-2xl bg-white p-3 shadow-sm ${
                isBest ? 'shadow-[0_4px_12px_-2px_rgba(5,150,105,0.12)] ring-[1.5px] ring-[#006948]/80' : ''
              } ${!row.product || !row.product.inStock ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black whitespace-nowrap ${chainBadgeClass(row.chain)}`}
                  >
                    {row.chain === 'paknsave' ? t('badge.yellow') : t('badge.green')}
                  </span>
                  <span className="truncate font-[family-name:var(--font-kiwi-headline)] text-sm font-bold text-[#131b2e]">
                    {row.shortName}
                  </span>
                  {row.distanceKm != null ? (
                    <span className="font-mono text-[11px] text-[#3d4a42]">{row.distanceKm} km</span>
                  ) : null}
                </div>
                {isBest ? (
                  <span className="shrink-0 rounded-full bg-[#006948] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {t('bestDeal')}
                  </span>
                ) : delta != null && delta > 0 ? (
                  <span className="shrink-0 rounded-full bg-[#ffdea6] px-2 py-0.5 text-[10px] font-bold text-[#271900]">
                    +{formatPrice(delta)} NZD
                  </span>
                ) : null}
              </div>

              <div className="flex items-end justify-between pt-1">
                {row.product ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xs font-bold ${isBest ? 'text-[#006948]' : 'text-[#131b2e]'}`}>NZ$</span>
                      <span
                        className={`font-[family-name:var(--font-kiwi-headline)] text-[28px] leading-8 font-extrabold ${
                          isBest ? 'text-[#006948]' : 'text-[#131b2e]'
                        }`}
                      >
                        {formatPrice(row.product.price)}
                      </span>
                      {row.product.unitPriceLabel ? (
                        <span className="font-mono text-[11px] text-[#3d4a42]">({row.product.unitPriceLabel})</span>
                      ) : null}
                    </div>
                    {row.product.clubPrice != null ? (
                      <p className="mt-0.5 text-[11px] font-bold text-[#1E7E34]">
                        {t('clubPrice', { price: formatPrice(row.product.clubPrice) })}
                      </p>
                    ) : null}
                    {row.priceScope === 'catalogue' ? (
                      <p className="mt-0.5 text-[10px] text-[#6d7a72]">{t('cataloguePriceNote')}</p>
                    ) : null}
                    {!row.product.inStock ? (
                      <p className="mt-0.5 text-[11px] text-[#ba1a1a] italic">{t('outOfStock')}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-[#3d4a42]">{row.error || t('noMatch')}</p>
                )}
              </div>
            </article>
          )
        })}
      </section>

      <button
        type="button"
        aria-label={t('captureAria')}
        onClick={openCamera}
        className="fixed right-4 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#006948] text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        <Camera className="h-7 w-7" />
      </button>
    </div>
  )
}
