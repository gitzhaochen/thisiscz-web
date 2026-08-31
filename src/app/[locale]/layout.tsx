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
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'
import '../globals.css'

type Props = {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata(props: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await props.params

  const t = await getTranslations({ locale, namespace: 'Common' })

  return {
    metadataBase: new URL(SITE_URL),
    title: t('siteTitle'),
    description: t('description'),
    openGraph: {
      siteName: 'ThisIsCZ',
      type: 'website',
    },
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
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-WXNH2RJ7N7" strategy="lazyOnload" />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-WXNH2RJ7N7');
        `}
      </Script>
      {/* <Script id="crisp-chat" type="text/javascript" strategy="afterInteractive">
        {`
          window.$crisp=[];window.CRISP_WEBSITE_ID="860f0fe8-6635-4118-9b68-a8f12ec0bd6c";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
        `}
      </Script> */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <NextIntlClientProvider>
          <QueryClientProvider>
            <Suspense fallback={<div />}>
              <AppInit />
              <LayoutHeader />
              <div lang={locale}>{children}</div>
            </Suspense>
          </QueryClientProvider>
          <Toaster />
        </NextIntlClientProvider>
      </ThemeProvider>
    </>
  )
}
