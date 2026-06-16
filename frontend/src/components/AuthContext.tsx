'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface UserProfile {
  id: number
  email: string
  region_preference: string | null
  saved_addresses: any[]
  saved_payment_methods: any[]
  wishlist: number[]
  cart: any[]
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  register: (email: string, password: string) => Promise<UserProfile>
  logout: () => void
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'email'>>) => Promise<UserProfile>
  toggleWishlist: (productId: number) => Promise<void>
  syncCart: (cart: any[]) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage on mount
    const savedUser = localStorage.getItem('nx_user')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        // Optionally fetch latest from backend
        fetchLatestProfile(parsed.id)
      } catch (e) {
        localStorage.removeItem('nx_user')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchLatestProfile = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        localStorage.setItem('nx_user', JSON.stringify(data))
      }
    } catch (err) {
      console.error('Failed to fetch profile updates', err)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || 'Authentication failed')
    }

    let data = await res.json()

    // Merge guest cart with user cart
    const guestCartRaw = localStorage.getItem('nexcart_cart')
    let mergedCart = data.cart || []
    if (guestCartRaw) {
      try {
        const guestCart = JSON.parse(guestCartRaw)
        if (Array.isArray(guestCart) && guestCart.length > 0) {
          const cartMap = new Map<number, any>()
          mergedCart.forEach((item: any) => cartMap.set(item.id, item))
          guestCart.forEach((item: any) => {
            if (cartMap.has(item.id)) {
              const existing = cartMap.get(item.id)
              cartMap.set(item.id, { ...existing, quantity: existing.quantity + item.quantity })
            } else {
              cartMap.set(item.id, item)
            }
          })
          mergedCart = Array.from(cartMap.values())
          
          const updateRes = await fetch(`${API_URL}/api/users/${data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: mergedCart })
          })
          if (updateRes.ok) {
            data = await updateRes.json()
          }
        }
      } catch (e) {
        console.error('Failed to merge guest cart', e)
      }
      localStorage.removeItem('nexcart_cart')
    }

    setUser(data)
    localStorage.setItem('nx_user', JSON.stringify(data))
    return data
  }

  const register = async (email: string, password: string): Promise<UserProfile> => {
    const res = await fetch(`${API_URL}/api/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || 'Registration failed')
    }

    // Automatically log in after registration
    return login(email, password)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('nx_user')
  }

  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'email'>>): Promise<UserProfile> => {
    if (!user) throw new Error('Not authenticated')

    const res = await fetch(`${API_URL}/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || 'Failed to update profile')
    }

    const data = await res.json()
    setUser(data)
    localStorage.setItem('nx_user', JSON.stringify(data))
    return data
  }

  const toggleWishlist = async (productId: number) => {
    if (!user) return
    const isWishlisted = user.wishlist.includes(productId)
    const newWishlist = isWishlisted
      ? user.wishlist.filter(id => id !== productId)
      : [...user.wishlist, productId]
    await updateProfile({ wishlist: newWishlist })
  }

  const syncCart = async (cart: any[]) => {
    if (!user) return
    await updateProfile({ cart })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, toggleWishlist, syncCart }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
