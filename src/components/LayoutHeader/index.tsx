'use client'
import { Link, usePathname } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import LocaleSwitcher from './LocaleSwitcher'
import { MobileNavMenu, PcNavMenu } from './NavMenu'
import ProfileAction from './ProfileAction'
import ThemeModeToggle from './ThemeModeToggle'

const LayoutHeader = () => {
  const i18nCommon = useTranslations('Common')
  const i18nCars = useTranslations('PageCars')
  const i18nNzSchools = useTranslations('PageNzSchools')
  const pathname = usePathname()
  const locale = useLocale()

  const mobileTitle = pathname.startsWith('/nzschools')
    ? i18nNzSchools('seoTitle')
    : pathname.startsWith('/cars')
      ? i18nCars('seoTitle')
      : i18nCommon('siteTitle')

  return (
    <div className="bg-background sticky top-0 z-10 border-b border-dashed">
      <div className="page-wrapper flex items-center justify-between py-2">
        <div className="flex flex-1 items-center gap-[200px]">
          <Link
            href="/"
            className={`${locale === 'en' ? 'font-schoolbell tracking-wide' : 'font-chinese opacity-80'} text-md font-bold`}
          >
            <span className="md:hidden">{mobileTitle}</span>
            <span className="hidden md:inline">{i18nCommon('siteTitle')}</span>
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
