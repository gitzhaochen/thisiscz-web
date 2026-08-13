'use client'

import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import {
  findCategoryIdForTopic,
  isMathMotionTopic,
  mathMotionCatalog,
  mathMotionTopicMessageKey,
} from '@/app/[locale]/mathMotion/mathMotionTopics'
import { Link, usePathname } from '@/i18n/navigation'
import { ChevronDown, Menu } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

export const navigation = [
  { name: 'home', href: '/' },
  { name: 'nzSchools', href: '/nzschools' },
  { name: 'mathMotion', href: '/mathMotion' },
  { name: 'nzRedNoteCars', href: '/cars' },
  { name: 'posts', href: '/posts' },
  { name: 'bookmarks', href: '/bookmarks' },
  // { name: 'aiTalk', href: '/aiTalk' },
  // { name: 'resume', href: '/resume' },
]

function buildMathExpandedState(activeTopic?: string): Record<string, boolean> {
  const activeCategoryId = activeTopic ? findCategoryIdForTopic(activeTopic) : undefined
  return Object.fromEntries(mathMotionCatalog.map((category) => [category.id, category.id === activeCategoryId]))
}

export const MobileNavMenu = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const i18nNav = useTranslations('Navigation')
  const i18nMath = useTranslations('PageMathMotion')
  const [open, setOpen] = useState(false)
  const activeTopicParam = searchParams.get('topic') || ''
  const activeMathTopic = isMathMotionTopic(activeTopicParam) ? activeTopicParam : 'circle-formulas'
  const showMathTopicMenu = pathname.startsWith('/mathMotion')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() =>
    buildMathExpandedState(activeMathTopic),
  )

  useEffect(() => {
    setExpandedCategories(buildMathExpandedState(activeMathTopic))
  }, [activeMathTopic])

  useEffect(() => {
    setOpen(false)
  }, [pathname, activeTopicParam])

  return (
    <div className="md:hidden">
      <Drawer direction="left" open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerTitle className="sr-only">Navigation menu</DrawerTitle>
          <div className="grid gap-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`text-md flex items-center px-4 py-2 ${
                  pathname === item.href ? 'font-bold' : 'font-normal'
                }`}
              >
                {i18nNav(item.name)}
              </Link>
            ))}
          </div>
          {showMathTopicMenu ? (
            <div className="border-t pb-4">
              <div className="px-4 py-3 text-sm font-semibold">{i18nNav('mathMotion')}</div>
              <nav aria-label={i18nMath('common.navAriaLabel')} className="space-y-1">
                {mathMotionCatalog.map((category) => {
                  const expanded = !!expandedCategories[category.id]
                  return (
                    <div key={category.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedCategories((prev) => ({ ...prev, [category.id]: !expanded }))}
                        className="flex w-full items-center justify-between border-b px-4 py-2 text-left text-sm font-semibold transition-colors hover:text-blue-600/80"
                      >
                        <span>{i18nMath(`categories.${category.id}`)}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded ? (
                        <div className="mt-1 ml-3 flex flex-col gap-1">
                          {category.topics.map((topic, index) => {
                            const active = activeMathTopic === topic.id
                            return (
                              <Link
                                key={topic.id}
                                href={`/mathMotion?topic=${topic.id}`}
                                aria-current={active ? 'page' : undefined}
                                onClick={() => setOpen(false)}
                                className={`w-full border-b px-4 py-2 text-left text-sm transition-colors ${
                                  active ? 'font-semibold text-blue-600' : 'hover:text-blue-600/80'
                                }`}
                              >
                                {index + 1}. {i18nMath(`topics.${mathMotionTopicMessageKey(topic.id)}`)}
                              </Link>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </nav>
            </div>
          ) : null}
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
