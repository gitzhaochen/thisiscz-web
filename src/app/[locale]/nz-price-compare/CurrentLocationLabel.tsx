'use client'

import { MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

const DEFAULT_LABEL = 'Auckland'

type CurrentLocationLabelProps = {
  latitude: number
  longitude: number
  className?: string
}

export function CurrentLocationLabel({ latitude, longitude, className }: CurrentLocationLabelProps) {
  const t = useTranslations('PageNzPriceCompare')
  const [label, setLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          lat: String(latitude),
          lng: String(longitude),
        })
        const res = await fetch(`/api/price-compare/location?${params}`)
        const data = (await res.json()) as { label?: string | null }
        if (cancelled) return
        setLabel(data.label?.trim() || null)
      } catch {
        if (!cancelled) setLabel(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [latitude, longitude])

  const text = loading ? t('locating') : label || DEFAULT_LABEL

  return (
    <p className={className ?? 'flex max-w-[55%] items-center gap-1 text-xs text-[#3d4a42]'}>
      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#006948]" />
      <span className="truncate" title={label || DEFAULT_LABEL}>
        {text}
      </span>
    </p>
  )
}
