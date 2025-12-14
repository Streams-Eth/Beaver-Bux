#!/usr/bin/env node
/**
 * Update historical purchases with calculated BBUX amounts
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
    console.log(`   Price per token: ${PRICE_PER_TOKEN} ETH per BBUX`)
    
    // Get all purchases
    const { data: purchases, error: fetchError } = await supabase
      .from('presale_purchases')
      .select('*')
    
    if (fetchError) {
      console.error('❌ Failed to fetch purchases:', fetchError.message)
      process.exit(1)
    }
    
    if (!purchases || purchases.length === 0) {
      console.log('ℹ️  No purchases found')
      return
    }
    
    console.log(`\n📝 Found ${purchases.length} purchase(s) to update:\n`)
    
    for (const purchase of purchases) {
      const ethAmount = parseFloat(purchase.eth_amount)
      const bbuxAmount = ethAmount / PRICE_PER_TOKEN
      
      console.log(`  Tx: ${purchase.tx_hash.slice(0, 10)}...`)
      console.log(`  ETH: ${ethAmount}`)
      console.log(`  BBUX calculated: ${bbuxAmount.toFixed(0)}`)
      
      // Update the record
      const { error: updateError } = await supabase
        .from('presale_purchases')
        .update({ bbux_amount: bbuxAmount.toFixed(0) })
        .eq('tx_hash', purchase.tx_hash)
      
      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`)
      } else {
        console.log(`  ✅ Updated\n`)
      }
    }
    
    console.log('✅ Update complete!')
    
    // Show summary
    const { data: updated } = await supabase
      .from('presale_purchases')
      .select('eth_amount, bbux_amount')
    
    if (updated) {
      const totalETH = updated.reduce((sum, p) => sum + parseFloat(p.eth_amount || 0), 0)
      const totalBBUX = updated.reduce((sum, p) => sum + parseFloat(p.bbux_amount || 0), 0)
      
      console.log('\n📊 Dashboard will show:')
      console.log(`   Total ETH: ${totalETH.toFixed(6)}`)
      console.log(`   Total BBUX: ${totalBBUX.toFixed(0)}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

updateBBUXAmounts()
