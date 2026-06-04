'use client'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/userStore'
import { EditIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  post: any
}

const PostAdminActions = ({ post }: Props) => {
  const user = useUserStore((state: any) => state.user)
  // console.log('user---', user)
  return (
    <>
      {user?.role === 'admin' && (
        <Link href={`/admin/addPosts?actionType=edit&id=${post.id}`}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <EditIcon className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </>
  )
}

export default PostAdminActions
