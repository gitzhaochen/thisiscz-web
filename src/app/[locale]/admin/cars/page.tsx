'use client'

import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/Pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from '@/i18n/navigation'
import { CarStatus, useDeleteApiCarsPublicId, useGetApiCars, usePatchApiCarsPublicIdStatus } from '@/lib/api/generated'
import type { CarStatusUpdateDTO } from '@/lib/api/generated'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
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
  const currentPage = Math.max(1, Number(searchParams.get('page') || 1))

  const { data: carsData, refetch: refetchCars } = useGetApiCars(
    { page: currentPage, pageSize, status: selectedStatus },
    { query: { staleTime: 0 } },
  )
  const totalPages = Math.ceil((carsData?.totalCount || 0) / pageSize)

  const { mutate: updateStatus, isPending: updateStatusPending } = usePatchApiCarsPublicIdStatus({
    mutation: {
      onSuccess: async () => {
        toast.success('Status updated')
        await queryClient.invalidateQueries({ queryKey: ['/api/cars'] })
        await refetchCars()
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
        await queryClient.invalidateQueries({ queryKey: ['/api/cars'] })
        await refetchCars()
      },
      onError: () => {
        toast.error('Delete failed')
      },
    },
  })

  const onChangeStatus = (publicId: string, status: CarStatusUpdateDTO['status']) => {
    updateStatus({
      publicId,
      data: {
        status,
      },
    })
  }

  const onDeleteCar = (publicId: string, title?: string) => {
    const confirmed = window.confirm(`确定删除车源吗？\n${title || ''}`)
    if (!confirmed) return
    deleteCar({ publicId })
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
        <div className="rounded-md border">
          <Table className="min-w-[1280px] text-sm [&_td]:py-1 [&_th]:h-8 [&_th]:py-1">
            <TableHeader className="bg-muted/40 text-muted-foreground">
              <TableRow>
                <TableHead>头图</TableHead>
                <TableHead>车源 ID</TableHead>
                <TableHead>标题（跳转原文）</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>年份</TableHead>
                <TableHead>里程</TableHead>
                <TableHead>品牌/车型</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-[340px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(carsData?.items || [])
                .filter((car) => !!car.publicId)
                .map((car) => {
                  const imageUrl = car.imageUrls?.[0] || ''
                  const mileageWan =
                    typeof car.mileageKm === 'number' && car.mileageKm > 0
                      ? `${(car.mileageKm / 10000).toFixed(1).replace(/\.0$/, '')}万公里`
                      : '-'
                  const createdAt = car.createdAt ? new Date(car.createdAt).toLocaleString() : '-'
                  const formattedPrice = typeof car.price === 'number' ? car.price.toLocaleString('en-NZ') : '-'

                  return (
                    <TableRow key={car.publicId}>
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
                      <TableCell className="font-mono text-xs">{car.publicId}</TableCell>
                      <TableCell className="max-w-[340px]">
                        {car.sourceUrl ? (
                          <a
                            href={car.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium hover:underline"
                          >
                            <span className="line-clamp-2">{car.postTitle || '-'}</span>
                          </a>
                        ) : (
                          <p className="line-clamp-2 font-medium">{car.postTitle || '-'}</p>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-[#ef4444] tabular-nums">
                        {formattedPrice} {car.currency || ''}
                      </TableCell>
                      <TableCell>{car.year ?? '-'}</TableCell>
                      <TableCell>{mileageWan}</TableCell>
                      <TableCell>
                        {car.manufacturer || '-'} {car.model || ''}
                      </TableCell>
                      <TableCell>{createdAt}</TableCell>
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
                            disabled={deleteCarPending || updateStatusPending}
                            onClick={() => onDeleteCar(car.publicId!, car.postTitle ?? undefined)}
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
                                disabled={updateStatusPending || deleteCarPending}
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
