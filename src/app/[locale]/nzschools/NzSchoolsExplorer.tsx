'use client'

import { Pagination } from '@/components/Pagination'
import { GoogleSchoolMap } from '@/components/NzSchools/GoogleSchoolMap'
import { SchoolMetaLine } from '@/components/NzSchools/SchoolMetaLine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from '@/i18n/navigation'
import type { SchoolDTO, SchoolFilterOptionsDTO } from '@/lib/api/generated'
import { createNzSchoolEnumLabelHelpers } from '@/lib/nzSchoolEnumLabels'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'

export type SchoolFilters = {
  name: string
  city: string
  authorityClass: string
  levelClass: string
  coEdStatus: string
  eqiIndexSortOrder: 'asc' | 'desc'
  ueRateSortOrder?: 'asc' | 'desc'
}

type Props = {
  schools: SchoolDTO[]
  enums: SchoolFilterOptionsDTO
  filters: SchoolFilters
  currentPage: number
  totalPages: number
  totalCount: number
  loadError?: boolean
}

function isSecondaryLevelClass(levelClass: string) {
  return levelClass.trim().toLowerCase() === 'secondary'
}

function formatUeRate(ueRate?: number | null) {
  return typeof ueRate === 'number' && Number.isFinite(ueRate) ? `${(ueRate * 100).toFixed(1)}%` : '-'
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

function buildListUrl(pathname: string, filters: SchoolFilters, page = 1) {
  const params = new URLSearchParams()

  if (filters.name.trim()) params.set('name', filters.name.trim())
  if (filters.city) params.set('city', filters.city)
  if (filters.authorityClass) params.set('authorityClass', filters.authorityClass)
  if (filters.levelClass) params.set('levelClass', filters.levelClass)
  if (filters.coEdStatus) params.set('coEdStatus', filters.coEdStatus)
  if (isSecondaryLevelClass(filters.levelClass)) {
    if (filters.ueRateSortOrder && filters.ueRateSortOrder !== 'desc') {
      params.set('ueRateSortOrder', filters.ueRateSortOrder)
    }
  } else if (filters.eqiIndexSortOrder !== 'asc') {
    params.set('eqiIndexSortOrder', filters.eqiIndexSortOrder)
  }
  if (page > 1) params.set('page', String(page))

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export default function NzSchoolsExplorer({
  schools,
  enums,
  filters,
  currentPage,
  totalPages,
  totalCount,
  loadError,
}: Props) {
  const t = useTranslations('PageNzSchools')
  const tEnum = useTranslations('NzSchoolEnums')
  const { getAuthorityClassLabel, getLevelClassLabel, getCoEdStatusLabel } = useMemo(
    () => createNzSchoolEnumLabelHelpers(tEnum),
    [tEnum],
  )
  const router = useRouter()
  const pathname = usePathname()
  const [draftFilters, setDraftFilters] = useState(filters)
  const [showMobileMoreFilters, setShowMobileMoreFilters] = useState(false)

  const mapMarkers = useMemo(
    () =>
      schools
        .filter((school) => typeof school.latitude === 'number' && typeof school.longitude === 'number')
        .map((school) => ({
          id: school.schoolId ?? school.id ?? school.name ?? 'school',
          lat: school.latitude as number,
          lng: school.longitude as number,
          title: school.name,
          metaLine: `${school.city || '-'} · ${getAuthorityClassLabel(school.authorityClass)} · ${getLevelClassLabel(
            school.levelClass,
          )} · ${getCoEdStatusLabel(school.coEdStatus)}`,
          statsLine: `${t('totalStudents')}: ${school.totalStudents ?? '-'} · EQI: ${school.eqiIndex ?? '-'}`,
          markerColor: getAuthorityMarkerColor(school.authorityClass),
        })),
    [schools, getAuthorityClassLabel, getLevelClassLabel, getCoEdStatusLabel, t],
  )

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push(buildListUrl(pathname, draftFilters))
  }

  const onReset = () => {
    const resetFilters: SchoolFilters = {
      name: '',
      city: '',
      authorityClass: '',
      levelClass: '',
      coEdStatus: '',
      eqiIndexSortOrder: 'asc',
    }
    setDraftFilters(resetFilters)
    router.push(pathname)
  }

  return (
    <>
      <div className="mb-6 space-y-4 rounded-lg border p-3">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 space-y-1">
                <label className="text-muted-foreground hidden text-xs md:block" htmlFor="school-name">
                  {t('namePlaceholder')}
                </label>
                <Input
                  id="school-name"
                  value={draftFilters.name}
                  onChange={(event) => setDraftFilters((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder={t('namePlaceholder')}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="md:hidden"
                onClick={() => setShowMobileMoreFilters((previous) => !previous)}
              >
                {showMobileMoreFilters ? t('lessFilters') : t('moreFilters')}
              </Button>
            </div>

            <FilterSelect
              label={t('city')}
              value={draftFilters.city}
              options={enums.city ?? []}
              allLabel={t('all')}
              visible={showMobileMoreFilters}
              onChange={(value) => setDraftFilters((previous) => ({ ...previous, city: value }))}
            />
            <FilterSelect
              label={t('levelClass')}
              value={draftFilters.levelClass}
              options={enums.levelClass ?? []}
              getLabel={getLevelClassLabel}
              allLabel={t('all')}
              visible={showMobileMoreFilters}
              onChange={(levelClass) =>
                setDraftFilters((previous) => ({
                  ...previous,
                  levelClass,
                  ueRateSortOrder: isSecondaryLevelClass(levelClass) ? 'desc' : undefined,
                }))
              }
            />
            <FilterSelect
              label={t('authorityClass')}
              value={draftFilters.authorityClass}
              options={enums.authorityClass ?? []}
              getLabel={getAuthorityClassLabel}
              allLabel={t('all')}
              visible={showMobileMoreFilters}
              onChange={(authorityClass) => setDraftFilters((previous) => ({ ...previous, authorityClass }))}
            />
            <FilterSelect
              label={t('coEdStatus')}
              value={draftFilters.coEdStatus}
              options={enums.coEdStatus ?? []}
              getLabel={getCoEdStatusLabel}
              allLabel={t('all')}
              visible={showMobileMoreFilters}
              onChange={(coEdStatus) => setDraftFilters((previous) => ({ ...previous, coEdStatus }))}
            />

            <div className={showMobileMoreFilters ? 'space-y-1' : 'hidden space-y-1 md:block'}>
              <div className="text-muted-foreground text-xs">
                {isSecondaryLevelClass(draftFilters.levelClass) ? t('ueRateSortOrder') : t('eqiIndexSortOrder')}
              </div>
              <Select
                value={
                  isSecondaryLevelClass(draftFilters.levelClass)
                    ? (draftFilters.ueRateSortOrder ?? 'desc')
                    : draftFilters.eqiIndexSortOrder
                }
                onValueChange={(value) =>
                  setDraftFilters((previous) =>
                    isSecondaryLevelClass(previous.levelClass)
                      ? { ...previous, ueRateSortOrder: value === 'asc' ? 'asc' : 'desc' }
                      : { ...previous, eqiIndexSortOrder: value === 'desc' ? 'desc' : 'asc' },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    {isSecondaryLevelClass(draftFilters.levelClass) ? t('ueRateSortAsc') : t('sortAsc')}
                  </SelectItem>
                  <SelectItem value="desc">
                    {isSecondaryLevelClass(draftFilters.levelClass) ? t('ueRateSortDesc') : t('sortDesc')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 md:flex-none">
              {t('applyFilters')}
            </Button>
            <Button type="button" variant="outline" className="flex-1 md:flex-none" onClick={onReset}>
              {t('resetFilters')}
            </Button>
          </div>
        </form>
      </div>

      {loadError ? <p className="text-destructive mb-4 text-sm">{t('loadError')}</p> : null}
      <p className="text-muted-foreground mb-4 text-sm">{t('resultCount', { count: totalCount })}</p>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-2 lg:sticky lg:top-4 lg:order-2">
          <h2 className="text-lg font-semibold">{t('mapTitle')}</h2>
          <GoogleSchoolMap
            markers={mapMarkers}
            heightClassName="h-[460px] lg:h-[680px]"
            noCoordinatesText={t('mapNoCoordinates')}
            missingApiKeyText={t('mapMissingApiKey')}
            loadErrorText={t('mapLoadError')}
          />
        </div>

        <section aria-label={t('resultsTitle')} className="lg:order-1">
          <div className="space-y-3">
            {schools.map((school) => (
              <article key={school.schoolId}>
                <Link
                  href={`/nzschools/${school.schoolId}`}
                  className="hover:bg-muted/40 block rounded-lg border p-4 transition-colors"
                >
                  <h2 className="text-base font-semibold">{school.name}</h2>
                  <SchoolMetaLine
                    city={school.city}
                    authorityClassLabel={getAuthorityClassLabel(school.authorityClass)}
                    levelClassLabel={getLevelClassLabel(school.levelClass)}
                    coEdStatusLabel={getCoEdStatusLabel(school.coEdStatus)}
                    className="mt-2"
                  />
                  <p className="text-foreground mt-2 text-xs">
                    {t('totalStudents')}: {school.totalStudents ?? '-'} · EQI: {school.eqiIndex ?? '-'}
                    {isSecondaryLevelClass(filters.levelClass) ? (
                      <>
                        {' · '}
                        {t('ueRate')}: {formatUeRate(school.ueRate)}
                      </>
                    ) : null}
                  </p>
                </Link>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  options: string[]
  allLabel: string
  visible: boolean
  getLabel?: (value?: string | null) => string
  onChange: (value: string) => void
}

function FilterSelect({ label, value, options, allLabel, visible, getLabel, onChange }: FilterSelectProps) {
  return (
    <div className={visible ? 'space-y-1' : 'hidden space-y-1 md:block'}>
      <div className="text-muted-foreground text-xs">{label}</div>
      <Select value={value || 'all'} onValueChange={(nextValue) => onChange(nextValue === 'all' ? '' : nextValue)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {getLabel ? getLabel(option) : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
