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
    <aside className="rounded-lg border p-2">
      <div className="px-3 py-2 text-sm font-semibold">Admin Menu</div>
      <nav className="flex flex-col gap-1">
        {menuGroups.map((group) => {
          const hasActiveChild = group.children.some((child) => child.isActive(pathname))
          const opened = openedKeys.includes(group.key) || hasActiveChild

          return (
            <div key={group.key} className="rounded-md border border-transparent">
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  hasActiveChild ? 'bg-muted' : 'hover:bg-muted'
                }`}
              >
                <span>{group.label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${opened ? 'rotate-180' : ''}`} />
              </button>
              {opened && (
                <div className="mt-1 ml-3 flex flex-col gap-1 border-l pl-2">
                  {group.children.map((child) => {
                    const active = child.isActive(pathname)
                    return (
                      <Link
                        key={child.key}
                        href={child.href}
                        className={`rounded-md px-3 py-2 text-sm transition-colors ${
                          active ? 'font-semibold' : 'hover:bg-muted'
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
