'use client'
import { useState } from 'react'

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  emoji: string
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
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.2rem' }}>Your Cart
            <span style={{ marginLeft: 10, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              {cart.length} item{cart.length !== 1 ? 's' : ''}
            </span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
              <p>Your cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                {item.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button onClick={() => onUpdateQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>−</button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', cursor: 'pointer', fontWeight: 700 }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>${total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} className="btn-glow" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
