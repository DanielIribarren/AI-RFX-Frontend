import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { transformHtmlUrls } from '@/utils/transform-html-urls'

/**
 * Hook to transform HTML URLs for branding assets
 * Automatically gets companyId from auth context and transforms HTML
 */
export function useTransformHtmlUrls(html: string): string {
  const { user } = useAuth()
  const companyId = user?.id // Using user ID as company ID for now
  
  const transformedHtml = useMemo(() => {
    if (!html || !companyId) {
      return html
    }
    
    return transformHtmlUrls(html, companyId)
  }, [html, companyId])
  
  return transformedHtml
}
