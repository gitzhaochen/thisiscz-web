import type { SchoolDetailDTO } from '@/lib/api/generated'

export type UeRate2023Row = {
  ethnicityKey: string
  universityCount: number | null
  totalLeavers: number | null
  ueRate: number | null
}

const ethnicityUniversityFieldMap: Array<{
  ethnicityKey: string
  field: keyof SchoolDetailDTO
}> = [
  { ethnicityKey: 'Asian', field: 'asianUniversity2023' },
  { ethnicityKey: 'European/Pākehā', field: 'europeanPakehaUniversity2023' },
  { ethnicityKey: 'Māori', field: 'maoriUniversity2023' },
  { ethnicityKey: 'Pacific', field: 'pacificUniversity2023' },
  { ethnicityKey: 'MELAA', field: 'melaaUniversity2023' },
  { ethnicityKey: 'Other', field: 'otherUniversity2023' },
  { ethnicityKey: 'International fee paying', field: 'internationalFeePayingUniversity2023' },
]

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function calculateUeRate(universityCount: number | null, totalLeavers: number | null): number | null {
  if (universityCount === null || totalLeavers === null || totalLeavers <= 0) {
    return null
  }
  return Math.round((universityCount / totalLeavers) * 10000) / 10000
}

export function formatUeRatePercent(ueRate: number | null | undefined) {
  if (typeof ueRate !== 'number' || Number.isNaN(ueRate)) {
    return '-'
  }
  return `${(ueRate * 100).toFixed(1)}%`
}

export function buildUeRate2023Rows(detail: SchoolDetailDTO): UeRate2023Row[] {
  const schoolTotalLeavers = toNullableNumber(detail.totalLeavers2023)

  const ethnicityRows = ethnicityUniversityFieldMap.map(({ ethnicityKey, field }) => {
    const universityCount = toNullableNumber(detail[field])
    return {
      ethnicityKey,
      universityCount,
      totalLeavers: schoolTotalLeavers,
      ueRate: calculateUeRate(universityCount, schoolTotalLeavers),
    }
  })

  const visibleEthnicityRows = ethnicityRows.filter((row) => row.universityCount !== null)

  const totalRow: UeRate2023Row = {
    ethnicityKey: 'Total',
    universityCount: toNullableNumber(detail.totalUniversity2023),
    totalLeavers: schoolTotalLeavers,
    ueRate:
      typeof detail.ueRate === 'number'
        ? detail.ueRate
        : calculateUeRate(
            toNullableNumber(detail.totalUniversity2023),
            schoolTotalLeavers,
          ),
  }

  if (
    totalRow.universityCount === null &&
    totalRow.totalLeavers === null &&
    visibleEthnicityRows.length === 0
  ) {
    return []
  }

  return [...visibleEthnicityRows, totalRow]
}
