import { MetadataRoute } from 'next'
import { PRODUCTS } from '@/lib/products'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexcart.io'
  
  const productUrls = PRODUCTS.map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...productUrls,
  ]
}
