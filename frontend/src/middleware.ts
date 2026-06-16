import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = new URL(request.nextUrl)
  
  // 1. Dev query override: ?region=XX
  let regionCode = url.searchParams.get('region')
  
  // 2. Cookie check
  if (!regionCode) {
    regionCode = request.cookies.get('nx_region')?.value || null
  }
  
  // 3. Vercel geolocation header check
  if (!regionCode) {
    regionCode = request.headers.get('x-vercel-ip-country') || null
  }
  
  // 4. Accept-Language header fallback
  if (!regionCode) {
    const acceptLanguage = request.headers.get('accept-language') || ''
    if (acceptLanguage.includes('en-IN') || acceptLanguage.includes('hi')) {
      regionCode = 'IN'
    } else if (acceptLanguage.includes('en-GB')) {
      regionCode = 'GB'
    } else if (acceptLanguage.includes('ae') || acceptLanguage.includes('ar')) {
      regionCode = 'AE'
    } else if (acceptLanguage.includes('de')) {
      regionCode = 'DE'
    }
  }

  // Validate or fallback to default
  const validCodes = ['US', 'IN', 'GB', 'AE', 'DE']
  if (!regionCode || !validCodes.includes(regionCode.toUpperCase())) {
    regionCode = 'US'
  }

  regionCode = regionCode.toUpperCase()

  // Clone headers to inject the resolved region
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nx-region', regionCode)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  
  // Sync cookie
  const currentCookie = request.cookies.get('nx_region')?.value
  if (currentCookie !== regionCode) {
    response.cookies.set('nx_region', regionCode, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: [
    // Apply middleware to all client page routes, exclude public assets, api and next internals
    '/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json|sw.js).*)',
  ],
}
