# thisiscz-web

A multilingual personal website and content platform built with Next.js App Router. It includes a blog, bookmarks, resume, admin panel, and a few personal utility pages.

Live demo: [thisiscz.vercel.app](https://thisiscz.vercel.app)

## Features

- **i18n** — English and Chinese via `next-intl`
- **Posts** — List, detail, categories, likes, and nested comments
- **Bookmarks** — Curated links with categories and admin management
- **Resume** — Markdown resume rendered on the homepage
- **Admin** — Create and edit posts and bookmarks (Google OAuth)
- **AI Talk** — Voice/text chat powered by DeepSeek (via Route Handler proxy)
- **Utilities** — Crypto tracker and NZ Spend calculator pages

## Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, Radix UI |
| i18n | next-intl |
| Data | TanStack Query v5, Orval (Swagger → hooks) |
| State | Zustand (current user) |
| Forms | react-hook-form + zod |
| Assets | AWS S3 / Cloudflare R2 (production) |

The frontend talks to a **standalone backend API**. A few Next.js Route Handlers act as a lightweight BFF (DeepSeek proxy, S3 presigned uploads).

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/)
- A running backend API (Swagger at `http://localhost:5239/swagger/v1/swagger.json`)

## Getting Started

```bash
git clone https://github.com/<your-username>/thisiscz-web.git
cd thisiscz-web
pnpm install
cp .env.development .env.local   # then fill in values
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the root path redirects to `/en`.

## Environment Variables

Create `.env.local` (or copy from `.env.development`):

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_BASE_URL` | Yes | Frontend base URL, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API base URL, e.g. `http://localhost:5239` |
| `DEEPSEEK_API_KEY` | For AI Talk | DeepSeek API key (server-side only) |
| `APP_AWS_ACCESS_KEY` | For S3 upload | AWS access key |
| `APP_AWS_SECRET_KEY` | For S3 upload | AWS secret key |
| `APP_AWS_REGION` | For S3 upload | AWS region |
| `NEXT_PUBLIC_AWS_S3_BUCKET_NAME_ASSETS` | For S3 upload | S3 bucket name |
| `NEXT_PUBLIC_AWS_S3_ASEETSPREFIX` | Production | CDN prefix for static assets |
| `NEXT_PUBLIC_CLOUDFLARE_R2_ASEETSPREFIX` | Production | R2 CDN prefix for bookmark images |

> Do not commit real secrets. Keep `.env.local` out of version control.

Google OAuth client ID is configured in `src/app/[locale]/login/page.tsx`. Replace it with your own before deploying.

## Scripts

```bash
pnpm dev            # Start dev server
pnpm build          # Production build (+ S3 upload script)
pnpm start          # Start production server
pnpm lint           # ESLint
pnpm generate:api   # Regenerate API hooks from Swagger (Orval)
```

After backend API changes, run `pnpm generate:api` to refresh `src/lib/api/generated`.

## Project Structure

```text
src/
├── app/
│   ├── [locale]/          # Pages (posts, bookmarks, admin, …)
│   └── api/               # Route Handlers (BFF)
├── components/            # Shared components + shadcn/ui
├── hooks/
├── i18n/                  # Locale routing & navigation
├── lib/                   # API client, auth, utils
├── messages/              # en.json, zh.json
└── store/                 # Zustand stores
public/assets/             # Post & resume Markdown
scripts/                   # S3 upload, md2pdf
```

## Deployment

Designed for [Vercel](https://vercel.com). Production builds optionally upload static assets to S3 via `scripts/uploadToS3.js`.

Set environment variables in your hosting provider. The backend API must be deployed separately.

## Architecture

For detailed architecture, conventions, and technical debt notes, see [PROJECT_ARCHITECTURE_GPT.md](./PROJECT_ARCHITECTURE_GPT.md).

## Contributing

Issues and pull requests are welcome. For large changes, please open an issue first to discuss the approach.

## License

No license file is included yet. All rights reserved unless stated otherwise.
