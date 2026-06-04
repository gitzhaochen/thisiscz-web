'use client'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link, useRouter } from '@/i18n/navigation'
import { useUserStore } from '@/store/userStore'
import { UserIcon } from 'lucide-react'
import { clearAuth } from '@/lib/auth'

export default function ProfileAction() {
  const user = useUserStore((state: any) => state.user)
  const router = useRouter()
  // console.log('user', user)
  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="link" className="cursor-pointer">
          {user.userName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.role === 'admin' && (
          <>
            <DropdownMenuItem>
              <Link href="/admin/addPosts">Add posts</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/admin/addBookmarks">Add bookmarks</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem>
          <Link href="/posts/mylikes">My likes</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <div
            className="cursor-pointer text-gray-500"
            onClick={() => {
              clearAuth()
              location.reload()
            }}
          >
            Logout
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      size="sm"
      variant="ghost"
      className="cursor-pointer"
      onClick={() => {
        router.replace(`/login?returnTo=${encodeURIComponent(window.location.href)}`, { locale: 'en' })
      }}
    >
      <UserIcon className="h-4 w-4" />
    </Button>
  )
}
