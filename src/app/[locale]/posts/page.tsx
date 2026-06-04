'use client'
import PostCard from './components/PostCard'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Pagination } from '@/components/Pagination'
import { useUserStore } from '@/store/userStore'
import { getGetApiPostsQueryOptions, PostCategory, useGetApiPosts } from '@/lib/api/generated'
import { Tabs, TabsList } from '@/components/ui/tabs'
import { TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const pageSize = 10
const postCategories = [PostCategory.life, PostCategory.work, PostCategory.crypto, PostCategory.sports] as const
export default function PagePosts() {
  const t = useTranslations('PostCategory')
  const userId = useUserStore((state: any) => state.user?.id)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') || 'all'
  const router = useRouter()
  const pathname = usePathname()
  const { data, isPending } = useGetApiPosts({
    page: currentPage,
    pageSize: pageSize,
    category: category === 'all' ? undefined : (category as PostCategory),
  }, {
    query: {
      // Keep previous page/category data during transitions to avoid empty-state flashes.
      placeholderData: (previousData) => previousData,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  })
  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  // 从响应数据中提取分页信息
  const totalPages = data?.totalCount ? Math.ceil(data?.totalCount / pageSize) : 1
  const posts = data?.items || []

  useEffect(() => {
    if (currentPage >= totalPages) return

    const nextPageParams = {
      page: currentPage + 1,
      pageSize,
      category: category === 'all' ? undefined : (category as PostCategory),
    }

    queryClient.prefetchQuery(getGetApiPostsQueryOptions(nextPageParams))
  }, [category, currentPage, totalPages, queryClient])

  return (
    <div className="page-wrapper py-6">
      <div className="mb-6 flex justify-start">
        <Tabs value={category} onValueChange={handleCategoryChange}>
          <TabsList className="md:gap-2">
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
            {postCategories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {t(cat)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {isPending && (
        <div className="my-4 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-gray-500 dark:border-white"></div>
        </div>
      )}
      <div className="flex flex-col gap-6">
        {posts.map((post: any) => (
          <PostCard key={post.id} post={post} currentUserId={userId} />
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
