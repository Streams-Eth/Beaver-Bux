export const runtime = "nodejs"

import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase.from('payments').select('*').order('received_at', { ascending: false }).limit(200)
      if (error) {
        console.error('Supabase fetch error', error)
        return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500 })
      }

      // Return payments; let client filter delivered status
      return new Response(JSON.stringify({ ok: true, payments: data }), { status: 200 })
    }

    // fallback: read local payments.json
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'data', 'payments.json')
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const arr = JSON.parse(raw)
      return new Response(JSON.stringify({ ok: true, payments: arr }), { status: 200 })
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: 'No payments found' }), { status: 404 })
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}
