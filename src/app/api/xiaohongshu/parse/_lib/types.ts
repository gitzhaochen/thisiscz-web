export type ParsedCarFields = {
  price: number | null
  currency: string | null
  year: number | null
  mileageKm: number | null
  manufacturer: string | null
  model: string | null
  transmission: 'automatic' | 'manual' | null
  engineDisplacementL: string | null
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'phev' | 'ev' | 'other' | null
  contactPhone: string | null
  contactWechat: string | null
  contactEmail: string | null
  sellerType: 'individual' | 'dealer' | null
  country: string | null
  city: string | null
  originalPostPublishedAt: string | null
}

export type AiParsedFieldName = Exclude<keyof ParsedCarFields, 'originalPostPublishedAt'>

export type AiFieldCandidate = {
  value: ParsedCarFields[AiParsedFieldName]
  confidence: number
  evidence: string
}

export type AiParsedCarFields = Partial<Record<AiParsedFieldName, AiFieldCandidate>>

export type ParsedFieldSource = 'deepseek' | 'date'

export type ParsedFieldSources = Partial<Record<keyof ParsedCarFields, ParsedFieldSource>>

export type DeepSeekUsage = {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export type DeepSeekCarParseResult = {
  fields: AiParsedCarFields
  model: string
  usage?: DeepSeekUsage
  durationMs: number
}
