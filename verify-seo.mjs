const baseUrl = (process.env.SEO_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

async function get(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`)
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`${pathname} returned ${response.status}`)
  }
  return { response, body }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const robots = await get('/robots.txt')
assert(robots.response.headers.get('content-type')?.includes('text/plain'), 'robots.txt has the wrong content type')
assert(robots.body.includes('https://thisiscz.com/sitemap.xml'), 'robots.txt does not advertise the sitemap')

const sitemap = await get('/sitemap.xml')
assert(sitemap.response.headers.get('content-type')?.includes('xml'), 'sitemap.xml has the wrong content type')
assert(sitemap.body.includes('https://thisiscz.com/en/nzschools'), 'English school directory is missing from sitemap')
assert(sitemap.body.includes('https://thisiscz.com/zh/nzschools'), 'Chinese school directory is missing from sitemap')

for (const locale of ['en', 'zh']) {
  const list = await get(`/${locale}/nzschools`)
  assert(list.body.includes(`<html lang="${locale}"`), `${locale} page has the wrong html lang`)
  assert(/<h1(?:\s|>)/.test(list.body), `${locale} directory has no h1`)
  assert(
    new RegExp(`href="/${locale}/nzschools/\\d+`).test(list.body),
    `${locale} directory has no server-rendered school links`,
  )
  assert(!list.body.includes('noindex'), `${locale} directory should be indexable`)
}

const filteredList = await get('/en/nzschools?city=Auckland')
assert(filteredList.body.includes('noindex'), 'Filtered school results should be noindex')

const schoolId = sitemap.body.match(/https:\/\/thisiscz\.com\/en\/nzschools\/(\d+)/)?.[1]
assert(schoolId, 'No school detail URL found in sitemap')

const detail = await get(`/en/nzschools/${schoolId}`)
assert((detail.body.match(/<h1(?:\s|>)/g) || []).length === 1, 'School detail must contain exactly one h1')
assert(detail.body.includes('EducationalOrganization'), 'School JSON-LD is missing')
assert(detail.body.includes('BreadcrumbList'), 'Breadcrumb JSON-LD is missing')
assert(detail.body.includes(`https://thisiscz.com/en/nzschools/${schoolId}`), 'School canonical URL is missing')
assert(detail.body.includes('hrefLang="zh-CN"'), 'Chinese hreflang is missing')
assert(detail.body.includes('property="og:image"'), 'School Open Graph image is missing')

console.log(`SEO verification passed for ${baseUrl} (school ${schoolId})`)
