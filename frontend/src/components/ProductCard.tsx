'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { track } from '@/lib/telemetry'
import type { Product } from '@/lib/products'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: 'badge-blue', Computers: 'badge-purple', Footwear: 'badge-cyan',
  'Books & Reading': 'badge-green', 'Home Appliances': 'badge-blue', Clothing: 'badge-pink', Kitchen: 'badge-cyan',
}

const CATEGORY_ICON: Record<string, string> = {
  Electronics: '🎧', Computers: '💻', Footwear: '👟',
  'Books & Reading': '📚', 'Home Appliances': '🏠', Clothing: '👖', Kitchen: '🍳',
}

const CATEGORY_GRADIENT: Record<string, string> = {
  Electronics: '195deg, #0d1e3d, #1a3a6e', Computers: '195deg, #1a0d3d, #3a1a6e',
  Footwear: '195deg, #0d2e3d, #1a5e6e', 'Books & Reading': '195deg, #0d3d1a, #1a6e3a',
  'Home Appliances': '195deg, #0d1e3d, #1a3a6e', Clothing: '195deg, #3d0d2e, #6e1a5e',
  Kitchen: '195deg, #0d2e3d, #1a5e6e',
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // 3D tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -8
    const rotY = ((x - cx) / cx) *  8
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`
  }

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    }
    setIsHovered(false)
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    onAddToCart(product)
    setAdded(true)
    await track(product.id, 'add_to_cart')
    setTimeout(() => setAdded(false), 1800)
  }

  const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating))
  const gradient = CATEGORY_GRADIENT[product.category] || '195deg, #0d1e3d, #1a3a6e'

  return (
    <Link href={`/products/${product.id}`} onClick={() => track(product.id, 'click')} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        style={{
          background: 'rgba(16,28,53,0.75)',
          border: isHovered ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          boxShadow: isHovered ? '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
          backdropFilter: 'blur(20px)',
          willChange: 'transform',
          cursor: 'pointer',
        }}
      >
        {/* Image / Icon Panel */}
        <div style={{
          height: 200,
          background: `linear-gradient(${gradient})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glowing circle behind icon */}
          <div style={{
            position: 'absolute',
            width: 140, height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }} />
          {/* Decorative corner blobs */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,92,246,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(6,182,212,0.06)' }} />

          {/* Scanline effect on hover */}
          {isHovered && (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)', animation: 'scanline 1.5s linear infinite' }} />
            </div>
          )}

          <span style={{ fontSize: '3.8rem', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.5))' }}>
            {CATEGORY_ICON[product.category] || '📦'}
          </span>

          {/* Best seller / new badge */}
          {product.badge && (
            <span className="badge badge-purple" style={{ position: 'absolute', top: 12, left: 12, backdropFilter: 'blur(8px)' }}>
              ✦ {product.badge}
            </span>
          )}

          {/* Rating pill top-right */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            borderRadius: 100, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ color: '#fbbf24', fontSize: '0.72rem' }}>★</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{product.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`badge ${CATEGORY_COLORS[product.category] || 'badge-blue'}`}>{product.category}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.review_count.toLocaleString()} reviews</span>
          </div>

          <h3 style={{ fontSize: '0.97rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>
            {product.title}
          </h3>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, flex: 1 }}>
            {product.description.substring(0, 75)}...
          </p>

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
            <div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ${product.price.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              style={{
                background: added ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                border: 'none', borderRadius: 12,
                padding: '8px 18px', fontSize: '0.8rem', fontWeight: 700,
                color: 'white', cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: added ? '0 0 16px rgba(34,197,94,0.4)' : '0 0 16px rgba(59,130,246,0.3)',
                transform: added ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              {added ? '✓ Added!' : '+ Cart'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
