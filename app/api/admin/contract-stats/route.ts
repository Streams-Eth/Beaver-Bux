import { NextResponse } from 'next/server'

// Query BaseScan API for transactions (no block range limit)
async function getTransactionsFromBaseScan(contractAddress: string) {
  try {
    console.log(`[Dashboard] Querying BaseScan for transactions on ${contractAddress}`)
    // Format URL properly
    const url = `https://api.basescan.org/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=desc&apikey=E53TR9MNJ3R9K8MKUDKH3JHCQMRNNDNFMF`
    console.log(`[Dashboard] BaseScan URL: ${url.substring(0, 100)}...`)
    
    const response = await fetch(url, { 
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    })
    const data = await response.json()
    
    console.log(`[Dashboard] BaseScan response status: ${data.status}, message: ${data.message}`)
    
    if (data.status === '1' && Array.isArray(data.result)) {
      console.log(`[Dashboard] Found ${data.result.length} transactions on BaseScan`)
      return data.result
    } else {
      console.log(`[Dashboard] BaseScan returned status ${data.status}: ${data.message}`)
      return []
    }
  } catch (e: any) {
    console.log(`[Dashboard] BaseScan query failed: ${e.message}`)
    return []
  }
}

export async function GET() {
  try {
    const PRESALE_ADDRESS = '0xF479063E290E85e1470a11821128392F6063790B'
    
    // Get transaction data from BaseScan (works better than RPC for historical data)
    const baseScanTxs = await getTransactionsFromBaseScan(PRESALE_ADDRESS)
    
    // Filter for successful "Buy" function calls
    const buyTxs = baseScanTxs.filter((tx: any) => 
      tx.functionName && tx.functionName.includes('Buy') && 
      tx.isError === '0' &&
      tx.value && BigInt(tx.value) > 0n
    )
    
    console.log(`[Dashboard] Found ${buyTxs.length} Buy transactions`)
    
    let ethRaised = 0n
    const uniqueBuyers = new Set<string>()
    const eventList: any[] = []
    
    // Process BaseScan transactions
    for (const tx of buyTxs) {
      try {
        const ethAmount = BigInt(tx.value || '0')
        const buyer = tx.from
        
        console.log(`[Dashboard] Buy tx: buyer=${buyer.slice(0, 10)}..., eth=${(Number(ethAmount) / 1e18).toFixed(6)}, block=${tx.blockNumber}`)
        
        ethRaised += ethAmount
        uniqueBuyers.add(buyer.toLowerCase())
        
        eventList.push({
          buyer,
          ethAmount,
          txHash: tx.hash,
          blockNumber: parseInt(tx.blockNumber),
          timeStamp: parseInt(tx.timeStamp),
        })
      } catch (e: any) {
        console.log(`[Dashboard] Error processing BaseScan tx: ${e.message}`)
      }
    }
    
    // Format output
    const ethRaisedFormatted = (Number(ethRaised) / 1e18).toFixed(6)
    
    console.log(`[Dashboard] Summary: ${ethRaisedFormatted} ETH raised, ${uniqueBuyers.size} contributors`)
    
    // Format purchase details with timestamps
    const recentPurchases = eventList.map(event => ({
      buyer: event.buyer,
      amount: (Number(event.ethAmount) / 1e18).toFixed(6),
      tokens: 'From Contract',
      timestamp: new Date(event.timeStamp * 1000).toLocaleString(),
    }))
    
    return NextResponse.json({
      ethRaised: ethRaisedFormatted,
      tokensSold: '0',  // Would need contract storage queries
      contributorCount: uniqueBuyers.size,
      recentPurchases: recentPurchases.slice(0, 10).reverse(), // Last 10, most recent first
    })
  } catch (error: any) {
    console.error('[Dashboard] API Error:', error.message)
    return NextResponse.json({
      error: error.message || 'Failed to load stats',
      ethRaised: '0',
      tokensSold: '0',
      contributorCount: 0,
      recentPurchases: [],
    })
  }
}
