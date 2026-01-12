import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-rfx.com'

export default function sitemap(): MetadataRoute.Sitemap {
  // Páginas estáticas principales - MVP simplificado (sin /como-funciona)
  const staticPages = [
    '',
    '/pricing',
    '/casos-de-estudio',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return staticPages
}
