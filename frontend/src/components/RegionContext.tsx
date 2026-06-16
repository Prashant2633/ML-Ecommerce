'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { REGIONS, DEFAULT_REGION, type Region } from '@/lib/regions.config'

interface RegionContextType {
  activeRegion: Region
  setRegion: (regionCode: string) => void
  formatPrice: (usdPrice: number, priceOverride?: number | null) => string
  formatDate: (date: Date | string) => string
  formatNumber: (num: number) => string
}

const RegionContext = createContext<RegionContextType | undefined>(undefined)

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function RegionProvider({
  children,
  initialRegionCode
}: {
  children: React.ReactNode
  initialRegionCode?: string
}) {
  const router = useRouter()
  
  // Find the initial region based on server-injected code
  const initialRegion = REGIONS.find(r => r.code === initialRegionCode) || DEFAULT_REGION
  const [activeRegion, setActiveRegionState] = useState<Region>(initialRegion)

  const setRegion = (regionCode: string) => {
    const found = REGIONS.find(r => r.code === regionCode)
    if (found) {
      setActiveRegionState(found)
      setCookie('nx_region', found.code)
      // Refresh the active route so that Server Components re-fetch data for the new region
      router.refresh()
    }
  }

  // FX rates cache (can be statically defined or fetched, but let's implement the conversion logic)
  // Base is USD (1.0). Exchange rates:
  // USD -> INR: 83.5
  // USD -> GBP: 0.79
  // USD -> AED: 3.67
  // USD -> EUR: 0.93
  const FX_RATES: Record<string, number> = {
    USD: 1.0,
    INR: 83.5,
    GBP: 0.79,
    AED: 3.67,
    EUR: 0.93
  }

  const formatPrice = (usdPrice: number, priceOverride?: number | null) => {
    let localPrice = usdPrice
    if (priceOverride !== undefined && priceOverride !== null) {
      localPrice = priceOverride
    } else {
      const rate = FX_RATES[activeRegion.currencyCode] || 1.0
      localPrice = usdPrice * rate
    }

    return new Intl.NumberFormat(activeRegion.locale, {
      style: 'currency',
      currency: activeRegion.currencyCode,
      minimumFractionDigits: activeRegion.currencyCode === 'INR' ? 0 : 2,
      maximumFractionDigits: 2
    }).format(localPrice)
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(activeRegion.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(activeRegion.locale).format(num)
  }

  return (
    <RegionContext.Provider value={{ activeRegion, setRegion, formatPrice, formatDate, formatNumber }}>
      {children}
    </RegionContext.Provider>
  )
}

export function useRegion() {
  const context = useContext(RegionContext)
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider')
  }
  return context
}
