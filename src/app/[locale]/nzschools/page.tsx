import type { Metadata } from 'next'
import type { SchoolDTOPaginationResult, SchoolFilterOptionsDTO } from '@/lib/api/generated'
import { SITE_URL } from '@/lib/seo'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Locale } from 'next-intl'
import NzSchoolsExplorer, { type SchoolFilters } from './NzSchoolsExplorer'

const PAGE_SIZE = 20

type SearchParams = Record<string, string | string[] | undefined>

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<SearchParams>
}

function getParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key]
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

function parsePage(searchParams: SearchParams) {
  const page = Number(getParam(searchParams, 'page'))
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseFilters(searchParams: SearchParams): SchoolFilters {
  const levelClass = getParam(searchParams, 'levelClass')
  return {
    name: getParam(searchParams, 'name'),
    city: getParam(searchParams, 'city'),
    authorityClass: getParam(searchParams, 'authorityClass'),
    levelClass,
    coEdStatus: getParam(searchParams, 'coEdStatus'),
    eqiIndexSortOrder: getParam(searchParams, 'eqiIndexSortOrder') === 'desc' ? 'desc' : 'asc',
    ueRateSortOrder:
      levelClass.toLowerCase() === 'secondary'
        ? getParam(searchParams, 'ueRateSortOrder') === 'asc'
          ? 'asc'
          : 'desc'
        : undefined,
  }
}

function hasIndexableFilter(searchParams: SearchParams) {
  return ['name', 'city', 'authorityClass', 'levelClass', 'coEdStatus', 'eqiIndexSortOrder', 'ueRateSortOrder'].some(
    (key) => Boolean(getParam(searchParams, key)),
  )
}

async function fetchPublicApi<T>(pathname: string): Promise<T> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBaseUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing')

  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    next: { revalidate: 60 },
  })
  if (!response.ok) throw new Error(`API request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

async function getSchoolPage(page: number, filters: SchoolFilters) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
  })

  if (filters.name) query.set('name', filters.name)
  if (filters.city) query.set('city', filters.city)
  if (filters.authorityClass) query.set('authorityClass', filters.authorityClass)
  if (filters.levelClass) query.set('levelClass', filters.levelClass)
  if (filters.coEdStatus) query.set('coEdStatus', filters.coEdStatus)
  if (filters.ueRateSortOrder) {
    query.set('ueRateSortOrder', filters.ueRateSortOrder)
  } else {
    query.set('eqiIndexSortOrder', filters.eqiIndexSortOrder)
  }

  return fetchPublicApi<SchoolDTOPaginationResult>(`/api/schools?${query}`)
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale }, query, t] = await Promise.all([
    params,
    searchParams,
    params.then(({ locale }) => getTranslations({ locale, namespace: 'PageNzSchools' })),
  ])
  const page = parsePage(query)
  const filtered = hasIndexableFilter(query)
  const pageQuery = page > 1 && !filtered ? `?page=${page}` : ''
  const canonical = `${SITE_URL}/${locale}/nzschools${pageQuery}`

  return {
    title: page > 1 ? `${t('seoTitle')} – ${t('pageTitle', { page })}` : t('seoTitle'),
    description: t('seoDescription'),
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en/nzschools${pageQuery}`,
        'zh-CN': `${SITE_URL}/zh/nzschools${pageQuery}`,
        'x-default': `${SITE_URL}/en/nzschools${pageQuery}`,
      },
    },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  }
}

export default async function PageNzSchools({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  setRequestLocale(locale)

  const page = parsePage(query)
  const filters = parseFilters(query)
  const t = await getTranslations({ locale, namespace: 'PageNzSchools' })

  let schoolPage: SchoolDTOPaginationResult = { items: [], totalCount: 0 }
  let enums: SchoolFilterOptionsDTO = {}
  let loadError = false

  try {
    ;[schoolPage, enums] = await Promise.all([
      getSchoolPage(page, filters),
      fetchPublicApi<SchoolFilterOptionsDTO>('/api/schools/enums'),
    ])
  } catch {
    loadError = true
  }

  const totalCount = schoolPage.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <main className="page-wrapper pt-6 pb-8">
      <header className="mb-6 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('heading')}</h1>
        <p className="text-muted-foreground mt-2 leading-7">{t('intro')}</p>
      </header>

      <NzSchoolsExplorer
        schools={schoolPage.items ?? []}
        enums={enums}
        filters={filters}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        loadError={loadError}
      />
    </main>
  )
}
