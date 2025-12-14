#!/usr/bin/env node
/**
 * Delete and re-import purchases with correct BBUX amounts
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Historical purchases WITH correct BBUX amounts
const historicalPurchases = [
  {
    tx_hash: '0x59a1b7d66c8051bd0948c63a829c9c4371b81565b0bfac00e9a3cec6b6f7dca1',
    wallet_address: '0x1284541D5E8b3BbBfDc00B37E0E44b15d7eCE0da056907',
    eth_amount: '0.0005',
    bbux_amount: '435',  // 0.0005 ETH / 0.00000115 = 435 BBUX
    network: 8453,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    tx_hash: '0x5e273f63f22e5ede63668ec02408f422718b72c2a095c0b8629a99e0449283d8',
    wallet_address: '0x1284541D5E8b3BbBfDc00B37E0E44b15d7eCE0da056907',
    eth_amount: '0.0005',
    bbux_amount: '435',  // 0.0005 ETH / 0.00000115 = 435 BBUX
    network: 8453,
    created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

async function reimport() {
  try {
    console.log('🔄 Re-importing purchases with BBUX amounts...\n')
    
    // Delete all existing records
    console.log('Deleting existing records...')
    const { data: existing } = await supabase
      .from('presale_purchases')
      .select('id')
    
    if (existing && existing.length > 0) {
      const ids = existing.map(x => x.id)
      const { error: deleteError } = await supabase
        .from('presale_purchases')
        .delete()
        .in('id', ids)
      
      if (deleteError) {
        console.log(`⚠️  Delete warning: ${deleteError.message}`)
      } else {
        console.log(`✅ Deleted ${ids.length} old records`)
      }
    }
    
    // Re-insert with BBUX amounts
    console.log('\nInserting new records...')
    let totalBBUX = 0
    
    for (const purchase of historicalPurchases) {
      totalBBUX += parseInt(purchase.bbux_amount)
      
      const { data, error } = await supabase
        .from('presale_purchases')
        .insert(purchase)
        .select()
      
      if (error) {
        console.error(`❌ Failed to insert ${purchase.tx_hash.slice(0, 10)}...`)
        console.error(`   Error: ${error.message}`)
      } else {
        console.log(`✅ Inserted ${purchase.tx_hash.slice(0, 10)}...`)
        console.log(`   ETH: ${purchase.eth_amount}, BBUX: ${purchase.bbux_amount}`)
      }
    }
    
    console.log(`\n✅ Complete! Dashboard should show ${totalBBUX} total BBUX`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

reimport()
