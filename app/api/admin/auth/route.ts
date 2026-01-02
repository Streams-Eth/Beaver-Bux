import { NextResponse } from 'next/server'
import { ethers } from 'ethers'

// Accept admin login via signed message. The message must include a fresh timestamp to mitigate replay.
// Env: ADMIN_WALLETS comma-separated list of allowed addresses (checksum or lowercase)
// POST body: { address, signature, message }
// Message format (example): "BBUX Admin Login 1700000000000"

const MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes

function parseAllowedWallets(): string[] {
  return (process.env.ADMIN_WALLETS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export async function POST(req: Request) {
  try {
    const { address, signature, message } = await req.json()

    if (!address || !signature || !message) {
      return NextResponse.json({ ok: false, error: 'Missing address, signature, or message' }, { status: 400 })
    }

    const allowed = parseAllowedWallets()
    if (allowed.length === 0) {
      return NextResponse.json({ ok: false, error: 'Admin wallets not configured' }, { status: 500 })
    }

    // Expect message format: "BBUX Admin Login <timestamp>"
    const parts = String(message).trim().split(/\s+/)
    const tsStr = parts[parts.length - 1]
    const ts = Number(tsStr)
    if (!Number.isFinite(ts)) {
      return NextResponse.json({ ok: false, error: 'Invalid login message timestamp' }, { status: 400 })
    }

    const now = Date.now()
    if (Math.abs(now - ts) > MAX_AGE_MS) {
      return NextResponse.json({ ok: false, error: 'Login message expired' }, { status: 400 })
    }

    let recovered: string
    try {
      recovered = ethers.utils.verifyMessage(message, signature)
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: 'Signature verification failed' }, { status: 400 })
    }

    const recoveredLc = recovered.toLowerCase()
    if (!allowed.includes(recoveredLc) || recoveredLc !== String(address).toLowerCase()) {
      return NextResponse.json({ ok: false, error: 'Address not authorized' }, { status: 403 })
    }

    // Issue a short-lived, HttpOnly session cookie
    const res = NextResponse.json({ ok: true })
    const maxAgeSeconds = 60 * 30 // 30 minutes session
    const secure = process.env.NODE_ENV === 'production'
    res.cookies.set('bbux_admin_auth', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: maxAgeSeconds,
      path: '/',
    })
    res.cookies.set('bbux_admin_addr', recoveredLc, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: maxAgeSeconds,
      path: '/',
    })

    return res
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 500 })
  }
}
