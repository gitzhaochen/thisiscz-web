'use client'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from '@/i18n/navigation'
import { CarStatus, useDeleteApiCarsPublicId, useGetApiCars, usePatchApiCarsPublicIdStatus } from '@/lib/api/generated'
import type { CarStatusUpdateDTO } from '@/lib/api/generated'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
const statusOptions = [CarStatus.active, CarStatus.sold, CarStatus.offShelf] as const
const statusTabLabels: Record<CarStatus, string> = {
  [CarStatus.active]: '在售',
  [CarStatus.sold]: '已售',
  [CarStatus.offShelf]: '下架',
}

export default function AdminCarsPage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<CarStatus>(CarStatus.active)

  const { data: carsData, refetch: refetchCars } = useGetApiCars(
    { page: 1, pageSize: 50, status: selectedStatus },
    { query: { staleTime: 0 } },
  )

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

  return (
    <div className="space-y-8">
      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Car source list</h1>
          <Link href="/admin/cars/form?actionType=add">
            <Button>Add car source</Button>
          </Link>
        </div>
        <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as CarStatus)}>
          <TabsList>
            {statusOptions.map((status) => (
              <TabsTrigger key={status} value={status}>
                {statusTabLabels[status]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {(carsData?.items || [])
          .filter((car) => !!car.publicId)
          .map((car) => (
            <div
              key={car.publicId}
              className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {car.postTitle} ({car.year}) - {car.manufacturer} {car.model}
                </p>
                <p className="text-muted-foreground text-sm">
                  {car.price} {car.currency} / {car.city}, {car.country} / status: {car.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/cars/form?actionType=edit&id=${car.publicId}`}>
                  <Button size="xs" variant="outline" className="inline-flex items-center gap-1">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  size="xs"
                  variant="destructive"
                  className="inline-flex items-center gap-1"
                  disabled={deleteCarPending || updateStatusPending}
                  onClick={() => onDeleteCar(car.publicId!, car.postTitle)}
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
            </div>
          ))}
      </div>
    </div>
  )
}
