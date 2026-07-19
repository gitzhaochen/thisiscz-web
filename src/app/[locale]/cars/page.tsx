import PageCarsClient from './PageCarsClient'
import { Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageCars' })

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords')
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean),
  }
}

export default function PageCars() {
  return <PageCarsClient />
}
