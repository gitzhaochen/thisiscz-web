export const SITE_URL = 'https://thisiscz.com'

export const INDEXED_LOCALES = ['en', 'zh'] as const

export function getLocaleAlternates(pathname = '') {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`

  return {
    en: `${SITE_URL}/en${normalizedPath}`,
    'zh-CN': `${SITE_URL}/zh${normalizedPath}`,
    'x-default': `${SITE_URL}/en${normalizedPath}`,
  }
}
