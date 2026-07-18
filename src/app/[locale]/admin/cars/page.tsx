'use client'

import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { CarStatus, useGetApiCars, usePatchApiCarsIdStatus } from '@/lib/api/generated'
import type { CarStatusUpdateDTO } from '@/lib/api/generated'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
const statusOptions = [CarStatus.active, CarStatus.sold, CarStatus.offShelf] as const

export default function AdminCarsPage() {
  const queryClient = useQueryClient()

  const { data: carsData, refetch: refetchCars } = useGetApiCars(
    { page: 1, pageSize: 50 },
    { query: { staleTime: 0 } },
  )

  const { mutate: updateStatus, isPending: updateStatusPending } = usePatchApiCarsIdStatus({
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

  const onChangeStatus = (carId: number, status: CarStatusUpdateDTO['status']) => {
    updateStatus({
      id: carId,
      data: {
        status,
      },
    })
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
        {(carsData?.items || []).map((car) => (
          <div key={car.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                {car.postTitle} ({car.year}) - {car.manufacturer} {car.model}
              </p>
              <p className="text-muted-foreground text-sm">
                {car.price} {car.currency} / {car.city}, {car.country} / status: {car.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/cars/form?actionType=edit&id=${car.id}`}>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </Link>
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={car.status === status ? 'default' : 'outline'}
                  disabled={updateStatusPending}
                  onClick={() => onChangeStatus(car.id!, status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
