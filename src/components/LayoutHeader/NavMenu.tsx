'use client'

import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Link, usePathname } from '@/i18n/navigation'
import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

export const navigation = [
  { name: 'home', href: '/' },
  { name: 'nzSchools', href: '/nzschools' },
  { name: 'nzRedNoteCars', href: '/cars' },
  { name: 'posts', href: '/posts' },
  { name: 'bookmarks', href: '/bookmarks' },
  { name: 'aiTalk', href: '/aiTalk' },
  // { name: 'resume', href: '/resume' },
]

export const MobileNavMenu = () => {
  const pathname = usePathname()
  const i18nNav = useTranslations('Navigation')
  const [open, setOpen] = useState(false)

  // 路由变化时关闭抽屉
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>

        <DrawerContent>
          <div className="grid gap-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-md flex items-center px-4 py-2 ${
                  pathname === item.href ? 'font-bold' : 'font-normal'
                }`}
              >
                {i18nNav(item.name)}
              </Link>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export const PcNavMenu = () => {
  const pathname = usePathname()
  const i18nNav = useTranslations('Navigation')

  return (
    <div className="hidden items-center gap-10 md:flex">
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm ${pathname === item.href ? 'font-bold' : 'font-normal'}`}
        >
          {i18nNav(item.name)}
        </Link>
      ))}
    </div>
  )
}
