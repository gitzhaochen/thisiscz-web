import { Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'
import { SITE_URL } from '@/lib/seo'

const headline = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-kiwi-headline',
  display: 'swap',
})

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-kiwi-body',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-kiwi-mono',
  display: 'swap',
})

type Props = {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageNzPriceCompare' })
  const baseUrl = SITE_URL
  const pageUrl = `${baseUrl}/${locale}/nz-price-compare`
  const title = t('seoTitle')
  const description = t('seoDescription')
  const keywords = t('seoKeywords')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: pageUrl,
      languages: {
        'zh-CN': `${baseUrl}/zh/nz-price-compare`,
        en: `${baseUrl}/en/nz-price-compare`,
        'x-default': `${baseUrl}/en/nz-price-compare`,
      },
    },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title,
      description,
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      siteName: 'ThisIsCZ',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function NzPriceCompareLayout({ children }: { children: ReactNode }) {
  return <div className={`${headline.variable} ${body.variable} ${mono.variable}`}>{children}</div>
}
