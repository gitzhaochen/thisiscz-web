import MarkdownView from '@/components/MarkdownView'
import { apiFetchServer } from '@/lib/apiFetch'
import { queryClient } from '@/lib/queryClient'
import { format } from 'date-fns'
import { LinkIcon } from 'lucide-react'
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import LinkAdminActions from '../components/LinkAdminActions'
import { LinkDTO } from '@/lib/api/generated'

type Props = {
  params: Promise<{ locale: Locale; id: string }>
}

export default async function PageBookmarksDetail({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  // 在服务端使用 queryClient.fetchQuery 获取数据
  const linkDetail: LinkDTO = await queryClient.fetchQuery({
    queryKey: ['link', id],
    queryFn: () => apiFetchServer(`/api/links/${id}`),
  })

  return (
    <div className="page-wrapper py-6">
      <div className="mx-auto max-w-[680px]">
        <div className="relative flex flex-col gap-4">
          <div className="relative aspect-2/1 w-full overflow-hidden rounded-xl">
            <Image src={linkDetail.imageUrl!} alt={linkDetail.title!} fill objectFit="cover" />
          </div>
          <a
            href={linkDetail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm underline"
          >
            <LinkIcon className="size-3" />
            {linkDetail.url}
          </a>

          <div className="text-lg font-bold">{linkDetail.title}</div>

          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>{linkDetail.user?.userName}</span>
            <span>{format(linkDetail.createdAt!, 'yyyy.MM.dd HH:mm')}</span>
          </div>

          <div className="absolute top-2 right-2 flex gap-3">
            <LinkAdminActions link={linkDetail} />
          </div>
          <div>
            <MarkdownView content={linkDetail.description!} />
          </div>
        </div>
      </div>
    </div>
  )
}
