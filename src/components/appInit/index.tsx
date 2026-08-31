'use client'
import useAuthAdmin from '@/hooks/useAuthAdmin'
import useSafari100vh from '@/hooks/useSafari100vh'
import { getAccessToken } from '@/lib/auth'
import { useUserStore } from '@/store/userStore'
import { useGetApiUsersMe } from '@/lib/api/generated'
import { useEffect } from 'react'
import RenderWakeupOnMount from '../RenderWakeupOnMount'

export default function AppInit() {
  useSafari100vh()

  const token = getAccessToken()

  const { data: user, isLoading } = useGetApiUsersMe({
    query: { enabled: !!token },
  })
  useEffect(() => {
    if (user) {
      useUserStore.setState({ user })
    }
  }, [user])

  useAuthAdmin()
  return <RenderWakeupOnMount />
}
