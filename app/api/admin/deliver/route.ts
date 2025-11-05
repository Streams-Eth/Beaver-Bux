export const runtime = "nodejs"

import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ethers } from "ethers"

/**
 * Admin token delivery endpoint
 * POST body: { transaction_id: string, to: string }
 *
 * Requirements (env):
 * - ETHEREUM_RPC_URL (JSON-RPC URL)
 * - ADMIN_PRIVATE_KEY (private key of admin wallet holding tokens)
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (optional, recommended)
 *
 * Behavior:
 * - Looks up the payment by transaction_id in Supabase (if configured) or in data/payments.json
 * - Reads token amount (numeric) and converts to token units using token.decimals() if available
 * - Calls ERC20.transfer(to, amount) from admin wallet and waits for 1 confirmation
 * - Updates the payment record (delivered=true, delivery_tx_hash)
 */

const PRESALE_CONTRACT = "0xF479063E290E85e1470a11821128392F6063790B"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const txId = body?.transaction_id
    const to = body?.to

    if (!txId || !to) {
      return new Response(JSON.stringify({ ok: false, error: 'transaction_id and to are required' }), { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let payment: any = null

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase.from('payments').select('*').eq('transaction_id', txId).limit(1).maybeSingle()
      if (error) console.error('Supabase fetch error', error)
      payment = data
    }

    if (!payment) {
      // fallback to local file
      const fs = await import('fs/promises')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'data', 'payments.json')
      try {
        const raw = await fs.readFile(filePath, 'utf8')
        const arr = JSON.parse(raw)
        payment = arr.find((p: any) => p.transaction_id === txId)
      } catch (e) {
        console.error('Failed to read local payments.json', e)
      }
    }

    if (!payment) {
      return new Response(JSON.stringify({ ok: false, error: 'Payment not found' }), { status: 404 })
    }

    if (!payment.tokens) {
      return new Response(JSON.stringify({ ok: false, error: 'Payment record missing tokens field' }), { status: 400 })
    }

    const rpc = process.env.ETHEREUM_RPC_URL
    const pk = process.env.ADMIN_PRIVATE_KEY
    if (!rpc || !pk) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing ETHEREUM_RPC_URL or ADMIN_PRIVATE_KEY env vars' }), { status: 500 })
    }

    const provider = new ethers.providers.JsonRpcProvider(rpc)
    const wallet = new ethers.Wallet(pk, provider)

    // Determine token address: prefer explicit env TOKEN_ADDRESS, otherwise read from presale contract
    let tokenAddress: string | null = null
    const presaleAbi = ["function bbux() view returns (address)"]
    try {
      if (process.env.TOKEN_ADDRESS) {
        tokenAddress = process.env.TOKEN_ADDRESS
      } else {
        const presale = new ethers.Contract(PRESALE_CONTRACT, presaleAbi, provider)
        tokenAddress = await presale.bbux()
      }
    } catch (e) {
      console.warn('Failed to read token address from presale contract:', e)
      if (!process.env.TOKEN_ADDRESS) throw e
      tokenAddress = process.env.TOKEN_ADDRESS || null
    }

    if (!tokenAddress) {
      return new Response(JSON.stringify({ ok: false, error: 'Token address not available' }), { status: 500 })
    }

    // ERC20 minimal ABI
    const erc20 = new ethers.Contract(tokenAddress, [
      'function decimals() view returns (uint8)',
      'function transfer(address to, uint256 amount) returns (bool)'
    ], wallet)

    let decimals = 18
    try {
      decimals = await erc20.decimals()
    } catch (e) {
      console.warn('Failed to read token decimals, defaulting to 18', e)
      decimals = 18
    }

    // parse tokens into units using ethers.utils.parseUnits
    const tokensStr = String(payment.tokens)
    const amount = ethers.utils.parseUnits(tokensStr, decimals)

    // send transfer
    const tx = await erc20.transfer(to, amount)
    const receipt = await tx.wait(1)

    // update record (supabase or local file)
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase.from('payments').update({ delivered: true, delivery_tx_hash: tx.hash }).eq('transaction_id', txId)
    } else {
      const fs = await import('fs/promises')
      const path = await import('path')
      const filePath = path.join(process.cwd(), 'data', 'payments.json')
      const raw = await fs.readFile(filePath, 'utf8')
      const arr = JSON.parse(raw)
      const idx = arr.findIndex((p: any) => p.transaction_id === txId)
      if (idx !== -1) {
        arr[idx].delivered = true
        arr[idx].delivery_tx_hash = tx.hash
        await fs.writeFile(filePath, JSON.stringify(arr, null, 2), 'utf8')
      }
    }

    return new Response(JSON.stringify({ ok: true, txHash: tx.hash, receipt }), { status: 200 })
  } catch (err) {
    console.error('Deliver error', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 })
  }
}
