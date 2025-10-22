import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  
  // Define protected routes (workspace routes)
  const protectedRoutes = ['/dashboard', '/history', '/budget-settings', '/profile', '/rfx-result-wrapper-v2']
  const authRoutes = ['/login', '/signup']
  
  const { pathname } = request.nextUrl
  
  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !accessToken && !refreshToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && (accessToken || refreshToken)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // If accessing root path
  if (pathname === '/') {
    // If authenticated, redirect to dashboard
    if (accessToken || refreshToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
