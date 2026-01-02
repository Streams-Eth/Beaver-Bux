import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  const opts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  }
  res.cookies.set('bbux_admin_auth', '', opts)
  res.cookies.set('bbux_admin_addr', '', opts)
  return res
}
