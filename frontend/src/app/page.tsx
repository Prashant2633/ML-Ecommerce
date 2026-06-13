'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import CartDrawer from '@/components/CartDrawer'
import { PRODUCTS, CATEGORIES, type Product } from '@/lib/products'
import { fetchRecommendations } from '@/lib/telemetry'

const HeroCanvas = dynamic(() => import('@/components/HeroCanvas'), { ssr: false })

gsap.registerPlugin(ScrollTrigger)

const EMOJI_MAP: Record<string, string> = {
  Electronics: '🎧', Computers: '💻', Footwear: '👟',
  'Books & Reading': '📚', 'Home Appliances': '🏠', Clothing: '👖', Kitchen: '🍳',
}

interface CartItem { id: number; title: string; price: number; quantity: number; emoji: string }

const MARQUEE_ITEMS = [
  '🎧 Electronics', '💻 Computers', '👟 Footwear', '📚 Books',
  '🏠 Home Appliances', '👖 Clothing', '🍳 Kitchen', '🚀 AI-Curated Deals',
  '🛡 Secure Payments', '🧠 RL Recommendations', '⚡ Fast Delivery', '✦ Premium Picks',
]

const FEATURES = [
  { icon: '🧠', title: 'Q-Learning Agent', desc: 'Learns from every click and session to optimize product ranking.', color: '#3b82f6' },
  { icon: '🔄', title: 'SARSA Algorithm', desc: 'On-policy RL that stays conservative and stable under live traffic.', color: '#8b5cf6' },
  { icon: '📈', title: 'Policy Gradients', desc: 'REINFORCE agent directly maximises expected purchase reward.', color: '#06b6d4' },
  { icon: '🔒', title: 'Secure Checkout', desc: 'Luhn-validated, PCI-DSS compliant, CSP-hardened payment flow.', color: '#ec4899' },
]

export default function HomePage() {
  const router = useRouter()
  const pageRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const copyRef = useRef<HTMLParagraphElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const statsRefs = useRef<(HTMLDivElement | null)[]>([])
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const aiSectionRef = useRef<HTMLDivElement>(null)
  const catalogSectionRef = useRef<HTMLDivElement>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [aiRecs, setAiRecs] = useState<Product[]>([])

  useEffect(() => {
    // Attempt to fetch real RL-powered recommendations (user_id=1 as demo).
    // Falls back to random picks if the backend is not reachable.
    fetchRecommendations(1)
      .then((ids: number[]) => {
        if (ids.length > 0) {
          const recs = ids
            .map((id) => PRODUCTS.find((p) => p.id === id))
            .filter((p): p is Product => p !== undefined)
          // Fill up to 3 with random picks if the API returned fewer
          const extras = [...PRODUCTS]
            .filter((p) => !ids.includes(p.id))
            .sort(() => Math.random() - 0.5)
          setAiRecs([...recs, ...extras].slice(0, 3))
        } else {
          setAiRecs([...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, 3))
        }
      })
      .catch(() => {
        setAiRecs([...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, 3))
      })
  }, [])

  useEffect(() => {
    if (!pageRef.current) return

    const ctx = gsap.context(() => {
      gsap.set([badgeRef.current, titleRef.current, copyRef.current, actionsRef.current, marqueeRef.current], {
        opacity: 0,
        y: 28,
      })

      gsap.to([badgeRef.current, titleRef.current, copyRef.current, actionsRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.95,
        stagger: 0.12,
        ease: 'power3.out',
      })

      gsap.to(marqueeRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
      })

      gsap.fromTo(
        statsRefs.current.filter(Boolean),
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: statsRefs.current[0],
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        },
      )

      gsap.fromTo(
        featureRefs.current.filter(Boolean),
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featureRefs.current[0],
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        },
      )

      gsap.fromTo(
        aiSectionRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: aiSectionRef.current,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        },
      )

      gsap.fromTo(
        catalogSectionRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: catalogSectionRef.current,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        },
      )
    }, pageRef)

    return () => ctx.revert()
  }, [])

  const filtered = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory)

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { id: product.id, title: product.title, price: product.price, quantity: 1, emoji: EMOJI_MAP[product.category] || '📦' }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0))
  }

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar cart={cart} onCartClick={() => setCartOpen(true)} />

      <section
        style={{
          position: 'relative',
          minHeight: 580,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '90px 24px 80px',
          background: 'radial-gradient(ellipse 100% 70% at 50% -5%, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }}
      >
        <HeroCanvas />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, transparent, var(--bg-primary))', pointerEvents: 'none', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, textAlign: 'center', margin: '0 auto' }}>
          <div
            ref={badgeRef}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 100,
              padding: '6px 16px',
              marginBottom: 28,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block', boxShadow: '0 0 8px #8b5cf6', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa', letterSpacing: '0.04em' }}>AI-POWERED RECOMMENDATIONS</span>
          </div>

          <h1
            ref={titleRef}
            style={{
              fontSize: 'clamp(2.6rem, 6vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              marginBottom: 24,
              letterSpacing: '-0.04em',
            }}
          >
            Shop Smarter with<br />
            <span className="gradient-text">Reinforcement Learning</span>
          </h1>

          <p
            ref={copyRef}
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-muted)',
              lineHeight: 1.75,
              maxWidth: 580,
              margin: '0 auto 42px',
            }}
          >
            Our custom AI engine — Q-Learning, SARSA & Policy Gradients — learns your preferences in real-time. Every interaction makes your feed more relevant.
          </p>

          <div ref={actionsRef} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-glow"
              style={{ padding: '15px 38px', fontSize: '0.95rem' }}
              onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Catalog →
            </button>
            <button
              className="btn-outline"
              style={{ padding: '15px 38px', fontSize: '0.95rem' }}
              onClick={() => document.getElementById('ai-picks')?.scrollIntoView({ behavior: 'smooth' })}
            >
              ✦ AI Picks
            </button>
          </div>
        </div>
      </section>

      <div
        ref={marqueeRef}
        style={{
          overflow: 'hidden',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.015)',
          padding: '14px 0',
        }}
      >
        <div style={{ display: 'flex', gap: 0, animation: 'marquee 28s linear infinite', width: 'max-content' }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} style={{ padding: '0 40px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {item}
              <span style={{ marginLeft: 40, color: 'rgba(59,130,246,0.4)' }}>·</span>
            </span>
          ))}
        </div>
      </div>

      <section style={{ padding: '64px 28px 0' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Products', value: '10,000+', icon: '📦', color: '#3b82f6' },
            { label: 'RL Training Iterations', value: '2.4M', icon: '🧠', color: '#8b5cf6' },
            { label: 'Recommendation Accuracy', value: '91.3%', icon: '🎯', color: '#06b6d4' },
            { label: 'Active Shoppers', value: '50K+', icon: '👤', color: '#ec4899' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              ref={el => { statsRefs.current[index] = el }}
              style={{
                background: 'rgba(16,28,53,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                padding: '24px 20px',
                textAlign: 'center',
                backdropFilter: 'blur(16px)',
                transition: 'border-color 0.3s, transform 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${stat.color}44`; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 10, filter: `drop-shadow(0 0 8px ${stat.color}60)` }}>{stat.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 4, color: stat.color, textShadow: `0 0 20px ${stat.color}40` }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '64px 28px' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="badge badge-cyan" style={{ marginBottom: 14 }}>How It Works</span>
            <h2 className="section-title" style={{ margin: '10px 0 0' }}>
              Powered by <span className="gradient-text">Custom RL Agents</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, index) => (
              <div
                key={f.title}
                ref={el => { featureRefs.current[index] = el }}
                style={{
                  background: 'rgba(16,28,53,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  backdropFilter: 'blur(16px)',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}40`; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${f.color}20`; e.currentTarget.style.transform = 'translateY(-4px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div className="feature-icon" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="neon-divider" style={{ margin: '0 28px' }} />

      <section id="ai-picks" style={{ padding: '60px 28px' }}>
        <div ref={aiSectionRef} style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 6px #8b5cf6)' }}>✦</span>
                <h2 className="section-title">AI Picks For You</h2>
                <span className="badge badge-purple">Policy Gradient Agent</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Curated from your session behaviour — click signals, item selection, and session depth.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))', gap: 22 }}>
            {aiRecs.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
          </div>
        </div>
      </section>

      <section id="catalog" style={{ padding: '0 28px 80px' }}>
        <div ref={catalogSectionRef} style={{ maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 className="section-title">Product Catalog</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: 4 }}>{filtered.length} products available</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 100,
                    fontFamily: 'inherit',
                    border: activeCategory === cat ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: activeCategory === cat ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                    color: activeCategory === cat ? '#60a5fa' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    boxShadow: activeCategory === cat ? '0 0 12px rgba(59,130,246,0.15)' : 'none',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))', gap: 22 }}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{ animation: `fadeInUp 0.4s ease ${i * 0.04}s both` }}>
                <ProductCard product={p} onAddToCart={addToCart} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '36px 28px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>✦</div>
            <span style={{ fontWeight: 700 }}><span className="gradient-text">NexCart</span></span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            ML-Powered E-commerce · Q-Learning · SARSA · Policy Gradients · Deployed on GCP
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Privacy', 'Terms', 'Security'].map(l => (
              <span key={l} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>

      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onUpdateQty={updateQty} onCheckout={() => { setCartOpen(false); router.push('/checkout') }} />}
    </div>
  )
}
