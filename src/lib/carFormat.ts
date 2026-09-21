import type { CarStatus, FuelType, SellerType, TransmissionType } from '@/lib/api/generated'

type TranslateFn = {
  (key: string): string
  (key: string, values: Record<string, string | number | Date>): string
}

const fallback = '-'

export function formatCarYear(year: number | null | undefined, t: TranslateFn) {
  if (typeof year !== 'number') return fallback
  return t('yearLabel', { year })
}

export function formatCarMileageKm(mileageKm: number | null | undefined, locale: string, t: TranslateFn) {
  if (typeof mileageKm !== 'number' || mileageKm <= 0) return fallback

  const useEnglish = locale.toLowerCase().startsWith('en')
  if (useEnglish) {
    return t('mileageKm', { value: mileageKm.toLocaleString('en-NZ') })
  }

  const wan = (mileageKm / 10000).toFixed(1).replace(/\.0$/, '')
  return t('mileageWanKm', { value: wan })
}

export function getCarEnumLabel(
  group: 'transmission' | 'fuelType' | 'sellerType' | 'status',
  value: TransmissionType | FuelType | SellerType | CarStatus | null | undefined,
  t: TranslateFn,
) {
  if (!value) return fallback
  try {
    return t(`enums.${group}.${value}`)
  } catch {
    return value
  }
}
