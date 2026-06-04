import { useLocale, useTranslations } from 'next-intl'
import LocaleSwitcher from './LocaleSwitcher'
import { MobileNavMenu, PcNavMenu } from './NavMenu'
import ThemeModeToggle from './ThemeModeToggle'
import ProfileAction from './ProfileAction'
import { Link } from '@/i18n/navigation'
const LayoutHeader = () => {
  const i18nCommon = useTranslations('Common')

  const locale = useLocale()
  return (
    <div className="bg-background sticky top-0 z-10 border-b border-dashed">
      <div className="page-wrapper flex items-center justify-between py-2">
        <div className="flex flex-1 items-center gap-[200px]">
          <Link
            href="/"
            className={`${
              locale === 'en' ? 'font-schoolbell tracking-wide' : 'font-chinese opacity-80'
            } text-md font-bold`}
          >
            {i18nCommon('siteTitle')}
          </Link>
          <PcNavMenu />
        </div>
        <div className="flex items-center gap-2">
          <ProfileAction />
          <LocaleSwitcher />
          <ThemeModeToggle />
          <MobileNavMenu />
        </div>
      </div>
    </div>
  )
}

export default LayoutHeader
