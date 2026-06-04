import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useGetApiCommentsInfinite, usePostApiCommentsCreate, useDeleteApiCommentsId } from '@/lib/api/generated'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, Loader, Reply, Trash2, User } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useLocale, useTranslations } from 'next-intl'
import { zhCN } from 'date-fns/locale/zh-CN'
import { enUS } from 'date-fns/locale/en-US'
type Props = {
  comment: any
  currentUser?: any
  onCommentDeleted?: () => void
  level: number
  postId: string
}

const REPLIES_PER_PAGE = 10

const CommentItem = ({ comment, currentUser, onCommentDeleted, level, postId }: Props) => {
  const locale = useLocale()
  const tComments = useTranslations('Comments')
  // console.log('comment---', comment)

  const isMaxLevel = level >= 2

  const [showReplies, setShowReplies] = useState(false)
  const [repliesCount, setRepliesCount] = useState(comment.replyCount)
  const {
    data: repliesData,
    refetch: refetchReplies,
    isLoading: repliesLoading,
    fetchNextPage,
    hasNextPage,
  } = useGetApiCommentsInfinite(
    {
      postId: Number(postId),
      parentId: Number(comment.id!),
      pageSize: REPLIES_PER_PAGE,
    },
    {
      query: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if ((lastPage?.items?.length ?? 0) < REPLIES_PER_PAGE) {
            return undefined
          }
          return (lastPageParam || 0) + 1
        },
        enabled: showReplies,
      },
    },
  )

  const [showReplyForm, setShowReplyForm] = useState(false)
  const [newReply, setNewReply] = useState('')

  const { mutate: deleteComment, isPending: deletingComment } = useDeleteApiCommentsId({
    mutation: {
      onSuccess: () => {
        onCommentDeleted?.()
      },
    },
  })

  const handleCommentDeleted = () => {
    setRepliesCount((prev: number) => prev - 1)
    refetchReplies()
  }

  const { mutate: addReply, isPending: addingReply } = usePostApiCommentsCreate({
    mutation: {
      onSuccess: () => {
        setShowReplyForm(false)
        setNewReply('')
        refetchReplies()
        setRepliesCount((prev: number) => prev + 1)
      },
    },
  })

  const handleSubmitReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await addReply({
      data: {
        content: newReply,
        postId: Number(postId),
        parentId: Number(comment.id),
      },
    })
  }

  return (
    <div
      key={comment.id}
      className={`${level > 0 ? 'border-l-1 border-gray-200 pl-4' : ''} border-b-1 border-gray-200 pb-3`}
    >
      <div className="flex h-8 items-center gap-8">
        <div className="flex items-center text-xs text-gray-500">
          <User className="mr-1 size-3" />
          <span>{comment.user?.userName || 'Anonymous'}</span>
          <span className="mx-2">•</span>
          <span>
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: locale === 'zh' ? zhCN : enUS,
            })}
          </span>
        </div>
        {(comment.userId === currentUser?.id || currentUser?.role === 'admin') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteComment({ id: Number(comment.id) })}
            disabled={deletingComment}
            className="cursor-pointer text-gray-500 hover:bg-gray-100"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>
      <p className="mt-1">{comment.content}</p>
      <div className="mt-1 flex items-center gap-2">
        {!isMaxLevel && (
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer text-gray-500"
            onClick={() => {
              if (!currentUser?.id) {
                toast.info(tComments('pleaseLoginToReply'))
                return
              }
              setShowReplyForm(!showReplyForm)
            }}
          >
            <Reply className="size-3" />
          </Button>
        )}
        {repliesCount > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="link"
              size="sm"
              className="cursor-pointer text-xs text-gray-500"
              onClick={() => setShowReplies(!showReplies)}
            >
              {tComments('replies', { count: repliesCount })}
              {showReplies ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
            </Button>
          </div>
        )}
      </div>
      <div className="ml-2">
        {showReplyForm && (
          <div className="">
            <form className="max-w-[800px]" onSubmit={handleSubmitReply}>
              <Textarea
                placeholder={tComments('enterYourReply')}
                name="reply"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 cursor-pointer text-gray-500"
                  type="submit"
                  disabled={addingReply}
                >
                  {addingReply ? tComments('replying') : tComments('reply')}
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 cursor-pointer text-gray-500"
                  onClick={() => setShowReplyForm(false)}
                >
                  {tComments('cancel')}
                </Button>
              </div>
            </form>
          </div>
        )}
        {showReplies && (
          <div className="mt-2">
            {repliesLoading && (
              <div className="flex justify-center">
                <Loader className="h-4 w-4 animate-spin" />
              </div>
            )}
            {repliesData?.pages.flatMap((page) => page.items).length && (
              <div className="replies">
                {repliesData?.pages
                  .flatMap((page) => page.items)
                  .map((reply: any) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUser={currentUser}
                      onCommentDeleted={handleCommentDeleted}
                      level={level + 1}
                      postId={postId}
                    />
                  ))}
              </div>
            )}

            {hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-gray-500"
                onClick={() => fetchNextPage()}
                disabled={repliesLoading}
              >
                {tComments('loadMoreReplies')}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentItem
