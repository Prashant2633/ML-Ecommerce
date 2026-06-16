import { Metadata } from 'next'
import { PRODUCTS } from '@/lib/products'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { id } = await params
  const product = PRODUCTS.find((p) => p.id === Number(id))
  
  if (!product) {
    return {
      title: 'Product Not Found | NexCart',
      description: 'The requested product could not be found.',
    }
  }

  const title = `${product.title} | NexCart — Curated Luxury`
  const description = `${product.description} - Shop ${product.title} in the ${product.category} category.`
  const imageUrl = product.image_url.startsWith('http') ? product.image_url : `https://nexcart.io${product.image_url}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 600,
          alt: product.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>
}
