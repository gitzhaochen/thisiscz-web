'use client'
import { Button } from '@/components/ui/button'
import { usePostApiPostsPostLike } from '@/lib/api/generated'
import { Heart } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { useUserStore } from '@/store/userStore'

type Props = {
  post: any
}

const LikeAction = ({ post }: Props) => {
  const user = useUserStore((state: any) => state.user)
  const locale = useLocale()
  const [isLiked, setIsLiked] = useState<boolean>(post.isLikedByCurrentUser)
  const [likeCount, setLikeCount] = useState<number>(post.likeCount)

  const { mutate: likePost, isPending: likingPost } = usePostApiPostsPostLike({
    mutation: {
      onSuccess: () => {
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      },
    },
  })

  const { mutate: unlikePost, isPending: unlikingPost } = usePostApiPostsPostLike({
    mutation: {
      onSuccess: () => {
        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      },
    },
  })

  const handleLikeToggle = () => {
    // console.log('post---', post)
    if (!user?.id) {
      toast.info('Please login to like this post')
      // return redirect({
      //   href: `/login?returnUrl=${encodeURIComponent(window.location.href)}`,
      //   locale: locale,
      // })
    }
    if (isLiked) {
      unlikePost({ data: { postId: Number(post.id), isLiked: false } })
    } else {
      likePost({ data: { postId: Number(post.id), isLiked: true } })
    }
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={likingPost || unlikingPost}
      className={`flex cursor-pointer items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{likeCount}</span>
    </Button>
  )
}

export default LikeAction
