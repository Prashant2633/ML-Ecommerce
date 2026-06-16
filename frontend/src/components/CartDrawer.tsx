'use client'
import { useRegion } from '@/components/RegionContext'
import { PRODUCTS } from '@/lib/products'


interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  image_url?: string
  size?: string
}

interface CartDrawerProps {
  cart: CartItem[]
  onClose: () => void
  onUpdateQty: (id: number, delta: number, size?: string) => void
  onCheckout: () => void
}

export default function CartDrawer({ cart, onClose, onUpdateQty, onCheckout }: CartDrawerProps) {
  const { activeRegion, formatPrice } = useRegion()

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

  const totalVal = cart.reduce((sum, item) => {
    const pVal = getPriceVal(item.id, item.price)
    return sum + pVal * item.quantity
  }, 0)

  const formattedTotal = new Intl.NumberFormat(activeRegion.locale, {
    style: 'currency',
    currency: activeRegion.currencyCode,
    minimumFractionDigits: activeRegion.currencyCode === 'INR' ? 0 : 2,
    maximumFractionDigits: 2
  }).format(totalVal)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 200 }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: '#0e1013',
        borderLeft: '1px solid #22242a',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #22242a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#f5f5f7' }}>
            Your Cart
            <span style={{ marginLeft: 10, fontSize: '0.82rem', color: '#8e8e93', fontWeight: 500 }}>
              ({cart.length} item{cart.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '1.2rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5f5f7'}
            onMouseLeave={e => e.currentTarget.style.color = '#8e8e93'}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8e8e93', paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '3rem', marginBottom: 4, filter: 'drop-shadow(0 0 12px rgba(197,160,89,0.2))' }}>🛒</div>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5f5f7', margin: 0 }}>Your cart is empty</p>
              <p style={{ fontSize: '0.78rem', color: '#8e8e93', maxWidth: 220, margin: '0 auto 8px', lineHeight: 1.5 }}>
                Explore our curated collection of luxury apparel, watches, audio, and accessories.
              </p>
              <button 
                onClick={onClose} 
                className="btn-lux-filled" 
                style={{ 
                  padding: '10px 22px', 
                  fontSize: '0.75rem',
                  background: 'linear-gradient(135deg, #c5a059, #aa820a)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#0b0c0e',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Start Shopping
              </button>
            </div>
          ) : cart.map(item => {
            const prod = PRODUCTS.find(p => p.id === item.id) || PRODUCTS[0]
            const avail = prod.availability?.[activeRegion.code]
            const priceOverride = avail?.priceOverride
            const localizedPriceStr = formatPrice(item.price, priceOverride)

            return (
              <div key={item.size ? `${item.id}-${item.size}` : `${item.id}`} className="bento-card-lux" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, background: '#14161a', borderColor: '#22242a', flexDirection: 'row' }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#0b0c0e', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#c5a059', fontWeight: 600 }}>✦</div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#f5f5f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#c5a059', fontWeight: 700 }}>
                    {localizedPriceStr} <span style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 400 }}>x {item.quantity}</span>
                  </p>
                  {item.size && (
                    <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 4, fontSize: '0.65rem', color: '#8e8e93', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Size: {item.size}
                    </span>
                  )}
                </div>

                {/* Quantity selectors */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => onUpdateQty(item.id, -1, item.size)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f5f5f7', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>−</button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.id, 1, item.size)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(197, 160, 89, 0.08)', border: '1px solid rgba(197, 160, 89, 0.25)', color: '#c5a059', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '24px', borderTop: '1px solid #22242a', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ color: '#8e8e93', fontSize: '0.85rem', fontWeight: 500 }}>SUBTOTAL</span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#c5a059' }}>{formattedTotal}</span>
            </div>
            <button onClick={onCheckout} className="btn-lux-filled" style={{ width: '100%', padding: '14px', fontSize: '0.82rem' }}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
