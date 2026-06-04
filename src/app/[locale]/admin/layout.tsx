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

  return <div className="page-wrapper py-6">{children}</div>
}
