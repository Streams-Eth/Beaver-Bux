#!/usr/bin/env node
/**
 * Force update BBUX amounts using upsert
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function upsertWithBBUX() {
  try {
    console.log('📝 Upserting purchases with BBUX amounts...\n')
    
    const updates = [
      {
        tx_hash: '0x59a1b7d66c8051bd0948c63a829c9c4371b81565b0bfac00e9a3cec6b6f7dca1',
        wallet_address: '0x1284541D5E8b3BbBfDc00B37E0E44b15d7eCE0da056907',
        eth_amount: '0.0005',
        bbux_amount: '435',
        network: 8453,
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        tx_hash: '0x5e273f63f22e5ede63668ec02408f422718b72c2a095c0b8629a99e0449283d8',
        wallet_address: '0x1284541D5E8b3BbBfDc00B37E0E44b15d7eCE0da056907',
        eth_amount: '0.0005',
        bbux_amount: '435',
        network: 8453,
        created_at: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
    
    const { data, error } = await supabase
      .from('presale_purchases')
      .upsert(updates, { onConflict: 'tx_hash' })
      .select()
    
    if (error) {
      console.error('❌ Upsert failed:', error.message)
      console.error('Details:', error)
    } else {
      console.log('✅ Upserted successfully!')
      console.log('\nRecords in database:')
      data.forEach(record => {
        console.log(`  ${record.tx_hash.slice(0, 10)}... | ETH: ${record.eth_amount} | BBUX: ${record.bbux_amount}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

upsertWithBBUX()
