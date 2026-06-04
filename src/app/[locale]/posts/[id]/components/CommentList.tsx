'use client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import React, { useEffect, useState } from 'react'
import CommentItem from './CommentItem'
import { Loader, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { useGetApiCommentsInfinite, usePostApiCommentsCreate } from '@/lib/api/generated'
import { useTranslations } from 'next-intl'
type Props = {
  post: any
}

const COMMENTS_PER_PAGE = 10

const CommentList = ({ post }: Props) => {
  const user = useUserStore((state: any) => state.user)
  const tComments = useTranslations('Comments')
  const [newComment, setNewComment] = useState('')
  const [commentCount, setCommentCount] = useState(post.commentCount)

  const {
    data: comments,
    isFetching,
    error,
    refetch: refetchComments,
    fetchNextPage,
    hasNextPage,
  } = useGetApiCommentsInfinite(
    {
      postId: Number(post.id),
      pageSize: COMMENTS_PER_PAGE,
    },
    {
      query: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if ((lastPage?.items?.length ?? 0) < COMMENTS_PER_PAGE) {
            return undefined
          }
          return (lastPageParam || 0) + 1
        },
        getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
          if (firstPageParam && firstPageParam <= 1) {
            return undefined
          }
          return (firstPageParam || 0) - 1
        },
      },
    },
  )

  const { mutate: addComment, isPending: addingComment } = usePostApiCommentsCreate({
    mutation: {
      onSuccess: () => {
        setNewComment('')
        refetchComments()
        setCommentCount((prev: number) => prev + 1)
      },
    },
  })

  const handleCommentDeleted = () => {
    setCommentCount((prev: number) => prev - 1)
    refetchComments()
  }

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user?.id) {
      toast.info(tComments('pleaseLoginToComment'))
      return
    }
    if (!newComment.trim()) return

    await addComment({
      data: {
        content: newComment.trim(),
        postId: Number(post.id),
        parentId: null, // 创建顶级评论
      },
    })
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo')
    if (scrollTo === 'comments') {
      const commentsElement = document.getElementById('comments')
      if (commentsElement) commentsElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, [searchParams])

  return (
    <div className="mt-8 space-y-4">
      <h4 className="font-semibold" id="comments">
        {tComments('comments')}
      </h4>
      {/* 评论表单 */}
      <form onSubmit={handleSubmitComment} className="max-w-[800px] space-y-2">
        <Textarea
          placeholder={tComments('enterYourComment')}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
        />
        <Button type="submit" disabled={addingComment || !newComment.trim()} size="sm" className="cursor-pointer">
          {addingComment ? tComments('submitting') : tComments('submit')}
        </Button>
      </form>
      {/* 评论列表 */}
      {isFetching && (
        <div className="flex justify-center">
          <Loader className="h-4 w-4 animate-spin" />
        </div>
      )}
      <div className="space-y-4">
        {comments?.pages?.length &&
          comments?.pages
            .flatMap((page) => page?.items ?? [])
            .map((comment: any) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUser={user}
                onCommentDeleted={handleCommentDeleted}
                postId={post.id}
                level={0}
              />
            ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            className="cursor-pointer text-gray-500 hover:bg-gray-100"
          >
            {tComments('loadMoreComments')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CommentList
