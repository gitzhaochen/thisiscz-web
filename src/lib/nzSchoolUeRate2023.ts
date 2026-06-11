import type { SchoolDetailDTO } from '@/lib/api/generated'

export type UeRate2023Row = {
  ethnicityKey: string
  universityCount: number | null
  totalLeavers: number | null
  ueRate: number | null
}

const ethnicityFieldMap: Array<{
  ethnicityKey: string
  universityField: keyof SchoolDetailDTO
  leaversField: keyof SchoolDetailDTO
}> = [
  {
    ethnicityKey: 'Asian',
    universityField: 'asianUniversity2023',
    leaversField: 'asianTotalLeavers2023',
  },
  {
    ethnicityKey: 'European/Pākehā',
    universityField: 'europeanPakehaUniversity2023',
    leaversField: 'europeanPakehaTotalLeavers2023',
  },
  {
    ethnicityKey: 'Māori',
    universityField: 'maoriUniversity2023',
    leaversField: 'maoriTotalLeavers2023',
  },
  {
    ethnicityKey: 'Pacific',
    universityField: 'pacificUniversity2023',
    leaversField: 'pacificTotalLeavers2023',
  },
  {
    ethnicityKey: 'MELAA',
    universityField: 'melaaUniversity2023',
    leaversField: 'melaaTotalLeavers2023',
  },
  {
    ethnicityKey: 'Other',
    universityField: 'otherUniversity2023',
    leaversField: 'otherTotalLeavers2023',
  },
  {
    ethnicityKey: 'International fee paying',
    universityField: 'internationalFeePayingUniversity2023',
    leaversField: 'internationalFeePayingTotalLeavers2023',
  },
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

  const ethnicityRows = ethnicityFieldMap.map(({ ethnicityKey, universityField, leaversField }) => {
    const universityCount = toNullableNumber(detail[universityField])
    const totalLeavers = toNullableNumber(detail[leaversField])
    return {
      ethnicityKey,
      universityCount,
      totalLeavers,
      ueRate: calculateUeRate(universityCount, totalLeavers),
    }
  })

  const visibleEthnicityRows = ethnicityRows.filter(
    (row) => row.universityCount !== null || row.totalLeavers !== null,
  )

  const totalRow: UeRate2023Row = {
    ethnicityKey: 'Total',
    universityCount: toNullableNumber(detail.totalUniversity2023),
    totalLeavers: schoolTotalLeavers,
    ueRate:
      typeof detail.ueRate === 'number'
        ? detail.ueRate
        : calculateUeRate(toNullableNumber(detail.totalUniversity2023), schoolTotalLeavers),
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
