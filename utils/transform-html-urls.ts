/**
 * Utility functions to transform URLs inside HTML content
 * Fixes relative URLs for images and links that come from the backend
 */

/**
 * Transforms relative URLs in HTML content to use Next.js API proxy endpoints
 * @param html - HTML content with potentially relative URLs
 * @param companyId - Company ID for constructing proxy URLs
 * @returns HTML with transformed URLs
 */
export function transformHtmlUrls(html: string, companyId: string): string {
  if (!html || !companyId) {
    return html
  }

  console.log('[TransformHtmlUrls] Processing HTML for company:', companyId)
  console.log('[TransformHtmlUrls] Original HTML length:', html.length)
  console.log('[TransformHtmlUrls] HTML snippet:', html.substring(0, 300) + '...')

  let transformedHtml = html

  // Transform image sources
  transformedHtml = transformImageSources(transformedHtml, companyId)
  
  // Transform links if needed
  transformedHtml = transformLinkHrefs(transformedHtml, companyId)

  console.log('[TransformHtmlUrls] Transformed HTML length:', transformedHtml.length)
  
  return transformedHtml
}

/**
 * Transforms image src attributes in HTML
 * Converts: <img src="/static/branding/companyId/logo.png" />
 * To: <img src="/api/branding/files/companyId/logo" />
 */
function transformImageSources(html: string, companyId: string): string {
  // Regex to match img tags with src attributes
  const imgRegex = /<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi
  
  const transformedHtml = html.replace(imgRegex, (match, beforeSrc, srcUrl, afterSrc) => {
    console.log('[TransformHtmlUrls] Found image src:', srcUrl)
    
    // If it's already an absolute URL, leave it alone
    if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) {
      console.log('[TransformHtmlUrls] Absolute URL, no transform needed:', srcUrl)
      return match
    }
    
    // Transform relative URLs that look like branding assets OR any relative path with common image extensions
    const isBrandingUrl = srcUrl.includes('/static/branding/') || srcUrl.includes('/branding/')
    const isImageFile = srcUrl.match(/\.(png|jpg|jpeg|svg|webp|gif|bmp)$/i)
    const isRelativeUrl = !srcUrl.startsWith('http://') && !srcUrl.startsWith('https://') && !srcUrl.startsWith('data:')
    
    if (isBrandingUrl || (isRelativeUrl && isImageFile)) {
      let transformedSrc: string
      
      // Extract file type from URL
      if (srcUrl.includes('logo') || srcUrl.toLowerCase().includes('logo')) {
        transformedSrc = `/api/branding/files/${companyId}/logo`
        console.log('[TransformHtmlUrls] Transformed logo URL:', srcUrl, '→', transformedSrc)
      } else if (srcUrl.includes('template')) {
        transformedSrc = `/api/branding/files/${companyId}/template`
        console.log('[TransformHtmlUrls] Transformed template URL:', srcUrl, '→', transformedSrc)
      } else if (isImageFile) {
        // Generic image file - assume it's a logo
        transformedSrc = `/api/branding/files/${companyId}/logo`
        console.log('[TransformHtmlUrls] Transformed generic image URL:', srcUrl, '→', transformedSrc)
      } else {
        // Generic branding file - assume it's a template
        transformedSrc = `/api/branding/files/${companyId}/template`
        console.log('[TransformHtmlUrls] Transformed generic file URL:', srcUrl, '→', transformedSrc)
      }
      
      return `<img${beforeSrc}src="${transformedSrc}"${afterSrc}>`
    }
    
    console.log('[TransformHtmlUrls] No transform needed for:', srcUrl)
    return match
  })
  
  return transformedHtml
}

/**
 * Transforms link href attributes in HTML (if needed for downloads)
 * Converts: <a href="/static/branding/companyId/template.pdf">Download</a>
 * To: <a href="/api/branding/files/companyId/template">Download</a>
 */
function transformLinkHrefs(html: string, companyId: string): string {
  // Regex to match anchor tags with href attributes
  const linkRegex = /<a([^>]*?)href=["']([^"']*?)["']([^>]*?)>/gi
  
  const transformedHtml = html.replace(linkRegex, (match, beforeHref, hrefUrl, afterHref) => {
    console.log('[TransformHtmlUrls] Found link href:', hrefUrl)
    
    // If it's already an absolute URL, leave it alone
    if (hrefUrl.startsWith('http://') || hrefUrl.startsWith('https://')) {
      console.log('[TransformHtmlUrls] Absolute URL, no transform needed:', hrefUrl)
      return match
    }
    
    // Transform relative URLs that look like branding assets
    if (hrefUrl.includes('/static/branding/') || hrefUrl.includes('/branding/')) {
      let transformedHref: string
      
      // Most links to branding files are probably templates
      if (hrefUrl.includes('template') || hrefUrl.match(/\.(pdf|xlsx|xls)$/i)) {
        transformedHref = `/api/branding/files/${companyId}/template`
        console.log('[TransformHtmlUrls] Transformed template link:', hrefUrl, '→', transformedHref)
      } else {
        transformedHref = `/api/branding/files/${companyId}/logo`
        console.log('[TransformHtmlUrls] Transformed logo link:', hrefUrl, '→', transformedHref)
      }
      
      return `<a${beforeHref}href="${transformedHref}"${afterHref}>`
    }
    
    console.log('[TransformHtmlUrls] No transform needed for link:', hrefUrl)
    return match
  })
  
  return transformedHtml
}

/**
 * Alternative approach: Transform URLs using DOMParser (more robust but requires browser environment)
 * Use this if the regex approach has issues with complex HTML
 */
export function transformHtmlUrlsWithDom(html: string, companyId: string): string {
  if (!html || !companyId || typeof window === 'undefined') {
    return html
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Transform all images
    const images = doc.querySelectorAll('img[src]')
    images.forEach(img => {
      const src = img.getAttribute('src')
      if (src && (src.includes('/static/branding/') || src.includes('/branding/'))) {
        let newSrc: string
        if (src.includes('logo')) {
          newSrc = `/api/branding/files/${companyId}/logo`
        } else {
          newSrc = `/api/branding/files/${companyId}/template`
        }
        console.log('[TransformHtmlUrls] DOM transform image:', src, '→', newSrc)
        img.setAttribute('src', newSrc)
      }
    })
    
    // Transform all links
    const links = doc.querySelectorAll('a[href]')
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (href && (href.includes('/static/branding/') || href.includes('/branding/'))) {
        let newHref: string
        if (href.includes('template') || href.match(/\.(pdf|xlsx|xls)$/i)) {
          newHref = `/api/branding/files/${companyId}/template`
        } else {
          newHref = `/api/branding/files/${companyId}/logo`
        }
        console.log('[TransformHtmlUrls] DOM transform link:', href, '→', newHref)
        link.setAttribute('href', newHref)
      }
    })
    
    // Return the transformed HTML
    return doc.body.innerHTML
  } catch (error) {
    console.error('[TransformHtmlUrls] DOM parsing failed, falling back to regex:', error)
    return transformHtmlUrls(html, companyId)
  }
}
