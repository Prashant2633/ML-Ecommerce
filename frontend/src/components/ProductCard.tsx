'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { track } from '@/lib/telemetry'
import type { Product } from '@/lib/products'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

const CATEGORY_GRADIENT: Record<string, string> = {
  'Luxury Watch': '195deg, #1f1a12, #0f0b06',
  'Premium Audio': '195deg, #18191c, #0a0b0d',
  'Designer Bags': '195deg, #1e1e1e, #0f0f0f',
  'Curated Looks': '195deg, #1c1d22, #0d0e12',
  'Accessories': '195deg, #1e1c16, #0e0d08',
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
    const rotX = ((y - cy) / cy) * -6
    const rotY = ((x - cx) / cx) *  6
    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`
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
  const gradient = CATEGORY_GRADIENT[product.category] || '195deg, #18191c, #0a0b0d'

  return (
    <Link href={`/products/${product.id}`} onClick={() => track(product.id, 'click')} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        style={{
          background: '#14161a',
          border: isHovered ? '1px solid rgba(197, 160, 89, 0.35)' : '1px solid #22242a',
          borderRadius: 20,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.1s ease-out',
          boxShadow: isHovered ? '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)' : 'inset 0 1px 0 rgba(255,255,255,0.01)',
          backdropFilter: 'blur(20px)',
          willChange: 'transform',
          cursor: 'pointer',
        }}
      >
        {/* Image Panel */}
        <div style={{
          height: 200,
          background: `linear-gradient(${gradient})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.title} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                transform: isHovered ? 'scale(1.04)' : 'scale(1)', 
                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' 
              }} 
            />
          ) : (
            <div style={{
              position: 'absolute',
              width: 140, height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(197,160,89,0.1), transparent 70%)',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }} />
          )}

          {/* Golden overlay gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11, 12, 14, 0.7) 0%, transparent 80%)', pointerEvents: 'none' }} />

          {/* Badge top-left */}
          {product.badge && (
            <span className="badge" style={{ position: 'absolute', top: 12, left: 12, backdropFilter: 'blur(8px)', background: 'rgba(197,160,89,0.12)', color: '#c5a059', border: '1px solid rgba(197,160,89,0.25)' }}>
              ✦ {product.badge}
            </span>
          )}

          {/* Rating pill top-right */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(11,12,14,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: 100, padding: '3px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ color: '#c5a059', fontSize: '0.72rem' }}>★</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f5f5f7' }}>{product.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>{product.review_count.toLocaleString()} reviews</span>
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f5f5f7', lineHeight: 1.4, margin: 0 }}>
            {product.title}
          </h3>

          <p style={{ fontSize: '0.8rem', color: '#8e8e93', lineHeight: 1.55, margin: 0, flex: 1 }}>
            {product.description}
          </p>

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 4 }}>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c5a059' }}>
                ${product.price.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              style={{
                background: added ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #c5a059, #aa820a)',
                border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: '0.78rem', fontWeight: 700,
                color: added ? '#ffffff' : '#0b0c0e', cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: added ? '0 0 16px rgba(34,197,94,0.3)' : '0 4px 12px rgba(197,160,89,0.15)',
                transform: added ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              {added ? '✓ Added' : '+ Cart'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
