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

export default async function PageNzSchoolDetail({ params }: Props) {
  const { locale, schoolId } = await params
  setRequestLocale(locale)
  const tEnum = await getTranslations({ locale, namespace: 'NzSchoolEnums' })
  const { getAuthorityClassLabel, getLevelClassLabel, getCoEdStatusLabel, getOrgTypeLabel } =
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
              <div className="text-muted-foreground">学校ID</div>
              <div className="text-foreground font-medium">{detail.schoolId}</div>
            </div>
            <div>
              <div className="text-muted-foreground">EQI指数</div>
              <div className="text-foreground font-medium">{detail.eqiIndex ?? '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">2025在校总人数</div>
              <div className="text-foreground font-medium">{detail.totalStudents2025 ?? '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">地址</div>
              <div className="text-foreground font-medium">
                {[detail.addressLine1, detail.addressSuburb, detail.city].filter(Boolean).join(', ') || '-'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">学校类型</div>
              <div className="text-foreground font-medium">{getOrgTypeLabel(detail.orgType)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">学校网站</div>
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
          <div className="mb-3 text-lg font-semibold">2025年各年级种族人数</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>年级</TableHead>
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
              <TableRow>
                <TableCell className="font-semibold">合计</TableCell>
                {ethnicityColumns.map((col) => (
                  <TableCell key={col} className="font-semibold">
                    {ethnicityTotals[col] ?? 0}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
