'use client'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  post: any
}

const CommentAction = ({ post }: Props) => {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex cursor-pointer items-center gap-1 text-gray-500"
      onClick={() => {
        router.push(`/posts/${post.id}?scrollTo=comments`)
      }}
    >
      <MessageCircle className="h-4 w-4" />
      <span>{post.commentCount}</span>
    </Button>
  )
}

export default CommentAction
