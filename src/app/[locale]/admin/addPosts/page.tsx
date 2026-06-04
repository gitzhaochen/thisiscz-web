'use client'

import MarkdownView from '@/components/MarkdownView'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PostCategory, useGetApiPostsId, usePostApiPosts, usePutApiPostsId } from '@/lib/api/generated'
import { zodResolver } from '@hookform/resolvers/zod'
import { Locale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type Props = {
  params: Promise<{ locale: Locale }>
}

const postCategories = [PostCategory.life, PostCategory.work, PostCategory.crypto, PostCategory.sports] as const
const formSchema = z.object({
  title: z.string().min(2, {
    message: 'title must be at least 2 characters.',
  }),
  titleZh: z.string().optional(),
  summary: z.string().optional(),
  summaryZh: z.string().optional(),
  content: z.string().optional(),
  contentZh: z.string().optional(),
  category: z.enum(postCategories),
})

export default function AdminAddPosts() {
  const t = useTranslations('PostCategory')

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      titleZh: '',
      summary: '',
      summaryZh: '',
      content: '',
      contentZh: '',
      category: undefined,
    },
  })

  const searchParams = useSearchParams()
  const actionType = searchParams.get('actionType') || 'add'
  const id = searchParams.get('id')

  const { mutate: addPost, isPending: addLoading } = usePostApiPosts({
    mutation: {
      onSuccess: () => {
        toast.success('Post added successfully')
      },
    },
  })
  const { mutate: editPost, isPending: editLoading } = usePutApiPostsId({
    mutation: {
      onSuccess: () => {
        toast.success('Post edited successfully')
      },
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values)
    if (actionType === 'edit') {
      editPost({ id: Number(id!), data: values })
    } else {
      addPost({ data: values })
    }
  }

  const { data: postDetail } = useGetApiPostsId(id ? Number(id) : 0, {
    query: { enabled: !!id },
  })
  useEffect(() => {
    if (postDetail) {
      form.reset({
        title: postDetail.title,
        titleZh: postDetail.titleZh || '',
        summary: postDetail.summary || '',
        summaryZh: postDetail.summaryZh || '',
        content: postDetail.content || '',
        contentZh: postDetail.contentZh || '',
        category: postDetail.category,
      })
    }
  }, [postDetail])

  return (
    <div className="mx-auto w-full space-y-8">
      <div className="flex justify-between">
        <h1 className="font-bold">{actionType === 'edit' ? 'Edit' : 'Add'} Posts</h1>
        {/* {actionType === 'edit' && (
          <Button
            variant="outline"
            size="icon"
            disabled={deleteLoading}
            className="cursor-pointer"
            onClick={() => {
              deletePost({
                variables: { id: searchParams.get('id') },
              })
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        )} */}
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
                      {postCategories.map((category) => (
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
            name="titleZh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>titleZh</FormLabel>
                <FormControl>
                  <Input placeholder="" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>summary</FormLabel>
                <FormControl>
                  <Textarea placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="summaryZh"
            render={({ field }) => (
              <FormItem>
                <FormLabel>summaryZh</FormLabel>
                <FormControl>
                  <Textarea placeholder="" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>content</FormLabel>
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
                        <MarkdownView content={field.value || ''} />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="contentZh"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>contentZh</FormLabel>
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
                        <MarkdownView content={field.value || ''} />
                      </div>
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
