import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { totalPurchases: 0, totalETH: '0', totalBBUX: '0', error: 'Supabase not configured' },
        { status: 200 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Query all presale purchases
    const { data: purchases, error } = await supabase
      .from('presale_purchases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json(
        { totalPurchases: 0, totalETH: '0', totalBBUX: '0', error: error.message },
        { status: 200 }
      )
    }

    // Calculate totals
    const totalPurchases = purchases?.length || 0
    const totalETH = purchases?.reduce((sum, p) => sum + parseFloat(p.eth_amount || '0'), 0) || 0
    const totalBBUX = purchases?.reduce((sum, p) => sum + parseFloat(p.bbux_amount || '0'), 0) || 0
    
    // Debug logging
    console.log('[Stats API] Purchases:', purchases)
    console.log('[Stats API] BBUX values:', purchases?.map(p => ({ tx: p.tx_hash?.slice(0, 10), bbux: p.bbux_amount, parsed: parseFloat(p.bbux_amount || '0') })))
    console.log('[Stats API] Total BBUX calculated:', totalBBUX)
    
    // Count unique contributors (distinct wallet addresses)
    const uniqueContributors = new Set(purchases?.map(p => p.wallet_address?.toLowerCase()) || []).size

    return NextResponse.json({
      totalPurchases,
      totalETH: totalETH.toFixed(6),
      totalBBUX: totalBBUX.toFixed(2),
      uniqueContributors,
      recentPurchases: purchases?.slice(0, 10) || [],
    })
  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { totalPurchases: 0, totalETH: '0', totalBBUX: '0', error: error.message },
      { status: 200 }
    )
  }
}
