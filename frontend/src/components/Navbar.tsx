'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface CartItem { id: number; title: string; price: number; quantity: number }

interface NavbarProps {
  cart: CartItem[]
  onCartClick: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function Navbar({ cart, onCartClick, searchQuery, onSearchChange }: NavbarProps) {
  const pathname = usePathname()
  const [accountOpen, setAccountOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'billing' | 'telemetry'>('profile')
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0)

  const navItems = [
    { label: 'Shop', id: 'catalog', href: '/?scroll=catalog' },
    { label: 'Discover', id: 'discover', href: '/?scroll=discover' },
    { label: 'AI Styles', id: 'style-guide', href: '/?scroll=style-guide' },
    { label: 'Account', isAccount: true }
  ]

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.isAccount) {
      e.preventDefault()
      setAccountOpen(true)
      return
    }

    if (pathname === '/') {
      e.preventDefault()
      const el = document.getElementById(item.id!)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', `/?scroll=${item.id}`)
      }
    }
  }

  return (
    <>
      <nav style={{
        background: 'rgba(11, 12, 14, 0.9)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 28px',
      }}>
        {/* Subtle Gold accent line top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #c5a059 30%, #aa820a 70%, transparent)' }} />

        <div className="navbar-container" style={{ maxWidth: 1300, margin: '0 auto' }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #c5a059, #aa820a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#0b0c0e', fontWeight: 900, boxShadow: '0 0 16px rgba(197,160,89,0.3)' }}>
              N
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f5f5f7' }}>
              NEX<span style={{ color: '#c5a059' }}>CART</span>
            </span>
          </Link>

          {/* Search */}
          <div className="navbar-search-wrapper">
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, width: 14, height: 14, color: '#c5a059' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search luxury products..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '9px 16px 9px 38px',
                color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(197,160,89,0.4)'; e.target.style.background = 'rgba(197,160,89,0.02)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />
          </div>

          {/* Links */}
          <div className="navbar-links-wrapper" style={{ marginLeft: 'auto' }}>
            {navItems.map((item) => (
              <Link key={item.label} href={item.href || '#'} onClick={(e) => handleNavClick(e, item)} style={{ color: '#8e8e93', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'color 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c5a059')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8e8e93')}>
                {item.label}
              </Link>
            ))}

            {/* Cart */}
            <button onClick={onCartClick} style={{
              background: 'rgba(197, 160, 89, 0.08)',
              border: '1px solid rgba(197, 160, 89, 0.25)',
              borderRadius: 10, padding: '7px 16px',
              color: '#c5a059', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(197, 160, 89, 0.15)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(197, 160, 89, 0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(197, 160, 89, 0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Cart
              {totalItems > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #c5a059, #aa820a)',
                  borderRadius: '50%', width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: '#0b0c0e',
                  boxShadow: '0 0 8px rgba(197, 160, 89, 0.5)',
                }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Account Modal */}
      {accountOpen && (
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
        }} onClick={() => setAccountOpen(false)}>
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
              onClick={() => setAccountOpen(false)}
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

            {/* Modal Title */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c5a059', margin: '0 0 4px' }}>
              NEXUS CUSTOMER PORTAL
            </h3>

            {/* Tabs Selector */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 0, gap: 14 }}>
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'orders', label: 'Orders' },
                { id: 'billing', label: 'Payments' },
                { id: 'telemetry', label: 'AI Settings' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === t.id ? '2px solid #c5a059' : '2px solid transparent',
                    color: activeTab === t.id ? '#c5a059' : '#8e8e93',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    transition: 'all 0.2s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Profile */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255, 255, 255, 0.03)', paddingBottom: 14 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c5a059, #aa820a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(197, 160, 89, 0.3)',
                  }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0b0c0e' }}>AM</span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f5f5f7', margin: 0 }}>Alexander Mercer</h3>
                      <span style={{
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        background: 'rgba(197, 160, 89, 0.12)',
                        color: '#c5a059',
                        border: '1px solid rgba(197, 160, 89, 0.2)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}>ELITE</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#8e8e93', margin: '2px 0 0' }}>Sovereign Tier Black Member</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Email Address</span>
                    <span style={{ fontSize: '0.8rem', color: '#f5f5f7', fontWeight: 600 }}>alexander.mercer@nexus.io</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Registered Shipping Address</span>
                    <span style={{ fontSize: '0.8rem', color: '#f5f5f7', fontWeight: 600, lineHeight: 1.4, display: 'block' }}>
                      1200 Avenue of the Americas, Penthouse B<br />
                      New York, NY 10036
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <span style={{ fontSize: '0.62rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Member ID</span>
                      <span style={{ fontSize: '0.78rem', color: '#f5f5f7', fontWeight: 600 }}>#NEX-992-04</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.62rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Contact Phone</span>
                      <span style={{ fontSize: '0.78rem', color: '#f5f5f7', fontWeight: 600 }}>+1 (555) 019-2834</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4, animation: 'fadeIn 0.2s ease-out' }}>
                {[
                  { id: 'NEX-9872', item: 'Chronos Elite Watch', date: 'June 12, 2026', total: 4950.00, status: 'Shipped (FedEx #FX-8827)', statusColor: '#10b981' },
                  { id: 'NEX-9801', item: 'Aura Headphones', date: 'June 08, 2026', total: 850.00, status: 'Processing (Est: June 18)', statusColor: '#c5a059' },
                  { id: 'NEX-9520', item: 'Aria Crossbody', date: 'May 15, 2026', total: 1200.00, status: 'Delivered', statusColor: '#8e8e93' }
                ].map(order => (
                  <div key={order.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f5f5f7' }}>Order #{order.id}</span>
                      <span style={{ fontSize: '0.68rem', color: order.statusColor, fontWeight: 700 }}>{order.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#8e8e93' }}>
                      <span>{order.item} · {order.date}</span>
                      <span style={{ fontWeight: 800, color: '#c5a059' }}>${order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Billing/Payments */}
            {activeTab === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.2s ease-out' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase' }}>Saved Payment Methods</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #1f2025 0%, #101114 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                    boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.55rem', color: '#8e8e93', fontWeight: 800, letterSpacing: '0.1em' }}>VISA PLATINUM</span>
                      <span style={{ color: '#c5a059', fontSize: '0.8rem', fontWeight: 900 }}>NEXUS</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.15em', color: '#f5f5f7', margin: '4px 0' }}>•••• •••• •••• 4021</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#8e8e93' }}>
                      <span>ALEXANDER MERCER</span>
                      <span>EXP: 12/29</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1rem' }}>💳</span>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block', color: '#f5f5f7' }}>Mastercard Black</span>
                        <span style={{ fontSize: '0.6rem', color: '#8e8e93' }}>•••• •••• •••• 9012</span>
                      </div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: '#c5a059', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 700 }}>Edit</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: AI Settings */}
            {activeTab === 'telemetry' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.2s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Convergence Index</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#c5a059' }}>98.6%</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.62rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Telemetry State</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981' }}>● SYNCHRONIZED</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                    <span style={{ fontSize: '0.58rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Style Profile</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f5f5f7' }}>Minimalist & Leather</span>
                  </div>
                  <div style={{ padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                    <span style={{ fontSize: '0.58rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Active Preferences</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f5f5f7' }}>Tech Noir Aesthetic</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.62rem', color: '#8e8e93', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Price Affinity Threshold</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min="1" max="100" defaultValue="85" style={{ flex: 1, accentColor: '#c5a059', height: 4 }} />
                    <span style={{ fontSize: '0.68rem', color: '#c5a059', fontWeight: 800 }}>85% Luxury Bias</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button 
                onClick={() => alert("Re-calibrating NexCart AI recommendation engine to your telemetry trends...")}
                style={{
                  flex: 1,
                  background: 'rgba(197, 160, 89, 0.08)',
                  border: '1px solid rgba(197, 160, 89, 0.25)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#c5a059',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(197, 160, 89, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(197, 160, 89, 0.08)'}
              >
                ✦ Recalibrate AI
              </button>
              <button 
                onClick={() => setAccountOpen(false)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #c5a059, #aa820a)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#0b0c0e',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'opacity 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
