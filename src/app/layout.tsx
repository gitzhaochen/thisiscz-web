import { ReactNode } from 'react'
import { getLocale } from 'next-intl/server'
import { Schoolbell, ZCOOL_KuaiLe } from 'next/font/google'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
}

const schoolbell = Schoolbell({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-schoolbell-loaded',
  display: 'swap',
})

const zcoolKuaiLe = ZCOOL_KuaiLe({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-chinese-loaded',
  display: 'swap',
})

type Props = {
  children: ReactNode
}

export default async function RootLayout({ children }: Props) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${schoolbell.variable} ${zcoolKuaiLe.variable}`}>{children}</body>
    </html>
  )
}
