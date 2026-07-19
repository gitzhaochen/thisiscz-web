import { apiFetchServer } from '@/lib/apiFetch'
import { NextRequest, NextResponse } from 'next/server'

const ACCEPTED_HOSTS = ['xiaohongshu.com', 'xhslink.com', 'xhscdn.com']
const NZ_CITY_LIST = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Dunedin',
  'Palmerston North',
  'Napier',
  'Nelson',
] as const

type ParsedCarFields = {
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

const decodeHtmlEntities = (input: string) => {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

const extractMeta = (html: string, key: string) => {
  const reg = new RegExp(`<meta[^>]+(?:property)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return reg.exec(html)?.[1]?.trim() || ''
}

const sanitizeText = (value: string) => decodeHtmlEntities(value).replace(/\s+/g, ' ').trim()

const removeHashtagTopics = (value: string) => {
  return value
    .replace(/#[^#\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractDetailTitle = (html: string) => {
  const match = html.match(/<div[^>]*id=["']detail-title["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || ''
  return match.replace(/<[^>]*>/g, '')
}

const extractImages = (html: string) => {
  const matches = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi)]
  const urls = matches
    .map((match) => sanitizeText(match[1] || ''))
    .filter((url) => /^http/i.test(url))
    .slice(0, 12)

  return [...new Set(urls)]
}

const toNumber = (value: string) => {
  const parsed = Number(value.replace(/[,，\s]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const extractPrice = (text: string) => {
  const wanMatch = text.match(/(?:价格|售价|卖价|出价|price|asking)[^0-9]{0,8}(\d+(?:\.\d+)?)\s*万/i)?.[1]
  if (wanMatch) {
    const numberPart = Number(wanMatch)
    if (Number.isFinite(numberPart)) {
      return Math.round(numberPart * 10000)
    }
  }

  const keywordPrice = text.match(
    /(?:价格|售价|卖价|出价|price|asking)[^0-9]{0,12}(?:nzd|cny|rmb|aud|usd|nz\$|au\$|us\$|\$|￥|¥)?\s*(\d{1,3}(?:[,\s，]\d{3})+|\d{4,8})/i,
  )?.[1]
  if (keywordPrice) {
    return toNumber(keywordPrice)
  }

  const dollarPrice = text.match(
    /(?:nzd|cny|rmb|aud|usd|nz\$|au\$|us\$|\$|￥|¥)\s*(\d{1,3}(?:[,\s，]\d{3})+|\d{4,8})/i,
  )?.[1]
  if (dollarPrice) {
    return toNumber(dollarPrice)
  }

  return null
}

const extractCurrency = (text: string) => {
  if (/(nzd|纽币|新西兰元)/i.test(text)) return 'NZD'
  if (/(cny|rmb|人民币)/i.test(text)) return 'CNY'
  if (/(aud|澳元)/i.test(text)) return 'AUD'
  if (/(usd|美金|美元)/i.test(text)) return 'USD'
  if (/\$/.test(text)) return 'NZD'
  return null
}

const extractYear = (text: string) => {
  const yearMatches = text.match(/\b(19\d{2}|20\d{2})\b/g) || []
  const maxYear = new Date().getFullYear() + 1
  const year = yearMatches
    .map((item) => Number(item))
    .find((value) => Number.isInteger(value) && value >= 1990 && value <= maxYear)
  return year || null
}

const extractMileageKm = (text: string) => {
  const mileageWanByKeyword = text.match(/(?:里程|实表|公里数|公里|行驶|mileage)[^0-9]{0,12}(\d+(?:\.\d+)?)\s*万/i)?.[1]
  if (mileageWanByKeyword) {
    const value = Number(mileageWanByKeyword)
    if (Number.isFinite(value)) {
      return Math.round(value * 10000)
    }
  }

  const mileageByKeyword = text.match(
    /(?:里程|实表|公里数|公里|行驶|mileage)[^0-9]{0,12}(\d{1,3}(?:[,\s，]\d{3})+|\d{4,7})(?!\s*[年月日])/i,
  )?.[1]
  if (mileageByKeyword) {
    return toNumber(mileageByKeyword)
  }

  const mileageWanByUnit = text.match(/(\d+(?:\.\d+)?)\s*万\s*(?:km|kms|公里|千米)/i)?.[1]
  if (mileageWanByUnit) {
    const value = Number(mileageWanByUnit)
    if (Number.isFinite(value)) {
      return Math.round(value * 10000)
    }
  }

  const mileageByUnit = text.match(/(\d{1,3}(?:[,\s，]\d{3})+|\d{4,7})\s*(?:km|kms|公里|千米)/i)?.[1]
  if (mileageByUnit) {
    return toNumber(mileageByUnit)
  }

  return null
}

const extractTransmission = (text: string): ParsedCarFields['transmission'] => {
  if (/(手动|manual|\bmt\b)/i.test(text)) return 'manual'
  if (/(自动|automatic|\bat\b|\bcvt\b|\bdct\b|auto)/i.test(text)) return 'automatic'
  return null
}

const extractEngineDisplacement = (text: string) => {
  const value = text.match(/\b([0-9](?:\.[0-9])?)\s*(?:l|升)\b/i)?.[1]
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const extractFuelType = (text: string): ParsedCarFields['fuelType'] => {
  if (/(纯电|ev|electric)/i.test(text)) return 'ev'
  if (/(插混|phev)/i.test(text)) return 'phev'
  if (/(混动|hybrid)/i.test(text)) return 'hybrid'
  if (/(柴油|diesel)/i.test(text)) return 'diesel'
  if (/(汽油|petrol|gasoline)/i.test(text)) return 'gasoline'
  return null
}

const extractPhone = (text: string) => {
  const match = text.match(/(?:\+?\d[\d\s-]{7,}\d)/)
  return match?.[0]?.replace(/\s+/g, ' ') || null
}

const extractWechat = (text: string) => {
  return (
    text.match(/(?:微信|wechat|vx)\s*[:：-]?\s*([a-zA-Z][a-zA-Z0-9_-]{4,})/i)?.[1] ||
    text.match(/(?:微信|wechat|vx)\s*[:：-]?\s*(\d{5,})/i)?.[1] ||
    null
  )
}

const extractEmail = (text: string) => {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i)?.[0] || null
}

const extractSellerType = (text: string): ParsedCarFields['sellerType'] => {
  if (/(个人|私家|owner|private seller|个人一手)/i.test(text)) return 'individual'
  if (/(车行|商家|dealer)/i.test(text)) return 'dealer'

  return null
}

const extractCountry = (text: string) => {
  if (/(new zealand|nz|新西兰)/i.test(text)) return 'New Zealand'
  if (/(china|中国)/i.test(text)) return 'China'
  return null
}

const extractCity = (text: string) => {
  const found = NZ_CITY_LIST.find((city) => new RegExp(`\\b${city}\\b`, 'i').test(text))
  return found || null
}

const extractCoreModel = (text: string) => {
  const firstSegment = text.split(/[|｜,，。;；]/)[0] || ''
  const normalized = firstSegment
    .replace(/\([^)]*\)|（[^）]*）/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const stopwords = new Set([
    'petrol',
    'gasoline',
    'diesel',
    'hybrid',
    'phev',
    'ev',
    'auto',
    'automatic',
    'manual',
    'at',
    'mt',
    'cvt',
    'dct',
    'km',
    'kms',
    'year',
    'years',
  ])

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+|[^a-zA-Z0-9\u4e00-\u9fa5-]+$/g, ''))
    .filter(Boolean)

  for (const token of tokens) {
    const lower = token.toLowerCase()
    if (/^\d{4}$/.test(token)) continue
    if (/^\d+(?:\.\d+)?(?:l|km|k|万)?$/i.test(token)) continue
    if (stopwords.has(lower)) continue
    return token
  }

  return null
}

const stripLeadingManufacturerAlias = (text: string, manufacturer: string) => {
  const aliasMap: Record<string, string[]> = {
    Toyota: ['toyota', '丰田'],
    Honda: ['honda', '本田'],
    Mazda: ['mazda', '马自达'],
    Nissan: ['nissan', '日产'],
    Mitsubishi: ['mitsubishi', '三菱'],
    Subaru: ['subaru', '斯巴鲁'],
    BMW: ['bmw', '宝马'],
    'Mercedes-Benz': ['mercedes', 'benz', '奔驰'],
    Audi: ['audi', '奥迪'],
    Volkswagen: ['volkswagen', 'vw', '大众'],
    Tesla: ['tesla', '特斯拉'],
    Ford: ['ford', '福特'],
    Kia: ['kia', '起亚'],
    Hyundai: ['hyundai', '现代'],
    Lexus: ['lexus', '雷克萨斯'],
  }

  const aliases = aliasMap[manufacturer] || [manufacturer.toLowerCase()]
  const escapedAliases = aliases.map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const aliasPrefixReg = new RegExp(`^(?:${escapedAliases.join('|')})[\\s\\-:：|]*`, 'i')

  let output = text.trim()
  while (aliasPrefixReg.test(output)) {
    output = output.replace(aliasPrefixReg, '').trim()
  }
  return output
}

const extractManufacturerAndModel = (title: string): Pick<ParsedCarFields, 'manufacturer' | 'model'> => {
  const manufacturerMatchers = [
    { value: 'Toyota', pattern: /(toyota|丰田)/i },
    { value: 'Honda', pattern: /(honda|本田)/i },
    { value: 'Mazda', pattern: /(mazda|马自达)/i },
    { value: 'Nissan', pattern: /(nissan|日产)/i },
    { value: 'Mitsubishi', pattern: /(mitsubishi|三菱)/i },
    { value: 'Subaru', pattern: /(subaru|斯巴鲁)/i },
    { value: 'BMW', pattern: /\bbmw\b/i },
    { value: 'Mercedes-Benz', pattern: /(mercedes|benz|奔驰)/i },
    { value: 'Audi', pattern: /\baudi\b/i },
    { value: 'Volkswagen', pattern: /(volkswagen|vw|大众)/i },
    { value: 'Tesla', pattern: /\btesla\b/i },
    { value: 'Ford', pattern: /\bford\b/i },
    { value: 'Kia', pattern: /\bkia\b/i },
    { value: 'Hyundai', pattern: /\bhyundai\b/i },
    { value: 'Lexus', pattern: /(lexus|雷克萨斯)/i },
  ] as const

  for (const item of manufacturerMatchers) {
    const match = item.pattern.exec(title)
    if (!match) continue
    const afterManufacturer = title.slice(match.index + match[0].length).trim()
    const cleanedModel = afterManufacturer.replace(/^[\s\-:：|]+/, '').replace(/(?:\$|￥|¥).*$/, '').trim()
    const modelWithoutBrandPrefix = stripLeadingManufacturerAlias(cleanedModel, item.value)
    const candidateModel = modelWithoutBrandPrefix || cleanedModel
    const coreModel = extractCoreModel(candidateModel)

    return {
      manufacturer: item.value,
      model: coreModel || null,
    }
  }

  return { manufacturer: null, model: null }
}

const extractParsedCarFields = (title: string, content: string): ParsedCarFields => {
  const mergedText = `${title}\n${content}`
  const manufacturerAndModel = extractManufacturerAndModel(title)

  return {
    price: extractPrice(mergedText),
    currency: extractCurrency(mergedText),
    year: extractYear(mergedText),
    mileageKm: extractMileageKm(mergedText),
    manufacturer: manufacturerAndModel.manufacturer,
    model: manufacturerAndModel.model,
    transmission: extractTransmission(mergedText),
    engineDisplacementL: extractEngineDisplacement(mergedText),
    fuelType: extractFuelType(mergedText),
    contactPhone: extractPhone(mergedText),
    contactWechat: extractWechat(mergedText),
    contactEmail: extractEmail(mergedText),
    sellerType: extractSellerType(mergedText),
    country: extractCountry(mergedText),
    city: extractCity(mergedText),
  }
}

export async function GET(request: NextRequest) {
  try {
    // 限制为 admin，避免被滥用成开放抓取代理
    const currentUser = await apiFetchServer('/api/users/me')
    const role = String(currentUser?.role || '').toLowerCase()
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUrl = request.nextUrl.searchParams.get('url')?.trim()
    if (!targetUrl) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(targetUrl)
    } catch {
      return NextResponse.json({ error: 'invalid url' }, { status: 400 })
    }

    const allowed = ACCEPTED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
    if (!allowed) {
      return NextResponse.json({ error: 'unsupported host' }, { status: 400 })
    }

    const response = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: `fetch failed with status ${response.status}` }, { status: 502 })
    }

    const html = await response.text()

    const finalUrl = response.url || parsed.toString()

    const title =
      sanitizeText(extractDetailTitle(html)) ||
      sanitizeText(extractMeta(html, 'og:title')) ||
      sanitizeText(extractMeta(html, 'twitter:title')) ||
      sanitizeText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '')

    const content = removeHashtagTopics(
      sanitizeText(extractMeta(html, 'og:description')) ||
        sanitizeText(extractMeta(html, 'description')) ||
        sanitizeText(extractMeta(html, 'twitter:description')),
    )

    const imageUrls = extractImages(html)
    const parsedFields = extractParsedCarFields(title, content)

    return NextResponse.json({
      sourceUrl: finalUrl,
      postTitle: title,
      postContent: content,
      imageUrls,
      parsedFields,
      parseSource: 'regex',
    })
  } catch (error) {
    console.error('Parse xiaohongshu error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
