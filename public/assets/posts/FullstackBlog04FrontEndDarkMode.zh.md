### 全栈开发个人博客04：前端深色模式

> Shadcn/ui 是一个现代化的 React UI 组件库，旨在提供可自定义、高质量、无依赖的用户界面组件。它利用 Tailwind CSS 和 React 的灵活性，提供了一组易于使用、响应式且可扩展的 UI 组件，帮助开发者快速构建美观且功能丰富的应用界面，同时保持设计的一致性和灵活性。

#### 1. 深色模式实现原理

##### 1.1 核心机制

项目使用 `next-themes` 库实现深色模式，核心原理是：

- **类名切换**：切换深色模式时，`next-themes` 会在 `<html>` 元素上添加或移除 `dark` 类名。
- **CSS 变量**：通过 CSS 变量（CSS Custom Properties）定义浅色和深色主题的颜色值。
- **Tailwind 变体**：使用 Tailwind CSS 的 `dark:` 变体根据 `dark` 类名应用深色样式。

##### 1.2 安装依赖

```bash
pnpm add next-themes
```

#### 2. ThemeProvider 配置

##### 2.1 创建 ThemeProvider 组件

```tsx
// src/components/ThemeProvider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

##### 2.2 在布局中配置

```tsx
// src/app/[locale]/layout.tsx
import { ThemeProvider } from '@/components/ThemeProvider'

export default async function LocaleLayout({ children, params }: Props) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**配置说明**：

- `attribute="class"`：使用 `class` 属性（而非 `data-theme`）来切换主题
- `defaultTheme="system"`：默认跟随系统主题设置
- `enableSystem`：启用系统主题检测
- `disableTransitionOnChange`：切换主题时禁用过渡动画，避免闪烁
- `suppressHydrationWarning`：抑制 Next.js 的 hydration 警告（主题在客户端确定）

#### 3. CSS 变量定义

##### 3.1 浅色主题变量

在 `globals.css` 的 `:root` 中定义浅色主题的 CSS 变量：

```css
:root {
  --background: oklch(1 0 0); /* 白色背景 */
  --foreground: oklch(0.141 0.005 285.823); /* 深色文字 */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.967 0.001 286.375);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.015 286.067);
  --destructive: oklch(0.577 0.245 27.325);
  /* ... 更多变量 */
}
```

##### 3.2 深色主题变量

在 `.dark` 类中定义深色主题的 CSS 变量：

```css
.dark {
  --background: oklch(0.141 0.005 285.823); /* 深色背景 */
  --foreground: oklch(0.985 0 0); /* 浅色文字 */
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.92 0.004 286.32);
  --primary-foreground: oklch(0.21 0.006 285.885);
  --secondary: oklch(0.274 0.006 286.033);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --border: oklch(1 0 0 / 10%); /* 半透明边框 */
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.552 0.016 285.938);
  --destructive: oklch(0.704 0.191 22.216);
  /* ... 更多变量 */
}
```

##### 3.3 Tailwind CSS 深色变体配置

在 `globals.css` 中配置 Tailwind CSS 的深色变体：

```css
@custom-variant dark (&:is(.dark *));
```

这允许使用 `dark:` 前缀来应用深色模式样式。

#### 4. 主题切换组件

##### 4.1 实现主题切换按钮

```tsx
// src/components/LayoutHeader/ThemeModeToggle.tsx
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
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </div>
  )
}
```

**实现要点**：

- 使用 `useTheme` hook 获取当前主题和切换函数
- 太阳图标：浅色模式显示，深色模式隐藏（`dark:scale-0`）
- 月亮图标：深色模式显示，浅色模式隐藏（`dark:scale-100`）
- 使用 CSS 过渡动画实现平滑切换效果

#### 5. 在组件中使用深色模式

##### 5.1 使用 Tailwind 的 `dark:` 变体

```tsx
// 示例：按钮组件
<button className="bg-background text-foreground dark:bg-input/30 dark:border-input">按钮</button>
```

##### 5.2 使用 CSS 变量

组件自动使用 CSS 变量，无需额外配置：

```tsx
// 自动适配主题
<div className="bg-background text-foreground">{/* 背景和文字颜色会根据主题自动切换 */}</div>
```

##### 5.3 组件中的深色模式应用示例

**按钮组件**：

```tsx
// src/components/ui/button.tsx
const buttonVariants = cva(
  'bg-primary text-primary-foreground dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
  {
    variants: {
      variant: {
        outline: 'border bg-background dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        ghost: 'hover:bg-accent dark:hover:bg-accent/50',
      },
    },
  },
)
```

**输入框组件**：

```tsx
// src/components/ui/input.tsx
<input className="border-input dark:bg-input/30 placeholder:text-muted-foreground" />
```

**标签页组件**：

```tsx
// src/components/ui/tabs.tsx
<TabsTrigger className="dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground" />
```

#### 6. 深色模式最佳实践

##### 6.1 颜色系统

- **使用语义化变量**：使用 `--background`、`--foreground`、`--primary` 等语义化变量，而非具体颜色值
- **对比度保证**：确保文字和背景有足够的对比度（WCAG AA 标准）
- **使用 OKLCH 颜色空间**：项目使用 OKLCH 颜色空间，提供更好的颜色一致性和可预测性

##### 6.2 过渡动画

- **禁用切换过渡**：在 `ThemeProvider` 中设置 `disableTransitionOnChange`，避免主题切换时的闪烁
- **组件内过渡**：在组件内部使用 `transition-colors` 实现平滑的颜色过渡

##### 6.3 系统主题检测

- **默认跟随系统**：设置 `defaultTheme="system"` 和 `enableSystem`，自动检测用户系统主题偏好
- **用户可覆盖**：用户可以通过切换按钮手动覆盖系统设置

##### 6.4 避免闪烁（FOUC）

- **suppressHydrationWarning**：在 `<html>` 标签上添加，避免 hydration 不匹配警告
- **客户端渲染**：主题相关的组件使用 `'use client'` 指令，确保在客户端确定主题

#### 7. 深色模式特性总结

- ✅ **系统主题检测**：自动跟随用户系统主题设置
- ✅ **手动切换**：提供主题切换按钮，用户可手动切换
- ✅ **持久化存储**：用户选择会保存在 localStorage 中
- ✅ **无闪烁切换**：禁用切换时的过渡动画，避免视觉闪烁
- ✅ **完整覆盖**：所有 UI 组件都支持深色模式
- ✅ **语义化颜色**：使用 CSS 变量实现统一的颜色系统
- ✅ **平滑过渡**：组件内部颜色变化有平滑的过渡效果

通过以上实现，项目提供了完整的深色模式支持，用户可以享受舒适的深色主题体验。
