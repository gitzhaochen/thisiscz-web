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

export default async function PageNzSchoolDetail({ params }: Props) {
  const { locale, schoolId } = await params
  setRequestLocale(locale)
  const tEnum = await getTranslations({ locale, namespace: 'NzSchoolEnums' })
  const { getRegionLabel, getAuthorityClassLabel, getCoEdStatusLabel, getOrgTypeLabel } =
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

  return (
    <div className="page-wrapper py-6">
      <div className="space-y-6">
        <div className="rounded-lg border p-4 md:p-5">
          <div className="text-xl font-bold">{detail.name}</div>
          <div className="text-foreground mt-1 text-sm">
            School ID: {detail.schoolId} · {getRegionLabel(detail.region)} ·{' '}
            {getAuthorityClassLabel(detail.authorityClass)} · {getOrgTypeLabel(detail.orgType)}
          </div>

          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-muted-foreground">CoEd Status</div>
              <div className="text-foreground/85 font-medium">{getCoEdStatusLabel(detail.coEdStatus)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">EQI Index</div>
              <div className="text-foreground/85 font-medium">{detail.eqiIndex ?? '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Students (2025)</div>
              <div className="text-foreground/85 font-medium">{detail.totalStudents2025 ?? '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Address</div>
              <div className="text-foreground/85 font-medium">
                {[detail.addressLine1, detail.addressSuburb, detail.city].filter(Boolean).join(', ') || '-'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Territorial Authority</div>
              <div className="text-foreground/85 font-medium">{detail.territorialAuthority || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Website</div>
              {detail.url ? (
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/85 font-medium underline"
                >
                  {detail.url}
                </a>
              ) : (
                <div className="text-foreground/85 font-medium">-</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 md:p-5">
          <div className="mb-3 text-lg font-semibold">Year Level Ethnicity Counts (2025)</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year Level</TableHead>
                {ethnicityColumns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
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
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
