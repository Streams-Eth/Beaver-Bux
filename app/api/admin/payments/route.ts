export const runtime = "nodejs"

import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      // Try the primary payments table first (PayPal flow)
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(200)

      if (!error) {
        return new Response(JSON.stringify({ ok: true, payments: data }), { status: 200 })
      }

      const errMsg = String(error?.message || error)
      console.warn('Supabase payments table unavailable, attempting presale_purchases fallback:', errMsg)

      // Fallback to presale_purchases (on-chain tracked purchases) so the admin UI still shows data
      const { data: purchases, error: fallbackError } = await supabase
        .from('presale_purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (fallbackError) {
        console.error('Supabase fallback fetch error', fallbackError)
        return new Response(JSON.stringify({ ok: false, error: errMsg, fallbackError: String(fallbackError?.message || fallbackError) }), { status: 200 })
      }

      const mapped = (purchases || []).map((p: any) => ({
        transaction_id: p.tx_hash,
        buyer_name: p.wallet_address,
        buyer_email: undefined,
        tokens: p.bbux_amount ? Number(p.bbux_amount) : undefined,
        gross_cad: undefined,
        paypal_fee_cad: undefined,
        net_cad: undefined,
        delivered: false,
        delivery_tx_hash: undefined,
      }))

      return new Response(JSON.stringify({ ok: true, payments: mapped, note: 'Using presale_purchases fallback' }), { status: 200 })
    }

    // fallback: read local payments.json
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'payments.json')
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      let arr = JSON.parse(raw)
      if (!Array.isArray(arr)) arr = []
      return new Response(JSON.stringify({ ok: true, payments: arr }), { status: 200 })
    } catch (e) {
      // If file missing or invalid, return an empty payments array instead of 404
      return new Response(JSON.stringify({ ok: true, payments: [] }), { status: 200 })
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}
