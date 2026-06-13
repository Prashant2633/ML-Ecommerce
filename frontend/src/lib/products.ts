// Shared mock data — in production this comes from the FastAPI /api/products endpoint

export interface Product {
  id: number
  title: string
  description: string
  price: number
  image_url: string
  category: string
  rating: number
  review_count: number
  badge?: string
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise cancellation with 30-hour battery life and multipoint connection.',
    price: 349.99,
    image_url: '/products/headphones.jpg',
    category: 'Electronics',
    rating: 4.8,
    review_count: 2341,
    badge: 'Best Seller',
  },
  {
    id: 2,
    title: 'Apple MacBook Air M3',
    description: 'Supercharged by M3 chip, with 18-hour battery and brilliant Liquid Retina display.',
    price: 1299.00,
    image_url: '/products/macbook.jpg',
    category: 'Computers',
    rating: 4.9,
    review_count: 876,
    badge: 'New',
  },
  {
    id: 3,
    title: 'Nike Air Max 270',
    description: 'Engineered mesh upper for breathability with Air Max cushioning for all-day comfort.',
    price: 149.99,
    image_url: '/products/shoes.jpg',
    category: 'Footwear',
    rating: 4.5,
    review_count: 5102,
  },
  {
    id: 4,
    title: 'Samsung 4K OLED Smart TV 55"',
    description: 'Quantum HDR OLED display with ultra-slim design and AI-powered upscaling.',
    price: 1499.99,
    image_url: '/products/tv.jpg',
    category: 'Electronics',
    rating: 4.7,
    review_count: 1204,
    badge: 'Hot Deal',
  },
  {
    id: 5,
    title: 'Kindle Paperwhite Signature Edition',
    description: '6.8" display with adjustable warm light, wireless charging, and 32 GB storage.',
    price: 189.99,
    image_url: '/products/kindle.jpg',
    category: 'Books & Reading',
    rating: 4.6,
    review_count: 3879,
  },
  {
    id: 6,
    title: 'Dyson V15 Detect Vacuum',
    description: 'Laser reveals invisible dust with acoustic piezo sensor for precise particle counts.',
    price: 749.99,
    image_url: '/products/dyson.jpg',
    category: 'Home Appliances',
    rating: 4.7,
    review_count: 924,
    badge: 'Premium',
  },
  {
    id: 7,
    title: 'Levi\'s 501 Original Jeans',
    description: 'The original fit that started it all. Straight leg with a regular waist since 1873.',
    price: 69.99,
    image_url: '/products/jeans.jpg',
    category: 'Clothing',
    rating: 4.4,
    review_count: 8921,
  },
  {
    id: 8,
    title: 'Instant Pot Duo 7-in-1',
    description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker & warmer.',
    price: 99.99,
    image_url: '/products/instantpot.jpg',
    category: 'Kitchen',
    rating: 4.8,
    review_count: 14203,
    badge: 'Top Rated',
  },
]

export const CATEGORIES = ['All', 'Electronics', 'Computers', 'Footwear', 'Books & Reading', 'Home Appliances', 'Clothing', 'Kitchen']
