import { useTransformHtmlUrls } from '@/hooks/use-transform-html-urls'

interface TransformedHtmlContentProps {
  html: string
  className?: string
}

export function TransformedHtmlContent({ html, className }: TransformedHtmlContentProps) {
  const transformedHtml = useTransformHtmlUrls(html)
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: transformedHtml }}
    />
  )
}
