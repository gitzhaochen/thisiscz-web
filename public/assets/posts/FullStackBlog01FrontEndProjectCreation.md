### Full-Stack Personal Blog Development 01: Frontend Project Creation

> Developing a personal blog using free resources not only showcases personal branding and technical capabilities but also provides hands-on practice with full-stack development technologies, making it a zero-cost yet high-value project.

#### 1. Technology Stack

##### Core Framework

- **Editor**: Cursor Pro
- **Frontend Framework**: Next.js v16 (App Router), React 19.2.0
- **State Management**: Zustand
- **Type System**: TypeScript

##### UI & Styling

- **CSS Framework**: Tailwind CSS v4
- **UI Component Library**: Shadcn UI (based on Radix UI)
- **Theme System**: next-themes (supports dark/light mode)
- **Responsive Design**: Mobile-first responsive layout

##### Internationalization & Content

- **Internationalization**: next-intl (supports Chinese/English switching)
- **Markdown Rendering**: react-markdown + remark-gfm + rehype-highlight
- **Code Highlighting**: highlight.js

##### Data Fetching & API

- **Data Fetching**: @tanstack/react-query v5 (supports caching, pagination, infinite scroll)
- **API Code Generation**: orval (automatically generates type-safe API clients based on OpenAPI/Swagger)
- **Form Handling**: react-hook-form + zod (form validation)

##### Authentication & Authorization

- **Google Login**: @react-oauth/google
- **JWT Handling**: jwt-decode
- **Cookie Management**: js-cookie

##### Deployment & Storage

- **Deployment Platform**: Vercel
- **Static Asset Storage**: AWS S3 (production CDN)

#### 2. Project Configuration

1. Frontend Project Initialization

```bash
npx create-next-app@latest my-blog
```

Create the application with the latest Next.js, selecting TypeScript, ESLint, Tailwind CSS, App Router, and src/app directory structure.

2. Pnpm Configuration

```bash
// .npmrc
registry="https://registry.yarnpkg.com/"

```

Use Pnpm to install dependencies, saving disk space. Configure npm registry to use Yarn's registry to resolve npm registry blocking issues.

3. Editor Configuration

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

Editor settings: automatically format code with Prettier on save, and check code with ESLint.

4. Prettier Configuration

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

Prettier configuration: use Tailwind CSS plugin to automatically adjust style order, use single quotes, 120 character line width, no semicolons.

5. ESLint Configuration: use Next.js core rules and Prettier rules.

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "react/no-unescaped-entities": 0,
    "@next/next/no-html-link-for-pages": 0
  }
}
```

#### 3. Start the Project

```bash
pnpm i
pnpm dev
```

After completing the above configuration, you can start development. Visit http://localhost:3000 to see the results.

#### 4. Deployment and Static Asset CDN Acceleration

For production deployment, the project uses Vercel for one-click hosting. Static assets (such as images and blog post attachments) are automatically uploaded to AWS S3 via custom scripts. It is recommended to combine AWS CloudFront CDN for global acceleration to ensure high availability and fast access to resources. You also get 5GB of free storage per year.

1. **Vercel Deployment for Frontend**
   - It is recommended to connect Vercel with Github, and trigger automatic deployment by pushing to the `main` branch.
   - In `next.config.js`, you can configure `assetPrefix` to point to your Cloudflare CDN domain in production.

2. **Automatically Upload Static Assets to S3**
   - The uploaded content includes: `public` (Next.js static files directory) and `.next/static/` (built static assets).
   - Write an upload script in `scripts/uploadToS3.js` to upload directories to S3.
   - Configure the S3 bucket policy for public read, enabling static asset access.

   Run the following command to build and automatically upload assets to S3:

   ```bash
   pnpm build
   # This will automatically run "next build && node ./scripts/uploadToS3.js"
   ```

3. **Bind CDN Acceleration**
   - Set up a static asset domain in S3 (e.g. `static.yourcdn.com`) and connect this domain to a CDN.
   - The frontend will then access images and assets via `https://static.yourcdn.com/assets/...`.

With this setup, code and assets are decoupled—code is deployed on Vercel, while static assets are distributed via S3+CDN for easy high availability and global acceleration.

#### 5. Core Feature Modules

##### 1. User Authentication Module

- **Google OAuth Login**: Supports third-party Google account login
- **JWT Authentication**: Identity verification based on JWT Token
- **User State Management**: Use Zustand to manage user login state
- **Permission Control**: Distinguish between regular users and admin roles

##### 2. Blog Post Module

- **Post List**: Supports pagination and category filtering (Life, Work, Cryptocurrency, Sports)
- **Post Details**: Markdown content rendering with code highlighting
- **Post Likes**: Supports like/unlike functionality
- **Multi-language Support**: Posts support Chinese/English titles, summaries, and content
- **Admin Features**: Create, edit, and delete posts (admin only)

##### 3. Comment System Module

- **Comment Display**: Supports nested comments (parent-child comment relationships)
- **Comment Creation**: Users can post comments and replies on articles
- **Comment Management**: Comment authors or admins can delete comments (recursively delete child comments)
- **Pagination Loading**: Supports comment list pagination and infinite scroll

##### 4. Bookmark/Link Management Module

- **Link Display**: Supports categorized display (Life, Work, Cryptocurrency, Sports, Movies)
- **Link Details**: View detailed link information
- **Admin Features**: Create, edit, and delete links (admin only)

##### 5. Internationalization Module

- **Multi-language Support**: Complete Chinese/English interface switching
- **Route Internationalization**: Route internationalization based on next-intl
- **Content Localization**: Comprehensive localization of articles, menus, and notification messages

##### 6. Theme System Module

- **Dark/Light Mode**: Supports automatic system theme switching and manual switching
- **Theme Persistence**: User preference settings stored locally

##### 7. Admin Backend Module

- **Post Management**: Create and edit blog posts (supports Markdown)
- **Bookmark Management**: Create and edit bookmark links
- **Image Upload**: Supports uploading images to AWS S3

##### 8. Other Feature Modules

- **Responsive Design**: Complete mobile adaptation
- **SEO Optimization**: Next.js built-in SEO support
- **Code Highlighting**: Syntax highlighting for code blocks in articles
- **Pagination Component**: Unified pagination UI component
- **Toast Notifications**: Operation feedback prompts
