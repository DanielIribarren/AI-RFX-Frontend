import { NextRequest, NextResponse } from 'next/server'

const AUTH_BASE_URL =
  process.env.AUTH_API_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth` : undefined) ||
  'http://localhost:5001/api/auth'

export async function POST(request: NextRequest) {
  console.log('🔐 [LOGIN ROUTE] Starting login request...')
  console.log('🔐 [LOGIN ROUTE] Backend URL:', AUTH_BASE_URL)
  
  try {
    const body = await request.json()
    console.log('🔐 [LOGIN ROUTE] Request body:', { email: body.email, password: '***' })
    
    const backendUrl = `${AUTH_BASE_URL}/login`
    console.log('🔐 [LOGIN ROUTE] Calling backend:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('🔐 [LOGIN ROUTE] Backend response status:', response.status)
    console.log('🔐 [LOGIN ROUTE] Backend response headers:', Object.fromEntries(response.headers.entries()))

    const data = await response.json()
    console.log('🔐 [LOGIN ROUTE] Backend response data:', {
      status: data.status,
      message: data.message,
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasUser: !!data.user,
    })
    
    // Si el login fue exitoso, crear cookies con los tokens
    if (response.ok && data.access_token) {
      console.log('✅ [LOGIN ROUTE] Login successful, setting cookies...')
      
      const nextResponse = NextResponse.json(data, { status: response.status })
      
      // Set access token cookie (24 hours)
      nextResponse.cookies.set('access_token', data.access_token, {
        httpOnly: false, // Necesario para que JavaScript pueda leerlo
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400, // 24 hours
        path: '/',
      })
      
      // Set refresh token cookie (7 days)
      if (data.refresh_token) {
        nextResponse.cookies.set('refresh_token', data.refresh_token, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 604800, // 7 days
          path: '/',
        })
      }
      
      console.log('✅ [LOGIN ROUTE] Cookies set successfully')
      return nextResponse
    }
    
    console.log('❌ [LOGIN ROUTE] Login failed:', data.message)
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ [LOGIN ROUTE] Login proxy error:', error)
    console.error('❌ [LOGIN ROUTE] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { status: 'error', message: 'Network error. Please try again.' },
      { status: 500 }
    )
  }
}
