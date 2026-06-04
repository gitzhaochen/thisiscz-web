### Full-Stack Personal Blog Development 03: Frontend Responsive Design

> Tailwind CSS is a powerful CSS framework that quickly builds responsive and customizable user interfaces through class names. It provides a large number of predefined classes such as `bg-blue-500`, `text-xl`, `p-4`, etc., making style application very efficient without writing a lot of custom CSS. Unlike traditional CSS frameworks, Tailwind CSS emphasizes composability and configurability, supporting customization of colors, spacing, fonts, and other properties through configuration files, greatly improving development speed while maintaining flexibility.

#### 1. Tailwind CSS v4 Configuration

##### 1.1 Basic Configuration

- **v4 version requires no configuration file**: Automatically scans files that use class names. Plugins also need to be imported and used in `global.css`, such as animation styles

```css
// global.css
@import "tailwindcss";
@import "tw-animate-css";
```

- **PostCSS Configuration**: Use `PostCSS` to process tailwindcss configuration. `autoprefixer` is imported by default to smooth out browser differences

```ts
// postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

##### 1.2 Custom Font Configuration

- Find your favorite fonts in [Google Fonts](https://fonts.google.com/), such as `Schoolbell` and `ZCOOL KuaiLe`
- Import fonts in `global.css` and define them using `@theme`

```css
// global.css
@import url('https://fonts.googleapis.com/css2?family=Schoolbell&family=ZCOOL+KuaiLe&display=swap');

@theme {
  --font-schoolbell: 'Schoolbell', cursive;
  --font-chinese: 'ZCOOL KuaiLe', sans-serif;
}
```

- Use class names `font-schoolbell` or `font-chinese` directly

```tsx
<h1 className="font-schoolbell">Hello World</h1>
```

#### 2. Responsive Design Strategy

##### 2.1 Mobile-First

The project adopts a **mobile-first** design strategy, with default styles targeting mobile devices, using the `md:` breakpoint (768px) and above for desktop styles.

**Tailwind CSS Breakpoints**:

- `sm:` - 640px and above
- `md:` - 768px and above (primarily used)
- `lg:` - 1024px and above
- `xl:` - 1280px and above

##### 2.2 Page Container Responsive

Use a unified `page-wrapper` class to implement responsive layout for page containers:

```css
// global.css
@layer components {
  .page-wrapper {
    @apply mx-auto w-full px-4 md:max-w-[1400px];
  }
}
```

- **Mobile**: Full width with left and right padding `px-4`
- **Desktop**: Maximum width `1400px`, centered display

##### 2.3 Navigation Menu Responsive

**Mobile**: Use drawer menu (Drawer), click menu icon to open sidebar

```tsx
// Mobile navigation menu
<div className="md:hidden">
  <Drawer>
    <DrawerTrigger>
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
      </Button>
    </DrawerTrigger>
    <DrawerContent>{/* Navigation links */}</DrawerContent>
  </Drawer>
</div>
```

**Desktop**: Display horizontal navigation menu

```tsx
// Desktop navigation menu
<div className="hidden items-center gap-10 md:flex">{/* Navigation links */}</div>
```

##### 2.4 Grid Layout Responsive

**Bookmarks Page**: 2 columns on mobile, 4 columns on desktop

```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{/* Bookmark cards */}</div>
```

**Form Layout**: Vertical arrangement on mobile, horizontal arrangement on desktop

```tsx
<div className="flex flex-col gap-2 md:flex-row">
  <div className="w-full md:w-1/2">{/* Form items */}</div>
</div>
```

##### 2.5 Text Truncation Responsive

Adjust text display lines based on screen size:

```tsx
// Display 2 lines on mobile, 1 line on desktop
<div className="line-clamp-2 text-sm text-gray-500 md:line-clamp-1">{summary}</div>
```

##### 2.6 Spacing and Padding Responsive

Adjust padding based on screen size:

```tsx
// p-2 on mobile, p-3 on desktop
<div className="flex flex-col gap-2 p-2 md:p-3">{/* Content */}</div>
```

#### 3. Safari 100vh Issue Handling

Safari browser's address bar causes inaccurate `100vh` calculation. Use a custom Hook to handle this:

```ts
// hooks/useSafari100vh.ts
export default function useSafari100vh() {
  useEffect(() => {
    const setViewHeight = () => {
      const windowVH = window.innerHeight / 100
      document.documentElement.style.setProperty('--vh', windowVH + 'px')
    }
    setViewHeight()
    document.addEventListener('DOMContentLoaded', setViewHeight)
    return () => {
      document.removeEventListener('DOMContentLoaded', setViewHeight)
    }
  }, [])
}
```

Define CSS variable in `global.css`:

```css
:root {
  --vh: 1vh;
}
```

#### 4. Responsive Design Best Practices

##### 4.1 Use Tailwind Responsive Classes

- Prioritize using Tailwind's built-in responsive utility classes
- Use `md:` as the primary breakpoint to maintain design consistency
- Avoid using `@media` queries to keep code clean

##### 4.2 Component Separation Strategy

- **Separate mobile and desktop components**: Such as `MobileNavMenu` and `PcNavMenu`
- Use conditional rendering: `md:hidden` and `hidden md:flex` to control show/hide

##### 4.3 Content Adaptation

- **Text Truncation**: Use `line-clamp-*` classes to control text lines
- **Responsive Images**: Use Next.js `Image` component's `fill` and `objectFit` properties
- **Spacing Adjustment**: Adjust `gap`, `padding`, `margin` based on screen size

##### 4.4 Touch-Friendly

- Maintain sufficient click areas for mobile buttons and links (at least 44x44px)
- Use appropriate font sizes to ensure mobile readability

Through the above responsive design strategies, the project achieves complete mobile and desktop adaptation, providing a good user experience.
