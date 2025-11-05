export const runtime = "nodejs"

import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const txId = body?.transaction_id
    const minutes = body?.minutes || 60

    if (!txId) return new Response(JSON.stringify({ ok: false, error: 'transaction_id required' }), { status: 400 })

    const token = randomUUID()
    const expires = new Date(Date.now() + minutes * 60 * 1000).toISOString()

    // update local payments.json if present
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'payments.json')
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const arr = JSON.parse(raw)
      const idx = arr.findIndex((p: any) => p.transaction_id === txId)
      if (idx !== -1) {
        arr[idx].claim_token = token
        arr[idx].claim_expires = expires
        await fs.writeFile(filePath, JSON.stringify(arr, null, 2), 'utf8')
      }
    } catch (e) {
      // ignore file errors
    }

    // return the claim URL
    const origin = process.env.APP_ORIGIN || ''
    const url = origin ? `${origin}/claim/${token}` : `/claim/${token}`

    return new Response(JSON.stringify({ ok: true, token, url, expires }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}
