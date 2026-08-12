import MathMotionExperience from './components/MathMotionExperience'
import { isMathMotionTopic } from './mathMotionTopics'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ topic?: string }>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageMathMotion' })

  return {
    title: t('seoTitle'),
    description: t('seoDescription'),
  }
}

export default async function MathMotionPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { topic } = await searchParams
  setRequestLocale(locale)

  return <MathMotionExperience initialTopic={isMathMotionTopic(topic) ? topic : 'circle-formulas'} />
}
