import { NextResponse, type NextRequest } from 'next/server'

const REALM = 'BeaverBux Admin'

function isProtectedPath(pathname: string) {
  // Allow auth/logout endpoints to bypass protection so login/logout can function
  if (pathname.startsWith('/api/admin/auth') || pathname.startsWith('/api/admin/logout')) return false
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin')
}

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}"`,
    },
  })
}

function getAllowedWallets() {
  return (process.env.ADMIN_WALLETS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  // Wallet-based admin session (set via /api/admin/auth)
  const allowedWallets = getAllowedWallets()
  const cookieAuth = request.cookies.get('bbux_admin_auth')?.value
  const cookieAddr = request.cookies.get('bbux_admin_addr')?.value?.toLowerCase()
  if (cookieAuth === '1' && cookieAddr && allowedWallets.includes(cookieAddr)) {
    return NextResponse.next()
  }

  const adminUser = process.env.ADMIN_BASIC_USER
  const adminPass = process.env.ADMIN_BASIC_PASS

  // If neither wallet auth nor basic auth is configured, respond as unauthorized (instead of 500)
  if ((!adminUser || !adminPass) && allowedWallets.length === 0) {
    return unauthorized()
  }

  // Basic auth fallback (optional)
  if (adminUser && adminPass) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.toLowerCase().startsWith('basic ')) {
      return unauthorized()
    }

    const base64Credentials = authHeader.split(' ')[1]
    try {
      const decoded = atob(base64Credentials || '')
      const [user, pass] = decoded.split(':')
      if (user === adminUser && pass === adminPass) {
        return NextResponse.next()
      }
    } catch (error) {
      return unauthorized()
    }
  }

  // If we reach here, wallet cookie not valid and basic auth failed/missing
  return unauthorized()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin', '/api/admin/:path*'],
}
