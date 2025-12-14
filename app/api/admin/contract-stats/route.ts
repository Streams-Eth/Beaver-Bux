import { NextResponse } from 'next/server'
import { ethers } from 'ethers'

export async function GET() {
  try {
    const PRESALE_ADDRESS = '0xF479063E290E85e1470a11821128392F6063790B'
    
    // Try multiple RPC endpoints
    let provider: any
    const rpcUrls = [
      'https://mainnet.base.org',
      'https://base.publicnode.com',
      'https://base.meowrpc.com',
    ]
    
    for (const rpcUrl of rpcUrls) {
      try {
        provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        await provider.getBlockNumber()
        console.log(`[Dashboard] Connected to RPC: ${rpcUrl}`)
        break
      } catch (e) {
        console.log(`[Dashboard] RPC failed: ${rpcUrl}`, e)
      }
    }
    
    if (!provider) {
      return NextResponse.json({
        error: 'All RPC endpoints failed',
        ethRaised: '0',
        tokensSold: '0',
        contributorCount: 0,
        recentPurchases: [],
      })
    }

    const presaleABI = [
      'function totalSold() view returns (uint256)',
      'function contributions(address) view returns (uint256)',
      'event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokensSent)',
    ]
    
    const presale = new ethers.Contract(PRESALE_ADDRESS, presaleABI, provider)
    
    // Get total BBUX sold
    const tokensSold = await presale.totalSold().catch(() => ethers.BigNumber.from(0))
    
    // Get all events
    const filter = presale.filters.TokensPurchased()
    const allEvents = await presale.queryFilter(filter, 0, 'latest').catch(() => [])
    
    let ethRaised = ethers.BigNumber.from(0)
    const uniqueBuyers = new Set<string>()
    
    allEvents.forEach((event: any) => {
      if (event.args) {
        ethRaised = ethRaised.add(event.args.ethAmount || 0)
        uniqueBuyers.add(event.args.buyer?.toLowerCase())
      }
    })
    
    const contributorCount = uniqueBuyers.size
    
    // Get recent purchases
    const recentPurchases = await Promise.all(
      allEvents.slice(-10).reverse().map(async (event: any) => {
        try {
          const block = await provider.getBlock(event.blockNumber)
          return {
            buyer: event.args?.buyer || '',
            amount: ethers.utils.formatEther(event.args?.ethAmount || 0),
            tokens: ethers.utils.formatEther(event.args?.tokensSent || 0),
            timestamp: new Date(block.timestamp * 1000).toLocaleString(),
          }
        } catch (e) {
          return {
            buyer: event.args?.buyer || '',
            amount: ethers.utils.formatEther(event.args?.ethAmount || 0),
            tokens: ethers.utils.formatEther(event.args?.tokensSent || 0),
            timestamp: 'Unknown',
          }
        }
      })
    )
    
    return NextResponse.json({
      ethRaised: ethers.utils.formatEther(ethRaised),
      tokensSold: ethers.utils.formatEther(tokensSold),
      contributorCount,
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
