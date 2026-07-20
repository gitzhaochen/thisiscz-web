import { Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'
import type { Metadata } from 'next'

type Props = {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageNzSchools' })
  const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'
  const pageUrl = `${baseUrl}/${locale}/nzschools`
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
        'zh-CN': `${baseUrl}/zh/nzschools`,
        en: `${baseUrl}/en/nzschools`,
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

export default function NzSchoolsLayout({ children }: { children: ReactNode }) {
  return children
}
