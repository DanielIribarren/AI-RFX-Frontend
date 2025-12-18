import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value
  
  // Define protected routes (workspace routes)
  const protectedRoutes = ['/dashboard', '/history', '/budget-settings', '/profile', '/rfx-result-wrapper-v2']
  const authRoutes = ['/login', '/signup']
  const publicRoutes = ['/', '/pricing'] // KISS: Allow public access to landing and pricing
  
  const { pathname } = request.nextUrl
  
  // Debug logging
  console.log('🔒 Middleware:', pathname)
  console.log('   Access token:', accessToken ? 'EXISTS' : 'MISSING')
  console.log('   Refresh token:', refreshToken ? 'EXISTS' : 'MISSING')
  
  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname)
  
  console.log('   Is protected route:', isProtectedRoute)
  console.log('   Is auth route:', isAuthRoute)
  console.log('   Is public route:', isPublicRoute)
  
  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !accessToken && !refreshToken) {
    console.log('❌ Middleware: No tokens, redirecting to /login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && (accessToken || refreshToken)) {
    console.log('✅ Middleware: Has tokens, redirecting to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // KISS: Allow public routes for everyone
  // The page itself will handle redirect if user is authenticated
  if (isPublicRoute) {
    console.log('✅ Middleware: Public route, allowing access')
    return NextResponse.next()
  }
  
  console.log('✅ Middleware: Allowing request to continue')
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
