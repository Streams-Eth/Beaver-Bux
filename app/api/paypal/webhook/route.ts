export const runtime = "nodejs"

import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * PayPal webhook receiver (Next.js route)
 *
 * Expected environment variables:
 * - PAYPAL_CLIENT_ID
 * - PAYPAL_CLIENT_SECRET
 * - PAYPAL_WEBHOOK_ID (the ID PayPal shows for the webhook configured in the dashboard)
 * - PAYPAL_MODE = "live" or "sandbox" (defaults to sandbox)
 *
 * This route verifies the PayPal webhook signature using the PayPal API and
 * persists payment events into `data/payments.json` as an array.
 */

export async function POST(req: Request) {
  try {
    const mode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox"
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const webhookId = process.env.PAYPAL_WEBHOOK_ID

    if (!clientId || !clientSecret || !webhookId) {
      return new Response(JSON.stringify({ ok: false, error: "Missing PayPal env vars (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_WEBHOOK_ID)" }), { status: 500 })
    }

    const rawBody = await req.text()
    const headers = req.headers

    const auth_algo = headers.get("paypal-auth-algo") || ""
    const cert_url = headers.get("paypal-cert-url") || ""
    const transmission_id = headers.get("paypal-transmission-id") || ""
    const transmission_sig = headers.get("paypal-transmission-sig") || ""
    const transmission_time = headers.get("paypal-transmission-time") || ""

    const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

    // Get an access token
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token
    if (!accessToken) throw new Error("Unable to obtain PayPal access token: " + JSON.stringify(tokenJson))

    // Prepare verification payload
    const verifyBody = {
      auth_algo,
      cert_url,
      transmission_id,
      transmission_sig,
      transmission_time,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }

    const verifyRes = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(verifyBody),
    })

    const verifyJson = await verifyRes.json()

    if (verifyJson.verification_status !== "SUCCESS") {
      return new Response(JSON.stringify({ ok: false, verification: verifyJson }), { status: 400 })
    }

    // Process event and persist to data/payments.json when relevant
    const event = verifyBody.webhook_event
    const eventType: string = event.event_type

    // Build a lightweight record we can store
    const record: any = {
      source: "paypal",
      event_type: eventType,
      received_at: new Date().toISOString(),
      saved: false,
      raw_event: event,
    }

    // Attempt to extract human-friendly fields when a payment/capture occurs
    try {
      const resource = event.resource || {}

      // Common places for amounts + descriptions vary between event types
      let gross: string | number | null = null
      let currency: string | null = null
      let description: string | null = null
      let txId: string | null = null

      if (resource.amount) {
        gross = resource.amount.value
        currency = resource.amount.currency_code
      }

      // Look for captures inside purchase_units (order flows)
      if (!gross && resource.purchase_units && Array.isArray(resource.purchase_units)) {
        const pu = resource.purchase_units[0]
        description = pu?.description || pu?.reference_id || description
        // Attempt to extract buyer wallet if provided in custom_id in format: <referenceId>|<wallet>
        try {
          const custom = pu?.custom_id || pu?.invoice_id || null
          if (custom && typeof custom === 'string' && custom.includes('|')) {
            const parts = custom.split('|')
            record.claim_reference = parts[0]
            // simple validation of wallet
            const possible = parts[1]
            if (/^0x[a-fA-F0-9]{40}$/.test(possible)) {
              record.buyer_wallet = possible
            }
          } else if (custom) {
            record.claim_reference = String(custom)
          }
        } catch (e) {
          // ignore
        }
        if (pu?.payments?.captures && Array.isArray(pu.payments.captures) && pu.payments.captures[0]) {
          const c = pu.payments.captures[0]
          gross = c.amount?.value || gross
          currency = c.amount?.currency_code || currency
          txId = c.id || txId
        }
      }

      // Fallbacks
      description = description || (resource.purchase_units && resource.purchase_units[0] && resource.purchase_units[0].description) || event.summary || null
      txId = txId || resource.id || event.id || null

      // Parse token count from description if present (e.g. "1,904.762 BBUX Tokens")
      let tokens: number | null = null
      if (description) {
        const m = description.match(/([\d,]+(?:\.\d+)?)\s*BBUX/i)
        if (m) tokens = parseFloat(m[1].replace(/,/g, ""))
      }

  record.transaction_id = txId
  record.gross = gross !== null ? parseFloat(String(gross)) : null
  record.currency = currency
  record.description = description
  record.tokens = tokens
    } catch (e) {
      // Non-fatal; we'll still store the raw event
    }

    // Persist to Supabase if configured, otherwise fall back to file write
    try {
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      let saved = false

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)

        const upsertPayload: any = {
          transaction_id: record.transaction_id || null,
          source: record.source || 'paypal',
          event_type: record.event_type || null,
          received_at: record.received_at || new Date().toISOString(),
          gross_cad: record.gross || null,
          currency: record.currency || null,
          description: record.description || null,
          tokens: record.tokens || null,
          buyer_wallet: record.buyer_wallet || null,
          claim_reference: record.claim_reference || null,
          raw_event: record.raw_event || null,
        }

        const { error } = await supabase.from('payments').upsert(upsertPayload, { onConflict: 'transaction_id' })
        if (error) {
          console.error('Supabase upsert error:', error)
        } else {
          saved = true
          record.saved = true
        }
      }

      if (!saved) {
        // fallback to local file persistence
        const fs = await import("fs/promises")
        const path = await import("path")
        const filePath = path.join(process.cwd(), "data", "payments.json")

        let arr: any[] = []
        try {
          const existing = await fs.readFile(filePath, "utf8")
          arr = JSON.parse(existing)
          if (!Array.isArray(arr)) arr = []
        } catch (e) {
          arr = []
        }

        arr.push(record)
        await fs.writeFile(filePath, JSON.stringify(arr, null, 2), "utf8")
        record.saved = true
      }

      // If buyer_wallet is present and server has admin delivery keys, attempt auto-delivery
      try {
        if (record.buyer_wallet && record.transaction_id && process.env.ETHEREUM_RPC_URL && process.env.ADMIN_PRIVATE_KEY) {
          const base = process.env.APP_ORIGIN || ''
          const url = base ? `${base}/api/admin/deliver` : `/api/admin/deliver`
          // call internal deliver endpoint
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_id: record.transaction_id, to: record.buyer_wallet }),
          })
          const jr = await resp.json().catch(() => null)
          console.log('Auto-deliver result', jr)
        }
      } catch (e) {
        console.error('Auto-deliver failed', e)
      }

      return new Response(JSON.stringify({ ok: true, verification: verifyJson, saved: record.saved }), { status: 200 })
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
    }
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}
