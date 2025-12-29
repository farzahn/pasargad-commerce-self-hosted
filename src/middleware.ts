import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Check if site-wide password protection is enabled
 */
const SITE_PASSWORD_ENABLED = !!process.env.SITE_PASSWORD

/**
 * Routes that should be accessible without site password
 */
const PUBLIC_ROUTES = ['/password', '/api/site-access']

/**
 * Routes that require authentication
 */
const PROTECTED_ROUTES = ['/account', '/checkout']

/**
 * Routes that require admin role
 */
const ADMIN_ROUTES = ['/admin']

/**
 * Auth routes (redirect away if already authenticated)
 * Note: Only Google OAuth is supported - no register or forgot-password pages
 */
const AUTH_ROUTES = ['/login']

/**
 * Build Content Security Policy header
 *
 * CSP helps prevent XSS attacks by controlling which resources can be loaded.
 */
function buildCspHeader(): string {
  const isDev = process.env.NODE_ENV === 'development'

  // Get PocketBase URL from environment (with fallback)
  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  const pbWsUrl = pbUrl.replace('http://', 'ws://').replace('https://', 'wss://')

  const cspDirectives = [
    // Default: only allow same-origin
    "default-src 'self'",

    // Scripts: self, inline (required for Next.js), and eval in dev mode
    `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}`,

    // Styles: self and inline (required for styled components and CSS-in-JS)
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Images: self, data URIs, blob, and PocketBase storage
    `img-src 'self' data: blob: ${pbUrl} https://*.pockethost.io`,

    // Fonts: self and Google Fonts
    "font-src 'self' https://fonts.gstatic.com",

    // Connect: API calls to PocketBase
    `connect-src 'self' ${pbUrl} https://*.pockethost.io ${pbWsUrl} wss://*.pockethost.io`,

    // Frames: none by default
    "frame-src 'self'",

    // Object/embed: none (security best practice)
    "object-src 'none'",

    // Base URI: self only
    "base-uri 'self'",

    // Form actions: self only
    "form-action 'self'",

    // Frame ancestors: none (prevents clickjacking, like X-Frame-Options)
    "frame-ancestors 'none'",

    // Upgrade insecure requests in production
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ]

  return cspDirectives.join('; ')
}

/**
 * Parse PocketBase auth cookie to check authentication status
 */
function getAuthFromCookie(request: NextRequest): { isValid: boolean; isAdmin: boolean } {
  const pbAuth = request.cookies.get('pb_auth')

  if (!pbAuth?.value) {
    return { isValid: false, isAdmin: false }
  }

  try {
    // PocketBase stores auth as JSON in the cookie
    const authData = JSON.parse(pbAuth.value)
    const isValid = !!authData.token

    // Check role or admin email
    const userRole = authData.model?.role || authData.record?.role
    const userEmail = authData.model?.email || authData.record?.email
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL

    const isAdmin = userRole === 'admin' || (!!adminEmail && userEmail === adminEmail)

    return { isValid, isAdmin }
  } catch {
    return { isValid: false, isAdmin: false }
  }
}

/**
 * Next.js Middleware for route protection
 *
 * This middleware provides:
 * 1. Site-wide password protection (when SITE_PASSWORD is set)
 * 2. Authentication protection for user routes
 * 3. Admin role protection for admin routes
 * 4. Security headers for all responses (including CSP)
 * 5. CORS protection for API routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if site password protection is enabled
  if (SITE_PASSWORD_ENABLED) {
    // Allow public routes without password
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route)
    )

    if (!isPublicRoute) {
      // Check for site-access cookie
      const siteAccess = request.cookies.get('site-access')

      if (siteAccess?.value !== 'granted') {
        // Redirect to password page
        const passwordUrl = new URL('/password', request.url)
        return NextResponse.redirect(passwordUrl)
      }
    }
  }

  // Get auth status from cookie
  const { isValid, isAdmin } = getAuthFromCookie(request)

  // Check if route is an auth route (login, register, etc.)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))
  if (isAuthRoute && isValid) {
    // Already authenticated, redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  if (isProtectedRoute && !isValid) {
    // Not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if route requires admin role
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  if (isAdminRoute) {
    if (!isValid) {
      // Not authenticated, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (!isAdmin) {
      // Authenticated but not admin, redirect to home with error
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
  }

  const response = NextResponse.next()

  // Add Content Security Policy header
  response.headers.set('Content-Security-Policy', buildCspHeader())

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // For API routes, add CORS protection
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Only allow same-origin requests for API routes
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    // In production, verify the origin matches our domain
    if (origin && host) {
      const originUrl = new URL(origin)
      // Allow localhost in development
      const isLocalhost =
        originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1'
      const isSameHost = originUrl.host === host

      if (!isLocalhost && !isSameHost) {
        return NextResponse.json(
          { error: 'CORS: Origin not allowed' },
          { status: 403 }
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
