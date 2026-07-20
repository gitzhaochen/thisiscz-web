'use client'

import ContactAdminNotice from '@/components/ContactAdminNotice'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from '@/i18n/navigation'
import { CarStatus, FuelType, useGetApiCars } from '@/lib/api/generated'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const pageSize = 12
const fuelTypeOptions = [
  FuelType.petrol,
  FuelType.diesel,
  FuelType.hybrid,
  FuelType.phev,
  FuelType.ev,
  FuelType.other,
] as const
const cityOptions = [
  'Auckland',
  // 'Wellington',
  // 'Christchurch',
  // 'Hamilton',
  // 'Tauranga',
  // 'Dunedin',
  // 'Palmerston North',
  // 'Napier',
  // 'Nelson',
] as const
const sortOptions = ['latest', 'priceLow'] as const

export default function PageCarsClient() {
  const t = useTranslations('PageCars')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const manufacturer = searchParams.get('manufacturer') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const minYear = searchParams.get('minYear') || ''
  const maxYear = searchParams.get('maxYear') || ''
  const city = searchParams.get('city') || 'Auckland'
  const fuelType = searchParams.get('fuelType') || 'all'
  const sortType = (searchParams.get('sortType') || 'latest') as (typeof sortOptions)[number]

  const { data, isPending } = useGetApiCars({
    page: currentPage,
    pageSize,
    status: CarStatus.active,
    manufacturer: manufacturer || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minYear: minYear ? Number(minYear) : undefined,
    maxYear: maxYear ? Number(maxYear) : undefined,
    city: city || undefined,
    fuelType: fuelType === 'all' ? undefined : (fuelType as FuelType),
  })

  const handleFilterApply = (formData: FormData) => {
    const params = new URLSearchParams(searchParams)
    const manufacturerValue = String(formData.get('manufacturer') || '').trim()
    const minPriceValue = String(formData.get('minPrice') || '').trim()
    const maxPriceValue = String(formData.get('maxPrice') || '').trim()
    const minYearValue = String(formData.get('minYear') || '').trim()
    const maxYearValue = String(formData.get('maxYear') || '').trim()
    const fuelTypeValue = String(formData.get('fuelType') || 'all')
    if (manufacturerValue) {
      params.set('manufacturer', manufacturerValue)
    } else {
      params.delete('manufacturer')
    }

    if (minPriceValue) {
      params.set('minPrice', minPriceValue)
    } else {
      params.delete('minPrice')
    }

    if (maxPriceValue) {
      params.set('maxPrice', maxPriceValue)
    } else {
      params.delete('maxPrice')
    }

    if (minYearValue) {
      params.set('minYear', minYearValue)
    } else {
      params.delete('minYear')
    }

    if (maxYearValue) {
      params.set('maxYear', maxYearValue)
    } else {
      params.delete('maxYear')
    }

    if (fuelTypeValue && fuelTypeValue !== 'all') {
      params.set('fuelType', fuelTypeValue)
    } else {
      params.delete('fuelType')
    }

    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSortChange = (sortTypeValue: string) => {
    const params = new URLSearchParams(searchParams)

    if (sortTypeValue && sortTypeValue !== 'latest') {
      params.set('sortType', sortTypeValue)
    } else {
      params.delete('sortType')
    }

    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCityChange = (cityValue: string) => {
    const params = new URLSearchParams(searchParams)

    if (cityValue && cityValue !== 'Auckland') {
      params.set('city', cityValue)
    } else {
      params.delete('city')
    }

    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleFilterReset = () => {
    const params = new URLSearchParams(searchParams)
    ;['manufacturer', 'minPrice', 'maxPrice', 'minYear', 'maxYear', 'city', 'fuelType'].forEach((key) =>
      params.delete(key),
    )
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const items = [...(data?.items || [])]
  if (sortType === 'priceLow') {
    items.sort((a, b) => {
      const left = a.price || 0
      const right = b.price || 0
      return left - right
    })
  } else {
    items.sort((a, b) => {
      const left = new Date(a.createdAt || '').getTime()
      const right = new Date(b.createdAt || '').getTime()
      return right - left
    })
  }

  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize)

  return (
    <div className="page-wrapper py-4">
      <div className="mb-4 rounded-md">
        <div className="flex items-center gap-2">
          <Select value={city} onValueChange={handleCityChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortType} onValueChange={handleSortChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t('sortLatest')}</SelectItem>
              <SelectItem value="priceLow">{t('sortPriceLow')}</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAdvancedFilters((prev) => !prev)}>
            {showAdvancedFilters ? t('hideAdvancedFilters') : t('showAdvancedFilters')}
          </Button>
        </div>

        {showAdvancedFilters && (
          <form
            className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4"
            action={(formData) => handleFilterApply(formData)}
          >
            <div className="space-y-1">
              <Label>{t('manufacturer')}</Label>
              <Input name="manufacturer" defaultValue={manufacturer} placeholder={t('manufacturerPlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label>{t('fuelType')}</Label>
              <Select name="fuelType" defaultValue={fuelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {fuelTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('minPrice')}</Label>
              <Input name="minPrice" defaultValue={minPrice} type="number" />
            </div>
            <div className="space-y-1">
              <Label>{t('maxPrice')}</Label>
              <Input name="maxPrice" defaultValue={maxPrice} type="number" />
            </div>
            <div className="space-y-1">
              <Label>{t('minYear')}</Label>
              <Input name="minYear" defaultValue={minYear} type="number" />
            </div>
            <div className="space-y-1">
              <Label>{t('maxYear')}</Label>
              <Input name="maxYear" defaultValue={maxYear} type="number" />
            </div>
            <div className="flex gap-2 md:col-span-4">
              <Button type="submit" size="sm">
                {t('applyFilters')}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleFilterReset}>
                {t('resetFilters')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {isPending && (
        <div className="my-4 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-gray-500 dark:border-white"></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((car) => {
          const carPublicId = car.publicId
          if (!carPublicId) return null
          const imageUrl = car.imageUrls?.[0] || ''
          const mileageWan =
            typeof car.mileageKm === 'number' && car.mileageKm > 0
              ? `${(car.mileageKm / 10000).toFixed(1).replace(/\.0$/, '')}万公里`
              : '-'
          return (
            <Link
              key={carPublicId}
              href={`/cars/${carPublicId}`}
              className="flex flex-col rounded-sm border transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-t-sm">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={car.postTitle || ''}
                    fill
                    className="object-cover object-center transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-sm">No image</div>
                )}
              </div>
              <div className="space-y-1 p-2 text-xs">
                <p className="line-clamp-1 text-sm font-semibold">{car.postTitle}</p>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span>{car.year ? `${car.year}年` : '-'}</span>
                    <span>{mileageWan}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#ef4444] tabular-nums">${car.price}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <ContactAdminNotice />

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
