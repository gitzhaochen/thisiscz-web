### Full-Stack Personal Blog Development 04: Frontend Dark Mode

> Shadcn/ui is a modern React UI component library designed to provide customizable, high-quality, dependency-free user interface components. It leverages the flexibility of Tailwind CSS and React to provide a set of easy-to-use, responsive, and extensible UI components, helping developers quickly build beautiful and feature-rich application interfaces while maintaining design consistency and flexibility.

#### 1. Dark Mode Implementation Principles.

##### 1.1 Core Mechanism

The project uses the `next-themes` library to implement dark mode. The core principles are:

- **Class Name Toggle**: When switching dark mode, `next-themes` adds or removes the `dark` class name on the `<html>` element
- **CSS Variables**: Define color values for light and dark themes through CSS variables (CSS Custom Properties)
- **Tailwind Variants**: Use Tailwind CSS's `dark:` variant to apply dark styles based on the `dark` class name

##### 1.2 Install Dependencies

```bash
pnpm add next-themes
```

#### 2. ThemeProvider Configuration

##### 2.1 Create ThemeProvider Component

```tsx
// src/components/ThemeProvider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

##### 2.2 Configure in Layout

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

**Configuration Notes**:

- `attribute="class"`: Use the `class` attribute (instead of `data-theme`) to toggle themes
- `defaultTheme="system"`: Default to following system theme settings
- `enableSystem`: Enable system theme detection
- `disableTransitionOnChange`: Disable transition animations when switching themes to avoid flickering
- `suppressHydrationWarning`: Suppress Next.js hydration warnings (theme is determined on the client side)

#### 3. CSS Variable Definitions

##### 3.1 Light Theme Variables

Define CSS variables for the light theme in `:root` in `globals.css`:

```css
:root {
  --background: oklch(1 0 0); /* White background */
  --foreground: oklch(0.141 0.005 285.823); /* Dark text */
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
  /* ... more variables */
}
```

##### 3.2 Dark Theme Variables

Define CSS variables for the dark theme in the `.dark` class:

```css
.dark {
  --background: oklch(0.141 0.005 285.823); /* Dark background */
  --foreground: oklch(0.985 0 0); /* Light text */
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.92 0.004 286.32);
  --primary-foreground: oklch(0.21 0.006 285.885);
  --secondary: oklch(0.274 0.006 286.033);
  --muted: oklch(0.274 0.006 286.033);
  --muted-foreground: oklch(0.705 0.015 286.067);
  --accent: oklch(0.274 0.006 286.033);
  --border: oklch(1 0 0 / 10%); /* Semi-transparent border */
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.552 0.016 285.938);
  --destructive: oklch(0.704 0.191 22.216);
  /* ... more variables */
}
```

##### 3.3 Tailwind CSS Dark Variant Configuration

Configure Tailwind CSS dark variant in `globals.css`:

```css
@custom-variant dark (&:is(.dark *));
```

This allows using the `dark:` prefix to apply dark mode styles.

#### 4. Theme Toggle Component

##### 4.1 Implement Theme Toggle Button

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

**Implementation Points**:

- Use `useTheme` hook to get current theme and toggle function
- Sun icon: Visible in light mode, hidden in dark mode (`dark:scale-0`)
- Moon icon: Visible in dark mode, hidden in light mode (`dark:scale-100`)
- Use CSS transition animations for smooth switching effects

#### 5. Using Dark Mode in Components

##### 5.1 Using Tailwind's `dark:` Variant

```tsx
// Example: Button component
<button className="bg-background text-foreground dark:bg-input/30 dark:border-input">Button</button>
```

##### 5.2 Using CSS Variables

Components automatically use CSS variables without additional configuration:

```tsx
// Automatically adapts to theme
<div className="bg-background text-foreground">
  {/* Background and text colors automatically switch based on theme */}
</div>
```

##### 5.3 Dark Mode Application Examples in Components

**Button Component**:

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

**Input Component**:

```tsx
// src/components/ui/input.tsx
<input className="border-input dark:bg-input/30 placeholder:text-muted-foreground" />
```

**Tabs Component**:

```tsx
// src/components/ui/tabs.tsx
<TabsTrigger className="dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground" />
```

#### 6. Dark Mode Best Practices

##### 6.1 Color System

- **Use Semantic Variables**: Use semantic variables like `--background`, `--foreground`, `--primary`, etc., instead of specific color values
- **Ensure Contrast**: Ensure sufficient contrast between text and background (WCAG AA standard)
- **Use OKLCH Color Space**: The project uses OKLCH color space, providing better color consistency and predictability

##### 6.2 Transition Animations

- **Disable Toggle Transitions**: Set `disableTransitionOnChange` in `ThemeProvider` to avoid flickering during theme switching
- **Component Transitions**: Use `transition-colors` within components for smooth color transitions

##### 6.3 System Theme Detection

- **Default to System**: Set `defaultTheme="system"` and `enableSystem` to automatically detect user system theme preferences
- **User Override**: Users can manually override system settings through the toggle button

##### 6.4 Avoid Flickering (FOUC)

- **suppressHydrationWarning**: Add to `<html>` tag to avoid hydration mismatch warnings
- **Client-Side Rendering**: Theme-related components use the `'use client'` directive to ensure theme is determined on the client side

#### 7. Dark Mode Features Summary

- ✅ **System Theme Detection**: Automatically follows user system theme settings
- ✅ **Manual Toggle**: Provides theme toggle button for manual switching
- ✅ **Persistent Storage**: User choices are saved in localStorage
- ✅ **Flicker-Free Switching**: Disables transition animations during switching to avoid visual flickering
- ✅ **Complete Coverage**: All UI components support dark mode
- ✅ **Semantic Colors**: Uses CSS variables to implement a unified color system
- ✅ **Smooth Transitions**: Component color changes have smooth transition effects

Through the above implementation, the project provides complete dark mode support, allowing users to enjoy a comfortable dark theme experience.
