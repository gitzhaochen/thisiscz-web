import { setRequestLocale } from 'next-intl/server'
import type { Locale } from 'next-intl'
import PriceCompareClient from './PriceCompareClient'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function NzPriceComparePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="page-wrapper bg-[#faf8ff] pt-6 pb-8">
      <PriceCompareClient />
    </main>
  )
}
