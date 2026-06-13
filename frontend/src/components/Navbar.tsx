'use client'
import { useState } from 'react'
import Link from 'next/link'

interface CartItem { id: number; title: string; price: number; quantity: number }

interface NavbarProps {
  cart: CartItem[]
  onCartClick: () => void
}

export default function Navbar({ cart, onCartClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <nav style={{
      background: 'rgba(6,11,24,0.8)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'sticky', top: 0, zIndex: 100,
      padding: '0 28px',
    }}>
      {/* Gradient line top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #3b82f6 30%, #8b5cf6 70%, transparent)' }} />

      <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24, height: 68 }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}>
            ✦
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span className="gradient-text">Nex</span><span style={{ color: 'var(--text-primary)' }}>Cart</span>
          </span>
        </Link>

        {/* Search */}
        <div style={{ flex: 1, position: 'relative', maxWidth: 500 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search 10,000+ products..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '10px 16px 10px 42px',
              color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.4)'; e.target.style.background = 'rgba(59,130,246,0.04)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
          />
        </div>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginLeft: 'auto' }}>
          {[['/', 'Catalog'], ['/checkout', 'Orders']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              {label}
            </Link>
          ))}

          {/* Cart */}
          <button onClick={onCartClick} style={{
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 12, padding: '8px 18px',
            color: '#60a5fa', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontWeight: 700, fontSize: '0.88rem',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(59,130,246,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Cart
            {totalItems > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: 'white',
                boxShadow: '0 0 8px rgba(59,130,246,0.5)',
                animation: 'pulse-glow 2s infinite',
              }}>
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
