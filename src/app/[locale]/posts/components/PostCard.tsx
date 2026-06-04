'use client'

import { Link } from '@/i18n/navigation'
import { PostCategory } from '@/lib/api/generated'
import { useLocale, useTranslations } from 'next-intl'
import CommentAction from './CommentAction'
import LikeAction from './LikeAction'
type Props = {
  post: any
  currentUserId?: string
}

const PostCard = ({ post, currentUserId }: Props) => {
  const locale = useLocale()
  const title = locale === 'zh' ? post.titleZh : post.title
  const summary = locale === 'zh' ? post.summaryZh : post.summary
  const t = useTranslations('PostCategory')
  const tCommon = useTranslations('Common')
  return (
    <div key={post.id} className="relative flex flex-col border-b">
      <div className="flex flex-col gap-2 p-2 md:p-3">
        <Link href={`/posts/${post.id}`} className="line-clamp-1 cursor-pointer text-sm font-bold hover:underline">
          {title}
        </Link>
        <div className="text-secondary-foreground line-clamp-2 text-sm md:line-clamp-1">{summary}</div>
        <div className="flex items-center gap-2">
          <LikeAction post={post} />
          <CommentAction post={post} />

          <div className="text-muted-foreground ml-2 text-sm">
            {tCommon('category')}: {t(post.category as PostCategory) || ''}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostCard
