import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { RegionProvider } from '@/components/RegionContext'
import { AuthProvider } from '@/components/AuthContext'
import PWARegistration from '@/components/PWARegistration'
import BottomTabBar from '@/components/BottomTabBar'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NexCart — AI-Powered Shopping',
  description: 'Personalized e-commerce platform powered by serverless content-based similarity and trending popularity recommendations.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NexCart',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const regionCode = headersList.get('x-nx-region') || 'US'

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <RegionProvider initialRegionCode={regionCode}>
          <AuthProvider>
            <PWARegistration />
            {children}
            <BottomTabBar />
          </AuthProvider>
        </RegionProvider>
      </body>
    </html>
  )
}
