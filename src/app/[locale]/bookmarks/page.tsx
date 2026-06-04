'use client'
import { Pagination } from '@/components/Pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from '@/i18n/navigation'
import { LinkCategory, LinkDTO, useGetApiLinks } from '@/lib/api/generated'
import { LinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const pageSize = 20
const linkCategories = [
  LinkCategory.life,
  LinkCategory.work,
  LinkCategory.crypto,
  LinkCategory.sports,
  LinkCategory.movies,
] as const

export default function PageBookmarks() {
  const t = useTranslations('LinkCategory')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const category = searchParams.get('category') || 'all'

  const { data, isPending } = useGetApiLinks({
    page: currentPage,
    pageSize: pageSize,
    category: category === 'all' ? undefined : (category as LinkCategory),
  })

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    // 切换分类时重置到第一页
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize)

  return (
    <div className="page-wrapper py-6">
      <div className="mb-6 flex justify-start">
        <Tabs value={category} onValueChange={handleCategoryChange}>
          <TabsList className="md:gap-2">
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
            {linkCategories.map((cat) => (
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data?.items?.map((link: LinkDTO) => (
          <div key={link.id} className="relative flex flex-col overflow-hidden rounded-md border transition-colors">
            <Link href={`/bookmarks/${link.id}`} className="relative aspect-2/1 w-full">
              <Image
                src={link.imageUrl || ''}
                alt={link.title || ''}
                fill
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-105"
              />
            </Link>
            <div className="flex flex-col gap-2 p-2 md:p-3">
              <Link href={`/bookmarks/${link.id}`} className="line-clamp-1 text-sm font-bold hover:underline">
                {link.title}
              </Link>
              <a
                href={link.url || ''}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground flex items-center gap-1 text-sm hover:underline"
              >
                <LinkIcon className="size-3" />
                <span className="line-clamp-1 flex-1 shrink-0 break-all">{link.url}</span>
              </a>
              <div className="line-clamp-1 text-sm">{link.description}</div>
            </div>
          </div>
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
