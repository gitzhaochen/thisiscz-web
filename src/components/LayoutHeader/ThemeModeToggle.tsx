'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function ThemeModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="hover:bg-accent hover:text-accent-foreground text-foreground relative flex size-8 cursor-pointer items-center justify-center transition-colors"
      onClick={() => (theme === 'light' ? setTheme('dark') : setTheme('light'))}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </div>
  )
}
