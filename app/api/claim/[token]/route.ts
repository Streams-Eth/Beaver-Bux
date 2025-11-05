export const runtime = "nodejs"

import { createClient } from "@supabase/supabase-js"
import { ethers } from "ethers"

export async function GET(req: Request, { params }: any) {
  try {
    const token = params.token
    if (!token) return new Response(JSON.stringify({ ok: false, error: 'Missing token' }), { status: 400 })

    // try supabase first
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data } = await supabase.from('payments').select('*').eq('claim_token', token).limit(1).maybeSingle()
      if (data) return new Response(JSON.stringify({ ok: true, payment: data }), { status: 200 })
    }

    // fallback to local file
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'payments.json')
    const raw = await fs.readFile(filePath, 'utf8')
    const arr = JSON.parse(raw)
    const payment = arr.find((p: any) => p.claim_token === token)
    if (!payment) return new Response(JSON.stringify({ ok: false, error: 'Token not found' }), { status: 404 })
    return new Response(JSON.stringify({ ok: true, payment }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}

export async function POST(req: Request, { params }: any) {
  try {
    const token = params.token
    const body = await req.json()
    const wallet = body?.wallet
    if (!token || !wallet) return new Response(JSON.stringify({ ok: false, error: 'Missing token or wallet' }), { status: 400 })

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let payment: any = null

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase.from('payments').select('*').eq('claim_token', token).limit(1).maybeSingle()
      if (error) console.error('Supabase fetch error', error)
      payment = data
    }

    if (!payment) {
      const fs = await import('fs/promises')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'data', 'payments.json')
      const raw = await fs.readFile(filePath, 'utf8')
      const arr = JSON.parse(raw)
      payment = arr.find((p: any) => p.claim_token === token)
      if (!payment) return new Response(JSON.stringify({ ok: false, error: 'Token not found' }), { status: 404 })

      // update local file: set claimed wallet
      const idx = arr.findIndex((p: any) => p.claim_token === token)
      arr[idx].claimed = true
      arr[idx].claimed_wallet = wallet
      await fs.writeFile(filePath, JSON.stringify(arr, null, 2), 'utf8')
    } else {
      // update supabase row
      const supabase = createClient(supabaseUrl!, supabaseKey!)
      await supabase.from('payments').update({ claimed: true, claimed_wallet: wallet }).eq('claim_token', token)
    }

    // Try to auto-deliver if admin env present: call internal deliver logic
    const canDeliver = Boolean(process.env.ETHEREUM_RPC_URL && process.env.ADMIN_PRIVATE_KEY)
    let deliverResult: any = null
    if (canDeliver && payment && payment.transaction_id) {
      // call internal deliver endpoint
      try {
        const base = process.env.APP_ORIGIN || ''
        const url = base ? `${base}/api/admin/deliver` : `/api/admin/deliver`
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id: payment.transaction_id, to: wallet }),
        })
        deliverResult = await resp.json()
      } catch (e) {
        console.error('Auto-deliver failed', e)
      }
    }

    return new Response(JSON.stringify({ ok: true, deliverAttempted: !!deliverResult, deliverResult }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}
