import AppInit from '@/components/appInit'
import LayoutHeader from '@/components/LayoutHeader'
import QueryClientProvider from '@/components/QueryClientProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { routing } from '@/i18n/routing'
import { hasLocale, Locale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { ReactNode, Suspense } from 'react'
import '../globals.css'

type Props = {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: Omit<Props, 'children'>) {
  const { locale } = await props.params

  const t = await getTranslations({ locale, namespace: 'Common' })

  return {
    title: t('siteTitle'),
    description: t('description'),
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_BASE_URL} />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-WXNH2RJ7N7" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WXNH2RJ7N7');
          `}
        </Script>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider>
            <QueryClientProvider>
              <Suspense fallback={<div />}>
                <AppInit />
                <LayoutHeader />
                {children}
              </Suspense>
            </QueryClientProvider>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
