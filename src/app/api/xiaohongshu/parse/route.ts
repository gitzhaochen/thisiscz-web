import { apiFetchServer } from '@/lib/apiFetch'
import { DeepSeekCarParserError, extractCarFieldsWithDeepSeek } from './_lib/deepseek-car-fields'
import {
  extractDateText,
  extractDetailTitle,
  extractImages,
  extractInitialStateNote,
  extractMeta,
  isXiaohongshuLoginHtml,
  removeHashtagTopics,
  sanitizeText,
} from './_lib/html'
import { parseOriginalPostPublishedAt } from './_lib/post-date'
import type { AiParsedCarFields, DeepSeekCarParseResult, ParsedCarFields, ParsedFieldSources } from './_lib/types'
import { NextRequest, NextResponse } from 'next/server'

const ACCEPTED_HOSTS = ['xiaohongshu.com', 'xhslink.com', 'xhscdn.com', 'xhslink.cn']
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const getTitle = (html: string) => {
  return (
    sanitizeText(extractDetailTitle(html)) ||
    sanitizeText(extractMeta(html, 'og:title')) ||
    sanitizeText(extractMeta(html, 'twitter:title')) ||
    sanitizeText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '')
  )
}

const getContent = (html: string) => {
  return removeHashtagTopics(
    sanitizeText(extractMeta(html, 'og:description')) ||
      sanitizeText(extractMeta(html, 'description')) ||
      sanitizeText(extractMeta(html, 'twitter:description')),
  )
}

const buildParsedFields = (
  aiFields: AiParsedCarFields,
  originalPostPublishedAt: string | null,
): {
  fields: ParsedCarFields
  fieldSources: ParsedFieldSources
  fieldEvidence: Partial<Record<keyof ParsedCarFields, string>>
} => {
  const fields: ParsedCarFields = {
    price: null,
    currency: null,
    year: null,
    mileageKm: null,
    manufacturer: null,
    model: null,
    transmission: null,
    engineDisplacementL: null,
    fuelType: null,
    contactPhone: null,
    contactWechat: null,
    contactEmail: null,
    sellerType: null,
    country: null,
    city: null,
    originalPostPublishedAt,
  }
  const fieldSources: ParsedFieldSources = originalPostPublishedAt ? { originalPostPublishedAt: 'date' } : {}
  const fieldEvidence: Partial<Record<keyof ParsedCarFields, string>> = {}

  for (const [field, candidate] of Object.entries(aiFields)) {
    if (!candidate || candidate.value === null) continue
    ;(fields as Record<string, unknown>)[field] = candidate.value
    fieldSources[field as keyof ParsedCarFields] = 'deepseek'
    fieldEvidence[field as keyof ParsedCarFields] = candidate.evidence
  }

  return { fields, fieldSources, fieldEvidence }
}

const isAdmin = async () => {
  try {
    const currentUser = await apiFetchServer('/api/users/me')
    return String(currentUser?.role || '').toLowerCase() === 'admin'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        'User-Agent': MOBILE_USER_AGENT,
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ error: `fetch failed with status ${response.status}` }, { status: 502 })
    }

    const html = await response.text()
    const finalUrl = response.url || parsed.toString()

    if (isXiaohongshuLoginHtml(finalUrl, html)) {
      return NextResponse.json(
        {
          error: 'Xiaohongshu redirected to login; keep xsec_token in the share link and retry',
          code: 'login_wall',
        },
        { status: 502 },
      )
    }

    const note = extractInitialStateNote(html)
    const title = note?.title || getTitle(html)
    const content = note?.content || getContent(html)
    const dateText = sanitizeText(extractDateText(html))
    const imageUrls = note?.imageUrls?.length ? note.imageUrls : extractImages(html)
    const originalPostPublishedAt = note?.publishedAtIso || parseOriginalPostPublishedAt(dateText)

    if (!title && !content) {
      return NextResponse.json(
        { error: 'Note content unavailable from Xiaohongshu page', code: 'empty_note' },
        { status: 502 },
      )
    }

    let aiResult: DeepSeekCarParseResult

    try {
      aiResult = await extractCarFieldsWithDeepSeek(title, content)
    } catch (error) {
      const code = error instanceof DeepSeekCarParserError ? error.code : 'unknown_error'
      const status = code === 'timeout' ? 504 : code === 'missing_api_key' ? 503 : 502
      console.warn('DeepSeek car parse failed:', code)
      return NextResponse.json({ error: 'AI parse failed', code }, { status })
    }

    const parsedResult = buildParsedFields(aiResult.fields, originalPostPublishedAt)

    return NextResponse.json({
      sourceUrl: finalUrl,
      postTitle: title,
      postContent: content,
      postTitleEn: aiResult.translations.postTitleEn,
      postContentEn: aiResult.translations.postContentEn,
      imageUrls,
      parsedFields: parsedResult.fields,
      fieldSources: parsedResult.fieldSources,
      fieldEvidence: parsedResult.fieldEvidence,
      parseSource: 'deepseek',
      warning: Object.keys(aiResult.fields).length === 0 ? 'deepseek_no_confident_fields' : undefined,
      aiMeta: {
        model: aiResult.model,
        durationMs: aiResult.durationMs,
        usage: aiResult.usage,
      },
    })
  } catch (error) {
    console.error('Parse xiaohongshu error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
