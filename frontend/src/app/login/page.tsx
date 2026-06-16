'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { user, login, register, loading } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push(redirect)
    }
  }, [user, loading, redirect, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.')
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isSignUp) {
        await register(email, password)
      } else {
        await login(email, password)
      }
      router.push(redirect)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #16181c 0%, #0b0c0e 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient gold glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(197, 160, 89, 0.04) 0%, transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Main Card */}
      <div style={{
        background: 'linear-gradient(135deg, #111215 0%, #16181c 100%)',
        border: '1px solid rgba(197, 160, 89, 0.15)',
        borderRadius: '24px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(197, 160, 89, 0.05)',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Top brand line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #c5a059, transparent)',
        }} />

        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #c5a059, #aa820a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              color: '#0b0c0e',
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(197,160,89,0.3)',
            }}>
              N
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f5f5f7' }}>
              NEX<span style={{ color: '#c5a059' }}>CART</span>
            </span>
          </Link>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#c5a059', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            {isSignUp ? 'Create Your Account' : 'Nexus Portal Sign In'}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#8e8e93', margin: 0 }}>
            {isSignUp ? 'Join the next generation of curated luxury commerce.' : 'Enter your credentials to access your telemetry and orders.'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#ef4444',
            fontSize: '0.78rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#8e8e93',
              marginBottom: '8px',
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px 12px 40px',
                  color: '#f5f5f7',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(197, 160, 89, 0.4)'
                  e.target.style.background = 'rgba(197, 160, 89, 0.01)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.target.style.background = 'rgba(255,255,255,0.02)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#8e8e93',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>🔑</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px 12px 40px',
                  color: '#f5f5f7',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(197, 160, 89, 0.4)'
                  e.target.style.background = 'rgba(197, 160, 89, 0.01)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.target.style.background = 'rgba(255,255,255,0.02)'
                }}
              />
            </div>
          </div>

          {isSignUp && (
            <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <label style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#8e8e93',
                marginBottom: '8px',
              }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>🛡️</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required={isSignUp}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 16px 12px 40px',
                    color: '#f5f5f7',
                    fontSize: '0.85rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(197, 160, 89, 0.4)'
                    e.target.style.background = 'rgba(197, 160, 89, 0.01)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.target.style.background = 'rgba(255,255,255,0.02)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'linear-gradient(135deg, #c5a059, #aa820a)',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#0b0c0e',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '10px',
              boxShadow: '0 8px 24px rgba(197, 160, 89, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => {
              if (!isSubmitting) {
                e.currentTarget.style.opacity = '0.9'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(197, 160, 89, 0.3)'
              }
            }}
            onMouseLeave={e => {
              if (!isSubmitting) {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(197, 160, 89, 0.2)'
              }
            }}
          >
            {isSubmitting ? 'Verifying...' : isSignUp ? 'Create Account' : 'Authenticate'}
          </button>
        </form>

        {/* Toggle Form type */}
        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          fontSize: '0.8rem',
          color: '#8e8e93',
        }}>
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => { setIsSignUp(false); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#c5a059', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => { setIsSignUp(true); setErrorMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#c5a059', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                Sign Up
              </button>
            </span>
          )}
        </div>

        {/* Developer Override helper */}
        <div style={{
          marginTop: '20px',
          background: 'rgba(197, 160, 89, 0.03)',
          border: '1px solid rgba(197, 160, 89, 0.1)',
          borderRadius: '12px',
          padding: '12px',
          fontSize: '0.7rem',
          color: '#8e8e93',
          textAlign: 'left',
          lineHeight: '1.4',
        }}>
          <strong style={{ color: '#c5a059', display: 'block', marginBottom: '4px' }}>💡 Dev sandbox accounts:</strong>
          • Email: <code style={{ color: '#f5f5f7' }}>alice@nexcart.io</code> (pwd: <code style={{ color: '#f5f5f7' }}>pw_alice</code>)<br />
          • Email: <code style={{ color: '#f5f5f7' }}>bob@nexcart.io</code> (pwd: <code style={{ color: '#f5f5f7' }}>pw_bob</code>)
        </div>
      </div>
    </div>
  )
}
