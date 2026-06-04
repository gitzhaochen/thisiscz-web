### 全栈开发个人博客01：创建前端项目

> 通过免费资源开发个人博客，既能展示个人品牌和技术能力，又能实践全栈开发技术，是一个零成本但高价值的项目实践。

#### 1. 技术选型

##### 核心框架

- **编辑器**: Cursor Pro
- **前端框架**: Next.js v16 (App Router), React 19.2.0
- **状态管理**: Zustand
- **类型系统**: TypeScript

##### UI 与样式

- **CSS 框架**: Tailwind CSS v4
- **UI 组件库**: Shadcn UI (基于 Radix UI)
- **主题系统**: next-themes (支持深色/浅色模式)
- **响应式设计**: 移动端优先的响应式布局

##### 国际化与内容

- **国际化**: next-intl (支持中英文切换)
- **Markdown 渲染**: react-markdown + remark-gfm + rehype-highlight
- **代码高亮**: highlight.js

##### 数据获取与 API

- **数据获取**: @tanstack/react-query v5 (支持缓存、分页、无限滚动)
- **API 代码生成**: orval (基于 OpenAPI/Swagger 自动生成类型安全的 API 客户端)
- **表单处理**: react-hook-form + zod (表单验证)

##### 认证与授权

- **Google 登录**: @react-oauth/google
- **JWT 处理**: jwt-decode
- **Cookie 管理**: js-cookie

##### 部署与存储

- **部署平台**: Vercel
- **静态资源存储**: AWS S3 (生产环境 CDN)

#### 2. 项目配置

1. 前端项目初始化

```bash
npx create-next-app@latest my-blog
```

用最新的Next.js创建应用，选择typescript、eslint、tailwind css、app router、src/app目录结构。

2. Pnpm 配置

```bash
// .npmrc
registry="https://registry.yarnpkg.com/"

```

使用Pnpm安装依赖，节省磁盘空间，配置npm源，使用yarn的源，解决npm源被墙的问题。

3. 配置编辑器

```bash
// .VSCode settings.json
"editor.formatOnSave": true,
"editor.codeActionsOnSave": {
  "source.fixAll.eslint": "explicit",
},
"[typescript]": {
  "editor.defaultFormatter": "esbenp.prettier-vscode"
},
"[typescriptreact]": {
  "editor.defaultFormatter": "esbenp.prettier-vscode"
},
```

编辑器设置保存自动使用Prettier格式化代码，使用ESLint检查代码。

4. Prettier 配置

```bash
// prettier.config.js
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
  semi: false,
  singleQuote: true,
  'prettier.printWidth': 120,
}
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "prettier"],
}

```

Prettier 配置，使用Tailwind CSS插件，可以自动调整样式顺序，使用单引号，120字符换行，不需要分号。

5. ESLint 配置，使用Next.js核心规则，使用Prettier规则。

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "react/no-unescaped-entities": 0,
    "@next/next/no-html-link-for-pages": 0
  }
}
```

#### 3. 启动项目

```bash
pnpm i
pnpm dev
```

完成以上配置，即可开始开发，访问 http://localhost:3000 即可看到效果。

#### 4. 部署与静态资源CDN加速

项目生产部署采用 Vercel 一键托管，静态资源（如图片、博客文章的附件等）通过自建脚本自动上传至 AWS S3，并推荐结合 AWS CloudFront CDN 进行全球加速，确保资源高可用和访问速度, 而且一年有5G免费存储额度。

1. **Vercel 部署前端站点**
   - 推荐直接用 Github 连接 Vercel，推送到 `main` 分支自动部署。
   - `next.config.js` 中可配置 `assetPrefix`，生产环境中指向你的 Cloudflare CDN 域名。

2. **自动上传静态资源到 S3**
   - 上传内容包括： `public`(Next.js静态文件目录) 和 `.next/static/`(构建后的静态资源)
   - 在 `scripts/uploadToS3.js` 编写上传目录至 S3 的脚本。
   - 配置 S3 存储桶策略为公开读取，用于静态资源访问。

   执行以下命令即可打包并自动上传资源到 S3：

   ```bash
   pnpm build
   # 会自动运行 "next build && node ./scripts/uploadToS3.js",
   ```

3. **绑定 CDN 加速**
   - 在 S3 配置静态资源域名（如 `static.yourcdn.com`），并将该域名接入 CDN 加速。
   - 前端通过 `https://static.yourcdn.com/assets/...` 访问图片和资源。

这样即可实现代码与资源解耦，代码部署在 Vercel，静态资源分发通过 S3+CDN，轻松实现高可用和全球加速。

#### 5. 核心功能模块

##### 1. 用户认证模块

- **Google OAuth 登录**: 支持第三方 Google 账号登录
- **JWT 认证**: 基于 JWT Token 的身份验证
- **用户状态管理**: 使用 Zustand 管理用户登录状态
- **权限控制**: 区分普通用户和管理员角色

##### 2. 博客文章模块

- **文章列表**: 支持分页、分类筛选（生活、工作、加密货币、运动）
- **文章详情**: Markdown 内容渲染，代码高亮显示
- **文章点赞**: 支持点赞/取消点赞功能
- **多语言支持**: 文章支持中英文标题、摘要、内容
- **管理员功能**: 创建、编辑、删除文章（仅管理员）

##### 3. 评论系统模块

- **评论展示**: 支持嵌套评论（父子评论关系）
- **评论创建**: 用户可对文章发表评论和回复
- **评论管理**: 评论作者或管理员可删除评论（递归删除子评论）
- **分页加载**: 支持评论列表分页和无限滚动

##### 4. 书签/链接管理模块

- **链接展示**: 支持分类展示（生活、工作、加密货币、运动、电影）
- **链接详情**: 查看链接详细信息
- **管理员功能**: 创建、编辑、删除链接（仅管理员）

##### 5. 国际化模块

- **多语言支持**: 完整的中英文界面切换
- **路由国际化**: 基于 next-intl 的路由国际化
- **内容本地化**: 文章、菜单、提示信息等全面本地化

##### 6. 主题系统模块

- **深色/浅色模式**: 支持系统主题自动切换和手动切换
- **主题持久化**: 用户偏好设置本地存储

##### 7. 管理员后台模块

- **文章管理**: 创建和编辑博客文章（支持 Markdown）
- **书签管理**: 创建和编辑书签链接
- **图片上传**: 支持上传图片到 AWS S3

##### 8. 其他功能模块

- **响应式设计**: 完整的移动端适配
- **SEO 优化**: Next.js 内置 SEO 支持
- **代码高亮**: 文章代码块语法高亮
- **分页组件**: 统一的分页 UI 组件
- **Toast 通知**: 操作反馈提示
