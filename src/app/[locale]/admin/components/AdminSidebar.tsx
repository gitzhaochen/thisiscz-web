'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'

const menuGroups = [
  {
    key: 'content',
    label: 'Content Management',
    children: [
      {
        key: 'posts',
        label: 'Posts',
        href: '/admin/addPosts',
        isActive: (pathname: string) => pathname.startsWith('/admin/addPosts'),
      },
      {
        key: 'bookmarks',
        label: 'Bookmarks',
        href: '/admin/addBookmarks',
        isActive: (pathname: string) => pathname.startsWith('/admin/addBookmarks'),
      },
    ],
  },
  {
    key: 'cars',
    label: 'Car Source Management',
    children: [
      {
        key: 'carList',
        label: 'Car source list',
        href: '/admin/cars',
        isActive: (pathname: string) => pathname === '/admin/cars',
      },
      {
        key: 'carParse',
        label: 'Parse car source',
        href: '/admin/cars/parse',
        isActive: (pathname: string) => pathname.startsWith('/admin/cars/parse'),
      },
      {
        key: 'carEdit',
        label: 'Edit car source',
        href: '/admin/cars/form',
        isActive: (pathname: string) => pathname.startsWith('/admin/cars/form'),
      },
    ],
  },
] as const

export default function AdminSidebar() {
  const pathname = usePathname()
  const activeGroupKeys = useMemo(() => {
    return menuGroups
      .filter((group) => group.children.some((child) => child.isActive(pathname)))
      .map((group) => group.key)
  }, [pathname])
  const [openedKeys, setOpenedKeys] = useState<string[]>(activeGroupKeys)

  const toggleGroup = (groupKey: string) => {
    setOpenedKeys((prev) => (prev.includes(groupKey) ? prev.filter((key) => key !== groupKey) : [...prev, groupKey]))
  }

  return (
    <aside className="bg-card lg:sticky lg:top-20">
      <nav aria-label="Admin Menu" className="space-y-1 pt-1">
        {menuGroups.map((group) => {
          const hasActiveChild = group.children.some((child) => child.isActive(pathname))
          const opened = openedKeys.includes(group.key) || hasActiveChild

          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className={`flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  hasActiveChild ? 'text-blue-600' : 'hover:text-blue-600/80'
                }`}
              >
                <span>{group.label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${opened ? 'rotate-180' : ''}`} />
              </button>
              {opened && (
                <div className="mt-1 ml-3 flex flex-col gap-1">
                  {group.children.map((child) => {
                    const active = child.isActive(pathname)
                    return (
                      <Link
                        key={child.key}
                        href={child.href}
                        aria-current={active ? 'page' : undefined}
                        className={`border-b px-3 py-2 text-sm transition-colors ${
                          active ? 'font-semibold text-blue-600' : 'hover:text-blue-600/80'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
