#!/usr/bin/env node
/**
 * Update historical purchases with calculated BBUX amounts (numeric)
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Price per token: 0.00000115 ETH per BBUX
const PRICE_PER_TOKEN = 0.00000115

async function updateBBUXAmounts() {
  try {
    console.log('📊 Calculating BBUX amounts for all purchases...')
    console.log(`   Price per token: ${PRICE_PER_TOKEN} ETH per BBUX\n`)
    
    // Update each transaction directly
    const updates = [
      {
        tx_hash: '0x59a1b7d66c8051bd0948c63a829c9c4371b81565b0bfac00e9a3cec6b6f7dca1',
        ethAmount: 0.0005,
      },
      {
        tx_hash: '0x5e273f63f22e5ede63668ec02408f422718b72c2a095c0b8629a99e0449283d8',
        ethAmount: 0.0005,
      }
    ]
    
    let totalBBUX = 0
    
    for (const update of updates) {
      const bbuxAmount = Math.round(update.ethAmount / PRICE_PER_TOKEN)
      totalBBUX += bbuxAmount
      
      console.log(`Updating ${update.tx_hash.slice(0, 10)}...`)
      console.log(`  ETH: ${update.ethAmount}, BBUX: ${bbuxAmount}`)
      
      const { error } = await supabase
        .from('presale_purchases')
        .update({ bbux_amount: bbuxAmount })
        .eq('tx_hash', update.tx_hash)
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`)
        console.error(`  Full error:`, error)
      } else {
        console.log(`  ✅ Updated`)
      }
    }
    
    console.log(`\n✅ Complete! Dashboard should show ${totalBBUX} total BBUX`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

updateBBUXAmounts().then(() => process.exit(0))
