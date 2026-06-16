// Shared mock data — in production this comes from the FastAPI /api/products endpoint

export interface RegionAvailability {
  available: boolean
  stock: number
  priceOverride?: number | null
  shippingDays?: number | null
}

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
  availability?: Record<string, RegionAvailability>
  reviews?: any[]
}

export const PRODUCTS: Product[] = [
  // 1. Luxury Watch
  {
    id: 1,
    title: 'Chronos Elite Watch',
    description: 'Soft gold accents with a hand-stitched leather strap and automatic movement.',
    price: 4950.00,
    image_url: '/images/chronos_elite.jpg',
    category: 'Luxury Watch',
    rating: 4.9,
    review_count: 142,
    badge: 'Soft Gold Accents',
  },
  {
    id: 2,
    title: 'Apex Smartwatch',
    description: 'Sapphire glass screen with brushed titanium frame and real-time heart metrics.',
    price: 2499.00,
    image_url: '/images/apex_smartwatch.png',
    category: 'Luxury Watch',
    rating: 4.7,
    review_count: 85,
    badge: 'New Release',
  },
  {
    id: 3,
    title: 'Submariner Prestige Watch',
    description: 'Classic diving watch with ceramic bezel, luminous markers, and oystersteel band.',
    price: 8500.00,
    image_url: '/images/submariner_watch.png',
    category: 'Luxury Watch',
    rating: 4.9,
    review_count: 211,
    badge: 'Collector Choice',
  },
  {
    id: 4,
    title: 'Grand Tourer Chrono Watch',
    description: 'Racing-inspired chronograph watch with carbon fiber dial and black rubber racing strap.',
    price: 3200.00,
    image_url: '/images/grand_tourer_watch.png',
    category: 'Luxury Watch',
    rating: 4.7,
    review_count: 62,
  },
  {
    id: 5,
    title: 'Heritage Dress Watch',
    description: 'Ultra-thin 18k rose gold dress watch with manual wind and subsecond dial.',
    price: 6200.00,
    image_url: '/images/heritage_dress_watch.png',
    category: 'Luxury Watch',
    rating: 4.8,
    review_count: 31,
  },

  // 2. Premium Audio
  {
    id: 6,
    title: 'Aura Headphones',
    description: 'Sleek over-ear audio with custom acoustic profile and hybrid active noise cancellation.',
    price: 850.00,
    image_url: '/images/aura_headphones.jpg',
    category: 'Premium Audio',
    rating: 4.8,
    review_count: 98,
    badge: 'Product Shot',
  },
  {
    id: 7,
    title: 'Studio Reference Monitor',
    description: 'Active bi-amplified studio monitor with beryllium dome tweeter and carbon fiber woofer.',
    price: 1800.00,
    image_url: '/images/studio_monitor.png',
    category: 'Premium Audio',
    rating: 4.9,
    review_count: 19,
    badge: 'Pro Audio',
  },
  {
    id: 8,
    title: 'Verge Wireless Earbuds',
    description: 'Ultra-compact true wireless earbuds with custom adaptive audio tuning and secure fit.',
    price: 299.00,
    image_url: '/images/verge_earbuds.png',
    category: 'Premium Audio',
    rating: 4.6,
    review_count: 88,
  },

  // 3. Designer Bags
  {
    id: 9,
    title: 'Aria Crossbody',
    description: 'Handcrafted calfskin leather crossbody bag with structured metal hardware.',
    price: 1200.00,
    image_url: '/images/aria_crossbody.jpg',
    category: 'Designer Bags',
    rating: 4.7,
    review_count: 64,
    badge: 'Designer',
  },
  {
    id: 10,
    title: 'Voyager Leather Duffle',
    description: 'Spacious weekender bag crafted from water-resistant pebble-grain leather.',
    price: 1650.00,
    image_url: '/images/voyager_duffle.png',
    category: 'Designer Bags',
    rating: 4.8,
    review_count: 36,
    badge: 'Travel Premium',
  },
  {
    id: 11,
    title: 'Vanguard Briefcase',
    description: 'Structured saffiano leather briefcase with padded laptop sleeve and combination lock.',
    price: 980.00,
    image_url: '/images/vanguard_briefcase.png',
    category: 'Designer Bags',
    rating: 4.8,
    review_count: 29,
  },
  {
    id: 12,
    title: 'Summit Rolltop Backpack',
    description: 'Water-resistant canvas backpack with leather straps and solid brass quick-release clips.',
    price: 850.00,
    image_url: '/images/rolltop_backpack.png',
    category: 'Designer Bags',
    rating: 4.7,
    review_count: 48,
  },

  // 4. Apparel
  {
    id: 13,
    title: 'Modern Essential Blazer',
    description: 'Minimalist double-breasted structured blazer in premium wool blend.',
    price: 950.00,
    image_url: '/images/modern_essential.jpg',
    category: 'Apparel',
    rating: 4.6,
    review_count: 53,
    badge: 'Curated Look',
  },
  {
    id: 14,
    title: 'Sartorial Trench Coat',
    description: 'Bespoke cotton-gabardine storm coat with signature horn buttons.',
    price: 1850.00,
    image_url: '/images/sartorial_trench.png',
    category: 'Apparel',
    rating: 4.9,
    review_count: 24,
    badge: 'Premium Selection',
  },
  {
    id: 15,
    title: 'Luxe Cashmere Hoodie',
    description: 'Knit from 100% Mongolian cashmere with a relaxed fit and gold-tipped drawstrings.',
    price: 580.00,
    image_url: '/images/cashmere_hoodie.png',
    category: 'Apparel',
    rating: 4.9,
    review_count: 38,
    badge: 'Cashmere',
  },
  {
    id: 16,
    title: 'Savile Row Dinner Suit',
    description: 'Bespoke double-breasted tux in midnight navy with satin peak lapels.',
    price: 2800.00,
    image_url: '/images/dinner_suit.png',
    category: 'Apparel',
    rating: 5.0,
    review_count: 12,
    badge: 'Bespoke',
  },
  {
    id: 17,
    title: 'Classic Linen Shirt',
    description: 'Breathable Italian linen shirt with a tailored fit, perfect for warm coastal evenings.',
    price: 180.00,
    image_url: '/images/linen_shirt.png',
    category: 'Apparel',
    rating: 4.4,
    review_count: 49,
  },
  {
    id: 18,
    title: 'Merino Wool Mockneck',
    description: 'Fine-gauge merino wool sweater with ribbed collar and cuffs, exceptionally soft.',
    price: 240.00,
    image_url: '/images/merino_mockneck.png',
    category: 'Apparel',
    rating: 4.7,
    review_count: 57,
  },
  {
    id: 19,
    title: 'Park Avenue Leather Jacket',
    description: 'Buttery soft lambskin leather bomber jacket with custom gold zippers and silk lining.',
    price: 1450.00,
    image_url: '/images/leather_jacket.png',
    category: 'Apparel',
    rating: 4.9,
    review_count: 22,
    badge: 'Limited',
  },
  {
    id: 20,
    title: 'Royal Silk Kurta',
    description: 'Hand-loomed raw silk Kurta in deep gold with intricate embroidery around the collar.',
    price: 380.00,
    image_url: '/images/royal_silk_kurta.png',
    category: 'Apparel',
    rating: 4.8,
    review_count: 36,
    badge: 'Festive Selection',
  },
  {
    id: 21,
    title: 'Sovereign Nehru Jacket',
    description: 'Bespoke textured Nehru jacket with gold-plated brass buttons, designed to layer over kurtas.',
    price: 420.00,
    image_url: '/images/nehru_jacket.png',
    category: 'Apparel',
    rating: 4.7,
    review_count: 29,
    badge: 'Classic Layer',
  },
  {
    id: 22,
    title: 'Heritage Sherwani',
    description: 'Luxury embroidered Sherwani coat crafted from fine jacquard silk with traditional motifs.',
    price: 1250.00,
    image_url: '/images/heritage_sherwani.png',
    category: 'Apparel',
    rating: 4.9,
    review_count: 14,
    badge: 'Bridal Selection',
  },
  {
    id: 23,
    title: 'Traditional Printed Kurti',
    description: 'Charming cotton A-line Kurti with block print motifs, perfect for casual style.',
    price: 140.00,
    image_url: '/images/printed_kurti.png',
    category: 'Apparel',
    rating: 4.6,
    review_count: 42,
  },
  {
    id: 24,
    title: 'Designer Silk Kurti',
    description: 'Flowy pure silk Kurti with delicate zari embroidery, ideal for festive evenings.',
    price: 280.00,
    image_url: '/images/silk_kurti.png',
    category: 'Apparel',
    rating: 4.7,
    review_count: 31,
  },
  {
    id: 25,
    title: 'Classic Cotton Pyjamas',
    description: 'Super-breathable lightweight cotton pajama set with checkered print.',
    price: 95.00,
    image_url: '/images/cotton_pyjamas.png',
    category: 'Apparel',
    rating: 4.5,
    review_count: 28,
  },
  {
    id: 26,
    title: 'Satin Pajama Set',
    description: 'Silk-smooth satin pajama top and pants set with contrast piping trim.',
    price: 160.00,
    image_url: '/images/satin_pajamas.png',
    category: 'Apparel',
    rating: 4.6,
    review_count: 35,
  },

  // 5. Accessories
  {
    id: 27,
    title: 'Eclipse Sunglasses',
    description: 'Classic tortoiseshell frame with lightweight polarized Carl Zeiss lenses.',
    price: 420.00,
    image_url: '/images/eclipse_sunglasses.png',
    category: 'Accessories',
    rating: 4.5,
    review_count: 112,
    badge: 'Limited Edition',
  },
  {
    id: 28,
    title: 'Metro Leather Cardholder',
    description: 'Slim pebble-grain leather card wallet with 4 slots and a central bill pocket.',
    price: 150.00,
    image_url: '/images/leather_cardholder.png',
    category: 'Accessories',
    rating: 4.6,
    review_count: 105,
  },
  {
    id: 29,
    title: 'Atlas Brass Cuff',
    description: 'Minimalist solid brass wrist cuff with hand-engraved geometric telemetry patterns.',
    price: 280.00,
    image_url: '/images/brass_cuff.png',
    category: 'Accessories',
    rating: 4.5,
    review_count: 39,
  },
  {
    id: 30,
    title: 'Nomad Wool Scarf',
    description: 'Over-sized knit scarf in pure extrafine wool with classic fringed borders.',
    price: 190.00,
    image_url: '/images/wool_scarf.png',
    category: 'Accessories',
    rating: 4.7,
    review_count: 73,
  },
  {
    id: 31,
    title: 'Optic Blue-Light Glasses',
    description: 'Acetate frame glasses with blue-light filtering lenses for digital console sessions.',
    price: 240.00,
    image_url: '/images/blue_light_glasses.png',
    category: 'Accessories',
    rating: 4.6,
    review_count: 55,
  },
  {
    id: 32,
    title: 'Classic Leather Belt',
    description: 'Genuine full-grain leather belt with solid brass buckle, hand-finished edges.',
    price: 120.00,
    image_url: '/images/leather_belt.png',
    category: 'Accessories',
    rating: 4.5,
    review_count: 48,
  },
  {
    id: 33,
    title: 'Premium Silk Necktie',
    description: 'Hand-stitched heavy silk jacquard necktie, classic width with refined texture.',
    price: 95.00,
    image_url: '/images/silk_necktie.png',
    category: 'Accessories',
    rating: 4.6,
    review_count: 31,
  },

  // 6. Electronics
  {
    id: 34,
    title: 'Quantum Pro Laptop',
    description: 'Supercharged 16-inch workstation with liquid-cooled chip and premium anodized obsidian finish.',
    price: 2499.00,
    image_url: '/images/quantum_laptop.png',
    category: 'Electronics',
    rating: 4.9,
    review_count: 73,
    badge: 'Workstation',
  },
  {
    id: 35,
    title: 'AeroPhone 15 Pro',
    description: 'Brushed titanium smartphone with high-fidelity triple camera and 120Hz ceramic screen.',
    price: 1299.00,
    image_url: '/images/aerophone.png',
    category: 'Electronics',
    rating: 4.8,
    review_count: 124,
    badge: 'Best Seller',
  },
  {
    id: 36,
    title: 'Nomad Mechanical Keyboard',
    description: 'Machined aluminum gasket-mount keyboard with silent linear switches and custom gold keycaps.',
    price: 350.00,
    image_url: '/images/nomad_keyboard.png',
    category: 'Electronics',
    rating: 4.7,
    review_count: 42,
    badge: 'Premium Build',
  },
  {
    id: 37,
    title: 'Dual Wireless Charging Stand',
    description: 'Fast-charging qi-compatible dual device stand with soft-touch leather backing.',
    price: 89.00,
    image_url: '/images/wireless_charger.png',
    category: 'Electronics',
    rating: 4.5,
    review_count: 22,
  },
  {
    id: 38,
    title: 'Ultra-Compact Power Bank',
    description: 'Pocket-sized 20,000mAh external battery pack with dual USB-C power delivery ports.',
    price: 59.00,
    image_url: '/images/power_bank.png',
    category: 'Electronics',
    rating: 4.6,
    review_count: 18,
  },

  // 7. Footwear
  {
    id: 39,
    title: 'Stratus Knit Sneakers',
    description: 'Ultra-breathable recycled knit upper with responsive foam cushioning for all-day comfort.',
    price: 220.00,
    image_url: '/images/stratus_sneakers.png',
    category: 'Footwear',
    rating: 4.5,
    review_count: 94,
    badge: 'Trending',
  },
  {
    id: 40,
    title: 'Sovereign Chelsea Boots',
    description: 'Italian suede chelsea boots with elastic side panels and durable Goodyear-welted crepe soles.',
    price: 650.00,
    image_url: '/images/chelsea_boots.png',
    category: 'Footwear',
    rating: 4.7,
    review_count: 41,
    badge: 'Handcrafted',
  },
  {
    id: 41,
    title: 'Monarch Leather Loafers',
    description: 'Polished full-grain leather penny loafers with hand-stitched detailing and padded footbeds.',
    price: 480.00,
    image_url: '/images/monarch_loafers.png',
    category: 'Footwear',
    rating: 4.8,
    review_count: 32,
  },
  {
    id: 42,
    title: 'Apex Court High-Tops',
    description: 'Retro-inspired premium leather high-top sneakers with gold-accented eyelets.',
    price: 280.00,
    image_url: '/images/court_hightops.png',
    category: 'Footwear',
    rating: 4.6,
    review_count: 67,
  },
  {
    id: 43,
    title: 'Resilient Running Shoes',
    description: 'High-performance running shoes with breathable mesh and shock-absorbent gel sole.',
    price: 160.00,
    image_url: '/images/running_shoes.png',
    category: 'Footwear',
    rating: 4.6,
    review_count: 53,
  },
  {
    id: 44,
    title: 'Memory Foam Cozy Slippers',
    description: 'Luxuriously soft fleece slippers with memory foam insoles for indoor comfort.',
    price: 45.00,
    image_url: '/images/cozy_slippers.png',
    category: 'Footwear',
    rating: 4.5,
    review_count: 24,
  },

  // 8. Home & Kitchen
  {
    id: 45,
    title: 'Professional Chef Knife',
    description: "Forged high-carbon steel 8-inch chef's knife, balanced bolster, and ergonomic rosewood handle.",
    price: 180.00,
    image_url: '/images/chef_knife.png',
    category: 'Home & Kitchen',
    rating: 4.9,
    review_count: 37,
    badge: 'Chef Choice',
  },
  {
    id: 46,
    title: 'Precision Carving Knife Set',
    description: 'Professional 3-piece stainless steel carving set including utility knife, slicer, and meat fork.',
    price: 299.00,
    image_url: '/images/knife_set.png',
    category: 'Home & Kitchen',
    rating: 4.8,
    review_count: 29,
  },
  {
    id: 47,
    title: 'Artisan Espresso Machine',
    description: 'High-pressure pump espresso maker with integrated steam wand for barista-quality drinks.',
    price: 899.00,
    image_url: '/images/espresso_machine.png',
    category: 'Home & Kitchen',
    rating: 4.9,
    review_count: 45,
    badge: 'Premium Kitchen',
  },
  {
    id: 48,
    title: 'High-Speed Food Blender',
    description: 'Heavy-duty 1200W blender with stainless steel blades, variable speeds, and travel jars.',
    price: 149.00,
    image_url: '/images/blender.png',
    category: 'Home & Kitchen',
    rating: 4.7,
    review_count: 61,
  },
  {
    id: 49,
    title: 'Compact Digital Air Fryer',
    description: 'Rapid air circulation technology with easy-to-use digital touchscreen, nonstick basket.',
    price: 129.00,
    image_url: '/images/air_fryer.png',
    category: 'Home & Kitchen',
    rating: 4.7,
    review_count: 53,
  },
  {
    id: 50,
    title: 'Double-Walled Smart Bottle',
    description: 'Vacuum-insulated stainless steel flask with LCD temperature display cap.',
    price: 49.00,
    image_url: '/images/water_bottle.png',
    category: 'Home & Kitchen',
    rating: 4.6,
    review_count: 72,
  },
  {
    id: 51,
    title: 'Handcrafted Ceramic Mug',
    description: 'Artisanal stoneware coffee mug with unique reactive glaze, comfortably sized handle.',
    price: 35.00,
    image_url: '/images/ceramic_mug.png',
    category: 'Home & Kitchen',
    rating: 4.7,
    review_count: 110,
  },
  {
    id: 52,
    title: 'Aromatic Soy Scented Candle',
    description: 'Clean-burning soy wax candle in frosted glass jar, scented with natural cedarwood oil.',
    price: 28.00,
    image_url: '/images/scented_candle.png',
    category: 'Home & Kitchen',
    rating: 4.5,
    review_count: 42,
  },

  // 9. Fitness & Outdoors
  {
    id: 53,
    title: 'Non-Slip Alignment Yoga Mat',
    description: 'Eco-friendly natural rubber yoga mat with laser-etched posture alignment guidelines.',
    price: 68.00,
    image_url: '/images/yoga_mat.png',
    category: 'Fitness & Outdoors',
    rating: 4.8,
    review_count: 86,
    badge: 'Eco Friendly',
  },
  {
    id: 54,
    title: 'Adjustable Dumbbell Set',
    description: 'Space-saving dumbbell system, adjustable from 5 to 50 lbs with quick turn dial.',
    price: 349.00,
    image_url: '/images/dumbbells.png',
    category: 'Fitness & Outdoors',
    rating: 4.9,
    review_count: 38,
  },
  {
    id: 55,
    title: 'High-Resistance Bands Kit',
    description: 'Set of 5 heavy-duty latex loop bands with dynamic resistance weights, carry pouch.',
    price: 39.00,
    image_url: '/images/resistance_bands.png',
    category: 'Fitness & Outdoors',
    rating: 4.6,
    review_count: 94,
  },
  {
    id: 56,
    title: '4-Person Waterproof Camping Tent',
    description: 'Double-layer outdoor dome tent with weather protection rainfly and ventilated windows.',
    price: 249.00,
    image_url: '/images/camping_tent.png',
    category: 'Fitness & Outdoors',
    rating: 4.7,
    review_count: 27,
  },
  {
    id: 57,
    title: 'Ergonomic Office Chair',
    description: 'High-back mesh desk chair with adjustable lumbar support, headrest, and 3D armrests.',
    price: 499.00,
    image_url: '/images/office_chair.png',
    category: 'Fitness & Outdoors',
    rating: 4.8,
    review_count: 51,
  },
  {
    id: 58,
    title: 'Minimalist LED Desk Lamp',
    description: 'Sleek eye-caring aluminum desk lamp with dimmable modes and built-in USB ports.',
    price: 79.00,
    image_url: '/images/desk_lamp.png',
    category: 'Fitness & Outdoors',
    rating: 4.5,
    review_count: 33,
  }
]

export const CATEGORIES = [
  'All', 
  'Luxury Watch', 
  'Premium Audio', 
  'Designer Bags', 
  'Apparel', 
  'Accessories', 
  'Electronics', 
  'Footwear', 
  'Home & Kitchen', 
  'Fitness & Outdoors'
]

// Post-process products to append regional availability
PRODUCTS.forEach(p => {
  // Default availability map
  p.availability = {
    US: { available: true, stock: 15 + (p.id % 10), priceOverride: null, shippingDays: 3 },
    IN: { available: true, stock: 5 + (p.id % 5), priceOverride: null, shippingDays: 5 },
    GB: { available: true, stock: 8 + (p.id % 8), priceOverride: null, shippingDays: 4 },
    AE: { available: true, stock: 12 + (p.id % 7), priceOverride: null, shippingDays: 2 },
    DE: { available: true, stock: 10 + (p.id % 6), priceOverride: null, shippingDays: 3 }
  }

  // 1. Regional out-of-stock (available but stock is 0)
  if (p.id === 1) { // Chronos Elite Watch
    p.availability.US.stock = 0
  }
  if (p.id === 6) { // Aura Headphones
    p.availability.IN.stock = 0
  }

  // 2. Regional unavailability (available is false)
  if (p.id === 20) { // Royal Silk Kurta
    // Not available in UK (GB) and Germany (DE)
    p.availability.GB.available = false
    p.availability.DE.available = false
  }
  if (p.id === 34) { // Quantum Pro Laptop
    // Not available in UAE (AE)
    p.availability.AE.available = false
  }

  // 3. Price overrides (e.g. specialized regional listings)
  if (p.id === 35) { // AeroPhone 15 Pro
    // In India (IN), override price to INR 109,900
    p.availability.IN.priceOverride = 109900
    // In UAE (AE), override price to AED 4,799
    p.availability.AE.priceOverride = 4799
  }
})
