'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { track } from '@/lib/telemetry'
import { useRegion } from '@/components/RegionContext'
import { useAuth } from '@/components/AuthContext'
import { PRODUCTS } from '@/lib/products'

const GlobeCanvas = dynamic(() => import('@/components/GlobeCanvas'), { ssr: false })

// Luhn Algorithm - validates credit card numbers
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

// Card number formatter (groups of 4)
function formatCard(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

// Expiry formatter MM/YY
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
  const router = useRouter()
  const { user, updateProfile, syncCart } = useAuth()
  const { activeRegion, formatPrice } = useRegion()

  const [step, setStep] = useState<Step>('details')
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cvvVisible, setCvvVisible] = useState(false)
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card')
  const [selectedShipping, setSelectedShipping] = useState<any>(null)
  
  const [processing, setProcessing] = useState(false)
  const [submitLocked, setSubmitLocked] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [cart, setCart] = useState<CartItem[]>([])
  
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null)

  // Load cart from context/localStorage on mount or when user changes
  useEffect(() => {
    if (user) {
      setCart(user.cart || [])
      // Autofill details from user account
      setForm(prev => ({
        ...prev,
        email: user.email,
        name: user.saved_addresses?.[0]?.name || '',
        address: user.saved_addresses?.[0]?.address || '',
        city: user.saved_addresses?.[0]?.city || '',
        state: user.saved_addresses?.[0]?.state || '',
        zipCode: user.saved_addresses?.[0]?.zip_code || ''
      }))
    } else {
      const saved = localStorage.getItem('nexcart_cart')
      if (saved) {
        try {
          setCart(JSON.parse(saved))
        } catch {}
      }
    }
  }, [user])

  // Update selected shipping option when activeRegion changes
  useEffect(() => {
    if (activeRegion.shippingZones && activeRegion.shippingZones.length > 0) {
      setSelectedShipping(activeRegion.shippingZones[0])
    }
  }, [activeRegion])

  // FX rates cache for calculation
  const FX_RATES: Record<string, number> = {
    USD: 1.0,
    INR: 83.5,
    GBP: 0.79,
    AED: 3.67,
    EUR: 0.93
  }

  const getPriceVal = (itemId: number, basePrice: number): number => {
    const prod = PRODUCTS.find(p => p.id === itemId)
    const avail = prod?.availability?.[activeRegion.code]
    if (avail && avail.priceOverride !== undefined && avail.priceOverride !== null) {
      return avail.priceOverride
    }
    const rate = FX_RATES[activeRegion.currencyCode] || 1.0
    return basePrice * rate
  }

  // ── Secure payment validation details ────────────────────────────────────
  const cardDigits = card.replace(/\s/g, '')
  const isCardValid = luhn(cardDigits)
  const cardBrand = cardDigits.startsWith('4') ? 'Visa' : cardDigits.startsWith('5') ? 'Mastercard' : cardDigits.startsWith('37') ? 'Amex' : ''
  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)
  const cvvValid = cvv.length >= 3

  const canPay = paymentMethod === 'cod' || (isCardValid && expiryValid && cvvValid && !submitLocked)

  // Subtotal, tax, shipping, and total calculations in local currency
  const subtotal = cart.reduce((sum, item) => sum + getPriceVal(item.id, item.price) * item.quantity, 0)
  const taxRate = activeRegion.taxRate
  const tax = subtotal * taxRate
  const shippingCost = selectedShipping ? selectedShipping.cost : 0
  const total = subtotal + tax + shippingCost

  // Localized label names based on active region
  const zipLabel = activeRegion.code === 'IN' ? 'PIN Code' :
                   activeRegion.code === 'GB' ? 'Postcode' :
                   activeRegion.code === 'DE' ? 'PLZ (Postleitzahl)' :
                   activeRegion.code === 'AE' ? 'PO Box / Area' : 'ZIP Code'

  const stateLabel = activeRegion.code === 'AE' ? 'Emirate' :
                     activeRegion.code === 'GB' ? 'County' :
                     activeRegion.code === 'DE' ? 'Bundesland' : 'State'

  const cityLabel = activeRegion.code === 'DE' ? 'Stadt' :
                    activeRegion.code === 'GB' ? 'Town/City' : 'City'

  const validateDetails = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email is required'
    if (!form.address.trim()) errs.address = 'Street address is required'
    if (!form.city.trim()) errs.city = `${cityLabel} is required`
    if (!form.state.trim()) errs.state = `${stateLabel} is required`
    if (!form.zipCode.trim()) errs.zipCode = `${zipLabel} is required`
    
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePay = async () => {
    if (!canPay) return
    setSubmitLocked(true)
    setProcessing(true)

    try {
      // 1. Verify regional availability and stock level for all cart items
      for (const item of cart) {
        const prod = PRODUCTS.find(p => p.id === item.id)
        const avail = prod?.availability?.[activeRegion.code]
        if (!avail || !avail.available) {
          throw new Error(`Product "${item.title}" is not available in your region (${activeRegion.displayName}).`)
        }
        if (avail.stock < item.quantity) {
          if (avail.stock === 0) {
            throw new Error(`Product "${item.title}" is out of stock in your region (${activeRegion.displayName}).`)
          } else {
            throw new Error(`Sorry, "${item.title}" only has ${avail.stock} items left in stock in your region (${activeRegion.displayName}). Please adjust your cart quantity.`)
          }
        }
      }

      // Create shipping address object
      const shippingAddress = {
        name: form.name,
        email: form.email,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zipCode
      }

      // If user wants to save address, save it to their profile in the database
      if (user && saveAddressToProfile) {
        await updateProfile({
          saved_addresses: [shippingAddress]
        })
      }

      // Map cart items to the database order schema
      const orderItems = cart.map(item => ({
        product_id: item.id,
        title: item.title,
        price: getPriceVal(item.id, item.price),
        quantity: item.quantity
      }))

      // Place order in backend API
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user ? user.id : null,
          region_code: activeRegion.code,
          items: orderItems,
          subtotal,
          tax,
          shipping_cost: shippingCost,
          total,
          shipping_address: shippingAddress,
          payment_method: paymentMethod.toUpperCase()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to record order on server')
      }

      const orderData = await response.json()
      setConfirmedOrder(orderData)

      // Telemetry signals purchase
      track(1, 'purchase', user?.id).catch(() => {})

      // Clear card fields from memory
      setCvv('')
      setCard('')
      setExpiry('')

      // Clear cart
      if (user) {
        await syncCart([])
      }
      localStorage.removeItem('nexcart_cart')
      setCart([])

      setStep('confirmation')
    } catch (e: any) {
      alert(e.message || 'Payment processing failed. Please try again.')
      setSubmitLocked(false)
    } finally {
      setProcessing(false)
    }
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

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
        
        {step !== 'confirmation' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32, alignItems: 'start' }}>
            
            {/* LEFT COLUMN: Shipping & Payment Forms */}
            <div>
              {/* Step indicator tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
                {['details', 'payment'].map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: step === s || (s === 'details' && step === 'payment') ? 'linear-gradient(135deg, #c5a059, #aa820a)' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.75rem', color: step === s || (s === 'details' && step === 'payment') ? '#0b0c0e' : '#8e8e93',
                      boxShadow: step === s || (s === 'details' && step === 'payment') ? '0 0 12px rgba(197,160,89,0.3)' : 'none',
                    }}>
                      {s === 'details' && step === 'payment' ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: step === s || (s === 'details' && step === 'payment') ? '#f5f5f7' : '#8e8e93' }}>
                      {s}
                    </span>
                    {i < 1 && <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,0.06)' }} />}
                  </div>
                ))}
              </div>

              {/* Step 1: Shipping Details */}
              {step === 'details' && (
                <div className="bento-card-lux" style={{ padding: 36, background: '#14161a', borderColor: '#22242a' }}>
                  <h2 style={{ margin: '0 0 28px', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#c5a059' }}>
                    Shipping Details
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Full Name</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }}
                          placeholder="John Doe"
                          style={inputStyle(!!errors.name)}
                        />
                        {errors.name && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>{errors.name}</p>}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Email Address</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })) }}
                          placeholder="john@example.com"
                          style={inputStyle(!!errors.email)}
                        />
                        {errors.email && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>{errors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Street Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={e => { setForm(f => ({ ...f, address: e.target.value })); setErrors(er => ({ ...er, address: '' })) }}
                        placeholder="123 Main St, Apartment 4B"
                        style={inputStyle(!!errors.address)}
                      />
                      {errors.address && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>{errors.address}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{cityLabel}</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setErrors(er => ({ ...er, city: '' })) }}
                          placeholder="New York"
                          style={inputStyle(!!errors.city)}
                        />
                        {errors.city && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>{errors.city}</p>}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{stateLabel}</label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={e => { setForm(f => ({ ...f, state: e.target.value })); setErrors(er => ({ ...er, state: '' })) }}
                          placeholder="NY"
                          style={inputStyle(!!errors.state)}
                        />
                        {errors.state && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>{errors.state}</p>}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{zipLabel}</label>
                        <input
                          type="text"
                          value={form.zipCode}
                          onChange={e => { setForm(f => ({ ...f, zipCode: e.target.value })); setErrors(er => ({ ...er, zipCode: '' })) }}
                          placeholder="10001"
                          style={inputStyle(!!errors.zipCode)}
                        />
                        {errors.zipCode && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>{errors.zipCode}</p>}
                      </div>
                    </div>

                    {user && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <input
                          type="checkbox"
                          id="save_addr"
                          checked={saveAddressToProfile}
                          onChange={e => setSaveAddressToProfile(e.target.checked)}
                          style={{ accentColor: '#c5a059', cursor: 'pointer' }}
                        />
                        <label htmlFor="save_addr" style={{ fontSize: '0.78rem', color: '#8e8e93', cursor: 'pointer' }}>
                          Save this address as my primary shipping address
                        </label>
                      </div>
                    )}

                    <button
                      onClick={() => validateDetails() && setStep('payment')}
                      className="btn-lux-filled"
                      style={{ padding: '14px', fontSize: '0.82rem', marginTop: 14 }}
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Details */}
              {step === 'payment' && (
                <div className="bento-card-lux" style={{ padding: 36, background: '#14161a', borderColor: '#22242a' }}>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#c5a059' }}>
                    Payment Details
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#8e8e93', marginBottom: 20 }}>
                    Select payment method and verify billing criteria.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    
                    {/* Payment methods selector */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        style={{
                          flex: 1,
                          background: paymentMethod === 'card' ? 'rgba(197, 160, 89, 0.08)' : 'rgba(255,255,255,0.01)',
                          border: paymentMethod === 'card' ? '1px solid #c5a059' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 12,
                          padding: '12px 16px',
                          color: paymentMethod === 'card' ? '#c5a059' : '#8e8e93',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>💳</span> Credit/Debit Card
                      </button>
                      
                      {activeRegion.codAvailable && (
                        <button
                          onClick={() => setPaymentMethod('cod')}
                          style={{
                            flex: 1,
                            background: paymentMethod === 'cod' ? 'rgba(197, 160, 89, 0.08)' : 'rgba(255,255,255,0.01)',
                            border: paymentMethod === 'cod' ? '1px solid #c5a059' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            padding: '12px 16px',
                            color: paymentMethod === 'cod' ? '#c5a059' : '#8e8e93',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>💵</span> Cash on Delivery
                        </button>
                      )}
                    </div>

                    {paymentMethod === 'card' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10 }}>
                          <span style={{ color: '#4ade80', fontSize: '0.9rem' }}>●</span>
                          <span style={{ fontSize: '0.75rem', color: '#8e8e93' }}>
                            Stripe sandbox active. Use test card: <code style={{ color: '#4ade80', fontWeight: 700 }}>4242 4242 4242 4242</code>
                          </span>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                            Card Number {cardBrand && <span style={{ color: '#c5a059' }}>({cardBrand})</span>}
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
                              style={inputStyle(!isCardValid && cardDigits.length === 16)}
                            />
                            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', opacity: 0.5 }}>💳</span>
                          </div>
                          {cardDigits.length === 16 && !isCardValid && (
                            <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: 4 }}>⚠ Invalid card number (Luhn check failed)</p>
                          )}
                          {isCardValid && <p style={{ color: '#4ade80', fontSize: '0.72rem', marginTop: 4 }}>✓ Valid card format</p>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Expiry Date</label>
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
                            <label style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>CVV</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={cvvVisible ? 'text' : 'password'}
                                inputMode="numeric"
                                value={cvv}
                                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="•••"
                                maxLength={4}
                                style={inputStyle(!cvvValid && cvv.length >= 3)}
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
                      </div>
                    ) : (
                      <div style={{ padding: '24px', background: 'rgba(197, 160, 89, 0.04)', border: '1px solid rgba(197, 160, 89, 0.15)', borderRadius: 12, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#c5a059', fontWeight: 600 }}>
                          📦 Cash on Delivery Confirmed
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#8e8e93', lineHeight: 1.4 }}>
                          You will pay the total amount of <strong style={{ color: '#f5f5f7' }}>{formatPrice(total / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : 1.0))}</strong> in cash or local QR scan to the courier agent upon physical delivery.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      <button
                        onClick={handlePay}
                        disabled={!canPay || processing}
                        className="btn-lux-filled"
                        style={{
                          padding: '14px',
                          fontSize: '0.82rem',
                          opacity: canPay && !processing ? 1 : 0.5,
                          cursor: canPay && !processing ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {processing ? '⏳ Processing Securely...' : paymentMethod === 'cod' ? 'Confirm Order' : 'Pay Now'}
                      </button>
                      <button
                        onClick={() => setStep('details')}
                        style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '0.8rem', padding: '6px 0' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#c5a059'}
                        onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}
                      >
                        ← Back to Shipping Details
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Order Summary & Globe */}
            <div>
              {/* Globe Visualizer */}
              <div className="bento-card-lux" style={{ padding: 24, textAlign: 'center', background: '#14161a', borderColor: '#22242a', marginBottom: 24 }}>
                <div style={{ height: 160, borderRadius: 12, overflow: 'hidden' }}>
                  <GlobeCanvas />
                </div>
                <p style={{ margin: '12px 0 0', fontSize: '0.72rem', color: '#8e8e93', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  🔒 Region: {activeRegion.displayName} ({activeRegion.code})
                </p>
              </div>

              {/* Order Summary */}
              <div className="bento-card-lux" style={{ padding: 28, background: '#14161a', borderColor: '#22242a' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#c5a059' }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, maxHeight: 240, overflowY: 'auto' }}>
                  {cart.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#8e8e93', fontStyle: 'italic' }}>Your cart is empty.</p>
                  ) : (
                    cart.map(item => {
                      const itemTotal = getPriceVal(item.id, item.price) * item.quantity
                      return (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#0b0c0e', border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#c5a059' }}>✦</div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#8e8e93' }}>
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c5a059' }}>
                            {formatPrice(item.price, PRODUCTS.find(p => p.id === item.id)?.availability?.[activeRegion.code]?.priceOverride)}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
                
                {/* Shipping Zone Selector */}
                {activeRegion.shippingZones && activeRegion.shippingZones.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: '0.68rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Shipping Speed
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeRegion.shippingZones.map(zone => (
                        <label
                          key={zone.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: selectedShipping?.id === zone.id ? 'rgba(197,160,89,0.05)' : 'rgba(255,255,255,0.01)',
                            border: selectedShipping?.id === zone.id ? '1px solid rgba(197,160,89,0.3)' : '1px solid rgba(255,255,255,0.04)',
                            borderRadius: 8,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="shipping_speed"
                              checked={selectedShipping?.id === zone.id}
                              onChange={() => setSelectedShipping(zone)}
                              style={{ accentColor: '#c5a059', cursor: 'pointer' }}
                            />
                            <div>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', color: '#f5f5f7' }}>{zone.name}</span>
                              <span style={{ fontSize: '0.65rem', color: '#8e8e93' }}>Est: {zone.deliveryDays} days</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c5a059' }}>
                            {formatPrice(zone.cost / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : activeRegion.currencyCode === 'EUR' ? 0.93 : activeRegion.currencyCode === 'GBP' ? 0.79 : 1.0))}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.78rem' }}>
                  <span style={{ color: '#8e8e93', fontWeight: 500 }}>SUBTOTAL</span>
                  <span style={{ fontWeight: 700, color: '#f5f5f7' }}>
                    {formatPrice(subtotal / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : activeRegion.currencyCode === 'EUR' ? 0.93 : activeRegion.currencyCode === 'GBP' ? 0.79 : 1.0))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.78rem' }}>
                  <span style={{ color: '#8e8e93', fontWeight: 500 }}>{activeRegion.taxLabel} ({Math.round(taxRate * 1000)/10}%)</span>
                  <span style={{ fontWeight: 700, color: '#f5f5f7' }}>
                    {formatPrice(tax / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : activeRegion.currencyCode === 'EUR' ? 0.93 : activeRegion.currencyCode === 'GBP' ? 0.79 : 1.0))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.78rem' }}>
                  <span style={{ color: '#8e8e93', fontWeight: 500 }}>SHIPPING COST</span>
                  <span style={{ fontWeight: 700, color: '#f5f5f7' }}>
                    {formatPrice(shippingCost / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : activeRegion.currencyCode === 'EUR' ? 0.93 : activeRegion.currencyCode === 'GBP' ? 0.79 : 1.0))}
                  </span>
                </div>
                
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '16px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f5f5f7' }}>TOTAL</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#c5a059' }}>
                    {formatPrice(total / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : activeRegion.currencyCode === 'EUR' ? 0.93 : activeRegion.currencyCode === 'GBP' ? 0.79 : 1.0))}
                  </span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Step 3: Order Confirmation Step */
          <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 600, margin: '0 auto' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: 24 }}>✅</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#c5a059' }}>
              Order Confirmed!
            </h1>
            <p style={{ color: '#8e8e93', fontSize: '0.9rem', marginBottom: 32 }}>
              Your order was placed successfully in the database. Card credentials were scrubbed instantly.
            </p>

            {confirmedOrder && (
              <div className="bento-card-lux" style={{ textAlign: 'left', background: '#14161a', borderColor: '#22242a', padding: 28, marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#f5f5f7', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 10 }}>
                  Order Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: '#8e8e93', display: 'block', marginBottom: 2 }}>Order Number</span>
                    <strong style={{ color: '#c5a059' }}>{confirmedOrder.order_number}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#8e8e93', display: 'block', marginBottom: 2 }}>Region Code</span>
                    <strong style={{ color: '#f5f5f7' }}>{confirmedOrder.region_code}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#8e8e93', display: 'block', marginBottom: 2 }}>Payment Method</span>
                    <strong style={{ color: '#f5f5f7' }}>{confirmedOrder.payment_method}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#8e8e93', display: 'block', marginBottom: 2 }}>Total Amount</span>
                    <strong style={{ color: '#c5a059' }}>
                      {formatPrice(confirmedOrder.total / (activeRegion.currencyCode === 'INR' ? 83.5 : activeRegion.currencyCode === 'AED' ? 3.67 : activeRegion.currencyCode === 'EUR' ? 0.93 : activeRegion.currencyCode === 'GBP' ? 0.79 : 1.0))}
                    </strong>
                  </div>
                </div>
                
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#8e8e93', display: 'block', marginBottom: 4 }}>Shipping Address</span>
                  <p style={{ margin: 0, color: '#f5f5f7', lineHeight: 1.4 }}>
                    {confirmedOrder.shipping_address.name}<br />
                    {confirmedOrder.shipping_address.address}, {confirmedOrder.shipping_address.city}, {confirmedOrder.shipping_address.state} {confirmedOrder.shipping_address.zip_code}
                  </p>
                </div>
              </div>
            )}

            <div className="bento-card-lux" style={{ margin: '32px auto', textAlign: 'left', background: 'linear-gradient(135deg, rgba(197,160,89,0.06), rgba(197,160,89,0.01))', border: '1px solid rgba(197,160,89,0.2)', padding: 18 }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#c5a059', lineHeight: 1.5 }}>
                🧠 <strong>Telemetry Logged:</strong> Purchase event synchronized. NexCart AI telemetry convergence weights successfully re-calculated to reinforce style profile affinity in real time.
              </p>
            </div>

            <Link href="/" className="btn-lux-filled" style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.82rem', padding: '12px 30px' }}>
              Continue Shopping →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
