import { GoogleSchoolMap } from '@/components/NzSchools/GoogleSchoolMap'
import { GoogleStreetView } from '@/components/NzSchools/GoogleStreetView'
import { SchoolMetaLine } from '@/components/NzSchools/SchoolMetaLine'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetchServer } from '@/lib/apiFetch'
import type { SchoolDetailDTO } from '@/lib/api/generated'
import { createNzSchoolEnumLabelHelpers } from '@/lib/nzSchoolEnumLabels'
import { buildUeRate2023Rows, formatUeRatePercent } from '@/lib/nzSchoolUeRate2023'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { SITE_URL } from '@/lib/seo'
import { Link } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: Locale; schoolId: string }>
}

const fetchSchoolDetail = cache(async (schoolId: string): Promise<SchoolDetailDTO | null> => {
  try {
    return await apiFetchServer(`/api/schools/${schoolId}`)
  } catch {
    return null
  }
})

function formatUeRateForSeo(ueRate?: number | null) {
  if (typeof ueRate !== 'number' || Number.isNaN(ueRate)) {
    return null
  }
  return `${(ueRate * 100).toFixed(1)}%`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, schoolId } = await params
  const tDetail = await getTranslations({ locale, namespace: 'PageNzSchoolDetail' })
  const tEnum = await getTranslations({ locale, namespace: 'NzSchoolEnums' })
  const { getAuthorityClassLabel, getLevelClassLabel } = createNzSchoolEnumLabelHelpers(tEnum)
  const baseUrl = SITE_URL
  const pageUrl = `${baseUrl}/${locale}/nzschools/${schoolId}`
  const localeCode = locale === 'zh' ? 'zh_CN' : 'en_US'

  const detail = await fetchSchoolDetail(schoolId)
  if (!detail?.name) {
    const fallbackTitle = tDetail('seoTitleFallback')
    return {
      title: fallbackTitle,
      description: tDetail('seoKeywordsBase'),
      alternates: {
        canonical: pageUrl,
        languages: {
          'zh-CN': `${baseUrl}/zh/nzschools/${schoolId}`,
          en: `${baseUrl}/en/nzschools/${schoolId}`,
          'x-default': `${baseUrl}/en/nzschools/${schoolId}`,
        },
      },
      openGraph: {
        type: 'article',
        url: pageUrl,
        title: fallbackTitle,
        description: tDetail('seoKeywordsBase'),
        locale: localeCode,
        siteName: 'ThisIsCZ',
      },
      twitter: {
        card: 'summary',
        title: fallbackTitle,
        description: tDetail('seoKeywordsBase'),
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const city = detail.city?.trim() || '-'
  const authorityClass = getAuthorityClassLabel(detail.authorityClass)
  const levelClass = getLevelClassLabel(detail.levelClass)
  const ueRate = formatUeRateForSeo(detail.ueRate)
  const ueRatePart = ueRate ? tDetail('seoUeRatePart', { ueRate }) : ''

  const keywords = [
    detail.name,
    city,
    `${city} ${levelClass}`.trim(),
    `${detail.name} ${city}`.trim(),
    authorityClass,
    levelClass,
    ...tDetail('seoKeywordsBase')
      .split(',')
      .map((keyword) => keyword.trim()),
  ].filter(Boolean)

  const title = tDetail('seoTitle', { name: detail.name, city })
  const description = tDetail('seoDescription', {
    name: detail.name,
    city,
    authorityClass,
    levelClass,
    eqi: detail.eqiIndex ?? '-',
    students: detail.totalStudents2025 ?? detail.totalStudents ?? '-',
    ueRatePart,
  })

  return {
    title,
    description,
    keywords: [...new Set(keywords)],
    alternates: {
      canonical: pageUrl,
      languages: {
        'zh-CN': `${baseUrl}/zh/nzschools/${schoolId}`,
        en: `${baseUrl}/en/nzschools/${schoolId}`,
        'x-default': `${baseUrl}/en/nzschools/${schoolId}`,
      },
    },
    openGraph: {
      type: 'article',
      url: pageUrl,
      title,
      description,
      locale: localeCode,
      siteName: 'ThisIsCZ',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

function getAuthorityMarkerColor(authorityClass?: string | null) {
  switch ((authorityClass ?? '').toLowerCase()) {
    case 'state':
      return '#2563eb'
    case 'state_integrated':
      return '#16a34a'
    case 'private':
      return '#f97316'
    case 'charter':
      return '#a855f7'
    default:
      return '#6b7280'
  }
}

export default async function PageNzSchoolDetail({ params }: Props) {
  const { locale, schoolId } = await params
  setRequestLocale(locale)
  const tDetail = await getTranslations({ locale, namespace: 'PageNzSchoolDetail' })
  const tEnum = await getTranslations({ locale, namespace: 'NzSchoolEnums' })
  const { getAuthorityClassLabel, getLevelClassLabel, getCoEdStatusLabel, getOrgTypeLabel, getEthnicityLabel } =
    createNzSchoolEnumLabelHelpers(tEnum)

  let detail = await fetchSchoolDetail(schoolId)

  if (!detail) {
    notFound()
  }

  const ethnicityColumns = Array.from(
    new Set(
      (detail.yearLevelEthnicityCounts2025 ?? [])
        .flatMap((row) => row.ethnicityCounts ?? [])
        .map((item) => item.ethnicity)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b))

  const ethnicityTotals = ethnicityColumns.reduce<Record<string, number>>((acc, ethnicity) => {
    acc[ethnicity] = 0
    return acc
  }, {})

  for (const row of detail.yearLevelEthnicityCounts2025 ?? []) {
    for (const item of row.ethnicityCounts ?? []) {
      if (!item.ethnicity) continue
      if (!ethnicityTotals[item.ethnicity]) {
        ethnicityTotals[item.ethnicity] = 0
      }
      ethnicityTotals[item.ethnicity] += item.studentCount ?? 0
    }
  }

  const ueRate2023Rows = buildUeRate2023Rows(detail)
  const ueRate2023EthnicityColumns = ueRate2023Rows.filter((row) => row.ethnicityKey !== 'Total')
  const ueRate2023TotalColumn = ueRate2023Rows.find((row) => row.ethnicityKey === 'Total')

  const detailMapMarkers =
    typeof detail.latitude === 'number' && typeof detail.longitude === 'number'
      ? [
          {
            id: detail.schoolId ?? detail.id ?? detail.name ?? 'school',
            lat: detail.latitude,
            lng: detail.longitude,
            title: detail.name ?? undefined,
            metaLine: `${detail.city || '-'} · ${getAuthorityClassLabel(detail.authorityClass)} · ${getLevelClassLabel(
              detail.levelClass,
            )} · ${getCoEdStatusLabel(detail.coEdStatus)}`,
            statsLine: `${tDetail('eqiIndex')}: ${detail.eqiIndex ?? '-'} · ${tDetail('totalStudents2025')}: ${detail.totalStudents2025 ?? '-'}`,
            markerColor: getAuthorityMarkerColor(detail.authorityClass),
          },
        ]
      : []

  const pageUrl = `${SITE_URL}/${locale}/nzschools/${schoolId}`
  const directoryUrl = `${SITE_URL}/${locale}/nzschools`
  const schoolJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${pageUrl}#school`,
    name: detail.name,
    url: pageUrl,
    sameAs: detail.url || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [detail.addressLine1, detail.addressSuburb].filter(Boolean).join(', ') || undefined,
      addressLocality: detail.city || undefined,
      addressCountry: 'NZ',
    },
    geo:
      typeof detail.latitude === 'number' && typeof detail.longitude === 'number'
        ? {
            '@type': 'GeoCoordinates',
            latitude: detail.latitude,
            longitude: detail.longitude,
          }
        : undefined,
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: tDetail('directory'),
        item: directoryUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: detail.name,
        item: pageUrl,
      },
    ],
  }

  return (
    <main className="page-wrapper py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <nav aria-label={tDetail('breadcrumbLabel')} className="text-muted-foreground mb-4 text-sm">
        <Link href="/nzschools" className="hover:text-foreground underline">
          {tDetail('directory')}
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{detail.name}</span>
      </nav>
      <article>
        <div className="space-y-6">
          <div className="rounded-lg border p-4 md:p-5">
            <h1 className="text-xl font-bold">{detail.name}</h1>
            <SchoolMetaLine
              city={detail.city}
              authorityClassLabel={getAuthorityClassLabel(detail.authorityClass)}
              levelClassLabel={getLevelClassLabel(detail.levelClass)}
              coEdStatusLabel={getCoEdStatusLabel(detail.coEdStatus)}
            />
            {detail.city ? (
              <Link
                href={`/nzschools?city=${encodeURIComponent(detail.city)}`}
                className="text-muted-foreground mt-2 inline-block text-sm underline"
              >
                {tDetail('viewCitySchools', { city: detail.city })}
              </Link>
            ) : null}

            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="text-muted-foreground">{tDetail('schoolId')}</div>
                <div className="text-foreground font-medium">{detail.schoolId}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{tDetail('eqiIndex')}</div>
                <div className="text-foreground font-medium">{detail.eqiIndex ?? '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{tDetail('totalStudents2025')}</div>
                <div className="text-foreground font-medium">{detail.totalStudents2025 ?? '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{tDetail('address')}</div>
                <div className="text-foreground font-medium">
                  {[detail.addressLine1, detail.addressSuburb, detail.city].filter(Boolean).join(', ') || '-'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{tDetail('orgType')}</div>
                <div className="text-foreground font-medium">{getOrgTypeLabel(detail.orgType)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{tDetail('website')}</div>
                {detail.url ? (
                  <a
                    href={detail.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-medium underline"
                  >
                    {detail.url}
                  </a>
                ) : (
                  <div className="text-foreground font-medium">-</div>
                )}
              </div>
            </div>
          </div>

          {ueRate2023Rows.length > 0 ? (
            <div className="rounded-lg border p-4 md:p-5">
              <h2 className="mb-3 text-base font-semibold">{tDetail('ueRateByEthnicity2023')}</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-32" />
                      {ueRate2023EthnicityColumns.map((col) => (
                        <TableHead key={col.ethnicityKey} className="min-w-24 text-center">
                          {getEthnicityLabel(col.ethnicityKey)}
                        </TableHead>
                      ))}
                      <TableHead className="min-w-24 text-center font-semibold">{tDetail('total')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{tDetail('universityEnrolments2023')}</TableCell>
                      {ueRate2023EthnicityColumns.map((col) => (
                        <TableCell key={col.ethnicityKey} className="text-center">
                          {col.universityCount ?? '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">
                        {ueRate2023TotalColumn?.universityCount ?? '-'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{tDetail('totalLeavers2023')}</TableCell>
                      {ueRate2023EthnicityColumns.map((col) => (
                        <TableCell key={col.ethnicityKey} className="text-center">
                          {col.totalLeavers ?? '-'}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">
                        {ueRate2023TotalColumn?.totalLeavers ?? '-'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{tDetail('ueRate')}</TableCell>
                      {ueRate2023EthnicityColumns.map((col) => (
                        <TableCell key={col.ethnicityKey} className="text-center">
                          {formatUeRatePercent(col.ueRate)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">
                        {formatUeRatePercent(ueRate2023TotalColumn?.ueRate)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border p-4 md:p-5">
            <h2 className="mb-3 text-base font-semibold">{tDetail('ethnicityByYearLevel2025')}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tDetail('yearLevel')}</TableHead>
                  {ethnicityColumns.map((col) => (
                    <TableHead key={col}>{getEthnicityLabel(col)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(detail.yearLevelEthnicityCounts2025 ?? []).map((row) => {
                  const countMap = new Map(
                    (row.ethnicityCounts ?? []).map((item) => [item.ethnicity ?? '', item.studentCount ?? 0]),
                  )
                  return (
                    <TableRow key={row.yearLevel}>
                      <TableCell className="font-medium">{row.yearLevel}</TableCell>
                      {ethnicityColumns.map((col) => (
                        <TableCell key={col}>{countMap.get(col) ?? 0}</TableCell>
                      ))}
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell className="font-semibold">{tDetail('total')}</TableCell>
                  {ethnicityColumns.map((col) => (
                    <TableCell key={col} className="font-semibold">
                      {ethnicityTotals[col] ?? 0}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="">
            <div className="space-y-2">
              <h2 className="text-base font-semibold">{tDetail('mapTitle')}</h2>
              <GoogleSchoolMap
                markers={detailMapMarkers}
                heightClassName="h-[300px] md:h-[400px]"
                noCoordinatesText={tDetail('mapNoCoordinates')}
                missingApiKeyText={tDetail('mapMissingApiKey')}
                loadErrorText={tDetail('mapLoadError')}
              />
            </div>

            <div className="mt-5 space-y-2">
              <h2 className="text-base font-semibold">{tDetail('streetViewTitle')}</h2>
              <GoogleStreetView
                lat={detail.latitude}
                lng={detail.longitude}
                heightClassName="h-[400px] md:h-[600px]"
                noCoordinatesText={tDetail('streetViewNoCoordinates')}
                missingApiKeyText={tDetail('streetViewMissingApiKey')}
                loadErrorText={tDetail('streetViewLoadError')}
                noStreetViewText={tDetail('streetViewNotAvailable')}
              />
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}
