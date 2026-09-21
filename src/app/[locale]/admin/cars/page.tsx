'use client'

import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/Pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from '@/i18n/navigation'
import {
  CarStatus,
  useDeleteApiCarsPublicId,
  useGetApiCars,
  usePatchApiCarsBatchStatus,
  usePatchApiCarsPublicIdStatus,
  usePostApiCarsBatchDelete,
} from '@/lib/api/generated'
import type { CarStatusUpdateDTO } from '@/lib/api/generated'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const statusOptions = [CarStatus.active, CarStatus.pending, CarStatus.sold, CarStatus.offShelf] as const
const pageSize = 20
const statusTabLabels: Record<CarStatus, string> = {
  [CarStatus.active]: '在售',
  [CarStatus.pending]: '待售',
  [CarStatus.sold]: '已售',
  [CarStatus.offShelf]: '下架',
}

export default function AdminCarsPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedStatus, setSelectedStatus] = useState<CarStatus>(CarStatus.active)
  const [selectedPublicIds, setSelectedPublicIds] = useState<string[]>([])
  const selectAllRef = useRef<HTMLInputElement>(null)
  const currentPage = Math.max(1, Number(searchParams.get('page') || 1))

  const { data: carsData, refetch: refetchCars } = useGetApiCars(
    { page: currentPage, pageSize, status: selectedStatus },
    { query: { staleTime: 0 } },
  )
  const totalPages = Math.ceil((carsData?.totalCount || 0) / pageSize)
  const cars = useMemo(() => (carsData?.items || []).filter((car) => !!car.publicId), [carsData?.items])
  const pagePublicIds = useMemo(() => cars.map((car) => car.publicId!), [cars])
  const allPageSelected = pagePublicIds.length > 0 && pagePublicIds.every((id) => selectedPublicIds.includes(id))
  const somePageSelected = pagePublicIds.some((id) => selectedPublicIds.includes(id))
  const batchStatusOptions = statusOptions.filter((status) => status !== selectedStatus)

  useEffect(() => {
    setSelectedPublicIds([])
  }, [selectedStatus, currentPage])

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !allPageSelected && somePageSelected
    }
  }, [allPageSelected, somePageSelected])

  const invalidateCars = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/cars'] })
    await refetchCars()
  }

  const { mutate: updateStatus, isPending: updateStatusPending } = usePatchApiCarsPublicIdStatus({
    mutation: {
      onSuccess: async () => {
        toast.success('Status updated')
        await invalidateCars()
      },
      onError: () => {
        toast.error('Status update failed')
      },
    },
  })

  const { mutate: deleteCar, isPending: deleteCarPending } = useDeleteApiCarsPublicId({
    mutation: {
      onSuccess: async () => {
        toast.success('Car deleted')
        await invalidateCars()
      },
      onError: () => {
        toast.error('Delete failed')
      },
    },
  })

  const { mutate: batchUpdateStatus, isPending: batchUpdateStatusPending } = usePatchApiCarsBatchStatus({
    mutation: {
      onSuccess: async () => {
        toast.success('批量状态更新成功')
        setSelectedPublicIds([])
        await invalidateCars()
      },
      onError: () => {
        toast.error('批量状态更新失败')
      },
    },
  })

  const { mutate: batchDeleteCars, isPending: batchDeletePending } = usePostApiCarsBatchDelete({
    mutation: {
      onSuccess: async () => {
        toast.success('批量删除成功')
        setSelectedPublicIds([])
        await invalidateCars()
      },
      onError: () => {
        toast.error('批量删除失败')
      },
    },
  })

  const actionPending = updateStatusPending || deleteCarPending || batchUpdateStatusPending || batchDeletePending

  const onChangeStatus = (publicId: string, status: CarStatusUpdateDTO['status']) => {
    updateStatus({
      publicId,
      data: {
        status,
      },
    })
  }

  const deleteImages = async (imageUrls: string[]) => {
    if (imageUrls.length === 0) return true

    try {
      const response = await fetch('/api/xiaohongshu/delete-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
        }),
      })
      if (!response.ok) {
        throw new Error(`Delete images failed: ${response.status}`)
      }
      return true
    } catch (error) {
      console.error('Delete R2 images before deleting car failed:', error)
      toast.error('删除图片失败，已取消删除车源')
      return false
    }
  }

  const onDeleteCar = async (car: {
    publicId?: string | null
    postTitle?: string | null
    imageUrls?: string[]
  }) => {
    const publicId = car.publicId || ''
    if (!publicId) return

    const title = car.postTitle || ''
    const confirmed = window.confirm(`确定删除车源吗？\n${title || ''}`)
    if (!confirmed) return

    const imageUrls = Array.isArray(car.imageUrls) ? car.imageUrls.filter((x) => typeof x === 'string' && x.trim()) : []
    const imagesDeleted = await deleteImages(imageUrls)
    if (!imagesDeleted) return

    deleteCar({ publicId })
  }

  const onBatchChangeStatus = (status: CarStatus) => {
    if (selectedPublicIds.length === 0) return

    const confirmed = window.confirm(
      `确定将选中的 ${selectedPublicIds.length} 条车源批量设为「${statusTabLabels[status]}」吗？`,
    )
    if (!confirmed) return

    batchUpdateStatus({
      data: {
        publicIds: selectedPublicIds,
        status,
      },
    })
  }

  const onBatchDelete = async () => {
    if (selectedPublicIds.length === 0) return

    const confirmed = window.confirm(`确定批量删除选中的 ${selectedPublicIds.length} 条车源吗？`)
    if (!confirmed) return

    const selectedCars = cars.filter((car) => selectedPublicIds.includes(car.publicId!))
    const imageUrls = selectedCars
      .flatMap((car) => (Array.isArray(car.imageUrls) ? car.imageUrls : []))
      .filter((x) => typeof x === 'string' && x.trim())

    const imagesDeleted = await deleteImages(imageUrls)
    if (!imagesDeleted) return

    batchDeleteCars({
      data: {
        publicIds: selectedPublicIds,
      },
    })
  }

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedPublicIds((prev) => prev.filter((id) => !pagePublicIds.includes(id)))
      return
    }
    setSelectedPublicIds((prev) => Array.from(new Set([...prev, ...pagePublicIds])))
  }

  const toggleSelectOne = (publicId: string) => {
    setSelectedPublicIds((prev) =>
      prev.includes(publicId) ? prev.filter((id) => id !== publicId) : [...prev, publicId],
    )
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as CarStatus)
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Car source list</h1>
          <Link href="/admin/cars/parse">
            <Button>Parse car source</Button>
          </Link>
        </div>
        <Tabs value={selectedStatus} onValueChange={handleStatusChange}>
          <TabsList>
            {statusOptions.map((status) => (
              <TabsTrigger key={status} value={status}>
                {statusTabLabels[status]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">
            已选 {selectedPublicIds.length} 条
          </span>
          <Button
            size="xs"
            variant="destructive"
            disabled={selectedPublicIds.length === 0 || actionPending}
            onClick={() => void onBatchDelete()}
          >
            批量删除
          </Button>
          {batchStatusOptions.map((status) => (
            <Button
              key={status}
              size="xs"
              variant="outline"
              disabled={selectedPublicIds.length === 0 || actionPending}
              onClick={() => onBatchChangeStatus(status)}
            >
              批量{statusTabLabels[status]}
            </Button>
          ))}
        </div>
        <div className="rounded-md border">
          <Table className="min-w-[1280px] text-sm [&_td]:py-1 [&_th]:h-8 [&_th]:py-1">
            <TableHeader className="bg-muted/40 text-muted-foreground">
              <TableRow>
                <TableHead className="w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-current"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    aria-label="全选当前页"
                  />
                </TableHead>
                <TableHead>头图</TableHead>
                <TableHead>车源 ID</TableHead>
                <TableHead>标题（跳转原文）</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>年份</TableHead>
                <TableHead>里程</TableHead>
                <TableHead>品牌/车型</TableHead>
                <TableHead>原贴发布时间</TableHead>
                <TableHead className="w-[340px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => {
                const imageUrl = car.imageUrls?.[0] || ''
                const mileageWan =
                  typeof car.mileageKm === 'number' && car.mileageKm > 0
                    ? `${(car.mileageKm / 10000).toFixed(1).replace(/\.0$/, '')}万公里`
                    : '-'
                const publishedAt = car.originalPostPublishedAt
                const originalPostPublishedAt = publishedAt ? new Date(publishedAt).toLocaleString() : '-'
                const formattedPrice = typeof car.price === 'number' ? car.price.toLocaleString('en-NZ') : '-'
                const isSelected = selectedPublicIds.includes(car.publicId!)

                return (
                  <TableRow key={car.publicId} data-state={isSelected ? 'selected' : undefined}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-current"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(car.publicId!)}
                        aria-label={`选择 ${car.publicId}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded border">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={car.postTitle || ''}
                            fill
                            className="object-cover object-center"
                          />
                        ) : (
                          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                            N/A
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{car.publicId}</TableCell>
                    <TableCell className="max-w-[340px]">
                      <p className="truncate font-medium" title={car.postTitle || undefined}>
                        {car.postTitle || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold text-[#ef4444] tabular-nums">
                      {formattedPrice} {car.currency || ''}
                    </TableCell>
                    <TableCell>{car.year ?? '-'}</TableCell>
                    <TableCell>{mileageWan}</TableCell>
                    <TableCell>
                      {car.manufacturer || '-'} {car.model || ''}
                    </TableCell>
                    <TableCell>{originalPostPublishedAt}</TableCell>
                    <TableCell className="w-[340px]">
                      <div className="flex flex-nowrap gap-2 whitespace-nowrap">
                        <Link href={`/admin/cars/form?id=${car.publicId}`}>
                          <Button size="xs" variant="outline" className="inline-flex items-center gap-1">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="xs"
                          variant="destructive"
                          className="inline-flex items-center gap-1"
                          disabled={actionPending}
                          onClick={() =>
                            void onDeleteCar({
                              publicId: car.publicId,
                              postTitle: car.postTitle,
                              imageUrls: car.imageUrls,
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {statusOptions
                          .filter((status) => status !== car.status)
                          .map((status) => (
                            <Button
                              key={status}
                              size="xs"
                              variant="outline"
                              disabled={actionPending}
                              onClick={() => onChangeStatus(car.publicId!, status)}
                            >
                              {statusTabLabels[status]}
                            </Button>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center pt-2">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  )
}
