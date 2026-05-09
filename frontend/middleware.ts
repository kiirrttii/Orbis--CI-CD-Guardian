import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const allCookies = request.cookies.getAll()
  
  // LOGGING - helpful for debugging cookie sync issues
  console.log('[Middleware] Path:', pathname)
  console.log('[Middleware] Cookies Seen:', allCookies.map(c => c.name).join(', '))
  
  const token = request.cookies.get('access_token')?.value
  const hasToken = !!token
  console.log('[Middleware] access_token found:', hasToken)

  const isPublicRoute = pathname === '/login' || pathname === '/signup'
  
  // If user is on a public route but has a token, send them to /how-it-works
  if (isPublicRoute && hasToken) {
    console.log('[Middleware] Authenticated user on public route, redirecting to /how-it-works')
    return NextResponse.redirect(new URL('/how-it-works', request.url))
  }

  // If user is on a protected route but has NO token, send them to /login
  if (!isPublicRoute && !hasToken) {
    console.log('[Middleware] Anonymous user on protected route, redirecting to /login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, etc. (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
