import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    
    console.log(`[Branding GET] Fetching branding for company: ${companyId}`)
    console.log(`[Branding GET] Backend URL: ${BACKEND_URL}/api/branding/${companyId}`)
    
    const response = await fetch(`${BACKEND_URL}/api/branding/${companyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log(`[Branding GET] Response status: ${response.status}`)
    
    // Verificar si la respuesta es JSON válido
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('[Branding GET] Non-JSON response:', text)
      return NextResponse.json(
        { status: 'error', message: 'Invalid response from backend' },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log(`[Branding GET] Response data:`, JSON.stringify(data, null, 2))
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Branding GET] Error:', error)
    console.error('[Branding GET] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { status: 'error', message: 'Network error. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    
    const response = await fetch(`${BACKEND_URL}/api/branding/${companyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Branding delete proxy error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Network error. Please try again.' },
      { status: 500 }
    )
  }
}
