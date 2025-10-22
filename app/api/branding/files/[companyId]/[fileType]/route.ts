import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; fileType: string }> }
) {
  try {
    const { companyId, fileType } = await params
    
    console.log(`[Branding Files] Fetching ${fileType} for company: ${companyId}`)
    
    // Validar fileType
    if (!['logo', 'template'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be "logo" or "template"' },
        { status: 400 }
      )
    }
    
    // Hacer request al backend
    const backendUrl = `${BACKEND_URL}/api/branding/files/${companyId}/${fileType}`
    console.log(`[Branding Files] Backend URL: ${backendUrl}`)
    
    const response = await fetch(backendUrl, {
      method: 'GET',
    })

    if (!response.ok) {
      console.error(`[Branding Files] Backend returned ${response.status}`)
      return NextResponse.json(
        { error: 'File not found' },
        { status: response.status }
      )
    }

    // Obtener el archivo como blob
    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    console.log(`[Branding Files] Serving ${fileType} with content-type: ${contentType}`)

    // Retornar el archivo con los headers correctos
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[Branding Files] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    )
  }
}
