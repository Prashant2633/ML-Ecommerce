'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PRODUCTS, type Product } from '@/lib/products'
import { track, fetchRecommendations } from '@/lib/telemetry'
import Navbar from '@/components/Navbar'
import CartDrawer from '@/components/CartDrawer'

const CATEGORY_COLORS: Record<string, string> = {
  'Luxury Watch': 'badge-gold',
  'Premium Audio': 'badge-gold',
  'Designer Bags': 'badge-gold',
  'Curated Looks': 'badge-gold',
  'Accessories': 'badge-gold',
  'Electronics': 'badge-gold',
  'Footwear': 'badge-gold',
}


export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [relatedRecs, setRelatedRecs] = useState<Product[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const [cart, setCart] = useState<any[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const product = PRODUCTS.find(p => p.id === Number(id))

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexcart_cart')
    if (saved) {
      try { setCart(JSON.parse(saved)) } catch {}
    }
  }, [])

  // Save cart changes
  const saveCart = (newCart: any[]) => {
    setCart(newCart)
    localStorage.setItem('nexcart_cart', JSON.stringify(newCart))
  }

  const handleUpdateQty = (id: number, delta: number) => {
    const newCart = cart.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0)
    saveCart(newCart)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    // Redirect to home catalog with search query param
    router.push(`/?search=${encodeURIComponent(query)}`)
  }

  useEffect(() => {
    if (!product) return
    track(product.id, 'view')

    // Fetch Content-Based recommendations similar to this product from the backend.
    // Falls back to next 3 static products if the API is unreachable.
    fetchRecommendations(1, product.id)
      .then((ids: number[]) => {
        const recs = ids
          .filter((id) => id !== product.id)
          .map((id) => PRODUCTS.find((p) => p.id === id))
          .filter((p): p is Product => p !== undefined)
        if (recs.length > 0) {
          setRelatedRecs(recs.slice(0, 3))
        } else {
          setRelatedRecs(PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3))
        }
      })
      .catch(() => {
        setRelatedRecs(PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3))
      })
  }, [product])

  // 3D image card tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = imageRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -6
    const rotY = ((x - cx) / cx) * 6
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.01)`
  }

  const handleMouseLeave = () => {
    if (imageRef.current) {
      imageRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
    }
    setIsHovered(false)
  }

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, background: '#0b0c0e', color: '#f5f5f7' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <p style={{ color: '#8e8e93', fontWeight: 600 }}>Product not found.</p>
      <Link href="/" className="btn-lux-filled" style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none' }}>← Go Back Home</Link>
    </div>
  )

  const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating))

  return (
    <div style={{ minHeight: '100vh', background: '#0b0c0e', color: '#f5f5f7', overflow: 'hidden' }}>
      
      {/* Navbar header */}
      <Navbar cart={cart} onCartClick={() => setCartOpen(true)} searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      {/* ── Breadcrumb Header ────────────────────────────────────────── */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid #22242a',
        background: 'rgba(11, 12, 14, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 68, zIndex: 50
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#8e8e93', fontWeight: 600, letterSpacing: '0.04em' }}>
          <Link href="/" style={{ color: '#8e8e93', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c5a059'}
            onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}>
            Home
          </Link>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ color: '#8e8e93' }}>{product.category}</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span className="gradient-text" style={{ fontWeight: 700, color: '#c5a059' }}>{product.title.substring(0, 30)}...</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        
        {/* ── Main Product Section ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, marginBottom: 72, alignItems: 'start' }}>
          
          {/* Left Side: Premium Image Container */}
          <div
            ref={imageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setIsHovered(true)}
            style={{
              height: 'clamp(280px, 50vw, 480px)',
              borderRadius: 24,
              background: `linear-gradient(135deg, hsl(${(product.id * 47) % 360}, 50%, 10%), hsl(${(product.id * 47 + 60) % 360}, 45%, 15%))`,
              border: isHovered ? '1px solid rgba(197,160,89,0.35)' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isHovered ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(197,160,89,0.15)' : '0 20px 48px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.1s ease-out, border-color 0.3s, box-shadow 0.3s',
              willChange: 'transform',
            }}
          >
            {/* Background patterns */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute', width: 220, height: 220, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(197,160,89,0.15), transparent 70%)',
              animation: 'pulse-glow 4s infinite',
            }} />

            {/* Product Image */}
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{
                fontSize: '8.5rem',
                position: 'relative', zIndex: 1,
                filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(197,160,89,0.25))',
              }} className="animate-float">
                📦
              </span>
            )}

            {product.badge && (
              <span className="badge" style={{ position: 'absolute', top: 24, left: 24, backdropFilter: 'blur(10px)', background: 'rgba(197,160,89,0.12)', color: '#c5a059', border: '1px solid rgba(197,160,89,0.25)' }}>
                ✦ {product.badge}
              </span>
            )}
          </div>

          {/* Right Side: High-Detail Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Category badge & review metrics */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{
                background: 'rgba(197, 160, 89, 0.08)',
                color: '#c5a059',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                borderRadius: 100,
                padding: '3px 10px',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {product.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="stars" style={{ fontSize: '0.9rem', color: '#c5a059' }}>{stars}</span>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{product.rating}</span>
                <span style={{ color: '#8e8e93', fontSize: '0.82rem' }}>({product.review_count.toLocaleString()} verified ratings)</span>
              </div>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0 }}>
              {product.title}
            </h1>

            {/* Description */}
            <p style={{ color: '#8e8e93', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              {product.description}
            </p>

            {/* Content Similarity Engine Insight Dashboard */}
            <div className="gradient-border" style={{ overflow: 'hidden' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.01))',
                padding: '24px 26px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 0 6px var(--accent-gold))', color: 'var(--accent-gold)' }}>✦</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>Content Similarity Engine</span>
                  </div>
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '3px 10px', background: 'rgba(212,175,55,0.12)', color: 'var(--accent-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>Vector overlap</span>
                </div>
                
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#8e8e93', lineHeight: 1.55 }}>
                  This item similarity is computed via multi-attribute indexing: category grouping, keyword matching (description & title), and price delta mapping.
                </p>

                {/* Similarity metrics indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8e8e93', marginBottom: 5 }}>
                      <span>Description Keyword Match</span>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>91.5%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: '91.5%', background: 'linear-gradient(90deg, #d4af37, #aa820a)', borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: '#8e8e93' }}>Price Similarity</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80', marginTop: 2 }}>96.8%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price & stock */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 0', borderTop: '1px solid #22242a', borderBottom: '1px solid #22242a',
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: '#8e8e93', display: 'block', marginBottom: 4, fontWeight: 500 }}>SPECIAL OFFER PRICE</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c5a059' }}>
                  ${product.price.toLocaleString()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 700 }}>✓ In Stock</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#8e8e93', marginTop: 6 }}>Dispatches within 24h</span>
              </div>
            </div>

            {/* Buy actions */}
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={async () => {
                  await track(product.id, 'add_to_cart')
                  // Add to localStorage cart
                  const saved = localStorage.getItem('nexcart_cart')
                  let cartList = []
                  if (saved) {
                    try { cartList = JSON.parse(saved) } catch {}
                  }
                  const existing = cartList.find((i: any) => i.id === product.id)
                  if (existing) {
                    existing.quantity += 1
                  } else {
                    cartList.push({ id: product.id, title: product.title, price: product.price, quantity: 1, image_url: product.image_url })
                  }
                  localStorage.setItem('nexcart_cart', JSON.stringify(cartList))
                  setCart(cartList) // Update local page state to open CartDrawer
                  setAdded(true)
                  setTimeout(() => setAdded(false), 2000)
                }}
                className="btn-glow"
                style={{
                  flex: 1, padding: '16px', fontSize: '0.85rem',
                  background: added ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #c5a059, #aa820a)',
                  color: added ? '#ffffff' : '#0b0c0e',
                  boxShadow: added ? '0 0 24px rgba(34,197,94,0.3)' : '0 4px 16px rgba(197,160,89,0.15)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button 
                onClick={async () => {
                  await track(product.id, 'purchase')
                  // Add to localStorage cart if not present
                  const saved = localStorage.getItem('nexcart_cart')
                  let cartList = []
                  if (saved) {
                    try { cartList = JSON.parse(saved) } catch {}
                  }
                  const existing = cartList.find((i: any) => i.id === product.id)
                  if (!existing) {
                    cartList.push({ id: product.id, title: product.title, price: product.price, quantity: 1, image_url: product.image_url })
                    localStorage.setItem('nexcart_cart', JSON.stringify(cartList))
                  }
                  router.push('/checkout')
                }}
                className="btn-outline" 
                style={{ flex: 1, padding: '16px', fontSize: '0.85rem', border: '1px solid rgba(197, 160, 89, 0.4)', color: '#c5a059', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                Secure Checkout
              </button>
            </div>

          </div>
        </div>

        {/* ── Related Recommendations ───────────────────────────────────── */}
        <div style={{ borderTop: '1px solid #22242a', paddingTop: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 6px var(--accent-gold))', color: 'var(--accent-gold)' }}>✦</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>People Also View</h2>
            <span className="badge" style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--accent-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>Similar Products</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {relatedRecs.map((p, index) => (
              <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }} onClick={() => track(p.id, 'click')}>
                <div
                  className="bento-card-lux"
                  style={{
                    padding: '20px 22px',
                    display: 'flex', gap: 16, alignItems: 'center',
                    border: '1px solid #22242a',
                    background: '#14161a',
                    flexDirection: 'row',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(197, 160, 89, 0.35)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.background = '#1c1d22'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#22242a'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.background = '#14161a'
                  }}
                >
                  <div style={{
                    width: 60, height: 60, borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.05)',
                    background: '#0b0c0e'
                  }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>📦</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </p>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{p.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#c5a059' }}>
                      ${p.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={handleUpdateQty} onCheckout={() => { setCartOpen(false); router.push('/checkout') }} />}
    </div>
  )
}
