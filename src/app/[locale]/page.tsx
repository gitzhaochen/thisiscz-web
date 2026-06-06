import MarkdownView from '@/components/MarkdownView'
import RenderWakeupOnMount from '@/components/RenderWakeupOnMount'
import { routing } from '@/i18n/routing'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
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

  const resumePath = join(process.cwd(), 'public', 'assets', RESUME_FILE_BY_LOCALE[locale])
  const resume = await readFile(resumePath, 'utf8')

  return (
    <div className="page-wrapper py-6">
      <RenderWakeupOnMount />
      <div className="mx-auto max-w-[800px]">
        <MarkdownView content={resume} />
      </div>
    </div>
  )
}
