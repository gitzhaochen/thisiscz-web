import AdminSidebar from './components/AdminSidebar'
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params
  // Enable static rendering
  setRequestLocale(locale)

  return (
    <div className="px-4 py-6">
      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
