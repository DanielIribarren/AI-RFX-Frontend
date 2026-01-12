import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tudominio.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/casos-de-estudio',
          '/login',
          '/signup'
        ],
        disallow: [
          '/dashboard',
          '/history',
          '/profile',
          '/rfx-result-wrapper-v2',
          '/checkout',
          '/budget-settings',
          '/api/',
          '/_next/',
          '/admin/'
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
