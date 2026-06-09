'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

type GoogleStreetViewProps = {
  lat?: number | null
  lng?: number | null
  className?: string
  heightClassName?: string
  noCoordinatesText?: string
  missingApiKeyText?: string
  loadErrorText?: string
  noStreetViewText?: string
}

declare global {
  interface Window {
    google?: any
    __googleMapsApiPromise?: Promise<any>
  }
}

const GOOGLE_MAP_SCRIPT_ID = 'google-maps-js-api'

function loadGoogleMapsApi(apiKey: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is undefined'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (window.__googleMapsApiPromise) {
    return window.__googleMapsApiPromise
  }

  window.__googleMapsApiPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAP_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google?.maps))
      existingScript.addEventListener('error', () => reject(new Error('Google Maps script load failed')))
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_MAP_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google?.maps)
    script.onerror = () => reject(new Error('Google Maps script load failed'))
    document.head.appendChild(script)
  })

  return window.__googleMapsApiPromise
}

export function GoogleStreetView({
  lat,
  lng,
  className,
  heightClassName = 'h-[300px]',
  noCoordinatesText = 'No coordinates available.',
  missingApiKeyText = 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing.',
  loadErrorText = 'Failed to load Google Maps.',
  noStreetViewText = 'Street View is not available for this location.',
}: GoogleStreetViewProps) {
  const panoramaElementRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<any | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [error, setError] = useState<string | null>(null)

  const hasValidCoordinates =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180

  useEffect(() => {
    if (!hasValidCoordinates) {
      return
    }

    if (!apiKey) {
      setError(missingApiKeyText)
      return
    }

    let isCancelled = false
    const targetLocation = { lat: lat as number, lng: lng as number }

    loadGoogleMapsApi(apiKey)
      .then(() => {
        if (isCancelled || !window.google?.maps || !panoramaElementRef.current) {
          return
        }

        const streetViewService = new window.google.maps.StreetViewService()
        streetViewService.getPanorama(
          { location: targetLocation, radius: 2000 },
          (data: any, status: string) => {
            if (isCancelled) {
              return
            }

            if (status !== window.google.maps.StreetViewStatus.OK) {
              setError(noStreetViewText)
              return
            }

            const panoramaPosition = data?.location?.latLng ?? targetLocation
            if (!panoramaRef.current) {
              panoramaRef.current = new window.google.maps.StreetViewPanorama(panoramaElementRef.current, {
                position: panoramaPosition,
                pov: { heading: 34, pitch: 8 },
                zoom: 1,
                addressControl: false,
                fullscreenControl: false,
                motionTracking: false,
                showRoadLabels: true,
              })
            } else {
              panoramaRef.current.setPosition(panoramaPosition)
            }

            setError(null)
          },
        )
      })
      .catch(() => {
        if (!isCancelled) {
          setError(loadErrorText)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [apiKey, lat, lng, hasValidCoordinates, missingApiKeyText, loadErrorText, noStreetViewText])

  if (!hasValidCoordinates) {
    return <div className={cn('text-muted-foreground text-sm', className)}>{noCoordinatesText}</div>
  }

  if (error) {
    return <div className={cn('text-muted-foreground text-sm', className)}>{error}</div>
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div ref={panoramaElementRef} className={cn('w-full', heightClassName)} />
    </div>
  )
}
