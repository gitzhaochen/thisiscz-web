### 全栈开发个人博客03：前端响应式设计

> Tailwind CSS 是一个功能强大的 CSS 框架，通过类名快速构建响应式和可自定义的用户界面。它提供了大量的预定义类，如 `bg-blue-500`、`text-xl`、`p-4` 等，使得样式的应用变得非常高效，无需写大量自定义 CSS。与传统的 CSS 框架不同，Tailwind CSS 强调可组合和可配置性，支持通过配置文件定制颜色、间距、字体等属性，极大提高了开发速度并且保持了灵活性。

#### 1. Tailwind CSS v4 配置

##### 1.1 基础配置

- **v4 版本无需配置文件**：自动扫描用到类名的文件，用到插件也需要在 `global.css` 中导入使用，比如动画样式

```css
// global.css
@import "tailwindcss";
@import "tw-animate-css";
```

- **PostCSS 配置**：使用 `PostCSS` 处理 tailwindcss 的配置，默认已经导入 `autoprefixer`，磨平浏览器差异

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

##### 1.2 自定义字体配置

- 在[谷歌字体库](https://fonts.google.com/) 找到喜欢的字体，比如 `Schoolbell` 和 `ZCOOL KuaiLe`
- 在 `global.css` 中导入字体并使用 `@theme` 定义

```css
// global.css
@import url('https://fonts.googleapis.com/css2?family=Schoolbell&family=ZCOOL+KuaiLe&display=swap');

@theme {
  --font-schoolbell: 'Schoolbell', cursive;
  --font-chinese: 'ZCOOL KuaiLe', sans-serif;
}
```

- 直接使用类名 `font-schoolbell` 或 `font-chinese`

```tsx
<h1 className="font-schoolbell">Hello World</h1>
```

#### 2. 响应式设计策略

##### 2.1 移动端优先（Mobile-First）

项目采用**移动端优先**的设计策略，默认样式针对移动端，使用 `md:` 断点（768px）及以上为桌面端样式。

**Tailwind CSS 断点**：

- `sm:` - 640px 及以上
- `md:` - 768px 及以上（主要使用）
- `lg:` - 1024px 及以上
- `xl:` - 1280px 及以上

##### 2.2 页面容器响应式

使用统一的 `page-wrapper` 类实现页面容器的响应式布局：

```css
// global.css
@layer components {
  .page-wrapper {
    @apply mx-auto w-full px-4 md:max-w-[1400px];
  }
}
```

- **移动端**：全宽，左右内边距 `px-4`
- **桌面端**：最大宽度 `1400px`，居中显示

##### 2.3 导航菜单响应式

**移动端**：使用抽屉菜单（Drawer），点击菜单图标打开侧边栏

```tsx
// 移动端导航菜单
<div className="md:hidden">
  <Drawer>
    <DrawerTrigger>
      <Button variant="ghost" size="icon">
        <Menu className="h-6 w-6" />
      </Button>
    </DrawerTrigger>
    <DrawerContent>{/* 导航链接 */}</DrawerContent>
  </Drawer>
</div>
```

**桌面端**：显示横向导航菜单

```tsx
// 桌面端导航菜单
<div className="hidden items-center gap-10 md:flex">{/* 导航链接 */}</div>
```

##### 2.4 网格布局响应式

**书签页面**：移动端 2 列，桌面端 4 列

```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-4">{/* 书签卡片 */}</div>
```

**表单布局**：移动端垂直排列，桌面端水平排列

```tsx
<div className="flex flex-col gap-2 md:flex-row">
  <div className="w-full md:w-1/2">{/* 表单项 */}</div>
</div>
```

##### 2.5 文本截断响应式

根据屏幕尺寸调整文本显示行数：

```tsx
// 移动端显示 2 行，桌面端显示 1 行
<div className="line-clamp-2 text-sm text-gray-500 md:line-clamp-1">{summary}</div>
```

##### 2.6 间距和内边距响应式

根据屏幕尺寸调整内边距：

```tsx
// 移动端 p-2，桌面端 p-3
<div className="flex flex-col gap-2 p-2 md:p-3">{/* 内容 */}</div>
```

#### 3. Safari 100vh 问题处理

Safari 浏览器的地址栏会导致 `100vh` 计算不准确，使用自定义 Hook 处理：

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

在 `global.css` 中定义 CSS 变量：

```css
:root {
  --vh: 1vh;
}
```

#### 4. 响应式设计最佳实践

##### 4.1 使用 Tailwind 响应式类

- 优先使用 Tailwind 内置的响应式工具类
- 使用 `md:` 作为主要断点，保持设计一致性
- 避免使用 `@media` 查询，保持代码简洁

##### 4.2 组件分离策略

- **移动端和桌面端组件分离**：如 `MobileNavMenu` 和 `PcNavMenu`
- 使用条件渲染：`md:hidden` 和 `hidden md:flex` 控制显示/隐藏

##### 4.3 内容适配

- **文本截断**：使用 `line-clamp-*` 类控制文本行数
- **图片响应式**：使用 Next.js `Image` 组件的 `fill` 和 `objectFit` 属性
- **间距调整**：根据屏幕尺寸调整 `gap`、`padding`、`margin`

##### 4.4 触摸友好

- 移动端按钮和链接保持足够的点击区域（至少 44x44px）
- 使用合适的字体大小，确保移动端可读性

通过以上响应式设计策略，项目实现了完整的移动端和桌面端适配，提供了良好的用户体验。
