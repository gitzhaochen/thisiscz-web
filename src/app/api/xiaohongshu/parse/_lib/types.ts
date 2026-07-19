export type ParsedCarFields = {
  price: number | null
  currency: string | null
  year: number | null
  mileageKm: number | null
  manufacturer: string | null
  model: string | null
  transmission: 'automatic' | 'manual' | null
  engineDisplacementL: number | null
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'phev' | 'ev' | 'other' | null
  contactPhone: string | null
  contactWechat: string | null
  contactEmail: string | null
  sellerType: 'individual' | 'dealer' | null
  country: string | null
  city: string | null
}
