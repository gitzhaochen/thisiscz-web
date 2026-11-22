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
      <Script id="tawk-to" strategy="afterInteractive">
        {`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6ab0ac05776426344625f66a/1k311vtpl';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        `}
      </Script>
      <Script id="google-analytics" strategy="lazyOnload">
        {`(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A8283440-9bf6-4b23-a784-d1f442aebe651.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`}
      </Script>
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
