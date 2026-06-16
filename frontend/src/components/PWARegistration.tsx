'use client'
import { useEffect } from 'react'

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker immediately
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA Service worker registered successfully:', reg.scope)
        })
        .catch((err) => {
          console.warn('PWA Service worker registration failed:', err)
        })
    }
  }, [])

  return null
}
