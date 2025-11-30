import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase not configured, skipping tracking')
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 200 })
    }

    const body = await request.json()
    const { tx_hash, wallet_address, eth_amount, bbux_amount, network } = body

    if (!tx_hash || !wallet_address) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insert purchase record
    const { data, error } = await supabase
      .from('presale_purchases')
      .insert({
        tx_hash,
        wallet_address,
        eth_amount,
        bbux_amount,
        network,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('Purchase tracked:', tx_hash)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Track purchase error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
