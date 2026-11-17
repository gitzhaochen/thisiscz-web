import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Car,
  FileText,
  Github,
  School,
  Shapes,
  ShoppingBasket,
} from 'lucide-react'
import Image from 'next/image'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
}

const FEATURES = [
  {
    key: 'nzSchools',
    href: '/nzschools',
    icon: School,
    accent:
      'border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  {
    key: 'nzPriceCompare',
    href: '/nz-price-compare',
    icon: ShoppingBasket,
    accent:
      'border-amber-200/70 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
  },
  {
    key: 'nzBargainCars',
    href: '/cars',
    icon: Car,
    accent: 'border-sky-200/70 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400',
  },
  {
    key: 'mathMotion',
    href: '/mathMotion',
    icon: Shapes,
    accent:
      'border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400',
  },
  {
    key: 'posts',
    href: '/posts',
    icon: BookOpen,
    accent:
      'border-rose-200/70 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400',
  },
  {
    key: 'bookmarks',
    href: '/bookmarks',
    icon: Bookmark,
    accent:
      'border-teal-200/70 bg-teal-50 text-teal-600 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400',
  },
] as const

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Pick<Props, 'params'>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'HomePage' })

  return {
    title: t('seoTitle'),
    description: t('seoDescription'),
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'HomePage' })
  const tags = t.raw('tags') as string[]

  return (
    <main>
      {/* Hero */}
      <section className="page-wrapper pt-10 pb-12 md:pt-16 md:pb-20">
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center">
          <div>
            <span className="text-muted-foreground inline-flex items-center gap-2 rounded-full border border-dashed px-3 py-1 text-xs font-medium">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              {t('eyebrow')}
            </span>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>

            <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-8 md:text-lg">{t('intro')}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/aboutMe">
                  {t('ctaAbout')}
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <a href="#features">{t('ctaExplore')}</a>
              </Button>
            </div>

            <ul className="text-muted-foreground mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              {tags.map((tag, index) => (
                <li key={tag} className="flex items-center gap-3">
                  {index > 0 ? <span className="bg-border h-3 w-px" aria-hidden /> : null}
                  <span>{tag}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <div className="bg-card relative mx-auto w-40 rotate-2 rounded-2xl border p-1.5 shadow-sm transition-transform duration-300 hover:rotate-0">
              <Image
                src="https://cdn.thisiscz.com/life/avatar/cz-cv.png"
                alt={t('avatarAlt')}
                width={160}
                height={192}
                className="h-auto w-full rounded-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="scroll-mt-20 border-t border-dashed">
        <div className="page-wrapper py-12 md:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
                  {t('featuresEyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{t('featuresTitle')}</h2>
              </div>
              <p className="text-muted-foreground max-w-md text-sm leading-6 md:text-right">
                {t('featuresDescription')}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ key, href, icon: Icon, accent }) => (
                <Link
                  key={key}
                  href={href}
                  className="group bg-card/60 hover:border-foreground/20 hover:bg-card focus-visible:ring-ring/50 relative flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-[3px] focus-visible:outline-none"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex size-10 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:-rotate-6 ${accent}`}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <ArrowUpRight
                      className="text-muted-foreground size-4 -translate-y-1 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold tracking-tight">{t(`features.${key}.title`)}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-6">{t(`features.${key}.description`)}</p>
                  <span className="text-muted-foreground group-hover:text-foreground mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium transition-colors">
                    {t('open')}
                    <ArrowRight
                      className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
              ))}
            </div>

            {/* Secondary links */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-dashed px-5 py-4">
              <span className="text-sm font-semibold">{t('moreTitle')}</span>
              <Link
                href="/aboutMe"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
              >
                {t('moreAboutMe')}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
              <Link
                href="/resume"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
              >
                <FileText className="size-3.5" aria-hidden />
                {t('moreResume')}
              </Link>
              <a
                href="https://github.com/gitzhaochen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
              >
                <Github className="size-3.5" aria-hidden />
                {t('moreGithub')}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-dashed">
        <div className="page-wrapper text-muted-foreground flex flex-col gap-1 py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} ThisIsCZ</span>
          <span>{t('footerNote')}</span>
        </div>
      </footer>
    </main>
  )
}
