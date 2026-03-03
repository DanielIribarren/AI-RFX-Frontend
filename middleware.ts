import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  // Early return for public routes (no processing needed)
  const publicRoutes = ['/', '/pricing', '/como-funciona', '/casos-de-estudio', '/industrias', '/blog']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Guard against invalid RFX IDs to prevent undefined/null UUID backend calls
  const rfxRouteMatch = pathname.match(/^\/rfx-result-wrapper-v2\/(data|budget|review)\/([^/]+)/i)
  if (rfxRouteMatch) {
    const candidateId = rfxRouteMatch[2]
    if (!uuidRegex.test(candidateId)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  
  // Protected routes check
  const protectedRoutes = ['/dashboard', '/history', '/budget-settings', '/profile', '/rfx-result-wrapper-v2', '/checkout']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Only run middleware on specific routes that need auth checks
     * Exclude: api, _next, static assets, images, fonts
     */
    '/((?!api|_next|static|.*\\..*|favicon.ico).*)',
    '/dashboard/:path*',
    '/history/:path*',
    '/budget-settings/:path*',
    '/profile/:path*',
    '/rfx-result-wrapper-v2/:path*',
    '/checkout/:path*',
    '/login',
    '/signup',
  ],
}
