'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import {
  FuelType,
  SellerType,
  SourcePlatformType,
  TransmissionType,
  getGetApiCarsPublicIdQueryKey,
  useGetApiCarsPublicId,
  usePostApiCarsCreate,
  usePutApiCarsPublicId,
} from '@/lib/api/generated'
import type { CarCreationDTO } from '@/lib/api/generated'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const transmissionOptions = [TransmissionType.automatic, TransmissionType.manual] as const
const fuelTypeOptions = [
  FuelType.petrol,
  FuelType.diesel,
  FuelType.hybrid,
  FuelType.phev,
  FuelType.ev,
  FuelType.other,
] as const
const sellerTypeOptions = [SellerType.individual, SellerType.dealer] as const
const sourcePlatformOptions = [SourcePlatformType.xiaohongshu] as const

const formSchema = z.object({
  price: z.string().min(1, { message: 'price is required' }),
  currency: z.string().min(1, { message: 'currency is required' }),
  year: z.string().min(1, { message: 'year is required' }),
  manufacturer: z.string().min(1, { message: 'manufacturer is required' }),
  model: z.string().min(1, { message: 'model is required' }),
  mileageKm: z.string().min(1, { message: 'mileage is required' }),
  transmission: z.enum(transmissionOptions),
  engineDisplacementL: z.string().optional(),
  fuelType: z.enum(fuelTypeOptions),
  contactPhone: z.string().optional(),
  contactWechat: z.string().optional(),
  contactEmail: z.string().optional(),
  country: z.string().min(1, { message: 'country is required' }),
  city: z.string().min(1, { message: 'city is required' }),
  sellerType: z.enum(sellerTypeOptions),
  sourcePlatform: z.enum(sourcePlatformOptions),
  parseSourceUrl: z.string().optional(),
  sourceUrl: z.string().min(1, { message: 'sourceUrl is required' }),
  postTitle: z.string().min(1, { message: 'postTitle is required' }),
  postContent: z.string().min(1, { message: 'postContent is required' }),
  imageUrlsText: z.string().optional(),
})

const parseImageUrls = (value: string | undefined) => {
  if (!value) {
    return []
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

type ParsedXhsCarFields = {
  price?: number | null
  currency?: string | null
  year?: number | null
  mileageKm?: number | null
  manufacturer?: string | null
  model?: string | null
  transmission?: string | null
  engineDisplacementL?: string | null
  fuelType?: string | null
  contactPhone?: string | null
  contactWechat?: string | null
  contactEmail?: string | null
  sellerType?: string | null
  country?: string | null
  city?: string | null
}

type XhsParseResponse = {
  error?: string
  sourceUrl?: string
  postTitle?: string
  postContent?: string
  imageUrls?: string[]
  parsedFields?: ParsedXhsCarFields
}

export default function AdminCarsFormPage() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const actionType = searchParams.get('actionType') || 'add'
  const publicId = searchParams.get('id') || ''
  const isEdit = actionType === 'edit' && !!publicId
  const [xhsUrl, setXhsUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: '',
      currency: 'NZD',
      year: '',
      manufacturer: '',
      model: '',
      mileageKm: '',
      transmission: TransmissionType.automatic,
      engineDisplacementL: '',
      fuelType: FuelType.petrol,
      contactPhone: '',
      contactWechat: '',
      contactEmail: '',
      country: 'New Zealand',
      city: 'Auckland',
      sellerType: SellerType.individual,
      sourcePlatform: SourcePlatformType.xiaohongshu,
      parseSourceUrl: '',
      sourceUrl: '',
      postTitle: '',
      postContent: '',
      imageUrlsText: '',
    },
  })

  const { data: carDetail } = useGetApiCarsPublicId(publicId, {
    query: { enabled: isEdit },
  })

  useEffect(() => {
    if (!carDetail) {
      return
    }

    form.reset({
      price: String(carDetail.price ?? ''),
      currency: carDetail.currency || 'NZD',
      year: String(carDetail.year ?? ''),
      manufacturer: carDetail.manufacturer || '',
      model: carDetail.model || '',
      mileageKm: String(carDetail.mileageKm ?? ''),
      transmission: (carDetail.transmission as (typeof transmissionOptions)[number]) || TransmissionType.automatic,
      engineDisplacementL:
        carDetail.engineDisplacementL === null || carDetail.engineDisplacementL === undefined
          ? ''
          : String(carDetail.engineDisplacementL),
      fuelType: (carDetail.fuelType as (typeof fuelTypeOptions)[number]) || FuelType.petrol,
      contactPhone: carDetail.contactPhone || '',
      contactWechat: carDetail.contactWechat || '',
      contactEmail: carDetail.contactEmail || '',
      country: carDetail.country || '',
      city: carDetail.city || '',
      sellerType: (carDetail.sellerType as (typeof sellerTypeOptions)[number]) || SellerType.individual,
      sourcePlatform:
        (carDetail.sourcePlatform as (typeof sourcePlatformOptions)[number]) || SourcePlatformType.xiaohongshu,
      parseSourceUrl: carDetail.parseSourceUrl || '',
      sourceUrl: carDetail.sourceUrl || '',
      postTitle: carDetail.postTitle || '',
      postContent: carDetail.postContent || '',
      imageUrlsText: (carDetail.imageUrls || []).join('\n'),
    })
  }, [carDetail, form])

  const { mutate: createCar, isPending: createPending } = usePostApiCarsCreate({
    mutation: {
      onSuccess: async () => {
        toast.success('Car created')
        await queryClient.invalidateQueries({ queryKey: ['/api/cars'] })
      },
      onError: () => {
        toast.error('Create failed')
      },
    },
  })

  const { mutate: updateCar, isPending: updatePending } = usePutApiCarsPublicId({
    mutation: {
      onSuccess: async () => {
        toast.success('Car updated')
        await queryClient.invalidateQueries({ queryKey: ['/api/cars'] })
        await queryClient.invalidateQueries({ queryKey: getGetApiCarsPublicIdQueryKey(publicId) })
      },
      onError: () => {
        toast.error('Update failed')
      },
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload: CarCreationDTO = {
      price: Number(values.price),
      currency: values.currency,
      year: Number(values.year),
      manufacturer: values.manufacturer.trim(),
      model: values.model.trim(),
      mileageKm: Number(values.mileageKm),
      transmission: values.transmission,
      engineDisplacementL: values.engineDisplacementL?.trim() || null,
      fuelType: values.fuelType,
      contactPhone: values.contactPhone?.trim() || null,
      contactWechat: values.contactWechat?.trim() || null,
      contactEmail: values.contactEmail?.trim() || null,
      country: values.country.trim(),
      city: values.city.trim(),
      sellerType: values.sellerType,
      sourcePlatform: values.sourcePlatform,
      parseSourceUrl: values.parseSourceUrl?.trim() || null,
      sourceUrl: values.sourceUrl.trim(),
      postTitle: values.postTitle.trim(),
      postContent: values.postContent.trim(),
      imageUrls: parseImageUrls(values.imageUrlsText),
    }

    if (isEdit) {
      updateCar({ publicId, data: payload })
      return
    }

    createCar({ data: payload })
    form.reset()
  }

  const handleExtractFromXhs = async () => {
    if (!xhsUrl.trim()) {
      toast.error('Please paste a Xiaohongshu URL first')
      return
    }

    setIsExtracting(true)
    try {
      const response = await fetch(`/api/xiaohongshu/parse?url=${encodeURIComponent(xhsUrl.trim())}`)
      const result = (await response.json()) as XhsParseResponse

      if (!response.ok) {
        toast.error(result?.error || 'Parse failed')
        return
      }

      if (result.sourceUrl) {
        form.setValue('sourceUrl', result.sourceUrl, { shouldDirty: true, shouldValidate: true })
      }
      form.setValue('parseSourceUrl', xhsUrl.trim(), { shouldDirty: true, shouldValidate: false })
      if (result.postTitle) {
        form.setValue('postTitle', result.postTitle, { shouldDirty: true, shouldValidate: true })
      }
      if (result.postContent) {
        form.setValue('postContent', result.postContent, { shouldDirty: true, shouldValidate: true })
      }
      if (Array.isArray(result.imageUrls) && result.imageUrls.length > 0) {
        form.setValue('imageUrlsText', result.imageUrls.join('\n'), {
          shouldDirty: true,
          shouldValidate: false,
        })
      }
      const parsed = result.parsedFields
      if (parsed) {
        if (typeof parsed.price === 'number') {
          form.setValue('price', String(parsed.price), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.currency === 'string' && parsed.currency.trim()) {
          form.setValue('currency', parsed.currency.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.year === 'number') {
          form.setValue('year', String(parsed.year), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.mileageKm === 'number') {
          form.setValue('mileageKm', String(parsed.mileageKm), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.manufacturer === 'string' && parsed.manufacturer.trim()) {
          form.setValue('manufacturer', parsed.manufacturer.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.model === 'string' && parsed.model.trim()) {
          form.setValue('model', parsed.model.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (
          typeof parsed.transmission === 'string' &&
          transmissionOptions.includes(parsed.transmission as (typeof transmissionOptions)[number])
        ) {
          form.setValue('transmission', parsed.transmission as (typeof transmissionOptions)[number], {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        if (typeof parsed.engineDisplacementL === 'string' && parsed.engineDisplacementL.trim()) {
          form.setValue('engineDisplacementL', parsed.engineDisplacementL.trim(), {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        if (
          typeof parsed.fuelType === 'string' &&
          fuelTypeOptions.includes(parsed.fuelType as (typeof fuelTypeOptions)[number])
        ) {
          form.setValue('fuelType', parsed.fuelType as (typeof fuelTypeOptions)[number], {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        if (typeof parsed.contactPhone === 'string' && parsed.contactPhone.trim()) {
          form.setValue('contactPhone', parsed.contactPhone.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.contactWechat === 'string' && parsed.contactWechat.trim()) {
          form.setValue('contactWechat', parsed.contactWechat.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.contactEmail === 'string' && parsed.contactEmail.trim()) {
          form.setValue('contactEmail', parsed.contactEmail.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.country === 'string' && parsed.country.trim()) {
          form.setValue('country', parsed.country.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (typeof parsed.city === 'string' && parsed.city.trim()) {
          form.setValue('city', parsed.city.trim(), { shouldDirty: true, shouldValidate: true })
        }
        if (
          typeof parsed.sellerType === 'string' &&
          sellerTypeOptions.includes(parsed.sellerType as (typeof sellerTypeOptions)[number])
        ) {
          form.setValue('sellerType', parsed.sellerType as (typeof sellerTypeOptions)[number], {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      }

      form.setValue('sourcePlatform', SourcePlatformType.xiaohongshu, {
        shouldDirty: true,
        shouldValidate: true,
      })
      toast.success('Xiaohongshu data filled')
    } catch {
      toast.error('Parse failed')
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit car source' : 'Add car source'}</h1>
        <Link href="/admin/cars">
          <Button variant="outline">Back to list</Button>
        </Link>
      </div>
      <div className="rounded-md border border-dashed p-3">
        <p className="mb-2 text-sm font-medium">Import from Xiaohongshu URL</p>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="https://www.xiaohongshu.com/..."
            value={xhsUrl}
            onPaste={(e) => {
              let text = e.clipboardData.getData('text')
              text = text.trim()
              // 使用正则提取以 http/https 开头的链接
              const match = text.match(/https?:\/\/[^\s]+/)
              if (match) {
                setXhsUrl(match[0])
              } else {
                toast.error('请粘贴包含有效的小红书链接（以 http/https 开头）')
                setXhsUrl('')
              }
            }}
          />
          <Button type="button" onClick={handleExtractFromXhs} disabled={isExtracting}>
            {isExtracting ? 'Parsing...' : 'Parse & Fill'}
          </Button>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mileageKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mileage (km)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transmission</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      {transmissionOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sellerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seller type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seller type" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellerTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sourcePlatform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source platform</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourcePlatformOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="engineDisplacementL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Engine displacement</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parseSourceUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parse source URL</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sourceUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source URL</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact phone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactWechat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact wechat</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="postTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="postContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post content</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="imageUrlsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URLs (one per line or comma-separated)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={createPending || updatePending}>
              {createPending || updatePending ? 'Saving...' : isEdit ? 'Update car source' : 'Create car source'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
