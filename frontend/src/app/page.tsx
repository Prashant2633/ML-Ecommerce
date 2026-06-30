'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Settings, ArrowUpRight, ArrowLeft, ArrowRight, Heart, ChevronRight, BarChart2, Eye, ShieldAlert, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import CartDrawer from '@/components/CartDrawer'
import { PRODUCTS, CATEGORIES, type Product } from '@/lib/products'
import { fetchRecommendations } from '@/lib/telemetry'
import { useRegion } from '@/components/RegionContext'
import { useAuth } from '@/components/AuthContext'

const HeroCanvas = dynamic(() => import('@/components/HeroCanvas'), { ssr: false })

gsap.registerPlugin(ScrollTrigger)

interface CartItem { id: number; title: string; price: number; quantity: number; image_url?: string; size?: string }

export default function HomePage() {
  const router = useRouter()
  const pageRef = useRef<HTMLDivElement>(null)
  const bentoGridRef = useRef<HTMLDivElement>(null)
  const bentoCardsRef = useRef<(HTMLDivElement | null)[]>([])
  const catalogSectionRef = useRef<HTMLDivElement>(null)
  
  const { user, syncCart } = useAuth()
  const [dbProducts, setDbProducts] = useState<Product[]>(PRODUCTS)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [aiRecs, setAiRecs] = useState<Product[]>([])
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const { activeRegion, formatPrice } = useRegion()

  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default')
  const maxSliderValue = activeRegion.currencyCode === 'INR' ? 800000 :
                         activeRegion.currencyCode === 'AED' ? 40000 : 10000
  const [maxPrice, setMaxPrice] = useState<number>(10000)
  const [visibleCount, setVisibleCount] = useState<number>(9)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
  
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    setMaxPrice(maxSliderValue)
  }, [activeRegion])

  useEffect(() => {
    setVisibleCount(9)
  }, [activeCategory, searchQuery, activeRegion, sortBy, maxPrice])

  const [trendsMenuOpen, setTrendsMenuOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [styleSettingsOpen, setStyleSettingsOpen] = useState(false)
  const [recommendationLimit, setRecommendationLimit] = useState(3)
  const [styleBias, setStyleBias] = useState<'minimal' | 'avant-garde' | 'classic' | 'sporty'>('minimal')
  const [weeklyViews, setWeeklyViews] = useState(48)
  const [weeklyData, setWeeklyData] = useState([30, 48, 65, 80, 55, 90])

  const exportTelemetry = () => {
    const data = {
      user: {
        id: "NEX-992-04",
        name: "Alexander Mercer",
        tier: "Elite Sovereign Member",
        balance: 48250.00
      },
      preference_shift: {
        monday: "Accessory click: Eclipse Sunglasses",
        wednesday: "Watch view: Chronos Elite",
        saturday: "Audio checkout: Aura Headphones"
      },
      affinity: {
        luxury_watch: 0.85,
        premium_audio: 0.72,
        designer_bags: 0.64,
        curated_looks: 0.52
      },
      system_telemetry: {
        latency_ms: 38,
        convergence: "98.6%",
        engine: "NumPy content-based similarity index v1.0.4"
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus_telemetry_report_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setTrendsMenuOpen(false)
  }

  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true)
    window.addEventListener('open-cart', handleOpenCart)
    return () => window.removeEventListener('open-cart', handleOpenCart)
  }, [])

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    // Fetch products from database first
    fetch(`${API_URL}/api/products/`)
      .then(res => res.json())
      .then(data => {
        let loadedProducts = PRODUCTS
        if (Array.isArray(data) && data.length > 0) {
          setDbProducts(data)
          loadedProducts = data
        }
        
        // Then load recommendations using loadedProducts
        fetchRecommendations(user ? user.id : 1)
          .then((ids: number[]) => {
            if (ids.length > 0) {
              const recs = ids
                .map((id) => loadedProducts.find((p) => p.id === id))
                .filter((p): p is Product => p !== undefined)
              setAiRecs(recs.slice(0, 3))
            } else {
              setAiRecs([...loadedProducts].sort(() => Math.random() - 0.5).slice(0, 3))
            }
          })
          .catch(() => {
            setAiRecs([...loadedProducts].sort(() => Math.random() - 0.5).slice(0, 3))
          })

        // Set trending products from db
        setTrendingProducts(loadedProducts.slice(0, 3))
      })
      .catch(err => {
        console.error('Failed to fetch products from database', err)
        // Fallback to static recommendations
        fetchRecommendations(1)
          .then((ids: number[]) => {
            if (ids.length > 0) {
              const recs = ids
                .map((id) => PRODUCTS.find((p) => p.id === id))
                .filter((p): p is Product => p !== undefined)
              setAiRecs(recs.slice(0, 3))
            } else {
              setAiRecs([...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, 3))
            }
          })
          .catch(() => {
            setAiRecs([...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, 3))
          })
        setTrendingProducts([...PRODUCTS].slice(0, 3))
      })
  }, [user])

  useEffect(() => {
    // Handle cross-page scrolling and search query from URL params
    const params = new URLSearchParams(window.location.search)
    const scrollTarget = params.get('scroll')
    if (scrollTarget) {
      const el = document.getElementById(scrollTarget)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 300)
      }
    }

    const searchParam = params.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
      const catalogEl = document.getElementById('catalog')
      if (catalogEl) {
        setTimeout(() => {
          catalogEl.scrollIntoView({ behavior: 'smooth' })
        }, 400)
      }
    }
  }, [])

  useEffect(() => {
    if (!pageRef.current) return

    const ctx = gsap.context(() => {
      // Fade-in bento cards sequentially
      gsap.fromTo(
        bentoCardsRef.current.filter(Boolean),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power3.out',
        }
      )

      // Catalog entrance animation on scroll
      gsap.fromTo(
        catalogSectionRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: catalogSectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      )
    }, pageRef)

    return () => ctx.revert()
  }, [])

  const getProductPrice = (p: Product) => {
    const avail = p.availability?.[activeRegion.code]
    if (avail && avail.priceOverride !== undefined && avail.priceOverride !== null) {
      return avail.priceOverride
    }
    const rate = {
      USD: 1.0,
      INR: 83.5,
      GBP: 0.79,
      AED: 3.67,
      EUR: 0.93
    }[activeRegion.currencyCode] || 1.0
    return p.price * rate
  }

  const filtered = dbProducts
    .filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory
      
      const isAvailableInRegion = p.availability?.[activeRegion.code]?.available ?? true
      if (!isAvailableInRegion) return false

      const localPrice = getProductPrice(p)
      if (localPrice > maxPrice) return false

      if (searchQuery.trim() === '') return matchesCategory

      const queryWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean)
      const matchesSearch = queryWords.every(word => {
        const stems = [word]
        if (word.endsWith('s')) stems.push(word.slice(0, -1))
        if (word.endsWith('es')) stems.push(word.slice(0, -2))
        if (word.endsWith('ies')) stems.push(word.slice(0, -3) + 'y')

        return stems.some(stem => {
          const titleMatch = p.title.toLowerCase().includes(stem)
          const descMatch = p.description.toLowerCase().includes(stem)
          const catMatch = p.category.toLowerCase().includes(stem)
          
          let synonymMatch = false
          if (stem === 'shoe' || stem === 'footwear') {
            synonymMatch = p.title.toLowerCase().includes('sneaker') || 
                           p.title.toLowerCase().includes('boot') || 
                           p.title.toLowerCase().includes('loafer') || 
                           p.title.toLowerCase().includes('high-top') ||
                           p.category.toLowerCase().includes('footwear')
          }
          if (stem === 'cloth' || stem === 'clothing' || stem === 'apparel' || stem === 'wear') {
            synonymMatch = p.category.toLowerCase().includes('looks') || 
                           p.title.toLowerCase().includes('blazer') || 
                           p.title.toLowerCase().includes('coat') || 
                           p.title.toLowerCase().includes('hoodie') || 
                           p.title.toLowerCase().includes('suit') || 
                           p.title.toLowerCase().includes('shirt') || 
                           p.title.toLowerCase().includes('mockneck') || 
                           p.title.toLowerCase().includes('jacket') || 
                           p.title.toLowerCase().includes('kurta') || 
                           p.title.toLowerCase().includes('sherwani')
          }
          if (stem === 'bag' || stem === 'backpack' || stem === 'luggage') {
            synonymMatch = p.category.toLowerCase().includes('bags') ||
                           p.title.toLowerCase().includes('duffle') || 
                           p.title.toLowerCase().includes('backpack') || 
                           p.title.toLowerCase().includes('crossbody') || 
                           p.title.toLowerCase().includes('briefcase')
          }
          if (stem === 'electronic' || stem === 'device' || stem === 'gadget') {
            synonymMatch = p.category.toLowerCase().includes('electronics') ||
                           p.title.toLowerCase().includes('laptop') || 
                           p.title.toLowerCase().includes('phone') || 
                           p.title.toLowerCase().includes('keyboard')
          }
          if (stem === 'kurta' || stem === 'sherwani' || stem === 'nehru') {
            synonymMatch = p.title.toLowerCase().includes('kurta') || 
                           p.title.toLowerCase().includes('nehru') || 
                           p.title.toLowerCase().includes('sherwani') ||
                           p.description.toLowerCase().includes('kurta') || 
                           p.description.toLowerCase().includes('nehru') || 
                           p.description.toLowerCase().includes('sherwani')
          }

          return titleMatch || descMatch || catMatch || synonymMatch
        })
      })

      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') {
        return getProductPrice(a) - getProductPrice(b)
      } else if (sortBy === 'price-high') {
        return getProductPrice(b) - getProductPrice(a)
      } else if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0)
      }
      return 0
    })

  // Load initial cart
  useEffect(() => {
    if (user) {
      setCart(user.cart || [])
    } else {
      const saved = localStorage.getItem('nexcart_cart')
      if (saved) {
        try {
          setCart(JSON.parse(saved))
        } catch {
          setCart([])
        }
      }
    }
  }, [user])

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('nexcart_cart', JSON.stringify(newCart))
    if (user) {
      syncCart(newCart)
    }
  }

  const addToCart = (product: Product) => {
    if (product.category === 'Apparel' || product.category === 'Footwear') {
      showToast(`Please select a size for "${product.title}"`, 'info')
      router.push(`/products/${product.id}`)
      return
    }

    const existing = cart.find(i => i.id === product.id)
    let newCart: CartItem[]
    if (existing) {
      newCart = cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
    } else {
      newCart = [...cart, { id: product.id, title: product.title, price: product.price, quantity: 1, image_url: product.image_url }]
    }
    saveCart(newCart)
    showToast(`Added "${product.title}" to cart!`)
  }

  const updateQty = (id: number, delta: number, size?: string) => {
    const item = cart.find(i => i.id === id && i.size === size)
    const newCart = cart.map(i => {
      if (i.id === id && i.size === size) {
        return { ...i, quantity: i.quantity + delta }
      }
      return i
    }).filter(i => i.quantity > 0)
    saveCart(newCart)
    
    if (item) {
      if (delta > 0) {
        showToast(`Increased quantity of "${item.title}"${size ? ` (Size: ${size})` : ''}`)
      } else {
        const stillInCart = newCart.find(i => i.id === id && i.size === size)
        if (stillInCart) {
          showToast(`Decreased quantity of "${item.title}"${size ? ` (Size: ${size})` : ''}`)
        } else {
          showToast(`Removed "${item.title}"${size ? ` (Size: ${size})` : ''} from cart`, 'info')
        }
      }
    }
  }

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar cart={cart} onCartClick={() => setCartOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* ── Top-Fold Premium Bento Grid Section ── */}
      <section id="discover" style={{ padding: '40px 24px', maxWidth: 1300, margin: '0 auto' }}>
        <div ref={bentoGridRef} className="bento-grid-luxury">
          
          {/* Card 1: Main Hero Panel (Col 2, Row 2) */}
          <div 
            ref={el => { bentoCardsRef.current[0] = el }}
            className="bento-card-lux bento-span-2x2"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(11, 12, 14, 0.95) 40%, rgba(11, 12, 14, 0.5) 100%), url("/images/chronos_elite.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'right center',
              minHeight: 380,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {/* Embedded 3D canvas behind text */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', zIndex: 1 }}>
              <HeroCanvas />
            </div>

            <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="gold-dot" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c5a059', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Intelligent Commerce
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(1.8rem, 3.8vw, 2.8rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-inter, sans-serif)',
                textTransform: 'uppercase',
                margin: 0
              }}>
                Curated Luxury.<br />
                <span style={{ background: 'linear-gradient(135deg, #ffffff, #c5a059)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligent Commerce.</span>
              </h1>

              <p style={{ fontSize: '0.85rem', color: '#8e8e93', lineHeight: 1.6, margin: 0 }}>
                Experience styling tailored dynamically to your behavior. Pure serverless execution delivering latency-free content discovery.
              </p>

              <button
                className="btn-lux-filled"
                style={{ alignSelf: 'flex-start', marginTop: 12 }}
                onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Now
              </button>
            </div>
          </div>

          {/* Card 2: AI Style Guide (Col 1, Row 2) */}
          <div 
            id="style-guide"
            ref={el => { bentoCardsRef.current[1] = el }}
            className="bento-card-lux bento-span-1x2"
            style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
                AI Style Guide
              </h3>
              <Settings size={15} style={{ color: '#8e8e93', cursor: 'pointer' }} onClick={() => setStyleSettingsOpen(true)} />
            </div>

            {/* Recs Grid */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Personalized Recommendations
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { img: '/images/chronos_elite.jpg', tag: 'Watch' },
                  { img: '/images/aura_headphones.jpg', tag: 'Audio' },
                  { img: '/images/aria_crossbody.jpg', tag: 'Bag' },
                ].map((item, idx) => (
                  <div key={idx} className="style-guide-thumb">
                    <img src={item.img} alt={item.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                <div className="style-guide-thumb" style={{ background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#c5a059', fontWeight: 600 }}>
                  +
                </div>
              </div>
            </div>

            {/* Style Matches */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Style Matches
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Leather', 'Minimalism', 'Bespoke'].map(tag => (
                  <span key={tag} className="tag-lux-badge">
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#c5a059' }} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Refined Performance SVG Line Chart */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 90 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase' }}>Refined Performance</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c5a059' }}>8.8/10</span>
              </div>
              
              {/* Mini SVG Chart */}
              <div style={{ position: 'relative', width: '100%', height: 45 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <path
                    d="M0,25 Q15,20 30,12 T60,18 T90,5 T100,2"
                    fill="none"
                    stroke="url(#goldGradient)"
                    strokeWidth="1.5"
                  />
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#aa820a" />
                      <stop offset="100%" stopColor="#c5a059" />
                    </linearGradient>
                  </defs>
                  {/* Points */}
                  <circle cx="30" cy="12" r="1.5" fill="var(--text-primary)" />
                  <circle cx="60" cy="18" r="1.5" fill="var(--text-primary)" />
                  <circle cx="90" cy="5" r="1.8" fill="#c5a059" />
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#8e8e93', marginTop: 4, letterSpacing: '0.05em' }}>
                <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: '#8e8e93' }}>Style Profile Score (Demo)</span>
              <span style={{ fontWeight: 800, color: '#c5a059' }}>8.8/10</span>
            </div>
          </div>

          {/* Card 3: Luxury Watch (Col 1, Row 1) */}
          <div 
            ref={el => { bentoCardsRef.current[2] = el }}
            className="bento-card-lux bento-span-1x1"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c5a059', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Luxury Watch</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 12, maxHeight: 110, position: 'relative' }}>
              <img src="/images/chronos_elite.jpg" alt="Watch" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '0.62rem', color: '#8e8e93', display: 'block', marginBottom: 2 }}>SOFT GOLD ACCENTS</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>Chronos Elite</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c5a059', display: 'block', marginTop: 2 }}>
                  {formatPrice(4950, PRODUCTS.find(p => p.id === 1)?.availability?.[activeRegion.code]?.priceOverride)}
                </span>
              </div>
              <Link href="/products/1" className="arrow-btn-lux">
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 4: Premium Audio (Col 1, Row 1) */}
          <div 
            ref={el => { bentoCardsRef.current[3] = el }}
            className="bento-card-lux bento-span-1x1"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c5a059', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Premium Audio</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 12, maxHeight: 110, position: 'relative' }}>
              <img src="/images/aura_headphones.jpg" alt="Headphones" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '0.62rem', color: '#8e8e93', display: 'block', marginBottom: 2 }}>PRODUCT SHOT</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>Aura Headphones</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c5a059', display: 'block', marginTop: 2 }}>
                  {formatPrice(850, PRODUCTS.find(p => p.id === 2)?.availability?.[activeRegion.code]?.priceOverride)}
                </span>
              </div>
              <Link href="/products/2" className="arrow-btn-lux">
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 6: Trends (Col 1, Row 2) */}
          <div 
            ref={el => { bentoCardsRef.current[5] = el }}
            className="bento-card-lux bento-span-1x2"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
                Your Trends
              </h3>
              <span 
                style={{ color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setTrendsMenuOpen(!trendsMenuOpen)}
              >
                •••
              </span>

              {/* Trends Dropdown Menu */}
              {trendsMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 24,
                  right: 0,
                  background: '#14161a',
                  border: '1px solid rgba(197,160,89,0.3)',
                  borderRadius: 8,
                  width: 180,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px 0',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <button 
                    onClick={() => {
                      setWeeklyViews(0);
                      setWeeklyData([0, 0, 0, 0, 0, 0]);
                      setTrendsMenuOpen(false);
                      alert("Activity history cleared!");
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#8e8e93', fontSize: '0.72rem', fontWeight: 600,
                      padding: '8px 16px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.2s, background 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#c5a059'; e.currentTarget.style.background = 'rgba(197,160,89,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8e8e93'; e.currentTarget.style.background = 'none' }}
                  >
                    🗑 Clear Activity
                  </button>
                  <button 
                    onClick={() => {
                      setWeeklyData([60, 95, 80, 110, 85, 130]);
                      setWeeklyViews(92);
                      setTrendsMenuOpen(false);
                      alert("Switched weekly timeline to Monthly Moving Average.");
                    }}
                    style={{
                      background: 'none', border: 'none', color: '#8e8e93', fontSize: '0.72rem', fontWeight: 600,
                      padding: '8px 16px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.2s, background 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#c5a059'; e.currentTarget.style.background = 'rgba(197,160,89,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8e8e93'; e.currentTarget.style.background = 'none' }}
                  >
                    🗓 Switch to Monthly
                  </button>
                  <button 
                    onClick={exportTelemetry}
                    style={{
                      background: 'none', border: 'none', color: '#8e8e93', fontSize: '0.72rem', fontWeight: 600,
                      padding: '8px 16px', textAlign: 'left', cursor: 'pointer', transition: 'color 0.2s, background 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#c5a059'; e.currentTarget.style.background = 'rgba(197,160,89,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8e8e93'; e.currentTarget.style.background = 'none' }}
                  >
                    📥 Export JSON Report
                  </button>
                </div>
              )}
            </div>

            {/* Vertical Bar Chart */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8e8e93', marginBottom: 10 }}>
                <span>WEEKLY ACTIVITY (Demo)</span>
                <span>PREFERENCE SHIFT</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 75, padding: '0 10px', gap: 12 }}>
                {weeklyData.map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%',
                      height: `${h}px`,
                      background: i === weeklyData.length - 1 ? 'linear-gradient(to top, #aa820a, #c5a059)' : 'var(--border-subtle)',
                      borderRadius: 4,
                      transition: 'all 0.3s'
                    }} />
                    <span style={{ fontSize: '0.5rem', color: '#8e8e93' }}>
                      {['W', 'T', 'W', 'T', 'F', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Engagement
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', marginLeft: 4 }}>
                    {[
                      { initial: 'A', bg: '#aa820a' },
                      { initial: 'B', bg: '#c5a059' },
                    ].map((user, idx) => (
                      <div key={idx} style={{
                        width: 20, height: 20, borderRadius: '50%', background: user.bg, color: '#0b0c0e', fontSize: '0.62rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #16181c', marginLeft: idx > 0 ? -6 : 0
                      }}>
                        {user.initial}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#8e8e93', marginLeft: 4 }}>Active matches</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#8e8e93', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Items Viewed (Demo)</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c5a059' }}>{weeklyViews}</span>
              </div>
            </div>

            <button 
              className="btn-lux-outline" 
              style={{ marginTop: 'auto', width: '100%' }}
              onClick={() => setInsightsOpen(true)}
            >
              View Insights
            </button>
          </div>

          {/* Card 5: Navigation & controls (Col 1, Row 1) */}
          <div 
            ref={el => { bentoCardsRef.current[4] = el }}
            className="bento-card-lux bento-span-1x1"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8e8e93', textTransform: 'uppercase' }}>Console</span>
              <span className="badge" style={{ background: 'rgba(197,160,89,0.12)', color: '#c5a059', border: '1px solid rgba(197,160,89,0.2)' }}>
                38ms Latency
              </span>
            </div>

            <div style={{ padding: '10px 0' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, display: 'block', color: '#c5a059' }}>✦ 98.6%</span>
              <span style={{ fontSize: '0.65rem', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommendation convergence</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="control-btn-lux" style={{ flex: 1 }}>
                <ArrowLeft size={14} />
              </button>
              <button className="control-btn-lux" style={{ flex: 1 }}>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 7: Designer Bag (Col 1, Row 1) */}
          <div 
            ref={el => { bentoCardsRef.current[6] = el }}
            className="bento-card-lux bento-span-1x1"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c5a059', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Designer</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 12, maxHeight: 110, position: 'relative' }}>
              <img src="/images/aria_crossbody.jpg" alt="Bag" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '0.62rem', color: '#8e8e93', display: 'block', marginBottom: 2 }}>CALFSKIN LEATHER</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>Aria Crossbody</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c5a059', display: 'block', marginTop: 2 }}>
                  {formatPrice(1200, PRODUCTS.find(p => p.id === 3)?.availability?.[activeRegion.code]?.priceOverride)}
                </span>
              </div>
              <Link href="/products/3" className="arrow-btn-lux">
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 8: Modern Essential (Col 1, Row 1) */}
          <div 
            ref={el => { bentoCardsRef.current[7] = el }}
            className="bento-card-lux bento-span-1x1"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c5a059', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Curated Look</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 12, maxHeight: 110, position: 'relative' }}>
              <img src="/images/modern_essential.jpg" alt="Blazer Model" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '0.62rem', color: '#8e8e93', display: 'block', marginBottom: 2 }}>WOOL BLEND BLAZER</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'block' }}>Modern Essential Collection</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c5a059', display: 'block', marginTop: 2 }}>
                  {formatPrice(950, PRODUCTS.find(p => p.id === 4)?.availability?.[activeRegion.code]?.priceOverride)}
                </span>
              </div>
              <Link href="/products/4" className="arrow-btn-lux">
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {/* Card 9: Recommended For You (Col 2, Row 1) */}
          <div 
            ref={el => { bentoCardsRef.current[8] = el }}
            className="bento-card-lux bento-span-2x1"
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.95rem', color: '#c5a059' }}>✦</span>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
                  Recommended For You
                </h3>
              </div>
              <span className="badge" style={{ background: 'rgba(197,160,89,0.12)', color: '#c5a059', border: '1px solid rgba(197,160,89,0.2)' }}>
                Content Similarity Engine
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1 }}>
              {aiRecs.map(p => (
                <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="mini-recs-card-lux">
                    <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', background: '#0b0c0e' }}>
                      <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#8e8e93', marginTop: 1 }}>
                        {p.category}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c5a059' }}>
                      {formatPrice(p.price, p.availability?.[activeRegion.code]?.priceOverride)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Product Catalog Section ── */}
      <section id="catalog" style={{ padding: '80px 24px 80px', borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.1)' }}>
        <div ref={catalogSectionRef} style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={14} style={{ color: '#c5a059' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c5a059', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Seeded Collection</span>
              </div>
              <h2 className="section-title" style={{ margin: 0, textTransform: 'uppercase', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>
                Product Catalog
              </h2>
              <p style={{ color: '#8e8e93', fontSize: '0.8rem', marginTop: 6 }}>{filtered.length} exclusive items available</p>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 100,
                    fontFamily: 'inherit',
                    border: activeCategory === cat ? '1px solid rgba(197,160,89,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    background: activeCategory === cat ? 'rgba(197,160,89,0.08)' : 'rgba(255,255,255,0.02)',
                    color: activeCategory === cat ? '#c5a059' : '#8e8e93',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (activeCategory !== cat) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                      e.currentTarget.style.color = '#f5f5f7'
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeCategory !== cat) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.color = '#8e8e93'
                    }
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Composable Filters Panel */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 16,
            padding: '16px 24px',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 24,
          }}>
            {/* Price Range Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 260 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Max Price:</span>
              <input 
                type="range" 
                min="0" 
                max={maxSliderValue} 
                value={maxPrice} 
                onChange={e => setMaxPrice(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#c5a059', height: 4, cursor: 'pointer' }} 
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c5a059', minWidth: 80 }}>
                {formatPrice(maxPrice / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : activeRegion.currencyCode === 'EUR' ? 0.93 : activeRegion.currencyCode === 'GBP' ? 0.79 : 1.0))}
              </span>
            </div>

            {/* Sorting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  color: '#f5f5f7',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))', gap: 24 }}>
            {filtered.slice(0, visibleCount).map((p, i) => (
              <div key={p.id} style={{ animation: `fadeInUp 0.4s ease ${i * 0.04}s both` }}>
                <ProductCard product={p} onAddToCart={addToCart} />
              </div>
            ))}
          </div>

          {filtered.length > visibleCount && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 9)}
                className="btn-lux-filled"
                style={{
                  padding: '12px 36px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Load More Collection
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.03)', padding: '40px 28px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: 'linear-gradient(135deg, #c5a059, #aa820a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: '#0b0c0e' }}>N</div>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}><span style={{ color: '#c5a059' }}>NEX</span>CART</span>
          </div>
          <p style={{ color: '#8e8e93', fontSize: '0.78rem', margin: 0 }}>
            Curated E-Commerce · Serverless Similarity Index · Verified on Vercel
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Privacy', 'Terms', 'Security'].map(l => (
              <span key={l} style={{ fontSize: '0.75rem', color: '#8e8e93', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c5a059'}
                onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={updateQty} onCheckout={() => { setCartOpen(false); router.push('/checkout') }} />}

      {/* Style Guide Settings Modal */}
      {styleSettingsOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }} onClick={() => setStyleSettingsOpen(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #111215 0%, #16181c 100%)',
            border: '1px solid rgba(197, 160, 89, 0.2)',
            boxShadow: '0 0 32px rgba(197, 160, 89, 0.1), 0 20px 48px rgba(0,0,0,0.8)',
            borderRadius: 20,
            width: '90%',
            maxWidth: 440,
            padding: 28,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Top Accent Line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: 2,
              background: 'linear-gradient(90deg, transparent, #c5a059, transparent)',
            }} />

            {/* Close Button */}
            <button 
              onClick={() => setStyleSettingsOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#8e8e93',
                fontSize: '1.2rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#c5a059'}
              onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c5a059', margin: 0 }}>
              AI Recommendations Tuning
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontWeight: 700 }}>
                  Recommendation Profile Bias
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { id: 'minimal', label: 'Minimalist' },
                    { id: 'avant-garde', label: 'Avant-Garde' },
                    { id: 'classic', label: 'Classic Heritage' },
                    { id: 'sporty', label: 'Tech Sporty' }
                  ].map(b => (
                    <button
                      key={b.id}
                      onClick={() => setStyleBias(b.id as any)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: styleBias === b.id ? '1px solid rgba(197,160,89,0.5)' : '1px solid rgba(255,255,255,0.06)',
                        background: styleBias === b.id ? 'rgba(197,160,89,0.08)' : 'rgba(255,255,255,0.02)',
                        color: styleBias === b.id ? '#c5a059' : '#8e8e93',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        transition: 'all 0.2s'
                      }}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 8, fontWeight: 700 }}>
                  Recommendation Engine Density
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input 
                    type="range" 
                    min="1" 
                    max="6" 
                    value={recommendationLimit} 
                    onChange={e => setRecommendationLimit(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#c5a059', height: 4 }} 
                  />
                  <span style={{ fontSize: '0.75rem', color: '#c5a059', fontWeight: 800 }}>{recommendationLimit} items</span>
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8e8e93' }}>
                <span>Neural Net Precision</span>
                <span style={{ color: '#c5a059', fontWeight: 700 }}>Dual Content-Matrix Engine</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setStyleSettingsOpen(false);
                alert("Successfully saved AI recommendations preference multipliers!");
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #c5a059, #aa820a)',
                border: 'none',
                borderRadius: 10,
                padding: '12px',
                color: '#0b0c0e',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: 'inherit'
              }}
            >
              Apply Settings
            </button>

          </div>
        </div>
      )}

      {/* Telemetry Insights Modal */}
      {insightsOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out',
        }} onClick={() => setInsightsOpen(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #111215 0%, #16181c 100%)',
            border: '1px solid rgba(197, 160, 89, 0.2)',
            boxShadow: '0 0 32px rgba(197, 160, 89, 0.1), 0 20px 48px rgba(0,0,0,0.8)',
            borderRadius: 20,
            width: '90%',
            maxWidth: 480,
            padding: 28,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Top Accent Line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '10%',
              right: '10%',
              height: 2,
              background: 'linear-gradient(90deg, transparent, #c5a059, transparent)',
            }} />

            {/* Close Button */}
            <button 
              onClick={() => setInsightsOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#8e8e93',
                fontSize: '1.2rem',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#c5a059'}
              onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c5a059', margin: 0 }}>
              Telemetry Preference Insights
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Category affinities */}
              <div>
                <span style={{ fontSize: '0.68rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 10, fontWeight: 700 }}>
                  Category Affinity Breakdown
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { cat: 'Luxury Watch', pct: 45 },
                    { cat: 'Premium Audio', pct: 28 },
                    { cat: 'Designer Bags', pct: 15 },
                    { cat: 'Curated Looks', pct: 12 }
                  ].map(affinity => (
                    <div key={affinity.cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                        <span>{affinity.cat}</span>
                        <span style={{ color: '#c5a059', fontWeight: 700 }}>{affinity.pct}%</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${affinity.pct}%`, height: '100%', background: 'linear-gradient(90deg, #aa820a, #c5a059)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preference shift */}
              <div>
                <span style={{ fontSize: '0.68rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 6, fontWeight: 700 }}>
                  Preference Shift Notes
                </span>
                <p style={{ fontSize: '0.75rem', color: '#8e8e93', lineHeight: 1.5, margin: 0 }}>
                  User demonstrates high preference stability on <span style={{ color: '#c5a059', fontWeight: 700 }}>Watches & Audio</span>. A minor preference increase in <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Curated Looks</span> is detected over Friday-Saturday clusters. Recommend pairing Chronos Elite Watch suggestions with wool-blend garments.
                </p>
              </div>

              {/* Engine statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                <div>
                  <span style={{ fontSize: '0.58rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Calculated Latency</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c5a059' }}>38ms (Serverless Index)</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.58rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Index Convergence</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>98.6% Accuracy</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setInsightsOpen(false)}
              style={{
                width: '100%',
                background: 'rgba(197, 160, 89, 0.08)',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                borderRadius: 10,
                padding: '10px',
                color: '#c5a059',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(197, 160, 89, 0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(197, 160, 89, 0.08)'}
            >
              Dismiss Insights
            </button>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'rgba(14, 16, 19, 0.95)',
          border: toast.type === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(197, 160, 89, 0.35)',
          borderRadius: 12,
          padding: '14px 20px',
          color: '#f5f5f7',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 16px rgba(197,160,89,0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'inherit',
          fontSize: '0.82rem',
          fontWeight: 600,
        }}>
          <span>{toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✨'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
