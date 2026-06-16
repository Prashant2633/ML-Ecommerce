import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcart.io'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dev/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
