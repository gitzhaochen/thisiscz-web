import MarkdownView from '@/components/MarkdownView'
import { routing } from '@/i18n/routing'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}

const ABOUT_FILE_BY_LOCALE: Record<Locale, string> = {
  zh: 'aboutme_zh.md',
  en: 'aboutme.md',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Pick<Props, 'params'>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PageAboutMe' })

  return {
    title: t('seoTitle'),
    description: t('seoDescription'),
  }
}

export default async function AboutMePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'PageAboutMe' })
  const aboutPath = join(process.cwd(), 'public', 'assets', ABOUT_FILE_BY_LOCALE[locale])
  const about = await readFile(aboutPath, 'utf8')
  // The Markdown file starts with its own "## About Me" heading — promote it to the page h1 instead.
  const aboutBody = about.replace(/^##\s+.+\r?\n+/, '')

  return (
    <div className="page-wrapper py-6">
      <div className="mx-auto max-w-[800px]">
        <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-4xl">{t('title')}</h1>
        <MarkdownView content={aboutBody} />
      </div>
    </div>
  )
}
