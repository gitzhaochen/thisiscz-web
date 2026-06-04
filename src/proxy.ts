import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

import type { NextRequest } from 'next/server'

// export default createMiddleware(routing)

export default async function proxy(request: NextRequest) {
  // console.log('middleware----', request.nextUrl.pathname)
  const intlMiddleware = createMiddleware(routing)
  return await intlMiddleware(request)
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
