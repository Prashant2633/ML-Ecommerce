'use client'

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  image_url?: string
}

interface CartDrawerProps {
  cart: CartItem[]
  onClose: () => void
  onUpdateQty: (id: number, delta: number) => void
  onCheckout: () => void
}

export default function CartDrawer({ cart, onClose, onUpdateQty, onCheckout }: CartDrawerProps) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

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
            <div style={{ textAlign: 'center', color: '#8e8e93', paddingTop: 80 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🛒</div>
              <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>Your cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="bento-card-lux" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, background: '#14161a', borderColor: '#22242a', flexDirection: 'row' }}>
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
                  ${(item.price).toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 400 }}>x {item.quantity}</span>
                </p>
              </div>

              {/* Quantity selectors */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button onClick={() => onUpdateQty(item.id, -1)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f5f5f7', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>−</button>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.id, 1)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(197, 160, 89, 0.08)', border: '1px solid rgba(197, 160, 89, 0.25)', color: '#c5a059', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '24px', borderTop: '1px solid #22242a', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ color: '#8e8e93', fontSize: '0.85rem', fontWeight: 500 }}>SUBTOTAL</span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#c5a059' }}>${total.toLocaleString()}</span>
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
