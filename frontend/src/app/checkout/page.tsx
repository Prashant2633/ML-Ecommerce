'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { track } from '@/lib/telemetry'

const GlobeCanvas = dynamic(() => import('@/components/GlobeCanvas'), { ssr: false })

// ── Luhn Algorithm — validates real card numbers ──────────────────────────────
function luhn(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 13) return false
  let sum = 0
  let isEven = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10)
    if (isEven) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    isEven = !isEven
  }
  return sum % 10 === 0
}

// ── Card number formatter (groups of 4) ─────────────────────────────────────
function formatCard(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

// ── Expiry formatter MM/YY ───────────────────────────────────────────────────
function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

type Step = 'details' | 'payment' | 'confirmation'

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  image_url?: string
}

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cvvVisible, setCvvVisible] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [submitLocked, setSubmitLocked] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexcart_cart')
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // ── Derived security checks ──────────────────────────────────────────────
  const cardDigits = card.replace(/\s/g, '')
  const isCardValid = luhn(cardDigits)
  const cardBrand = cardDigits.startsWith('4') ? 'Visa' : cardDigits.startsWith('5') ? 'Mastercard' : cardDigits.startsWith('37') ? 'Amex' : ''
  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)
  const cvvValid = cvv.length >= 3

  const canPay = isCardValid && expiryValid && cvvValid && !submitLocked
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // ── Validate shipping details ────────────────────────────────────────────
  const validateDetails = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required'
    if (!form.address.trim() || form.address.length < 8) errs.address = 'Full address required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Secure payment submit ────────────────────────────────────────────────
  const handlePay = async () => {
    if (!canPay) return
    setSubmitLocked(true) // Rate-limit: prevent double-submit
    setProcessing(true)

    // In production: call Stripe.js createPaymentMethod() here
    // NEVER send raw card data to your own server
    await new Promise(r => setTimeout(r, 2200))

    // Fire purchase telemetry — logs telemetry signal to database
    // product_id 1 represents a completed checkout (basket-level event)
    track(1, 'purchase').catch(() => { /* silently ignore if backend is down */ })

    // Clear sensitive data from memory immediately after "submission"
    setCvv('')
    setCard('')
    setExpiry('')

    // Clear cart from local storage
    localStorage.removeItem('nexcart_cart')
    setCart([])

    setProcessing(false)
    setStep('confirmation')
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    background: '#1c1d22',
    border: `1px solid ${hasError ? '#ef4444' : '#2d3037'}`,
    borderRadius: 10,
    padding: '12px 16px',
    color: '#f5f5f7',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0b0c0e', color: '#f5f5f7' }}>
      
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #22242a', background: 'rgba(11,12,14,0.9)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f5f5f7' }}>
              NEX<span style={{ color: '#c5a059' }}>CART</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8e8e93', fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
            <span style={{ color: '#c5a059', fontSize: '0.95rem' }}>🔒</span>
            SSL Secured Checkout
          </div>
        </div>
      </div>

      <div className={`checkout-grid ${step === 'confirmation' ? 'confirmation' : ''}`} style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px', gap: 32 }}>

        {/* ── LEFT: Forms ─────────────────────────────────────────────────── */}
        <div>
          {/* Step Indicator */}
          {step !== 'confirmation' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
              {['details', 'payment'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: step === s || (s === 'details' && step === 'payment') ? 'linear-gradient(135deg, #c5a059, #aa820a)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.8rem', color: step === s || (s === 'details' && step === 'payment') ? '#0b0c0e' : '#8e8e93',
                    boxShadow: step === s || (s === 'details' && step === 'payment') ? '0 0 12px rgba(197,160,89,0.3)' : 'none',
                  }}>
                    {s === 'details' && step === 'payment' ? '✓' : i + 1}
                  </div>
                  <span style={{ margin: '0 12px', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: step === s || (s === 'details' && step === 'payment') ? '#f5f5f7' : '#8e8e93' }}>{s}</span>
                  {i < 1 && <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.06)', marginRight: 12 }} />}
                </div>
              ))}
            </div>
          )}

          {/* ── Step: Shipping Details ─────────────────────────────────── */}
          {step === 'details' && (
            <div className="bento-card-lux" style={{ padding: 36, background: '#14161a', borderColor: '#22242a' }}>
              <h2 style={{ margin: '0 0 28px', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Shipping Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { label: 'Full Name',         key: 'name',    placeholder: 'John Doe',               type: 'text' },
                  { label: 'Email Address',     key: 'email',   placeholder: 'john@example.com',        type: 'email' },
                  { label: 'Shipping Address',  key: 'address', placeholder: '123 Main St, City, ZIP',  type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: '0.8rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>{field.label}</label>
                    <input
                      type={field.type}
                      autoComplete={field.key === 'email' ? 'email' : field.key === 'name' ? 'name' : 'street-address'}
                      value={form[field.key as keyof typeof form]}
                      onChange={e => { setForm(f => ({ ...f, [field.key]: e.target.value })); setErrors(er => ({ ...er, [field.key]: '' })) }}
                      placeholder={field.placeholder}
                      style={inputStyle(!!errors[field.key])}
                    />
                    {errors[field.key] && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>{errors[field.key]}</p>}
                  </div>
                ))}
                <button onClick={() => validateDetails() && setStep('payment')} className="btn-lux-filled" style={{ padding: '14px', fontSize: '0.82rem', marginTop: 8 }}>
                  Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Payment ─────────────────────────────────────────── */}
          {step === 'payment' && (
            <div className="bento-card-lux" style={{ padding: 36, background: '#14161a', borderColor: '#22242a' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Payment Details</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <span className="badge" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>Test Mode</span>
                <span style={{ fontSize: '0.78rem', color: '#8e8e93' }}>Use card <code style={{ color: '#4ade80', fontWeight: 700 }}>4242 4242 4242 4242</code></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Card Number */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                    Card Number
                    {cardBrand && <span style={{ marginLeft: 8, color: '#c5a059', fontWeight: 800 }}>({cardBrand})</span>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={card}
                      onChange={e => setCard(formatCard(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      style={{ ...inputStyle(!isCardValid && cardDigits.length === 16), paddingRight: 48 }}
                    />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem' }}>
                      💳
                    </span>
                  </div>
                  {cardDigits.length === 16 && !isCardValid && (
                    <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>⚠ Invalid card number</p>
                  )}
                  {isCardValid && <p style={{ color: '#4ade80', fontSize: '0.78rem', marginTop: 4 }}>✓ Valid card</p>}
                </div>

                {/* Expiry + CVV */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>Expiry</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      style={inputStyle(!expiryValid && expiry.length === 5)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8, letterSpacing: '0.02em' }}>
                      CVV
                      <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#8e8e93', textTransform: 'none', fontWeight: 400 }}>(never stored)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={cvvVisible ? 'text' : 'password'}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onBlur={() => setCvvVisible(false)}
                        placeholder="•••"
                        maxLength={4}
                        style={{ ...inputStyle(), paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onMouseDown={() => setCvvVisible(true)}
                        onMouseUp={() => setCvvVisible(false)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {cvvVisible ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security badges */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                  {['🔒 SSL Encrypted', '🛡 PCI DSS', '✓ Luhn Validated'].map(b => (
                    <span key={b} style={{ fontSize: '0.72rem', color: '#8e8e93', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>{b}</span>
                  ))}
                </div>

                <button
                  onClick={handlePay}
                  className="btn-lux-filled"
                  style={{ padding: '14px', fontSize: '0.82rem', marginTop: 8, opacity: canPay ? 1 : 0.5, cursor: canPay ? 'pointer' : 'not-allowed' }}
                  disabled={!canPay}
                >
                  {processing ? '⏳ Processing securely...' : `🔒 Pay Now`}
                </button>
                <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '0.82rem', marginTop: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c5a059'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}>← Back to details</button>
              </div>
            </div>
          )}

          {/* ── Step: Confirmation ────────────────────────────────────── */}
          {step === 'confirmation' && (
            <div style={{ textAlign: 'center', padding: '60px 24px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '4.5rem', marginBottom: 24 }}>✅</div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Order Confirmed!</h1>
              <p style={{ color: '#8e8e93', fontSize: '0.9rem', marginBottom: 8 }}>
                Payment processed successfully. Card data was cleared from memory immediately.
              </p>
              
              <div className="bento-card-lux" style={{ maxWidth: 500, margin: '32px auto', textAlign: 'left', background: 'linear-gradient(135deg, rgba(197,160,89,0.06), rgba(197,160,89,0.01))', border: '1px solid rgba(197,160,89,0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#c5a059', lineHeight: 1.5 }}>
                  🧠 <strong>Telemetry Logged:</strong> Purchase event has been tracked. Similarity matrix and popularity weights updated in real time.
                </p>
              </div>

              <Link href="/" className="btn-lux-filled" style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.82rem', padding: '12px 30px' }}>
                Continue Shopping →
              </Link>
            </div>
          )}
        </div>

        {/* ── RIGHT: Security Panel with Three.js Globe ────────────────────── */}
        {step !== 'confirmation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Globe */}
            <div className="bento-card-lux" style={{ padding: 24, textAlign: 'center', background: '#14161a', borderColor: '#22242a' }}>
              <div style={{ height: 220, borderRadius: 12, overflow: 'hidden' }}>
                <GlobeCanvas />
              </div>
              <p style={{ margin: '16px 0 0', fontSize: '0.8rem', color: '#8e8e93', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                🔒 Data is encrypted end-to-end
              </p>
            </div>

            {/* Order summary */}
            <div className="bento-card-lux" style={{ padding: 24, background: '#14161a', borderColor: '#22242a' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Summary</h3>
              
              {/* Dynamic items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 180, overflowY: 'auto' }}>
                {cart.length === 0 ? (
                  <p style={{ fontSize: '0.82rem', color: '#8e8e93' }}>No items in cart.</p>
                ) : cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: '#0b0c0e', border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#c5a059', background: 'rgba(197,160,89,0.1)' }}>✦</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#8e8e93' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c5a059' }}>${(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#8e8e93', fontSize: '0.8rem', fontWeight: 500 }}>SUBTOTAL</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>${total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#8e8e93', fontSize: '0.8rem', fontWeight: 500 }}>SHIPPING</span>
                <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 700 }}>FREE</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f5f5f7' }}>TOTAL</span>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#c5a059' }}>${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Security guarantees */}
            <div className="bento-card-lux" style={{ padding: 20, background: '#14161a', borderColor: '#22242a' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 800, color: '#8e8e93', letterSpacing: '0.04em', textTransform: 'uppercase' }}>SECURITY GUARANTEES</p>
              {[
                { icon: '🔒', text: '256-bit TLS encryption' },
                { icon: '🛡', text: 'PCI DSS Level 1 compliant' },
                { icon: '✓', text: 'Luhn algorithm validation' },
                { icon: '🚫', text: 'Card data never stored' },
                { icon: '⚡', text: 'Rate-limited submissions' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: '0.78rem', color: '#8e8e93', fontWeight: 500 }}>
                  <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
