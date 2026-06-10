'use client'

import { cn } from '@/lib/utils'
import { useEffect, useMemo, useRef, useState } from 'react'

export type SchoolMapMarker = {
  id: string | number
  lat: number
  lng: number
  title?: string
  metaLine?: string
  statsLine?: string
  markerColor?: string
}

type GoogleSchoolMapProps = {
  markers: SchoolMapMarker[]
  className?: string
  heightClassName?: string
  noCoordinatesText?: string
  missingApiKeyText?: string
  loadErrorText?: string
}

declare global {
  interface Window {
    google?: any
    __googleMapsApiPromise?: Promise<any>
  }
}

const GOOGLE_MAP_SCRIPT_ID = 'google-maps-js-api'

function escapeHtml(raw: string) {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

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

export function GoogleSchoolMap({
  markers,
  className,
  heightClassName = 'h-[340px]',
  noCoordinatesText = 'No map data available.',
  missingApiKeyText = 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing.',
  loadErrorText = 'Failed to load Google Maps.',
}: GoogleSchoolMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const infoWindowRef = useRef<any | null>(null)
  const markerInstancesRef = useRef<any[]>([])
  const viewportKeyRef = useRef<string>('')
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [mapError, setMapError] = useState<string | null>(null)

  const validMarkers = useMemo(
    () =>
      markers.filter(
        (marker) =>
          Number.isFinite(marker.lat) &&
          Number.isFinite(marker.lng) &&
          Math.abs(marker.lat) <= 90 &&
          Math.abs(marker.lng) <= 180,
      ),
    [markers],
  )

  useEffect(() => {
    if (validMarkers.length === 0) {
      for (const marker of markerInstancesRef.current) {
        marker.setMap(null)
      }
      markerInstancesRef.current = []
      viewportKeyRef.current = ''
      return
    }

    if (!apiKey) {
      setMapError(missingApiKeyText)
      return
    }

    let isCancelled = false

    loadGoogleMapsApi(apiKey)
      .then(() => {
        if (isCancelled || !mapElementRef.current || !window.google?.maps) {
          return
        }

        const firstMarker = validMarkers[0]
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapElementRef.current, {
            center: { lat: firstMarker.lat, lng: firstMarker.lng },
            zoom: validMarkers.length === 1 ? 16 : 16,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          })
        }
        if (!infoWindowRef.current) {
          infoWindowRef.current = new window.google.maps.InfoWindow()
        }

        const map = mapInstanceRef.current

        const bounds = new window.google.maps.LatLngBounds()
        const infoWindow = infoWindowRef.current

        for (const marker of markerInstancesRef.current) {
          marker.setMap(null)
        }
        markerInstancesRef.current = []

        for (const marker of validMarkers) {
          const position = { lat: marker.lat, lng: marker.lng }
          bounds.extend(position)
          const markerInstance = new window.google.maps.Marker({
            position,
            map,
            title: marker.title,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: validMarkers.length === 1 ? 10 : 6,
              fillColor: marker.markerColor ?? '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1.5,
            },
          })

          if (marker.title || marker.metaLine || marker.statsLine) {
            markerInstance.addListener('click', () => {
              const content = `
                <div style="max-width: 260px; line-height: 1.45;">
                  ${
                    marker.title
                      ? `<div style="font-weight: 600; font-size: 14px; color: #111827;">${escapeHtml(marker.title)}</div>`
                      : ''
                  }
                  ${
                    marker.metaLine
                      ? `<div style="margin-top: 4px; font-size: 12px; color: #111827;">${escapeHtml(marker.metaLine)}</div>`
                      : ''
                  }
                  ${
                    marker.statsLine
                      ? `<div style="margin-top: 4px; font-size: 12px; color: #111827;">${escapeHtml(marker.statsLine)}</div>`
                      : ''
                  }
                </div>
              `
              infoWindow.setContent(content)
              infoWindow.open({
                map,
                anchor: markerInstance,
              })
            })
          }

          markerInstancesRef.current.push(markerInstance)
        }

        const viewportKey = validMarkers
          .map((marker) => `${marker.lat.toFixed(6)},${marker.lng.toFixed(6)}`)
          .sort()
          .join('|')

        if (viewportKey !== viewportKeyRef.current) {
          viewportKeyRef.current = viewportKey
          if (validMarkers.length > 1) {
            map.fitBounds(bounds, 24)
            window.google.maps.event.addListenerOnce(map, 'idle', () => {
              const currentZoom = map.getZoom()
              if (typeof currentZoom === 'number') {
                map.setZoom(Math.min(currentZoom + 1, 18))
              }
            })
          } else {
            map.setCenter({ lat: firstMarker.lat, lng: firstMarker.lng })
            map.setZoom(16)
          }
        }

        setMapError(null)
      })
      .catch(() => {
        if (!isCancelled) {
          setMapError(loadErrorText)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [apiKey, validMarkers, missingApiKeyText, loadErrorText])

  if (validMarkers.length === 0) {
    return <div className={cn('text-muted-foreground text-sm', className)}>{noCoordinatesText}</div>
  }

  if (mapError) {
    return <div className={cn('text-muted-foreground text-sm', className)}>{mapError}</div>
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div ref={mapElementRef} className={cn('w-full', heightClassName)} />
    </div>
  )
}
