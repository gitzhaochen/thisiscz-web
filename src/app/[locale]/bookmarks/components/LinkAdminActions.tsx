'use client'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/userStore'
import { EditIcon } from 'lucide-react'
import Link from 'next/link'

type Props = {
  link: any
}

const LinkAdminActions = ({ link }: Props) => {
  const user = useUserStore((state: any) => state.user)
  return (
    <>
      {user?.role === 'admin' && (
        <Link href={`/admin/addBookmarks?actionType=edit&id=${link.id}`}>
          <Button variant="outline" size="icon" className="cursor-pointer">
            <EditIcon className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </>
  )
}

export default LinkAdminActions
