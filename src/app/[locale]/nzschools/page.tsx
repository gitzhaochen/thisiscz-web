'use client'

import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from '@/i18n/navigation'
import { type GetApiSchoolsParams, useGetApiSchools, useGetApiSchoolsEnums } from '@/lib/api/generated'
import { createNzSchoolEnumLabelHelpers } from '@/lib/nzSchoolEnumLabels'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'

const pageSize = 20

type FiltersState = {
  name: string
  region: string
  authorityClass: string
  coEdStatus: string
  eqiIndexSortOrder: 'asc' | 'desc'
  orgType: string[]
}

function parseFilters(searchParams: URLSearchParams): FiltersState {
  const sortOrder = searchParams.get('eqiIndexSortOrder') === 'desc' ? 'desc' : 'asc'
  return {
    name: searchParams.get('name') ?? '',
    region: searchParams.get('region') ?? '',
    authorityClass: searchParams.get('authorityClass') ?? '',
    coEdStatus: searchParams.get('coEdStatus') ?? '',
    eqiIndexSortOrder: sortOrder,
    orgType: searchParams.getAll('orgType').filter(Boolean),
  }
}

function buildListUrl(pathname: string, filters: FiltersState, page: number): string {
  const params = new URLSearchParams()

  if (filters.name.trim()) params.set('name', filters.name.trim())
  if (filters.region) params.set('region', filters.region)
  if (filters.authorityClass) params.set('authorityClass', filters.authorityClass)
  if (filters.coEdStatus) params.set('coEdStatus', filters.coEdStatus)
  if (filters.eqiIndexSortOrder !== 'asc') params.set('eqiIndexSortOrder', filters.eqiIndexSortOrder)
  for (const orgType of filters.orgType) {
    params.append('orgType', orgType)
  }

  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  return `${pathname}?${params.toString()}`
}

export default function PageNzSchools() {
  const t = useTranslations('PageNzSchools')
  const tEnum = useTranslations('NzSchoolEnums')
  const { getRegionLabel, getAuthorityClassLabel, getCoEdStatusLabel, getOrgTypeLabel } =
    createNzSchoolEnumLabelHelpers(tEnum)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get('page')) || 1
  const activeFilters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams])
  const [draftFilters, setDraftFilters] = useState<FiltersState>(activeFilters)

  const params = useMemo<GetApiSchoolsParams>(
    () => ({
      page: currentPage,
      pageSize,
      name: activeFilters.name || undefined,
      region: activeFilters.region || undefined,
      authorityClass: activeFilters.authorityClass || undefined,
      coEdStatus: activeFilters.coEdStatus || undefined,
      eqiIndexSortOrder: activeFilters.eqiIndexSortOrder || undefined,
      orgType: activeFilters.orgType.length > 0 ? activeFilters.orgType : undefined,
    }),
    [currentPage, activeFilters],
  )

  useEffect(() => {
    setDraftFilters(activeFilters)
  }, [activeFilters])

  const enumsQuery = useGetApiSchoolsEnums({
    query: {
      staleTime: 5 * 60 * 1000,
    },
  })

  const schoolsQuery = useGetApiSchools(params, {
    query: {
      staleTime: 60 * 1000,
      placeholderData: (previousData) => previousData,
    },
  })

  const totalPages = Math.max(1, Math.ceil((schoolsQuery.data?.totalCount ?? 0) / pageSize))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    router.push(buildListUrl(pathname, draftFilters, 1))
  }

  const onReset = () => {
    const resetFilters: FiltersState = {
      name: '',
      region: '',
      authorityClass: '',
      coEdStatus: '',
      eqiIndexSortOrder: 'asc',
      orgType: [],
    }
    setDraftFilters(resetFilters)
    router.push(buildListUrl(pathname, resetFilters, 1))
  }

  const toggleOrgType = (value: string) => {
    setDraftFilters((prev) => {
      const exists = prev.orgType.includes(value)
      return {
        ...prev,
        orgType: exists ? prev.orgType.filter((x) => x !== value) : [...prev.orgType, value],
      }
    })
  }

  return (
    <div className="page-wrapper py-6">
      <div className="mb-6 space-y-4 rounded-lg border p-4">
        <div className="text-lg font-semibold">{t('filtersTitle')}</div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">{t('namePlaceholder')}</div>
              <Input
                value={draftFilters.name}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">{t('region')}</div>
              <Select
                value={draftFilters.region || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({ ...prev, region: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {(enumsQuery.data?.region ?? []).map((item) => (
                    <SelectItem key={item} value={item}>
                      {getRegionLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">{t('authorityClass')}</div>
              <Select
                value={draftFilters.authorityClass || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    authorityClass: value === 'all' ? '' : value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('authorityClass')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {(enumsQuery.data?.authorityClass ?? []).map((item) => (
                    <SelectItem key={item} value={item}>
                      {getAuthorityClassLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">{t('coEdStatus')}</div>
              <Select
                value={draftFilters.coEdStatus || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({ ...prev, coEdStatus: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('coEdStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {(enumsQuery.data?.coEdStatus ?? []).map((item) => (
                    <SelectItem key={item} value={item}>
                      {getCoEdStatusLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">{t('eqiIndexSortOrder')}</div>
              <Select
                value={draftFilters.eqiIndexSortOrder}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    eqiIndexSortOrder: value === 'desc' ? 'desc' : 'asc',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('eqiIndexSortOrder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('sortAsc')}</SelectItem>
                  <SelectItem value="desc">{t('sortDesc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t('orgType')}</div>
            <div className="grid gap-2 rounded-md border p-3 md:grid-cols-2 lg:grid-cols-3">
              {(enumsQuery.data?.orgType ?? []).map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={draftFilters.orgType.includes(item)}
                    onChange={() => toggleOrgType(item)}
                  />
                  <span>{getOrgTypeLabel(item)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">{t('applyFilters')}</Button>
            <Button type="button" variant="outline" onClick={onReset}>
              {t('resetFilters')}
            </Button>
          </div>
        </form>
      </div>

      {(schoolsQuery.isPending || enumsQuery.isPending) && (
        <div className="my-4 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-gray-500 dark:border-white"></div>
        </div>
      )}

      {schoolsQuery.isError && <div className="text-destructive text-sm">{t('loadError')}</div>}

      <div className="space-y-3">
        {(schoolsQuery.data?.items ?? []).map((school) => (
          <Link
            key={school.schoolId}
            href={`/nzschools/${school.schoolId}`}
            className="hover:bg-muted/40 block rounded-lg border p-4 transition-colors"
          >
            <div className="text-base font-semibold">{school.name}</div>
            <div className="text-foreground mt-1 text-sm">
              {getRegionLabel(school.region)} · {getAuthorityClassLabel(school.authorityClass)} ·{' '}
              {getOrgTypeLabel(school.orgType)} · {getCoEdStatusLabel(school.coEdStatus)}
            </div>
            <div className="text-foreground mt-1 text-xs">
              EQI: {school.eqiIndex ?? '-'} · {t('totalStudents')}: {school.totalStudents ?? '-'}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
