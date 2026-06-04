import MarkdownView from '@/components/MarkdownView'
import { __IS_PROD__ } from '@/lib/constants'
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}
export default async function ResumePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  //TODO:cdn的资源不是最新的
  const baseurl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/assets/resume/`

  const resumePath = `${baseurl}${locale === 'zh' ? '赵晨-10年经验-Web开发.md' : 'CZ-10yrsExp-WebDeveloper-CV.md'}`
  // console.log(resumePath)
  const res = await fetch(resumePath)
  if (!res.ok) throw new Error('无法获取远程简历文件')
  const resume = await res.text()

  return (
    <div className="page-wrapper py-6">
      <div className="mx-auto max-w-[800px]">
        <MarkdownView content={resume} />
      </div>
    </div>
  )
}
