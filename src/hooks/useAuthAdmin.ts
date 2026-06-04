import { redirect, usePathname, useRouter } from '@/i18n/navigation'
import { useUserStore } from '@/store/userStore'
import { useEffect } from 'react'
import { getAccessToken } from '@/lib/auth'
export default function useAuthAdmin() {
  const router = useRouter()
  const user = useUserStore((state: any) => state.user)
  const pathname = usePathname()
  useEffect(() => {
    if (pathname.startsWith('/admin') && (!getAccessToken() || (user && user?.role.toLowerCase() !== 'admin'))) {
      router.replace('/')
    }
  }, [user, pathname])
}
