'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { REGIONS, type Region } from '@/lib/regions.config'
import { PRODUCTS, type Product } from '@/lib/products'

export default function RegionPreviewPage() {
  const [selectedProductId, setSelectedProductId] = useState<number>(10) // default to AeroPhone 15 Pro which has price overrides

  const product = PRODUCTS.find(p => p.id === selectedProductId) || PRODUCTS[0]

  // FX rates cache for preview (matches RegionContext)
  const FX_RATES: Record<string, number> = {
    USD: 1.0,
    INR: 83.5,
    GBP: 0.79,
    AED: 3.67,
    EUR: 0.93
  }

  const getPrice = (region: Region, usdPrice: number, override?: number | null) => {
    let localPrice = usdPrice
    if (override !== undefined && override !== null) {
      localPrice = override
    } else {
      const rate = FX_RATES[region.currencyCode] || 1.0
      localPrice = usdPrice * rate
    }

    return new Intl.NumberFormat(region.locale, {
      style: 'currency',
      currency: region.currencyCode,
      minimumFractionDigits: region.currencyCode === 'INR' ? 0 : 2,
      maximumFractionDigits: 2
    }).format(localPrice)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0c0e', color: '#f5f5f7', padding: '40px 24px', fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
          <div>
            <Link href="/" style={{ color: '#c5a059', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, display: 'inline-block', marginBottom: 8 }}>
              ← Back to NexCart Home
            </Link>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Multi-Region QA Preview
            </h1>
            <p style={{ color: '#8e8e93', fontSize: '0.9rem', marginTop: 6, margin: 0 }}>
              Verify product catalog price conversions, tax settings, shipping zones, and availability limits across all supported regions.
            </p>
          </div>
          <div>
            <select 
              value={selectedProductId}
              onChange={e => setSelectedProductId(Number(e.target.value))}
              style={{
                background: '#16181c',
                color: '#f5f5f7',
                border: '1px solid rgba(197, 160, 89, 0.3)',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              {PRODUCTS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Demo Product Showcase */}
        <div style={{ display: 'flex', gap: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 24, alignItems: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', background: '#16181c', flexShrink: 0 }}>
            <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#c5a059', letterSpacing: '0.05em' }}>
              {product.category}
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 8px 0' }}>{product.title}</h2>
            <p style={{ color: '#8e8e93', fontSize: '0.85rem', margin: 0, maxWidth: 800, lineHeight: 1.5 }}>{product.description}</p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
          {REGIONS.map(region => {
            const avail = product.availability?.[region.code] || { available: true, stock: 10, priceOverride: null, shippingDays: 3 }
            const finalPrice = getPrice(region, product.price, avail.priceOverride)
            const taxEst = (product.price * region.taxRate)
            const formattedTax = getPrice(region, taxEst, avail.priceOverride ? (avail.priceOverride * region.taxRate) : null)

            return (
              <div 
                key={region.code}
                style={{
                  background: 'linear-gradient(135deg, #111215 0%, #16181c 100%)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 12 }}>
                  <span style={{ fontSize: '1.5rem' }}>{region.flagEmoji}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{region.displayName}</h3>
                    <span style={{ fontSize: '0.72rem', color: '#8e8e93', fontWeight: 600 }}>{region.code} ({region.currencyCode})</span>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {!avail.available ? (
                    <span style={{ background: 'rgba(ef,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(ef,68,68,0.2)', borderRadius: 100, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      🚫 Unavailable
                    </span>
                  ) : avail.stock === 0 ? (
                    <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      ⚠️ Out of Stock
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 100, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      ✓ Available
                    </span>
                  )}
                  <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 100, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600, color: '#8e8e93' }}>
                    System: {region.measurementSystem}
                  </span>
                </div>

                {/* Price Display */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#8e8e93', display: 'block', marginBottom: 2 }}>LOCALIZED PRICE</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: avail.available ? '#c5a059' : '#8e8e93', textDecoration: avail.available ? 'none' : 'line-through' }}>
                    {finalPrice}
                  </span>
                  {avail.priceOverride && (
                    <span style={{ display: 'block', fontSize: '0.68rem', color: '#4ade80', fontWeight: 600, marginTop: 2 }}>
                      ✦ Local Override Applied
                    </span>
                  )}
                </div>

                {/* Tax Estimate */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#8e8e93', display: 'block', marginBottom: 2 }}>{region.taxLabel} ESTIMATE ({region.taxRate * 100}%)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formattedTax}</span>
                </div>

                {/* Shipping info */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 12 }}>
                  <span style={{ fontSize: '0.72rem', color: '#8e8e93', display: 'block', marginBottom: 6 }}>SHIPPING ZONES</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {region.shippingZones.map(opt => (
                      <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span style={{ color: '#f5f5f7' }}>{opt.name}</span>
                        <span style={{ fontWeight: 600, color: '#c5a059' }}>
                          {opt.cost === 0 ? 'Free' : `${region.currencySymbol}${opt.cost}`} ({opt.deliveryDays}d)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Options */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 12 }}>
                  <span style={{ fontSize: '0.72rem', color: '#8e8e93', display: 'block', marginBottom: 6 }}>SUPPORTED PAYMENTS</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {region.paymentMethods.map(m => (
                      <span key={m} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', textTransform: 'uppercase', color: '#f5f5f7' }}>
                        {m}
                      </span>
                    ))}
                    {region.codAvailable && (
                      <span style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 6, padding: '3px 8px', fontSize: '0.68rem', textTransform: 'uppercase', color: '#4ade80', fontWeight: 700 }}>
                        COD Ok
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
