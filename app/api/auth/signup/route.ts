import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5001/api/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Signup proxy error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Network error. Please try again.' },
      { status: 500 }
    )
  }
}
