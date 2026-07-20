import type { CarStatus, FuelType, SellerType, SourcePlatformType, TransmissionType } from '@/lib/api/generated'

const transmissionLabelMap: Record<TransmissionType, string> = {
  automatic: '自动',
  manual: '手动',
}

const fuelTypeLabelMap: Record<FuelType, string> = {
  petrol: '汽油',
  diesel: '柴油',
  hybrid: '混动',
  phev: '插混',
  ev: '纯电',
  other: '其他',
}

const sellerTypeLabelMap: Record<SellerType, string> = {
  individual: '个人',
  dealer: '商家',
}

const carStatusLabelMap: Record<CarStatus, string> = {
  active: '在售',
  sold: '已售',
  offShelf: '下架',
  pending: '待售',
}

const sourcePlatformLabelMap: Record<SourcePlatformType, string> = {
  xiaohongshu: '小红书',
}

const fallback = '-'

const pickLabel = <T extends string>(value: T | null | undefined, map: Partial<Record<T, string>>) => {
  if (!value) return fallback
  return map[value] || value
}

export const getTransmissionLabel = (value: TransmissionType | null | undefined) =>
  pickLabel<TransmissionType>(value, transmissionLabelMap)

export const getFuelTypeLabel = (value: FuelType | null | undefined) => pickLabel<FuelType>(value, fuelTypeLabelMap)

export const getSellerTypeLabel = (value: SellerType | null | undefined) =>
  pickLabel<SellerType>(value, sellerTypeLabelMap)

export const getCarStatusLabel = (value: CarStatus | null | undefined) =>
  pickLabel<CarStatus>(value, carStatusLabelMap)

export const getSourcePlatformLabel = (value: SourcePlatformType | null | undefined) =>
  pickLabel<SourcePlatformType>(value, sourcePlatformLabelMap)
