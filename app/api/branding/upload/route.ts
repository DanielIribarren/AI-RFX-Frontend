import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const response = await fetch(`${BACKEND_URL}/api/branding/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Branding upload proxy error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Network error. Please try again.' },
      { status: 500 }
    )
  }
}
