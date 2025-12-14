'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ethers } from 'ethers'

interface Stats {
  ethRaised: string
  tokensSold: string
  contributorCount: number
  recentPurchases: Array<{
    buyer: string
    amount: string
    tokens: string
    timestamp: string
  }>
  loading: boolean
  error: string | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    ethRaised: '0',
    tokensSold: '0',
    contributorCount: 0,
    recentPurchases: [],
    loading: true,
    error: null,
  })

  const [dbStats, setDbStats] = useState({
    totalPurchases: 0,
    totalETH: '0',
    totalBBUX: '0',
    loading: true,
  })

  useEffect(() => {
    loadContractStats()
    loadDatabaseStats()
  }, [])

  const loadContractStats = async () => {
    try {
      const PRESALE_ADDRESS = '0xF479063E290E85e1470a11821128392F6063790B'
      const provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org')
      
      const presaleABI = [
        'function ethRaised() view returns (uint256)',
        'function tokensSold() view returns (uint256)',
        'function contributorCount() view returns (uint256)',
        'event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount)',
      ]
      
      const presale = new ethers.Contract(PRESALE_ADDRESS, presaleABI, provider)
      
      // Get totals
      const [ethRaised, tokensSold, contributorCount] = await Promise.all([
        presale.ethRaised().catch(() => ethers.BigNumber.from(0)),
        presale.tokensSold().catch(() => ethers.BigNumber.from(0)),
        presale.contributorCount().catch(() => 0),
      ])
      
      // Get recent purchases (last 10 events)
      let recentPurchases: any[] = []
      try {
        const filter = presale.filters.TokensPurchased()
        const currentBlock = await provider.getBlockNumber()
        const events = await presale.queryFilter(filter, currentBlock - 10000, 'latest')
        
        recentPurchases = await Promise.all(
          events.slice(-10).reverse().map(async (event) => {
            const block = await provider.getBlock(event.blockNumber)
            return {
              buyer: event.args?.buyer || '',
              amount: ethers.utils.formatEther(event.args?.ethAmount || 0),
              tokens: ethers.utils.formatEther(event.args?.tokenAmount || 0),
              timestamp: new Date(block.timestamp * 1000).toLocaleString(),
            }
          })
        )
      } catch (e) {
        console.log('Could not fetch events:', e)
      }
      
      setStats({
        ethRaised: ethers.utils.formatEther(ethRaised),
        tokensSold: ethers.utils.formatEther(tokensSold),
        contributorCount: contributorCount.toNumber ? contributorCount.toNumber() : Number(contributorCount),
        recentPurchases,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      console.error('Contract stats error:', error)
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load contract stats',
      }))
    }
  }

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setDbStats({
          totalPurchases: data.totalPurchases || 0,
          totalETH: data.totalETH || '0',
          totalBBUX: data.totalBBUX || '0',
          loading: false,
        })
      }
    } catch (error) {
      console.error('Database stats error:', error)
      setDbStats(prev => ({ ...prev, loading: false }))
    }
  }

  const exportToCSV = () => {
    const date = new Date().toISOString().split('T')[0]
    
    // Summary CSV
    let csv = 'BBUX Presale Summary Report\n'
    csv += `Generated: ${new Date().toLocaleString()}\n`
    csv += '\n'
    csv += 'Metric,Value\n'
    csv += `Total ETH Raised,${stats.ethRaised}\n`
    csv += `Total BBUX Sold,${stats.tokensSold}\n`
    csv += `Number of Contributors,${stats.contributorCount}\n`
    csv += `Estimated USD Value,"$${(Number(stats.ethRaised) * 3000).toLocaleString()}"\n`
    csv += '\n\n'
    csv += 'Recent Purchases\n'
    csv += 'Buyer Address,ETH Amount,BBUX Amount,Timestamp\n'
    
    // Add each purchase
    stats.recentPurchases.forEach(purchase => {
      csv += `${purchase.buyer},${purchase.amount},${purchase.tokens},"${purchase.timestamp}"\n`
    })
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bbux-presale-report-${date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">BBUX Presale Dashboard</h1>
          <p className="text-muted-foreground">Real-time presale statistics from Base network</p>
        </div>

        {stats.error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">⚠️ {stats.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Contract Stats */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">📊 On-Chain Stats (Source of Truth)</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total ETH Raised</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="animate-pulse h-8 bg-muted rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground">{Number(stats.ethRaised).toFixed(4)} ETH</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ ${(Number(stats.ethRaised) * 3000).toLocaleString()} USD
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total BBUX Sold</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="animate-pulse h-8 bg-muted rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground">
                      {Number(stats.tokensSold).toLocaleString()} BBUX
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {((Number(stats.tokensSold) / 30000000) * 100).toFixed(2)}% of 30M allocation
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.loading ? (
                  <div className="animate-pulse h-8 bg-muted rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground">{stats.contributorCount}</div>
                    <p className="text-sm text-muted-foreground mt-1">Unique wallets</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Database Stats (Backup) */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">💾 Database Tracking (Backup)</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Tracked Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                {dbStats.loading ? (
                  <div className="animate-pulse h-8 bg-muted rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground">{dbStats.totalPurchases}</div>
                    <p className="text-sm text-muted-foreground mt-1">Transactions logged</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">DB ETH Total</CardTitle>
              </CardHeader>
              <CardContent>
                {dbStats.loading ? (
                  <div className="animate-pulse h-8 bg-muted rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground">{Number(dbStats.totalETH).toFixed(4)} ETH</div>
                    <p className="text-sm text-muted-foreground mt-1">From tracked txs</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">DB BBUX Total</CardTitle>
              </CardHeader>
              <CardContent>
                {dbStats.loading ? (
                  <div className="animate-pulse h-8 bg-muted rounded"></div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-foreground">
                      {Number(dbStats.totalBBUX).toLocaleString()} BBUX
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">From tracked txs</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Purchases */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">🔥 Recent Purchases</h2>
          <Card>
            <CardContent className="pt-6">
              {stats.loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
                  ))}
                </div>
              ) : stats.recentPurchases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No purchases yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Buyer</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">ETH</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">BBUX</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentPurchases.map((purchase, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm font-mono">
                            {purchase.buyer.slice(0, 6)}...{purchase.buyer.slice(-4)}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">{Number(purchase.amount).toFixed(4)} ETH</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">
                            {Number(purchase.tokens).toLocaleString()} BBUX
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-muted-foreground">
                            {purchase.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="https://basescan.org/address/0xF479063E290E85e1470a11821128392F6063790B"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            View on BaseScan →
          </a>
          <button
            onClick={() => {
              loadContractStats()
              loadDatabaseStats()
            }}
            className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10"
          >
            🔄 Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={stats.recentPurchases.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 Export to CSV
          </button>
        </div>
      </div>
    </div>
  )
}
