import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import ClockLearningPage from './ClockLearningPage'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function AryaStudyYear1Page({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="page-wrapper py-6">
      <ClockLearningPage />
    </div>
  )
}
