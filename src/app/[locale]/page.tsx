import MarkdownView from '@/components/MarkdownView'
import RenderWakeupOnMount from '@/components/RenderWakeupOnMount'
import { __IS_PROD__ } from '@/lib/constants'
import { routing } from '@/i18n/routing'
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}

const RESUME_FILE_BY_LOCALE: Record<Locale, string> = {
  // zh: '赵晨-10年经验-Web开发.md',
  zh: 'aboutme_zh.md',
  en: 'aboutme.md',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function ResumePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Keep base URL computation synchronous and cheap.
  const baseUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/assets/`

  const resumePath = `${baseUrl}${RESUME_FILE_BY_LOCALE[locale]}`
  const res = await fetch(resumePath)
  if (!res.ok) throw new Error('无法获取远程简历文件')
  const resume = await res.text()

  return (
    <div className="page-wrapper py-6">
      <RenderWakeupOnMount />
      <div className="mx-auto max-w-[800px]">
        <MarkdownView content={resume} />
      </div>
    </div>
  )
}
