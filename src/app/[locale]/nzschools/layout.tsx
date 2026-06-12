import { Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageNzSchools' })

  return {
    title: t('seoTitle'),
    description: t('seoDescription'),
    keywords: t('seoKeywords')
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  }
}

export default function NzSchoolsLayout({ children }: { children: ReactNode }) {
  return children
}
