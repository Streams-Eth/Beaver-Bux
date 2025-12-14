import { NextResponse } from 'next/server'

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
  if (data.error) {
    throw new Error(`${method}: ${data.error.message}`)
  }
  return data.result
}

export async function GET() {
  try {
    const PRESALE_ADDRESS = '0xF479063E290E85e1470a11821128392F6063790B'
    const rpcUrls = [
      'https://rpc.ankr.com/base',
      'https://base-rpc.ankr.com/http',
      'https://base-mainnet.g.alchemy.com/v2/qSihHc_yL9QSYQ_Jwtdyq',
      'https://mainnet.base.org',
      'https://base.publicnode.com',
      'https://base.llamarpc.com',
      'https://base-rpc.publicnode.com',
      'https://base.meowrpc.com',
    ]
    
    let rpcUrl = ''
    for (const url of rpcUrls) {
      try {
        await jsonRpcCall(url, 'eth_chainId')
        rpcUrl = url
        console.log(`[Dashboard] Using RPC: ${url}`)
        break
      } catch (e) {
        console.log(`[Dashboard] RPC ${url} not available`)
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

    // Get latest block
    const latestBlockHex = await jsonRpcCall(rpcUrl, 'eth_blockNumber')
    const latestBlock = parseInt(latestBlockHex, 16)
    console.log(`[Dashboard] Latest block: ${latestBlock}`)
    
    // Query from last 2 million blocks (~30 days) to catch all presale transactions
    const startBlock = Math.max(0, latestBlock - 2000000)
    console.log(`[Dashboard] Querying blocks ${startBlock} to ${latestBlock}`)
    
    // Query TokensPurchased events
    // Event: TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokensSent)
    const eventTopic = '0x8ff8b5f0a21b3cf82f37d61f85be04bf6a7ed36aacc79c0c9ea4ccd0cffce6fc'
    
    console.log(`[Dashboard] Fetching logs for topic ${eventTopic}`)
    const logs = await jsonRpcCall(rpcUrl, 'eth_getLogs', [
      {
        address: PRESALE_ADDRESS,
        topics: [eventTopic],
        fromBlock: '0x' + startBlock.toString(16),
        toBlock: 'latest',
      },
    ])
    
    console.log(`[Dashboard] Found ${logs?.length || 0} TokensPurchased events`)
    
    let ethRaised = 0n
    let tokensSold = 0n
    const uniqueBuyers = new Set<string>()
    const eventList: any[] = []
    
    if (Array.isArray(logs)) {
      for (const log of logs) {
        try {
          // Extract buyer from indexed parameter in topics[1]
          const buyer = '0x' + log.topics[1].slice(26)
          
          // Data contains ethAmount and tokensSent
          // Format: 0x + ethAmount(64 hex) + tokensSent(64 hex)
          const data = log.data
          const ethAmount = BigInt(data.slice(0, 66))
          const tokensAmount = BigInt(data.slice(66, 130))
          
          console.log(`[Dashboard] Event: buyer=${buyer.slice(0, 10)}..., eth=${(Number(ethAmount) / 1e18).toFixed(6)}, tokens=${(Number(tokensAmount) / 1e18).toFixed(2)}`)
          
          ethRaised += ethAmount
          tokensSold += tokensAmount
          uniqueBuyers.add(buyer.toLowerCase())
          
          eventList.push({
            buyer,
            ethAmount,
            tokensAmount,
            blockNumber: parseInt(log.blockNumber, 16),
            txHash: log.transactionHash,
          })
        } catch (e: any) {
          console.log(`[Dashboard] Error parsing event: ${e.message}`)
        }
      }
    }
    
    // Format output
    const ethRaisedFormatted = (Number(ethRaised) / 1e18).toFixed(6)
    const tokensSoldFormatted = (Number(tokensSold) / 1e18).toFixed(2)
    
    console.log(`[Dashboard] Summary: ${ethRaisedFormatted} ETH, ${tokensSoldFormatted} BBUX, ${uniqueBuyers.size} buyers`)
    
    // Get block timestamps for recent events
    const recentPurchases = []
    const recentEvents = eventList.slice(-10).reverse()
    
    for (const event of recentEvents) {
      try {
        const blockData = await jsonRpcCall(rpcUrl, 'eth_getBlockByNumber', [
          '0x' + event.blockNumber.toString(16),
          false,
        ])
        
        const timestamp = new Date(parseInt(blockData.timestamp, 16) * 1000).toLocaleString()
        recentPurchases.push({
          buyer: event.buyer,
          amount: (Number(event.ethAmount) / 1e18).toFixed(6),
          tokens: (Number(event.tokensAmount) / 1e18).toLocaleString(),
          timestamp,
        })
      } catch (e: any) {
        console.log(`[Dashboard] Error fetching block: ${e.message}`)
      }
    }
    
    return NextResponse.json({
      ethRaised: ethRaisedFormatted,
      tokensSold: tokensSoldFormatted,
      contributorCount: uniqueBuyers.size,
      recentPurchases,
    })
  } catch (error: any) {
    console.error('[Dashboard] Error:', error.message)
    return NextResponse.json({
      error: error.message || 'Failed to load stats',
      ethRaised: '0',
      tokensSold: '0',
      contributorCount: 0,
      recentPurchases: [],
    })
  }
}
