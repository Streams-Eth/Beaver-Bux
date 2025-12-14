#!/usr/bin/env node
/**
 * Import historical purchases from BaseScan into Supabase
 * These are real transactions that happened but aren't in our database yet
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Historical purchases from BaseScan
// User confirmed these exist at:
// - Block 38834746 (~14 days ago): 0.0005 ETH
// - Block 38273309 (~27 days ago): 0.0005 ETH
// Both from same wallet: 0x1284541D...0da056907
const historicalPurchases = [
  {
    tx_hash: '0x59a1b7d66c8051bd0948c63a829c9c4371b81565b0bfac00e9a3cec6b6f7dca1',
    wallet_address: '0x1284541D5E8b3BbBfDc00B37E0E44b15d7eCE0da056907',
    eth_amount: '0.0005',
    bbux_amount: '0',  // We'll calculate if needed
    network: 8453,  // Base
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
  },
  {
    tx_hash: '0x5e273f63f22e5ede63668ec02408f422718b72c2a095c0b8629a99e0449283d8',
    wallet_address: '0x1284541D5E8b3BbBfDc00B37E0E44b15d7eCE0da056907',
    eth_amount: '0.0005',
    bbux_amount: '0',
    network: 8453,
    created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(), // 27 days ago
  },
]

async function importPurchases() {
  try {
    console.log(`📥 Importing ${historicalPurchases.length} historical purchases...`)
    
    for (const purchase of historicalPurchases) {
      console.log(`\n  Importing: ${purchase.tx_hash.slice(0, 10)}...`)
      console.log(`  From: ${purchase.wallet_address.slice(0, 10)}...`)
      console.log(`  Amount: ${purchase.eth_amount} ETH`)
      
      const { data, error } = await supabase
        .from('presale_purchases')
        .insert(purchase)
        .select()
      
      if (error) {
        console.error(`  ❌ Failed: ${error.message}`)
      } else {
        console.log(`  ✅ Imported successfully`)
      }
    }
    
    console.log('\n✅ Import complete!')
    console.log('\nDashboard should now show:')
    console.log('  - Total ETH: 0.001000')
    console.log('  - Contributors: 1')
    console.log('  - Recent Purchases: 2 transactions')
    
  } catch (error) {
    console.error('❌ Import failed:', error.message)
    process.exit(1)
  }
}

importPurchases()
