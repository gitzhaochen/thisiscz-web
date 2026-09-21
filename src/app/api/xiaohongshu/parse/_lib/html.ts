const decodeHtmlEntities = (input: string) => {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export const extractMeta = (html: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
  ]
  for (const reg of patterns) {
    const value = reg.exec(html)?.[1]?.trim()
    if (value) return value
  }
  return ''
}

export const sanitizeText = (value: string) => decodeHtmlEntities(value).replace(/\s+/g, ' ').trim()

export const sanitizeMultilineText = (value: string) =>
  decodeHtmlEntities(value)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export const removeHashtagTopics = (value: string) => {
  return value
    .replace(/#[^#\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const extractDetailTitle = (html: string) => {
  const match = html.match(/<div[^>]*id=["']detail-title["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || ''
  return match.replace(/<[^>]*>/g, '')
}

export const extractDateText = (html: string) => {
  const match = html.match(/<span[^>]*class=["'][^"']*\bdate\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || ''
  return match.replace(/<[^>]*>/g, '')
}

export type XiaohongshuNotePayload = {
  title: string
  content: string
  publishedAtIso: string | null
  imageUrls: string[]
}

const pickImageUrl = (item: unknown): string | null => {
  if (!item || typeof item !== 'object') return null
  const record = item as Record<string, unknown>
  const candidates = [record.urlDefault, record.url, record.originUrl, record.urlPre]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
      return candidate.replace(/^http:\/\//i, 'https://')
    }
  }
  return null
}

const extractNoteImages = (note: Record<string, unknown>) => {
  const imageList = Array.isArray(note.imageList) ? note.imageList : []
  const urls = imageList
    .map((item) => pickImageUrl(item))
    .filter((url): url is string => Boolean(url))
    .slice(0, 12)
  return [...new Set(urls)]
}

export const extractInitialStateNote = (html: string): XiaohongshuNotePayload | null => {
  const marker = html.match(/window\.__INITIAL_STATE__\s*=\s*/)
  if (!marker || marker.index == null) return null

  const start = marker.index + marker[0].length
  const end = html.indexOf('</script>', start)
  if (end < 0) return null

  let raw = html.slice(start, end).trim()
  if (raw.endsWith(';')) raw = raw.slice(0, -1)
  raw = raw.replace(/\bundefined\b/g, 'null')

  try {
    const state = JSON.parse(raw) as {
      noteData?: {
        data?: { noteData?: Record<string, unknown> }
        normalNotePreloadData?: Record<string, unknown>
      }
    }
    const note =
      (state.noteData?.data?.noteData as Record<string, unknown> | undefined) ||
      (state.noteData?.normalNotePreloadData as Record<string, unknown> | undefined)
    if (!note) return null

    const title = sanitizeText(typeof note.title === 'string' ? note.title : '')
    const content = sanitizeMultilineText(typeof note.desc === 'string' ? note.desc : '')
    const timeMs = typeof note.time === 'number' ? note.time : Number(note.time)
    const publishedAtIso =
      Number.isFinite(timeMs) && timeMs > 0 ? new Date(timeMs).toISOString() : null

    if (!title && !content) return null

    return {
      title,
      content,
      publishedAtIso,
      imageUrls: extractNoteImages(note),
    }
  } catch {
    return null
  }
}

export const extractImages = (html: string) => {
  const matches = [
    ...html.matchAll(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi),
    ...html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["'][^>]*>/gi),
  ]
  const urls = matches
    .map((match) => sanitizeText(match[1] || ''))
    .filter((url) => /^https?:\/\//i.test(url))
    .map((url) => url.replace(/^http:\/\//i, 'https://'))
    .slice(0, 12)

  return [...new Set(urls)]
}

export const isXiaohongshuLoginHtml = (finalUrl: string, html: string) => {
  if (/\/login(?:\?|$)/i.test(finalUrl)) return true
  const title = sanitizeText(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '')
  return title.includes('登录') || /redirectPath=/i.test(finalUrl)
}
