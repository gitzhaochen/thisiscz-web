import type { MetadataRoute } from 'next'
import type { SchoolDTOPaginationResult } from '@/lib/api/generated'
import { INDEXED_LOCALES, SITE_URL } from '@/lib/seo'

export const revalidate = 86400

const STATIC_PATHS = ['', '/posts', '/nzschools', '/cars', '/resume'] as const

async function getSchools() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBaseUrl) return []

  try {
    const response = await fetch(`${apiBaseUrl}/api/schools?page=1&pageSize=10000`, {
      next: { revalidate },
    })
    if (!response.ok) return []

    const data = (await response.json()) as SchoolDTOPaginationResult
    return (data.items ?? []).filter((school) => school.schoolId)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_PATHS.flatMap((pathname) =>
    INDEXED_LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}${pathname}`,
      changeFrequency: pathname === '/nzschools' ? ('daily' as const) : ('weekly' as const),
      priority: pathname === '' ? 1 : pathname === '/nzschools' ? 0.9 : 0.7,
      alternates: {
        languages: {
          en: `${SITE_URL}/en${pathname}`,
          'zh-CN': `${SITE_URL}/zh${pathname}`,
        },
      },
    })),
  )

  const schools = await getSchools()
  const schoolEntries = schools.flatMap((school) =>
    INDEXED_LOCALES.map((locale) => {
      const pathname = `/nzschools/${school.schoolId}`
      return {
        url: `${SITE_URL}/${locale}${pathname}`,
        lastModified: school.updatedAt ? new Date(school.updatedAt) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: {
          languages: {
            en: `${SITE_URL}/en${pathname}`,
            'zh-CN': `${SITE_URL}/zh${pathname}`,
          },
        },
      }
    }),
  )

  return [...staticEntries, ...schoolEntries]
}
