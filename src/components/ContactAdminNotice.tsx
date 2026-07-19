import { LinkIcon } from 'lucide-react'

type ContactAdminNoticeProps = {
  className?: string
}

export default function ContactAdminNotice({ className }: ContactAdminNoticeProps) {
  return (
    <div className={className || 'text-muted-foreground mt-6 flex items-center justify-center text-xs'}>
      如需上下架车源，
      <a
        href="https://xhslink.com/m/4LHeBgbktey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs underline"
      >
        <LinkIcon className="h-3 w-3" />
        跳转小红书联系管理员
      </a>
    </div>
  )
}
