const decodeHtmlEntities = (input: string) => {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export const extractMeta = (html: string, key: string) => {
  const reg = new RegExp(`<meta[^>]+(?:property)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
  return reg.exec(html)?.[1]?.trim() || ''
}

export const sanitizeText = (value: string) => decodeHtmlEntities(value).replace(/\s+/g, ' ').trim()

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

export const extractImages = (html: string) => {
  const matches = [...html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi)]
  const urls = matches
    .map((match) => sanitizeText(match[1] || ''))
    .filter((url) => /^http/i.test(url))
    .slice(0, 12)

  return [...new Set(urls)]
}
