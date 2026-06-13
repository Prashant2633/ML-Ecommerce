'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PRODUCTS, type Product } from '@/lib/products'
import { track, fetchRecommendations } from '@/lib/telemetry'

const EMOJI_MAP: Record<string, string> = {
  Electronics: '🎧', Computers: '💻', Footwear: '👟',
  'Books & Reading': '📚', 'Home Appliances': '🏠', Clothing: '👖', Kitchen: '🍳',
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: 'badge-blue', Computers: 'badge-purple', Footwear: 'badge-cyan',
  'Books & Reading': 'badge-green', 'Home Appliances': 'badge-blue', Clothing: 'badge-pink', Kitchen: 'badge-cyan',
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [relatedRecs, setRelatedRecs] = useState<Product[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const product = PRODUCTS.find(p => p.id === Number(id))

  useEffect(() => {
    if (!product) return
    track(product.id, 'view')

    // Fetch real RL recommendations from the backend (SARSA agent label shown in UI).
    // Falls back to next 3 static products if the API is unreachable.
    fetchRecommendations(1)
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, background: 'var(--bg-primary)' }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Product not found.</p>
      <Link href="/" className="btn-glow" style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none' }}>← Go Back Home</Link>
    </div>
  )

  const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* ── Breadcrumb Header ────────────────────────────────────────── */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(6,11,24,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            Home
          </Link>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{product.category}</span>
          <span style={{ opacity: 0.3 }}>/</span>
          <span className="gradient-text" style={{ fontWeight: 700 }}>{product.title.substring(0, 30)}...</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        
        {/* ── Main Product Section ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, marginBottom: 72, alignItems: 'start' }}>
          
          {/* Left Side: Premium Image Container */}
          <div
            ref={imageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setIsHovered(true)}
            style={{
              height: 480,
              borderRadius: 24,
              background: `linear-gradient(135deg, hsl(${(product.id * 47) % 360}, 50%, 10%), hsl(${(product.id * 47 + 60) % 360}, 45%, 15%))`,
              border: isHovered ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isHovered ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.15)' : '0 20px 48px rgba(0,0,0,0.4)',
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
              background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
              animation: 'pulse-glow 4s infinite',
            }} />

            {/* Floating emoji icon */}
            <span style={{
              fontSize: '8.5rem',
              position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(59,130,246,0.25))',
            }} className="animate-float">
              {EMOJI_MAP[product.category] || '📦'}
            </span>

            {product.badge && (
              <span className="badge badge-purple" style={{ position: 'absolute', top: 24, left: 24, backdropFilter: 'blur(10px)', border: '1px solid rgba(139,92,246,0.4)' }}>
                ✦ {product.badge}
              </span>
            )}
          </div>

          {/* Right Side: High-Detail Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Category badge & review metrics */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span className={`badge ${CATEGORY_COLORS[product.category] || 'badge-blue'}`}>{product.category}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="stars" style={{ fontSize: '0.9rem' }}>{stars}</span>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{product.rating}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>({product.review_count.toLocaleString()} verified ratings)</span>
              </div>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', margin: 0 }}>
              {product.title}
            </h1>

            {/* Description */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              {product.description}
            </p>

            {/* Cyber AI Agent Insight Dashboard */}
            <div className="gradient-border" style={{ overflow: 'hidden' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.06))',
                padding: '24px 26px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 0 6px #8b5cf6)' }}>✦</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>RL Recommendation Logic</span>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '3px 10px' }}>Q-Learning Agent</span>
                </div>
                
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  This product has been selected based on real-time browsing behavior. State action mapping values predict high convergence with your current preferences.
                </p>

                {/* Cyber metrics mock indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 5 }}>
                      <span>Relevance Probability</span>
                      <span style={{ color: '#22d3ee', fontWeight: 700 }}>94.2%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: '94.2%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 16 }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reward Estimate</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80', marginTop: 2 }}>+18.40</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price & stock */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 }}>SPECIAL OFFER PRICE</span>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 700 }}>✓ In Stock</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>Dispatches within 24h</span>
              </div>
            </div>

            {/* Buy actions */}
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={async () => {
                  track(product.id, 'add_to_cart')
                  setAdded(true)
                  setTimeout(() => setAdded(false), 2000)
                }}
                className="btn-glow"
                style={{
                  flex: 1, padding: '16px', fontSize: '0.92rem',
                  background: added ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  boxShadow: added ? '0 0 24px rgba(34,197,94,0.3)' : '0 0 24px rgba(59,130,246,0.3)',
                }}
              >
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button onClick={() => { track(product.id, 'purchase'); router.push('/checkout') }} className="btn-outline" style={{ flex: 1, padding: '16px', fontSize: '0.92rem' }}>
                Secure Checkout
              </button>
            </div>

          </div>
        </div>

        {/* ── Related Recommendations ───────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 6px #8b5cf6)' }}>✦</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>People Also View</h2>
            <span className="badge badge-purple">SARSA Agent</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {relatedRecs.map((p, index) => (
              <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }} onClick={() => track(p.id, 'click')}>
                <div
                  className="glass-card"
                  style={{
                    padding: '20px 22px',
                    display: 'flex', gap: 16, alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(16,28,53,0.5)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.background = 'rgba(16,28,53,0.7)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.background = 'rgba(16,28,53,0.5)'
                  }}
                >
                  <div style={{
                    width: 60, height: 60, borderRadius: 14,
                    background: `linear-gradient(135deg, hsl(${(p.id * 47) % 360}, 50%, 10%), hsl(${(p.id * 47 + 60) % 360}, 45%, 15%))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {EMOJI_MAP[p.category] || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </p>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{p.category}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#60a5fa' }}>
                      ${p.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
