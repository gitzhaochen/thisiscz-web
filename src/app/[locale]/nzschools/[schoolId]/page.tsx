import { GoogleSchoolMap } from '@/components/NzSchools/GoogleSchoolMap'
import { GoogleStreetView } from '@/components/NzSchools/GoogleStreetView'
import { SchoolMetaLine } from '@/components/NzSchools/SchoolMetaLine'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetchServer } from '@/lib/apiFetch'
import type { SchoolDetailDTO } from '@/lib/api/generated'
import { createNzSchoolEnumLabelHelpers } from '@/lib/nzSchoolEnumLabels'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ locale: Locale; schoolId: string }>
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

  let detail: SchoolDetailDTO | null = null
  try {
    detail = await apiFetchServer(`/api/schools/${schoolId}`)
  } catch {
    notFound()
  }

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

  return (
    <div className="page-wrapper py-6">
      <div className="space-y-6">
        <div className="rounded-lg border p-4 md:p-5">
          <div className="text-xl font-bold">{detail.name}</div>
          <SchoolMetaLine
            city={detail.city}
            authorityClassLabel={getAuthorityClassLabel(detail.authorityClass)}
            levelClassLabel={getLevelClassLabel(detail.levelClass)}
            coEdStatusLabel={getCoEdStatusLabel(detail.coEdStatus)}
          />

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

        <div className="rounded-lg border p-4 md:p-5">
          <div className="mb-3 text-base font-semibold">{tDetail('ethnicityByYearLevel2025')}</div>
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
                      <TableCell key={col}>{countMap.get(col) ?? '-'}</TableCell>
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
            <div className="text-base font-semibold">{tDetail('mapTitle')}</div>
            <GoogleSchoolMap
              markers={detailMapMarkers}
              heightClassName="h-[300px] md:h-[400px]"
              noCoordinatesText={tDetail('mapNoCoordinates')}
              missingApiKeyText={tDetail('mapMissingApiKey')}
              loadErrorText={tDetail('mapLoadError')}
            />
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-base font-semibold">{tDetail('streetViewTitle')}</div>
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
    </div>
  )
}
