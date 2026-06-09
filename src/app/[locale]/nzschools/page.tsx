'use client'

import { Pagination } from '@/components/Pagination'
import { SchoolMetaLine } from '@/components/NzSchools/SchoolMetaLine'
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
  city: string
  authorityClass: string
  levelClass: string
  coEdStatus: string
  eqiIndexSortOrder: 'asc' | 'desc'
}

function parseFilters(searchParams: URLSearchParams): FiltersState {
  const sortOrder = searchParams.get('eqiIndexSortOrder') === 'desc' ? 'desc' : 'asc'
  return {
    name: searchParams.get('name') ?? '',
    city: searchParams.get('city') ?? '',
    authorityClass: searchParams.get('authorityClass') ?? '',
    levelClass: searchParams.get('levelClass') ?? '',
    coEdStatus: searchParams.get('coEdStatus') ?? '',
    eqiIndexSortOrder: sortOrder,
  }
}

function buildListUrl(pathname: string, filters: FiltersState, page: number): string {
  const params = new URLSearchParams()

  if (filters.name.trim()) params.set('name', filters.name.trim())
  if (filters.city) params.set('city', filters.city)
  if (filters.authorityClass) params.set('authorityClass', filters.authorityClass)
  if (filters.levelClass) params.set('levelClass', filters.levelClass)
  if (filters.coEdStatus) params.set('coEdStatus', filters.coEdStatus)
  if (filters.eqiIndexSortOrder !== 'asc') params.set('eqiIndexSortOrder', filters.eqiIndexSortOrder)

  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  return `${pathname}?${params.toString()}`
}

export default function PageNzSchools() {
  const t = useTranslations('PageNzSchools')
  const tEnum = useTranslations('NzSchoolEnums')
  const { getAuthorityClassLabel, getLevelClassLabel, getCoEdStatusLabel } = createNzSchoolEnumLabelHelpers(tEnum)
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
      city: activeFilters.city || undefined,
      authorityClass: activeFilters.authorityClass || undefined,
      levelClass: activeFilters.levelClass || undefined,
      coEdStatus: activeFilters.coEdStatus || undefined,
      eqiIndexSortOrder: activeFilters.eqiIndexSortOrder || undefined,
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
      city: '',
      authorityClass: '',
      levelClass: '',
      coEdStatus: '',
      eqiIndexSortOrder: 'asc',
    }
    setDraftFilters(resetFilters)
    router.push(buildListUrl(pathname, resetFilters, 1))
  }

  return (
    <div className="page-wrapper py-6">
      <div className="mb-6 space-y-4 rounded-lg border p-4">
        <div className="text-lg font-semibold">{t('filtersTitle')}</div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">{t('namePlaceholder')}</div>
              <Input
                value={draftFilters.name}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground text-xs">{t('city')}</div>
              <Select
                value={draftFilters.city || 'all'}
                onValueChange={(value) => setDraftFilters((prev) => ({ ...prev, city: value === 'all' ? '' : value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('city')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {(enumsQuery.data?.city ?? []).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
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
              <div className="text-muted-foreground text-xs">{t('levelClass')}</div>
              <Select
                value={draftFilters.levelClass || 'all'}
                onValueChange={(value) =>
                  setDraftFilters((prev) => ({ ...prev, levelClass: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('levelClass')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {(enumsQuery.data?.levelClass ?? []).map((item) => (
                    <SelectItem key={item} value={item}>
                      {getLevelClassLabel(item)}
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
            <SchoolMetaLine
              city={school.city}
              authorityClassLabel={getAuthorityClassLabel(school.authorityClass)}
              levelClassLabel={getLevelClassLabel(school.levelClass)}
              coEdStatusLabel={getCoEdStatusLabel(school.coEdStatus)}
              className="mt-2"
            />
            <div className="text-foreground mt-2 text-xs">
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
