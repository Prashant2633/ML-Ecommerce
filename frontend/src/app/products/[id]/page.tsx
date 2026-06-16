'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PRODUCTS, type Product } from '@/lib/products'
import { track, fetchRecommendations } from '@/lib/telemetry'
import Navbar from '@/components/Navbar'
import CartDrawer from '@/components/CartDrawer'
import { useRegion } from '@/components/RegionContext'
import { useAuth } from '@/components/AuthContext'

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, toggleWishlist, syncCart } = useAuth()
  const { activeRegion, formatPrice } = useRegion()

  const [product, setProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [added, setAdded] = useState(false)
  const [relatedRecs, setRelatedRecs] = useState<Product[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const [cart, setCart] = useState<any[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Carousel
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })

  // Reviews
  const [reviews, setReviews] = useState<any[]>([])
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Fetch product from database
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    setLoadingProduct(true)
    fetch(`${API_URL}/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setProduct(data)
        } else {
          const fallback = PRODUCTS.find(p => p.id === Number(id))
          if (fallback) setProduct(fallback)
        }
        setLoadingProduct(false)
      })
      .catch(err => {
        console.error('Failed to load product details', err)
        const fallback = PRODUCTS.find(p => p.id === Number(id))
        if (fallback) setProduct(fallback)
        setLoadingProduct(false)
      })
  }, [id])

  // Initial mock reviews
  useEffect(() => {
    setReviews([
      { name: 'Alexander Mercer', rating: 5, comment: 'Absolutely stunning. Matches my Minimalist & Leather preferences seamlessly. The telemetry index is spot on.', date: 'June 14, 2026' },
      { name: 'Sophia Chen', rating: 4, comment: 'Premium materials. Very elegant packaging. Shipping took 3 days in the AE region. Recommend!', date: 'June 09, 2026' }
    ])
  }, [id])

  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true)
    window.addEventListener('open-cart', handleOpenCart)
    return () => window.removeEventListener('open-cart', handleOpenCart)
  }, [])

  // Sync cart from context / localStorage
  useEffect(() => {
    if (user) {
      setCart(user.cart || [])
    } else {
      const saved = localStorage.getItem('nexcart_cart')
      if (saved) {
        try { setCart(JSON.parse(saved)) } catch {}
      }
    }
  }, [user])

  const saveCart = (newCart: any[]) => {
    setCart(newCart)
    localStorage.setItem('nexcart_cart', JSON.stringify(newCart))
    if (user) {
      syncCart(newCart)
    }
  }

  const handleUpdateQty = (id: number, delta: number) => {
    const newCart = cart.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0)
    saveCart(newCart)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    router.push(`/?search=${encodeURIComponent(query)}`)
  }

  // Load recommendations
  useEffect(() => {
    if (!product) return
    track(product.id, 'view', user?.id)

    fetchRecommendations(user ? user.id : 1, product.id)
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
  }, [product, user])

  // Mouse Move for Zoom/Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = imageRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
    setZoomScale(1.8) // zoom on hover
    
    // Tilt
    const rotX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -5
    const rotY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 5
    container.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }

  const handleMouseLeave = () => {
    if (imageRef.current) {
      imageRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
    }
    setZoomScale(1)
    setIsHovered(false)
  }

  const handleWishlistClick = async () => {
    if (!product) return
    if (!user) {
      router.push(`/login?redirect=/products/${product.id}`)
      return
    }
    await toggleWishlist(product.id)
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingReview(true)
    const reviewer = reviewerName.trim() || (user ? user.email.split('@')[0] : 'Anonymous')
    
    setTimeout(() => {
      const newReview = {
        name: reviewer,
        rating: newRating,
        comment: newComment,
        date: new Date().toLocaleDateString(activeRegion.locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      setReviews(prev => [newReview, ...prev])
      setNewComment('')
      setReviewerName('')
      setSubmittingReview(false)
    }, 800)
  }

  if (loadingProduct) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0c0e', color: '#f5f5f7' }}>
        <div style={{ fontSize: '1.2rem', color: '#c5a059', fontWeight: 600 }}>Loading product details...</div>
      </div>
    )
  }

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, background: '#0b0c0e', color: '#f5f5f7' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <p style={{ color: '#8e8e93', fontWeight: 600 }}>Product not found.</p>
      <Link href="/" className="btn-lux-filled" style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none' }}>← Go Back Home</Link>
    </div>
  )

  const isWishlisted = user?.wishlist?.includes(product.id) || false
  const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating))
  const rAvail = product.availability?.[activeRegion.code] || { available: true, stock: 10, priceOverride: null, shippingDays: 3 }
  const formattedPrice = formatPrice(product.price, rAvail.priceOverride)

  // Carousel angles/styled images to mimic high quality alternatives
  const images = [
    product.image_url,
    product.image_url, // Main repeat for display
    product.image_url
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0b0c0e', color: '#f5f5f7' }}>
      
      {/* Navbar header */}
      <Navbar cart={cart} onCartClick={() => setCartOpen(true)} searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      {/* Breadcrumbs */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid #22242a',
        background: 'rgba(11, 12, 14, 0.85)',
        backdropFilter: 'blur(20px)',
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
          <span style={{ color: '#c5a059', fontWeight: 700 }}>{product.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        
        {/* Main Product Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, marginBottom: 72, alignItems: 'start' }}>
          
          {/* LEFT: Carousel Visual Panel */}
          <div>
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
                transition: 'transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s',
                cursor: 'zoom-in',
              }}
            >
              {/* Product Image with dynamic zoom */}
              {images[activeImageIndex] ? (
                <img
                  src={images[activeImageIndex]}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${zoomScale})`,
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: zoomScale === 1 ? 'transform 0.3s ease' : 'none'
                  }}
                />
              ) : (
                <span style={{ fontSize: '8.5rem' }}>📦</span>
              )}

              {product.badge && (
                <span className="badge" style={{ position: 'absolute', top: 24, left: 24, backdropFilter: 'blur(10px)', background: 'rgba(197,160,89,0.12)', color: '#c5a059', border: '1px solid rgba(197,160,89,0.25)' }}>
                  ✦ {product.badge}
                </span>
              )}
            </div>

            {/* Thumbnail Row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.01)',
                    border: activeImageIndex === idx ? '2px solid #c5a059' : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s',
                    opacity: activeImageIndex === idx ? 1 : 0.6
                  }}
                >
                  <img src={img} alt={`angle ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                <span style={{ color: '#8e8e93', fontSize: '0.82rem' }}>({product.review_count + reviews.length - 2} verified reviews)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0 }}>
                {product.title}
              </h1>
              
              {/* Heart Wishlist button */}
              <button
                onClick={handleWishlistClick}
                style={{
                  background: isWishlisted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isWishlisted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 12,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  color: isWishlisted ? '#ef4444' : '#8e8e93',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  if (!isWishlisted) e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                }}
                onMouseLeave={e => {
                  if (!isWishlisted) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                {isWishlisted ? '♥' : '♡'}
              </button>
            </div>

            <p style={{ color: '#8e8e93', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              {product.description}
            </p>

            {/* AI Similarity insight */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.05) 0%, rgba(0,0,0,0) 100%)',
              border: '1px solid rgba(197, 160, 89, 0.15)',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c5a059', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                ✦ Telemetry Recommendation Convergence
              </span>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#8e8e93', lineHeight: 1.5 }}>
                Our content-based matching engine has mapped this item to your profile preferences with a price delta similarity score of <strong style={{ color: '#c5a059' }}>96.8%</strong>.
              </p>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 0', borderTop: '1px solid #22242a', borderBottom: '1px solid #22242a',
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: '#8e8e93', display: 'block', marginBottom: 4, fontWeight: 500 }}>SPECIAL OFFER PRICE</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#c5a059' }}>
                  {formattedPrice}
                </span>
                {rAvail.priceOverride && (
                  <span style={{ display: 'block', fontSize: '0.68rem', color: '#4ade80', fontWeight: 600, marginTop: 2 }}>
                    ✦ Local price override applied
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {!rAvail.available ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100, padding: '4px 12px' }}>🚫 Unavailable</span>
                ) : rAvail.stock === 0 ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 100, padding: '4px 12px' }}>⚠️ Out of Stock</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 100, padding: '4px 12px' }}>✓ In Stock</span>
                )}
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#8e8e93', marginTop: 6 }}>
                  {!rAvail.available 
                    ? 'Not available in your region' 
                    : `Dispatches in ${rAvail.shippingDays || 3} days`}
                </span>
              </div>
            </div>

            {/* Cart checkout operations */}
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                disabled={!rAvail.available || rAvail.stock === 0}
                onClick={async () => {
                  await track(product.id, 'add_to_cart', user?.id)
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
                  saveCart(cartList)
                  setAdded(true)
                  setTimeout(() => setAdded(false), 2000)
                }}
                className="btn-glow"
                style={{
                  flex: 1, padding: '16px', fontSize: '0.85rem',
                  background: !rAvail.available || rAvail.stock === 0
                    ? 'rgba(255,255,255,0.02)'
                    : added
                      ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                      : 'linear-gradient(135deg, #c5a059, #aa820a)',
                  color: !rAvail.available || rAvail.stock === 0
                    ? '#8e8e93'
                    : added
                      ? '#ffffff'
                      : '#0b0c0e',
                  border: !rAvail.available || rAvail.stock === 0
                    ? '1px solid rgba(255,255,255,0.06)'
                    : 'none',
                  boxShadow: !rAvail.available || rAvail.stock === 0
                    ? 'none'
                    : added
                      ? '0 0 24px rgba(34,197,94,0.3)'
                      : '0 4px 16px rgba(197,160,89,0.15)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: !rAvail.available || rAvail.stock === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {!rAvail.available 
                  ? 'Unavailable' 
                  : rAvail.stock === 0 
                    ? 'Out of Stock' 
                    : added 
                      ? '✓ Added!' 
                      : 'Add to Cart'}
              </button>
              
              <button 
                disabled={!rAvail.available || rAvail.stock === 0}
                onClick={async () => {
                  await track(product.id, 'purchase', user?.id)
                  const saved = localStorage.getItem('nexcart_cart')
                  let cartList = []
                  if (saved) {
                    try { cartList = JSON.parse(saved) } catch {}
                  }
                  const existing = cartList.find((i: any) => i.id === product.id)
                  if (!existing) {
                    cartList.push({ id: product.id, title: product.title, price: product.price, quantity: 1, image_url: product.image_url })
                    saveCart(cartList)
                  }
                  router.push('/checkout')
                }}
                className="btn-outline" 
                style={{ 
                  flex: 1, padding: '16px', fontSize: '0.85rem', 
                  border: !rAvail.available || rAvail.stock === 0 
                    ? '1px solid rgba(255,255,255,0.06)' 
                    : '1px solid rgba(197, 160, 89, 0.4)', 
                  color: !rAvail.available || rAvail.stock === 0 ? '#8e8e93' : '#c5a059', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.04em',
                  cursor: !rAvail.available || rAvail.stock === 0 ? 'not-allowed' : 'pointer',
                  background: 'none'
                }}
              >
                Secure Checkout
              </button>
            </div>
          </div>
        </div>

        {/* ── Product Reviews Section ── */}
        <div style={{ borderTop: '1px solid #22242a', paddingTop: 52, marginBottom: 72 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 28, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#c5a059' }}>
            Customer Reviews
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 48, alignItems: 'start' }}>
            
            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {reviews.map((rev, idx) => (
                <div key={idx} style={{ padding: 24, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#f5f5f7', display: 'block' }}>{rev.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#8e8e93' }}>{rev.date}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#c5a059' }}>
                      {'★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating)}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#8e8e93', lineHeight: 1.5 }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>

            {/* Write a Review Form */}
            <div className="bento-card-lux" style={{ padding: 28, background: '#14161a', borderColor: '#22242a' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#c5a059' }}>
                Write A Review
              </h3>
              
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    placeholder={user ? user.email.split('@')[0] : 'Enter your name'}
                    style={{
                      width: '100%',
                      background: '#1c1d22',
                      border: '1px solid #2d3037',
                      borderRadius: 10,
                      padding: '10px 14px',
                      color: '#f5f5f7',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Rating: {newRating} Stars
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={newRating}
                    onChange={e => setNewRating(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#c5a059', height: 4, cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#8e8e93', marginTop: 4 }}>
                    <span>1 Star</span>
                    <span>5 Stars</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Comments
                  </label>
                  <textarea
                    required
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Share your experience details with this product..."
                    rows={4}
                    style={{
                      width: '100%',
                      background: '#1c1d22',
                      border: '1px solid #2d3037',
                      borderRadius: 10,
                      padding: '10px 14px',
                      color: '#f5f5f7',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-lux-filled"
                  style={{ padding: '12px', fontSize: '0.82rem' }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
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
            {relatedRecs.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }} onClick={() => track(p.id, 'click', user?.id)}>
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
                    display: 'flex', alignItems: 'center', flexShrink: 0,
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
                      {formatPrice(p.price, p.availability?.[activeRegion.code]?.priceOverride)}
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
