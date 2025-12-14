import { NextResponse } from 'next/server'

// Simple JSON-RPC call without ethers
async function jsonRpcCall(rpcUrl: string, method: string, params: any[] = []) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    }),
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.result
}

export async function GET() {
  try {
    const PRESALE_ADDRESS = '0xF479063E290E85e1470a11821128392F6063790B'
    
    // Try different RPC endpoints
    const rpcUrls = [
      'https://mainnet.base.org',
      'https://base.publicnode.com',
    ]
    
    let rpcUrl = ''
    for (const url of rpcUrls) {
      try {
        await jsonRpcCall(url, 'eth_chainId')
        rpcUrl = url
        console.log(`[Dashboard] Using RPC: ${url}`)
        break
      } catch (e) {
        console.log(`[Dashboard] RPC failed: ${url}`)
      }
    }
    
    if (!rpcUrl) {
      return NextResponse.json({
        error: 'All RPC endpoints failed',
        ethRaised: '0',
        tokensSold: '0',
        contributorCount: 0,
        recentPurchases: [],
      })
    }

    // Get latest block for events
    const latestBlockHex = await jsonRpcCall(rpcUrl, 'eth_blockNumber')
    const latestBlock = parseInt(latestBlockHex, 16)
    console.log(`[Dashboard] Latest block: ${latestBlock}`)
    
    // Go back 1 million blocks to catch presale (presale likely started recently)
    const startBlock = Math.max(0, latestBlock - 1000000)
    console.log(`[Dashboard] Querying blocks ${startBlock} to ${latestBlock}`)
    
    // Call totalSold() - returns uint256
    const totalSoldCalldata = '0x08ce2a0f' // totalSold() selector
    const result = await jsonRpcCall(rpcUrl, 'eth_call', [
      { to: PRESALE_ADDRESS, data: totalSoldCalldata },
      'latest',
    ])
    
    const tokensSold = BigInt(result || '0x0').toString()
    console.log(`[Dashboard] Total sold (raw): ${result}, parsed: ${tokensSold}`)
    
    // Query logs for TokensPurchased events
    // Topic: keccak256('TokensPurchased(address,uint256,uint256)')
    const topic = '0x8ff8b5f0a21b3cf82f37d61f85be04bf6a7ed36aacc79c0c9ea4ccd0cffce6fc'
    
    console.log(`[Dashboard] Querying logs for topic ${topic}`)
    const logs = await jsonRpcCall(rpcUrl, 'eth_getLogs', [
      {
        address: PRESALE_ADDRESS,
        topics: [topic],
        fromBlock: '0x' + startBlock.toString(16),
        toBlock: 'latest',
      },
    ])
    
    console.log(`[Dashboard] Found ${logs?.length || 0} logs`)
    
    let ethRaised = 0n
    const uniqueBuyers = new Set<string>()
    const eventList: any[] = []
    
    if (Array.isArray(logs) && logs.length > 0) {
      for (const log of logs) {
        try {
          const buyer = '0x' + log.topics[1].slice(26) // Extract from indexed parameter
          const data = log.data
          
          // Decode: ethAmount (256 bits) + tokensSent (256 bits)
          const ethAmount = BigInt(data.slice(0, 66))
          const tokensAmount = BigInt('0x' + data.slice(66, 130))
          
          console.log(`[Dashboard] Event: buyer=${buyer}, eth=${ethAmount}, tokens=${tokensAmount}`)
          
          ethRaised += ethAmount
          uniqueBuyers.add(buyer.toLowerCase())
          
          eventList.push({
            buyer,
            ethAmount,
            tokensAmount,
            blockNumber: parseInt(log.blockNumber, 16),
          })
        } catch (e) {
          console.log('[Dashboard] Error parsing event:', e)
        }
      }
    } else {
      console.log('[Dashboard] No logs found')
    }
    
    // Format numbers
    const ethRaisedFormatted = (Number(ethRaised) / 1e18).toFixed(6)
    const tokensSoldFormatted = (BigInt(tokensSold) / BigInt(1e18)).toString()
    
    console.log(`[Dashboard] Final: ethRaised=${ethRaisedFormatted}, tokensSold=${tokensSoldFormatted}, contributors=${uniqueBuyers.size}`)
    
    // Get block timestamps for recent events
    const recentPurchases = []
    for (const event of eventList.slice(-10).reverse()) {
      try {
        const blockData = await jsonRpcCall(rpcUrl, 'eth_getBlockByNumber', [
          '0x' + event.blockNumber.toString(16),
          false,
        ])
        
        recentPurchases.push({
          buyer: event.buyer,
          amount: (Number(event.ethAmount) / 1e18).toFixed(6),
          tokens: (Number(event.tokensAmount) / 1e18).toLocaleString(),
          timestamp: new Date(parseInt(blockData.timestamp, 16) * 1000).toLocaleString(),
        })
      } catch (e) {
        console.log('[Dashboard] Error fetching block:', e)
      }
    }
    
    return NextResponse.json({
      ethRaised: ethRaisedFormatted,
      tokensSold: tokensSoldFormatted,
      contributorCount: uniqueBuyers.size,
      recentPurchases,
    })
  } catch (error: any) {
    console.error('[Dashboard] Error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to load stats',
      ethRaised: '0',
      tokensSold: '0',
      contributorCount: 0,
      recentPurchases: [],
    })
  }
}
