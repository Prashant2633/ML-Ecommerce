'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Compass, Heart, ShoppingBag, User } from 'lucide-react'

export default function BottomTabBar() {
  const router = useRouter()
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Read cart count initially
    const syncCart = () => {
      const saved = localStorage.getItem('nexcart_cart')
      if (saved) {
        try {
          const cart = JSON.parse(saved)
          const total = cart.reduce((sum: number, item: any) => sum + item.quantity, 0)
          setCartCount(total)
        } catch {}
      } else {
        setCartCount(0)
      }
    }

    syncCart()
    // Listen for storage changes (handles multi-tab sync)
    window.addEventListener('storage', syncCart)
    // Custom cart-update event for same-window updates
    window.addEventListener('cart-updated', syncCart)

    // Set interval to sync as a backup
    const interval = setInterval(syncCart, 1000)

    return () => {
      window.removeEventListener('storage', syncCart)
      window.removeEventListener('cart-updated', syncCart)
      clearInterval(interval)
    }
  }, [])

  const handleNav = (target: string) => {
    if (target === 'cart') {
      window.dispatchEvent(new CustomEvent('open-cart'))
    } else if (target === 'account') {
      window.dispatchEvent(new CustomEvent('open-account'))
    } else if (target === 'shop') {
      if (pathname === '/') {
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
      } else {
        router.push('/?scroll=catalog')
      }
    } else if (target === 'wishlist') {
      // Directs to profile account tab for wishlist (handled in Navbar)
      window.dispatchEvent(new CustomEvent('open-account', { detail: { tab: 'telemetry' } }))
    } else {
      router.push('/')
    }
  }

  return (
    <div className="mobile-bottom-tabs" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      background: 'rgba(11, 12, 14, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      zIndex: 99,
      display: 'none', // styled via media query in globals.css
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Home */}
      <button onClick={() => handleNav('home')} style={{
        background: 'none', border: 'none', color: pathname === '/' ? '#c5a059' : '#8e8e93',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
        fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit', width: 60, height: 44, justifyContent: 'center'
      }}>
        <Home size={18} />
        <span>Home</span>
      </button>

      {/* Shop */}
      <button onClick={() => handleNav('shop')} style={{
        background: 'none', border: 'none', color: '#8e8e93',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
        fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit', width: 60, height: 44, justifyContent: 'center'
      }}>
        <Compass size={18} />
        <span>Shop</span>
      </button>

      {/* Wishlist */}
      <button onClick={() => handleNav('wishlist')} style={{
        background: 'none', border: 'none', color: '#8e8e93',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
        fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit', width: 60, height: 44, justifyContent: 'center'
      }}>
        <Heart size={18} />
        <span>Wishlist</span>
      </button>

      {/* Cart */}
      <button onClick={() => handleNav('cart')} style={{
        background: 'none', border: 'none', color: '#8e8e93',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
        fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit', width: 60, height: 44, justifyContent: 'center',
        position: 'relative'
      }}>
        <ShoppingBag size={18} />
        <span>Cart</span>
        {cartCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 12,
            background: 'linear-gradient(135deg, #c5a059, #aa820a)',
            borderRadius: '50%',
            width: 14,
            height: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.55rem',
            fontWeight: 800,
            color: '#0b0c0e',
            boxShadow: '0 0 6px rgba(197, 160, 89, 0.4)'
          }}>
            {cartCount}
          </span>
        )}
      </button>

      {/* Account */}
      <button onClick={() => handleNav('account')} style={{
        background: 'none', border: 'none', color: '#8e8e93',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
        fontSize: '0.62rem', fontWeight: 600, fontFamily: 'inherit', width: 60, height: 44, justifyContent: 'center'
      }}>
        <User size={18} />
        <span>Account</span>
      </button>
    </div>
  )
}
