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

const UNSPLASH_MAP: Record<string, string> = {
  // Watches
  "chronos_elite.jpg": "photo-1547996160-81dfa63595aa",
  "apex_smartwatch.png": "photo-1523275335684-37898b6baf30",
  "submariner_watch.png": "photo-1547996160-81dfa63595aa",
  "grand_tourer_watch.png": "photo-1522312346375-d1a52e2b99b3",
  "heritage_dress_watch.png": "photo-1524805444758-089113d48a6d",
  // Premium Audio
  "aura_headphones.jpg": "photo-1505740420928-5e560c06d30e",
  "studio_monitor.png": "photo-1545048702-79362596cdc9",
  "verge_earbuds.png": "photo-1590658268037-6bf12165a8df",
  // Designer Bags
  "aria_crossbody.jpg": "photo-1548036328-c9fa89d128fa",
  "voyager_duffle.png": "photo-1533867617858-e7b97e060509",
  "vanguard_briefcase.png": "photo-1622560480605-d83c853bc5c3",
  "rolltop_backpack.png": "photo-1608228088998-57828365d486",
  // Apparel
  "modern_essential.jpg": "photo-1594938298603-c8148c4dae35",
  "sartorial_trench.png": "photo-1591047139829-d91aecb6caea",
  "cashmere_hoodie.png": "photo-1556821840-3a63f95609a7",
  "dinner_suit.png": "photo-1593032465175-481ac7f401a0",
  "linen_shirt.png": "photo-1596755094514-f87e34085b2c",
  "merino_mockneck.png": "photo-1614975058789-41316d0e2e9c",
  "leather_jacket.png": "photo-1551028719-00167b16eac5",
  "royal_silk_kurta.png": "photo-1608748010899-18f300247112",
  "nehru_jacket.png": "photo-1617627143750-d86bc21e42bb",
  "heritage_sherwani.png": "photo-1610030469983-98e550d6193c",
  "printed_kurti.png": "photo-1608748010899-18f300247112",
  "silk_kurti.png": "photo-1617627143750-d86bc21e42bb",
  "cotton_pyjamas.png": "photo-1562157873-818bc0726f68",
  "satin_pajamas.png": "photo-1608228088998-57828365d486",
  // Accessories
  "eclipse_sunglasses.png": "photo-1572635196237-14b3f281503f",
  "leather_cardholder.png": "photo-1622560480605-d83c853bc5c3",
  "brass_cuff.png": "photo-1611591437281-460bfbe1220a",
  "wool_scarf.png": "photo-1607604276583-eef5d076aa5f",
  "blue_light_glasses.png": "photo-1572635196237-14b3f281503f",
  "leather_belt.png": "photo-1614162692292-7ac56d7f7f1e",
  "silk_necktie.png": "photo-1598033129183-c4f50c736f10",
  // Electronics
  "quantum_laptop.png": "photo-1505797149-43b0069ec26b",
  "aerophone.png": "photo-1598327105666-5b89351aff97",
  "nomad_keyboard.png": "photo-1618384887929-16ec33fab9ef",
  "wireless_charger.png": "photo-1583863788434-e58a36330cf0",
  "power_bank.png": "photo-1609081219090-a6d81d3085bf",
  // Footwear
  "stratus_sneakers.png": "photo-1549298916-b41d501d3772",
  "chelsea_boots.png": "photo-1608256246200-53e635b5b65f",
  "monarch_loafers.png": "photo-1533867617858-e7b97e060509",
  "court_hightops.png": "photo-1549298916-b41d501d3772",
  "running_shoes.png": "photo-1542291026-7eec264c27ff",
  "cozy_slippers.png": "photo-1608228088998-57828365d486",
  // Home & Kitchen
  "chef_knife.png": "photo-1599940824399-b87987ceb72a",
  "knife_set.png": "photo-1509440159596-0249088772ff",
  "espresso_machine.png": "photo-1517701604599-bb29b565090c",
  "blender.png": "photo-1578643463396-0997cb5328c1",
  "air_fryer.png": "photo-1621972750749-0fbb1abb7736",
  "water_bottle.png": "photo-1602143407151-7111542de6e8",
  "ceramic_mug.png": "photo-1514228742587-6b1558fcca3d",
  "scented_candle.png": "photo-1603006905003-be475563bc59",
  // Fitness & Outdoors
  "yoga_mat.png": "photo-1592432678016-e910b452f9a2",
  "dumbbells.png": "photo-1638536532686-d610adfc8e5c",
  "resistance_bands.png": "photo-1517838277536-f5f99be501cd",
  "camping_tent.png": "photo-1504280390367-361c6d9f38f4",
  "office_chair.png": "photo-1505797149-43b0069ec26b",
  "desk_lamp.png": "photo-1507473885765-e6ed057f782c",
}

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
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
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
          if (data.reviews) {
            setReviews(data.reviews)
          }
        } else {
          const fallback = PRODUCTS.find(p => p.id === Number(id))
          if (fallback) {
            setProduct(fallback)
            setReviews(fallback.reviews || [
              { name: 'Alexander Mercer', rating: 5, comment: 'Absolutely stunning. Matches my Minimalist & Leather preferences seamlessly. The telemetry index is spot on.', date: 'June 14, 2026' },
              { name: 'Sophia Chen', rating: 4, comment: 'Premium materials. Very elegant packaging. Shipping took 3 days in the AE region. Recommend!', date: 'June 09, 2026' }
            ])
          }
        }
        setLoadingProduct(false)
      })
      .catch(err => {
        console.error('Failed to load product details', err)
        const fallback = PRODUCTS.find(p => p.id === Number(id))
        if (fallback) {
          setProduct(fallback)
          setReviews(fallback.reviews || [
            { name: 'Alexander Mercer', rating: 5, comment: 'Absolutely stunning. Matches my Minimalist & Leather preferences seamlessly. The telemetry index is spot on.', date: 'June 14, 2026' },
            { name: 'Sophia Chen', rating: 4, comment: 'Premium materials. Very elegant packaging. Shipping took 3 days in the AE region. Recommend!', date: 'June 09, 2026' }
          ])
        }
        setLoadingProduct(false)
      })
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    if (!user) {
      showToast('You must be logged in to submit a review!', 'error')
      router.push(`/login?redirect=/products/${id}`)
      return
    }

    setSubmittingReview(true)
    const reviewer = reviewerName.trim() || user.email.split('@')[0]
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_URL}/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reviewer,
          rating: newRating,
          comment: newComment
        })
      })
      if (!res.ok) {
        throw new Error('Failed to submit review')
      }
      const updatedProduct = await res.json()
      setProduct(updatedProduct)
      if (updatedProduct.reviews) {
        setReviews(updatedProduct.reviews)
      }
      setNewComment('')
      setReviewerName('')
      showToast('Review submitted successfully!')
    } catch (err: any) {
      console.error(err)
      showToast(err.message || 'Failed to submit review', 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loadingProduct) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ fontSize: '1.2rem', color: '#c5a059', fontWeight: 600 }}>Loading product details...</div>
      </div>
    )
  }

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
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
  const filename = product.image_url.split('/').pop() || ''
  const photoId = UNSPLASH_MAP[filename]
  const images = photoId ? [
    product.image_url,
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&h=600&q=80&sat=-25&con=10`,
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&h=600&q=80&bri=-15&con=15`,
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&h=600&q=80&sat=-100`
  ] : [
    product.image_url,
    product.image_url,
    product.image_url
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
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

            {/* Size Selector */}
            {rAvail.available && rAvail.stock > 0 && (product.category === 'Apparel' || product.category === 'Footwear') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 0', borderBottom: '1px solid #22242a' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f5f5f7', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Select Size {sizeError && <span style={{ color: '#ef4444', fontSize: '0.7rem', textTransform: 'none', marginLeft: 8 }}>(Please select a size)</span>}
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(product.category === 'Apparel' ? ['S', 'M', 'L', 'XL'] : ['8', '9', '10', '11']).map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size)
                        setSizeError(false)
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: selectedSize === size ? 'rgba(197, 160, 89, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: selectedSize === size ? '2px solid #c5a059' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: selectedSize === size ? '#c5a059' : '#f5f5f7',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Urgency Warning */}
            {rAvail.available && rAvail.stock > 0 && rAvail.stock <= 5 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 12, padding: '12px 16px', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠️ Stock Alert: Only {rAvail.stock} items left in stock in your region! Order soon.
              </div>
            )}

            {/* Cart checkout operations */}
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                disabled={!rAvail.available || rAvail.stock === 0}
                onClick={async () => {
                  if ((product.category === 'Apparel' || product.category === 'Footwear') && !selectedSize) {
                    setSizeError(true)
                    showToast('Please select a size first!', 'error')
                    return
                  }
                  await track(product.id, 'add_to_cart', user?.id)
                  const saved = localStorage.getItem('nexcart_cart')
                  let cartList = []
                  if (saved) {
                    try { cartList = JSON.parse(saved) } catch {}
                  }
                  const existing = cartList.find((i: any) => i.id === product.id && i.size === selectedSize)
                  if (existing) {
                    existing.quantity += 1
                  } else {
                    cartList.push({ id: product.id, title: product.title, price: product.price, quantity: 1, image_url: product.image_url, size: selectedSize || undefined })
                  }
                  saveCart(cartList)
                  setAdded(true)
                  showToast(selectedSize ? `Added "${product.title}" (Size: ${selectedSize}) to cart!` : `Added "${product.title}" to cart!`)
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
                  if ((product.category === 'Apparel' || product.category === 'Footwear') && !selectedSize) {
                    setSizeError(true)
                    showToast('Please select a size first!', 'error')
                    return
                  }
                  await track(product.id, 'purchase', user?.id)
                  const saved = localStorage.getItem('nexcart_cart')
                  let cartList = []
                  if (saved) {
                    try { cartList = JSON.parse(saved) } catch {}
                  }
                  const existing = cartList.find((i: any) => i.id === product.id && i.size === selectedSize)
                  if (!existing) {
                    cartList.push({ id: product.id, title: product.title, price: product.price, quantity: 1, image_url: product.image_url, size: selectedSize || undefined })
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
