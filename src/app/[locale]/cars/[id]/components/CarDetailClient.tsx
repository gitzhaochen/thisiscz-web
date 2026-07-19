'use client'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { useGetApiCarsPublicId } from '@/lib/api/generated'
import { ChevronLeft, ChevronRight, LinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'

export default function CarDetailClient({ publicId }: { publicId: string }) {
  const t = useTranslations('PageCars')
  const { data: car, isPending } = useGetApiCarsPublicId(publicId, {
    query: { enabled: !!publicId },
  })
  const [currentIndex, setCurrentIndex] = useState(0)

  if (isPending) {
    return (
      <div className="page-wrapper py-6">
        <div className="my-4 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-gray-500 dark:border-white"></div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="page-wrapper py-6">
        <p className="text-muted-foreground">{t('loadError')}</p>
      </div>
    )
  }

  const images = car.imageUrls || []
  const currentImage = images[currentIndex] || ''

  const prevImage = () => {
    if (images.length <= 1) {
      return
    }
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const nextImage = () => {
    if (images.length <= 1) {
      return
    }
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="page-wrapper py-6">
      <div className="mx-auto max-w-[860px] space-y-4">
        <h1 className="text-xl font-bold">{car.postTitle}</h1>

        <div className="relative overflow-hidden rounded-lg border">
          <div className="relative aspect-[16/10] w-full">
            {currentImage ? (
              <Image src={currentImage} alt={car.postTitle || ''} fill className="object-cover" />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImage}
                className="bg-background/80 hover:bg-background absolute top-1/2 left-2 -translate-y-1/2 rounded-full border p-1"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="bg-background/80 hover:bg-background absolute top-1/2 right-2 -translate-y-1/2 rounded-full border p-1"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2 md:grid-cols-8">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-md border ${
                  index === currentIndex ? 'ring-primary ring-2' : ''
                }`}
              >
                <Image src={url} alt={`${car.postTitle || 'car'}-${index}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2 rounded-lg border p-4">
          <p>
            <span className="font-medium">{t('priceUnit')}: </span>
            {car.price} {car.currency}
          </p>
          <p>
            <span className="font-medium">{t('yearUnit')}: </span>
            {car.year}
          </p>
          <p>
            <span className="font-medium">{t('mileageUnit')}: </span>
            {car.mileageKm} km
          </p>
          <p>
            <span className="font-medium">Vehicle: </span>
            {car.manufacturer} {car.model}
          </p>
          <p>
            <span className="font-medium">Location: </span>
            {car.city}, {car.country}
          </p>
          {car.sourceUrl && (
            <a
              href={car.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm underline"
            >
              <LinkIcon className="h-3 w-3" />
              {t('sourceLink')}
            </a>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none rounded-lg border p-4">
          <p>{car.postContent}</p>
        </div>
      </div>
    </div>
  )
}
