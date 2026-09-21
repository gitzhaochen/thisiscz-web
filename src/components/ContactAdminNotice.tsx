'use client'

import { LinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ContactAdminNoticeProps = {
  className?: string
}

export default function ContactAdminNotice({ className }: ContactAdminNoticeProps) {
  const t = useTranslations('PageCars')

  return (
    <div className={className || 'text-muted-foreground mt-6 flex items-center justify-center text-xs'}>
      {t('contactAdminBefore')}
      <a
        href="https://xhslink.com/m/4LHeBgbktey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs underline"
      >
        <LinkIcon className="h-3 w-3" />
        {t('contactAdminLink')}
      </a>
    </div>
  )
}
