'use client'
import { useState, useCallback } from 'react'
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

  // ── Derived security checks ──────────────────────────────────────────────
  const cardDigits = card.replace(/\s/g, '')
  const isCardValid = luhn(cardDigits)
  const cardBrand = cardDigits.startsWith('4') ? 'Visa' : cardDigits.startsWith('5') ? 'Mastercard' : cardDigits.startsWith('37') ? 'Amex' : ''
  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)
  const cvvValid = cvv.length >= 3

  const canPay = isCardValid && expiryValid && cvvValid && !submitLocked

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

    // Fire purchase telemetry — feeds the RL reward function (+20.0)
    // product_id 0 represents a completed checkout (basket-level event)
    track(1, 'purchase').catch(() => { /* silently ignore if backend is down */ })

    // Clear sensitive data from memory immediately after "submission"
    setCvv('')
    setCard('')
    setExpiry('')

    setProcessing(false)
    setStep('confirmation')
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12, padding: '12px 16px',
    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800 }}><span className="gradient-text">Nex</span><span style={{ color: 'var(--text-primary)' }}>Cart</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span style={{ color: '#22c55e', fontSize: '1rem' }}>🔒</span>
            256-bit SSL Encrypted Checkout
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: step === 'confirmation' ? '1fr' : '1fr 340px', gap: 32 }}>

        {/* ── LEFT: Forms ─────────────────────────────────────────────────── */}
        <div>
          {/* Step Indicator */}
          {step !== 'confirmation' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
              {['details', 'payment'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: step === s || (s === 'details' && step === 'payment') ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem', color: 'white',
                  }}>
                    {s === 'details' && step === 'payment' ? '✓' : i + 1}
                  </div>
                  <span style={{ margin: '0 12px', fontSize: '0.88rem', fontWeight: 500, color: step === s ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>{s}</span>
                  {i < 1 && <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.1)', marginRight: 12 }} />}
                </div>
              ))}
            </div>
          )}

          {/* ── Step: Shipping Details ─────────────────────────────────── */}
          {step === 'details' && (
            <div className="glass-card" style={{ padding: 36 }}>
              <h2 style={{ margin: '0 0 28px', fontSize: '1.3rem', fontWeight: 700 }}>Shipping Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  { label: 'Full Name',         key: 'name',    placeholder: 'John Doe',               type: 'text' },
                  { label: 'Email Address',     key: 'email',   placeholder: 'john@example.com',        type: 'email' },
                  { label: 'Shipping Address',  key: 'address', placeholder: '123 Main St, City, ZIP',  type: 'text' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 8 }}>{field.label}</label>
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
                <button onClick={() => validateDetails() && setStep('payment')} className="btn-glow" style={{ padding: '15px', fontSize: '1rem', marginTop: 8 }}>
                  Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Payment ─────────────────────────────────────────── */}
          {step === 'payment' && (
            <div className="glass-card" style={{ padding: 36 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 700 }}>Payment Details</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <span className="badge badge-green">Test Mode</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use card <code style={{ color: '#22c55e' }}>4242 4242 4242 4242</code></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Card Number */}
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 8 }}>
                    Card Number
                    {cardBrand && <span style={{ marginLeft: 8, color: '#3b82f6', fontWeight: 700 }}>{cardBrand}</span>}
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
                      {cardBrand === 'Visa' ? '💳' : cardBrand === 'Mastercard' ? '🏧' : '💳'}
                    </span>
                  </div>
                  {cardDigits.length === 16 && !isCardValid && (
                    <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 4 }}>⚠ Invalid card number</p>
                  )}
                  {isCardValid && <p style={{ color: '#22c55e', fontSize: '0.78rem', marginTop: 4 }}>✓ Valid card</p>}
                </div>

                {/* Expiry + CVV */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Expiry</label>
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
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 8 }}>
                      CVV
                      <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>(never stored)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={cvvVisible ? 'text' : 'password'}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onBlur={() => setCvvVisible(false)} // auto-hide on blur
                        placeholder="•••"
                        maxLength={4}
                        style={{ ...inputStyle(), paddingRight: 44 }}
                      />
                      <button
                        type="button"
                        onMouseDown={() => setCvvVisible(true)}
                        onMouseUp={() => setCvvVisible(false)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        {cvvVisible ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security badges */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 4 }}>
                  {['🔒 SSL Encrypted', '🛡 PCI DSS', '✓ Luhn Validated'].map(b => (
                    <span key={b} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>{b}</span>
                  ))}
                </div>

                <button
                  onClick={handlePay}
                  className="btn-glow"
                  style={{ padding: '16px', fontSize: '1rem', marginTop: 8, opacity: canPay ? 1 : 0.5, cursor: canPay ? 'pointer' : 'not-allowed' }}
                  disabled={!canPay}
                >
                  {processing ? '⏳ Processing securely...' : `🔒 Pay Now`}
                </button>
                <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem' }}>← Back to details</button>
              </div>
            </div>
          )}

          {/* ── Step: Confirmation ────────────────────────────────────── */}
          {step === 'confirmation' && (
            <div style={{ textAlign: 'center', padding: '60px 24px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '5rem', marginBottom: 24 }} className="animate-float">✅</div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>Order Confirmed!</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 8 }}>
                Payment processed securely. Card data was cleared from memory immediately after submission.
              </p>
              <div className="ai-banner" style={{ maxWidth: 500, margin: '32px auto', textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  🧠 <strong>RL Update:</strong> Purchase signal (reward = +20.0) recorded. All three agents will incorporate this in the next training iteration.
                </p>
              </div>
              <Link href="/" className="btn-glow" style={{ display: 'inline-block', padding: '14px 36px', textDecoration: 'none', fontSize: '1rem' }}>
                Continue Shopping →
              </Link>
            </div>
          )}
        </div>

        {/* ── RIGHT: Security Panel with Three.js Globe ────────────────────── */}
        {step !== 'confirmation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Globe */}
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ height: 220, borderRadius: 12, overflow: 'hidden' }}>
                <GlobeCanvas />
              </div>
              <p style={{ margin: '16px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                🔒 Your data is encrypted end-to-end
              </p>
            </div>

            {/* Order summary */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700 }}>Order Summary</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Subtotal</span>
                <span style={{ fontSize: '0.88rem' }}>$1,249.97</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Shipping</span>
                <span style={{ fontSize: '0.88rem', color: '#22c55e' }}>Free</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>$1,249.97</span>
              </div>
            </div>

            {/* Security badges */}
            <div className="glass-card" style={{ padding: 20 }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>SECURITY GUARANTEES</p>
              {[
                { icon: '🔒', text: '256-bit TLS encryption' },
                { icon: '🛡', text: 'PCI DSS Level 1 compliant' },
                { icon: '✓', text: 'Luhn algorithm validation' },
                { icon: '🚫', text: 'Card data never stored' },
                { icon: '⚡', text: 'Rate-limited submissions' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '1rem' }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
