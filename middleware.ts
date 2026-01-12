import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Early return for public routes (no processing needed)
  const publicRoutes = ['/', '/pricing', '/como-funciona', '/casos-de-estudio', '/industrias', '/blog']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
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
  
  // Auth routes check
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  if (isAuthRoute && (accessToken || refreshToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
