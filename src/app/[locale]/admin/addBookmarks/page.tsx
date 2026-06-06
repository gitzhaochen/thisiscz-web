'use client'

import MarkdownView from '@/components/MarkdownView'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  LinkCategory,
  useDeleteApiLinksId,
  useGetApiLinksId,
  usePostApiLinksCreate,
  usePutApiLinksId,
} from '@/lib/api/generated'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrashIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const R2_ASSETS_PREFIX = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ASSETS_PREFIX

const linkCategories = [
  LinkCategory.life,
  LinkCategory.work,
  LinkCategory.crypto,
  LinkCategory.sports,
  LinkCategory.movies,
] as const

const formSchema = z.object({
  url: z.string().min(2, {
    message: 'url must be at least 2 characters.',
  }),
  title: z.string().min(2, {
    message: 'title must be at least 2 characters.',
  }),
  description: z.string().min(2, {
    message: 'description must be at least 2 characters.',
  }),
  imageUrl: z.string().min(2, {
    message: 'imageUrl must be at least 2 characters.',
  }),
  category: z.enum(linkCategories),
})

export default function AdminBookmarks() {
  const t = useTranslations('LinkCategory')
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
      title: '',
      description: '',
      imageUrl: '',
      category: undefined,
    },
  })

  const { mutate: addLink, isPending: addLoading } = usePostApiLinksCreate({
    mutation: {
      onSuccess: () => {
        toast.success('Link added successfully')
        form.reset()
      },
    },
  })

  const { mutate: editLink, isPending: editLoading } = usePutApiLinksId({
    mutation: {
      onSuccess: () => {
        toast.success('Link edited successfully')
      },
    },
  })

  const searchParams = useSearchParams()
  const actionType = searchParams.get('actionType') || 'add'

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    console.log(values)
    if (actionType === 'edit') {
      editLink({ id: Number(searchParams.get('id')!), data: values })
    } else {
      addLink({ data: values })
    }
  }

  const id = searchParams.get('id')
  const { data: linkDetail } = useGetApiLinksId(id ? Number(id) : 0, {
    query: { enabled: !!id && actionType === 'edit' },
  })

  useEffect(() => {
    if (linkDetail) {
      form.reset({
        url: linkDetail.url,
        title: linkDetail.title,
        description: linkDetail.description,
        imageUrl: linkDetail.imageUrl,
        category: linkDetail.category,
      })
    }
  }, [linkDetail, form])

  const { mutate: deleteLink, isPending: deleteLoading } = useDeleteApiLinksId()

  return (
    <div className="mx-auto w-full space-y-8 md:w-[800px]">
      <div className="flex justify-between">
        <h1 className="font-bold">{actionType === 'edit' ? 'Edit' : 'Add'} Bookmarks</h1>
        {actionType === 'edit' && (
          <Button
            variant="outline"
            size="icon"
            disabled={deleteLoading}
            className="cursor-pointer"
            onClick={() => {
              deleteLink({ id: Number(searchParams.get('id')!) })
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>category</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {linkCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>url</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>title</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>description</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <Textarea
                      placeholder=""
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                      }}
                      className="flex-1"
                    />
                    <div className="w-full border border-dashed px-2 py-1 md:w-1/2">
                      <MarkdownView content={field.value} />
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>imageUrl</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        id="imageUrl"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const filename = encodeURIComponent(file.name)
                            const filePath = `web/uploads/bookmarks/${filename}`
                            const fileType = encodeURIComponent(file.type || 'application/octet-stream')
                            const response = await fetch(`/api/s3Upload?filePath=${filePath}&fileType=${fileType}`)

                            const data = await response.json()
                            const uploadResponse = await fetch(data.url, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': file.type || 'application/octet-stream',
                              },
                              body: file,
                            })

                            if (!uploadResponse.ok) {
                              toast.error('Upload image to R2 failed')
                              return
                            }

                            if (!R2_ASSETS_PREFIX) {
                              toast.error('Missing R2 public assets prefix env variable')
                              return
                            }

                            const imageUrl = `${R2_ASSETS_PREFIX}/${filePath}`

                            field.onChange(imageUrl)
                          }
                        }}
                      />
                      {/* 图片预览 */}
                      {field.value && (
                        <div className="relative mt-2 aspect-[2] w-[160px]">
                          <Image src={field.value} alt="image" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <Button type="submit" disabled={addLoading || editLoading}>
            {addLoading || editLoading ? 'Saving...' : actionType === 'edit' ? 'Edit' : 'Add'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
