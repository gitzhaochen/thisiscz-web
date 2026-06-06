import MarkdownView from '@/components/MarkdownView'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}
export default async function ResumePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const resumePath = join(process.cwd(), 'public', 'assets', 'resume', 'CZ-10yrsExp-WebDeveloper-CV.md')
  const resume = await readFile(resumePath, 'utf8')

  return (
    <div className="page-wrapper py-6">
      <div className="mx-auto max-w-[800px]">
        <MarkdownView content={resume} />
      </div>
    </div>
  )
}
