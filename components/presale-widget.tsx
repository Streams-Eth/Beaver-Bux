"use client"

import { useState, useEffect, useRef } from "react"
import { ethers } from 'ethers'
import { normalizeAddress } from '@/lib/utils'
import dynamic from 'next/dynamic'
const WalletControlsInner = dynamic(() => import('@/components/wallet-controls-inner'), { ssr: false })
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet } from "lucide-react"

// Network-aware contract addresses
const getNetworkConfig = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK || 'mainnet'
  
  const configs = {
    sepolia: {
      token: process.env.NEXT_PUBLIC_SEPOLIA_TOKEN || '',
      presale: process.env.NEXT_PUBLIC_SEPOLIA_PRESALE || '',
      chainId: 11155111,
      rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://sepolia.infura.io/v3/',
      explorerUrl: 'https://sepolia.etherscan.io',
    },
    base: {
      token: process.env.NEXT_PUBLIC_BASE_TOKEN || '',
      presale: process.env.NEXT_PUBLIC_BASE_PRESALE || '',
      chainId: 8453,
      rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC || 'https://mainnet.base.org',
      explorerUrl: 'https://basescan.org',
    },
    mainnet: {
      token: process.env.NEXT_PUBLIC_ETH_TOKEN || '0xa7372d8409805D0D3F0Eb774B9bC8b7975340682',
      presale: process.env.NEXT_PUBLIC_ETH_PRESALE || '0x45482E0858689E2dDd8F4bAEB95d4Fd5f292c564',
      chainId: 1,
      rpcUrl: process.env.NEXT_PUBLIC_ETH_RPC || 'https://eth-mainnet.g.alchemy.com/v2/',
      explorerUrl: 'https://etherscan.io',
    },
  }
  
  return configs[network as keyof typeof configs] || configs.mainnet
}

const NETWORK_CONFIG = getNetworkConfig()
const PRESALE_CONTRACT = NETWORK_CONFIG.presale
const MIN_CONTRIBUTION_ETH = 0.0005
const MAX_CONTRIBUTION_ETH = 0.25
const TOTAL_TOKENS_FOR_SALE = 100_000_000

// Stage configuration from contract (869,565 BBUX per ETH = 0.00000115 ETH per BBUX)
const STAGES = [
  {
    id: 1,
    start: new Date("2025-11-16T00:00:00Z"),
    end: new Date("2026-03-31T23:59:59Z"),
    pricePerToken: 0.00000115, // ETH per BBUX (1 / 869565)
    allocation: 5_000_000, // Stage 1: 5 ETH hard cap × 869,565
  },
  {
    id: 2,
    start: new Date("2026-04-01T00:00:00Z"),
    end: new Date("2026-06-30T23:59:59Z"),
    pricePerToken: 0.00000115,
    allocation: 8_000_000, // Stage 2: 8 ETH hard cap × 869,565
  },
  {
    id: 3,
    start: new Date("2026-07-01T00:00:00Z"),
    end: new Date("2026-09-28T23:59:59Z"),
    pricePerToken: 0.00000115,
    allocation: 15_000_000, // Stage 3: 15 ETH hard cap × 869,565
  },
  {
    id: 4,
    start: new Date("2026-09-29T00:00:00Z"),
    end: new Date("2026-12-27T23:59:59Z"),
    pricePerToken: 0.00000115,
    allocation: 20_000_000, // Stage 4: 20 ETH hard cap × 869,565
  },
]

const ETH_TO_CAD = 4200
const PAYPAL_CLIENT_ID = "AS6HlfoJXWFF-xqbhTeLn84IyegiYZwt9jQwfcwpdtaM0xbn2fIliPkGZWDsTjcrRYgbNWS3dUz-emhx"

export function PresaleWidget() {
  const [amount, setAmount] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const debugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'

  const addLog = (msg: string) => {
    try {
      setDebugLogs((s) => [...s.slice(-50), `${new Date().toISOString()} ${msg}`])
      console.log('[PresaleDebug]', msg)
    } catch (e) {}
  }
  const wcRef = useRef<any>(null)
  const prefetchingRef = useRef(false)
  const paypalRef = useRef<HTMLDivElement>(null)
  const [currentStage, setCurrentStage] = useState(STAGES[0])
  const [nextStage, setNextStage] = useState(STAGES[1])
  const [countdown, setCountdown] = useState("")

  const prefetchWalletConnect = async () => {
    if (typeof window === 'undefined' || prefetchingRef.current) return
    prefetchingRef.current = true
    try {
      addLog('prefetching WalletConnect module')
      const UniversalProviderModule = await import('@walletconnect/universal-provider')
      const UniversalProvider = (UniversalProviderModule as any).default || UniversalProviderModule
      const projectId = (process.env.NEXT_PUBLIC_WC_PROJECT_ID as string) || 'de11ba5f58d1e55215339c2ebec078ac'
      addLog('initializing WalletConnect provider')
      const wc = await UniversalProvider.init({
        projectId,
        metadata: {
          name: 'Beaver Bux',
          description: 'Beaver Bux Presale',
          url: (typeof window !== 'undefined' && window.location.origin) || 'https://beaver-bux.xyz',
          icons: [],
        },
      })
      wcRef.current = wc
      addLog('WalletConnect pre-initialized')
    } catch (e) {
      addLog(`WalletConnect prefetch error: ${String((e as any)?.message || e)}`)
      prefetchingRef.current = false
    }
  }

  const calculateTokens = (ethAmount: number) => {
    return ethAmount / currentStage.pricePerToken
  }

  const tokensToReceive = amount ? calculateTokens(Number.parseFloat(amount)) : 0
  const cadEquivalent = amount ? Number.parseFloat(amount) * ETH_TO_CAD : 0

  useEffect(() => {
    // Require wallet connect for PayPal purchases: buyer must connect a wallet first
    if (
      paypalRef.current &&
      window.paypal &&
      amount &&
      Number.parseFloat(amount) >= MIN_CONTRIBUTION_ETH &&
      isConnected &&
      account
    ) {
      const cadAmount = (Number.parseFloat(amount) * ETH_TO_CAD).toFixed(2)

      // create a stable reference id to include in the PayPal order so our webhook
      // can reliably match the payment to local records. Example: bbux-163...-12345
  const referenceId = `bbux-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
      // Prefer an existing claim token (if provided via localStorage or URL param).
      // This lets admins generate a claim token (e.g. bbux-claim-sara-0003) and the
      // PayPal order will include that token so the webhook can match it directly.
      // Format: <claimToken>|<wallet>  (fallback to <referenceId>|<wallet>)
      let claimToken: string | null = null
      try {
        claimToken = localStorage.getItem('bbux_claim_token')
      } catch (e) {
        claimToken = null
      }
      // also allow `claim` query param to prefill claimToken (useful for emailed claim links)
      try {
        if (!claimToken) {
          const qp = new URLSearchParams(window.location.search)
          const q = qp.get('claim')
          if (q) claimToken = q
        }
      } catch (e) {
        // ignore
      }

      // Include connected wallet address in the PayPal order custom_id so the webhook can auto-deliver
      // Use claimToken when present, otherwise fall back to generated referenceId
      const customId = `${claimToken || referenceId}|${account}`

      window.paypal
        .Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: cadAmount,
                    currency_code: "CAD",
                  },
                  description: `${tokensToReceive.toLocaleString()} BBUX Tokens`,
                  // include custom_id and invoice_id for easier reconciliation
                  custom_id: customId,
                  invoice_id: referenceId,
                },
              ],
            })
          },
          onApprove: async (data: any, actions: any) => {
            const order = await actions.order.capture()
            console.log("[v0] PayPal payment successful:", order, { referenceId })
            // Store a local reference so the client UI can show a matching id if needed
            try {
              localStorage.setItem(`bbux_ref_${order.id}`, referenceId)
            } catch (e) {
              // ignore storage errors
            }
            // TODO: Process the payment and call presale contract
            alert(`Payment successful! You will receive ${tokensToReceive.toLocaleString()} BBUX tokens.`)
          },
          onError: (err: any) => {
            console.error("[v0] PayPal error:", err)
            alert("Payment failed. Please try again.")
          },
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          },
        })
        .render(paypalRef.current)
    }
  }, [amount, tokensToReceive, isConnected, account])

  useEffect(() => {
    const targetDate = new Date("2025-11-01T00:00:00Z").getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        setCountdown("🚀 Presale is now LIVE!")
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setCountdown(`⏳ ${days}d ${hours}h ${minutes}m ${seconds}s until presale starts`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      const now = new Date()
      const active = STAGES.find((stage) => now >= stage.start && now <= stage.end) || STAGES[0]
      setCurrentStage(active)
      const nextIndex = STAGES.findIndex((s) => s.id === active.id) + 1
      if (nextIndex < STAGES.length) setNextStage(STAGES[nextIndex])
    } catch (e) {}

    try {
      const stored = localStorage.getItem('bbux_wallet_address')
      if (stored) {
        const norm = normalizeAddress(stored) || stored
        setAccount(norm)
        setIsConnected(true)
      }
    } catch (e) {}

    const onWalletChanged = (ev: any) => {
      try {
        const addr = ev?.detail?.address || null
        if (addr) {
          setAccount(addr)
          setIsConnected(true)
        } else {
          setAccount(null)
          setIsConnected(false)
        }
      } catch (e) {}
    }

    try {
      window.addEventListener('bbux:wallet-changed', onWalletChanged as EventListener)
    } catch (e) {}

    return () => {
      try { window.removeEventListener('bbux:wallet-changed', onWalletChanged as EventListener) } catch (e) {}
    }
  }, [])

  return (
    <Card className="w-full max-w-md bg-card border-2 border-primary/20 shadow-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground">{countdown}</CardTitle>
          <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-semibold">
            Stage {currentStage.id}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Next Stage Price:{" "}
          <span className="font-semibold text-foreground">
            ${(nextStage.pricePerToken * ETH_TO_CAD).toFixed(6)} CAD
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stage {currentStage.id} Progress</span>
            <span className="font-semibold text-foreground">
              {((currentStage.allocation / TOTAL_TOKENS_FOR_SALE) * 100).toFixed(0)}% of Total
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "15%" }} />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {currentStage.allocation.toLocaleString()} BBUX available in Stage {currentStage.id}
          </div>
        </div>

        <Tabs defaultValue="eth" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="eth">ETH</TabsTrigger>
            <TabsTrigger value="cad">CAD</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>

          <TabsContent value="eth" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount (ETH)</label>
              <Input
                type="number"
                placeholder={`Min: ${MIN_CONTRIBUTION_ETH} ETH`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                min={MIN_CONTRIBUTION_ETH}
                max={MAX_CONTRIBUTION_ETH}
                step="0.001"
              />
              <div className="text-xs text-muted-foreground">
                Min: {MIN_CONTRIBUTION_ETH} ETH • Max: {MAX_CONTRIBUTION_ETH} ETH
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-semibold text-foreground">{tokensToReceive.toLocaleString()} BBUX</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">CAD equivalent:</span>
                <span className="text-muted-foreground">${cadEquivalent.toFixed(2)} CAD</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cad" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount (CAD)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount ? (Number.parseFloat(amount) * ETH_TO_CAD).toFixed(2) : ""}
                onChange={(e) => setAmount((Number.parseFloat(e.target.value || "0") / ETH_TO_CAD).toString())}
                className="text-lg"
              />
              <div className="text-xs text-muted-foreground">
                Min: ${(MIN_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD • Max: $
                {(MAX_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-semibold text-foreground">{tokensToReceive.toLocaleString()} BBUX</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ETH equivalent:</span>
                <span className="text-muted-foreground">{amount ? Number.parseFloat(amount).toFixed(4) : "0"} ETH</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount (CAD)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount ? (Number.parseFloat(amount) * ETH_TO_CAD).toFixed(2) : ""}
                onChange={(e) => setAmount((Number.parseFloat(e.target.value || "0") / ETH_TO_CAD).toString())}
                className="text-lg"
              />
              <div className="text-xs text-muted-foreground">
                Min: ${(MIN_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD • Max: $
                {(MAX_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-semibold text-foreground">{tokensToReceive.toLocaleString()} BBUX</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ETH equivalent:</span>
                <span className="text-muted-foreground">{amount ? Number.parseFloat(amount).toFixed(4) : "0"} ETH</span>
              </div>
            </div>

            {amount && Number.parseFloat(amount) >= MIN_CONTRIBUTION_ETH ? (
              isConnected && account ? (
                <div ref={paypalRef} className="w-full" />
              ) : (
                <div className="bg-muted rounded-lg p-4 text-sm text-center text-muted-foreground">
                  Connect your wallet to enable PayPal checkout
                </div>
              )
            ) : (
              <div className="bg-muted rounded-lg p-4 text-sm text-center text-muted-foreground">
                Enter an amount to see PayPal payment options
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons (wallet-aware) */}
        {(() => {
          // Only consider the wallet-ready gate true when the wagmi *provider*
          // is fully created and the app-level QueryClientProvider has mounted.
          // Previously we used __WAGMI_READY which can be set earlier during
          // connector discovery; that allowed components using wagmi hooks to
          // mount before the actual provider (and QueryClient) were available,
          // causing "No QueryClient set" runtime errors. Use
          // __WAGMI_PROVIDER_READY which is set when providerConfig is created.
          const Ready =
            typeof window !== 'undefined' &&
            (window as any).__WAGMI_PROVIDER_READY &&
            (window as any).__BBUX_QUERY_CLIENT
          if (!Ready) {
            // Fallback UI when wagmi is not available - show connect or buy buttons
            if (!isConnected || !account) {
              // Show connect button
              return (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-primary text-primary-foreground text-lg py-6"
                    onPointerEnter={prefetchWalletConnect}
                    onMouseEnter={prefetchWalletConnect}
                    onTouchStart={prefetchWalletConnect}
                    onClick={async () => {
                      try {
                        addLog('fallback connect clicked')
                        // Try injected provider first
                        if (typeof window !== 'undefined' && (window as any).ethereum) {
                          addLog('detected window.ethereum, attempting injected connect')
                          try {
                            await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
                            const provider = new ethers.providers.Web3Provider((window as any).ethereum)
                            const signer = provider.getSigner()
                            const addr = await signer.getAddress()
                            setAccount(addr)
                            setIsConnected(true)
                            addLog(`injected connect succeeded ${addr}`)
                            try { const norm = normalizeAddress(addr) || addr; localStorage.setItem('bbux_wallet_address', norm) } catch (e) {}
                            try { const norm = normalizeAddress(addr) || addr; window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address: norm } })) } catch (e) {}
                            return
                          } catch (e) {
                            addLog(`injected connect failed: ${String((e as any)?.message || e)}`)
                          }
                        }

                        // Try WalletConnect Universal Provider as a fallback
                        try {
                          addLog('attempting WalletConnect Universal Provider fallback')
                          let wc = wcRef.current
                          if (!wc) {
                            addLog('no preinitialized WalletConnect found; initializing now')
                            const projectId = (process.env.NEXT_PUBLIC_WC_PROJECT_ID as string) || 'de11ba5f58d1e55215339c2ebec078ac'
                            const UniversalProviderModule = await import('@walletconnect/universal-provider')
                            const UniversalProvider = (UniversalProviderModule as any).default || UniversalProviderModule
                            wc = await UniversalProvider.init({
                              projectId,
                              metadata: {
                                name: 'Beaver Bux',
                                description: 'Beaver Bux Presale',
                                url: (typeof window !== 'undefined' && window.location.origin) || 'https://beaver-bux.xyz',
                                icons: [],
                              },
                            })
                            wcRef.current = wc
                          }
                          try {
                            await wc.connect()
                          } catch (connectErr) {
                            addLog(`WalletConnect connect() failed: ${String((connectErr as any)?.message || connectErr)}`)
                            alert('WalletConnect failed to open. If you are on mobile, ensure your wallet app supports WalletConnect and try again.')
                            return
                          }
                          const accounts = (wc as any).accounts || (wc as any).session?.namespaces?.eip155?.accounts || []
                          let addr: string | null = null
                          if (Array.isArray(accounts) && accounts.length > 0) {
                            const raw = accounts[0]
                            const parts = String(raw).split(':')
                            addr = parts[parts.length - 1]
                          }
                          if (addr) {
                            setAccount(addr)
                            setIsConnected(true)
                            addLog(`WalletConnect fallback succeeded ${addr}`)
                            try { const norm = normalizeAddress(addr) || addr; localStorage.setItem('bbux_wallet_address', norm) } catch (e) {}
                            try { const norm = normalizeAddress(addr) || addr; window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address: norm } })) } catch (e) {}
                          } else {
                            alert('Connected, but could not read account address from WalletConnect provider')
                          }
                          return
                        } catch (e) {
                          addLog(`WalletConnect fallback failed: ${String((e as any)?.message || e)}`)
                        }

                        alert('Wallet integration unavailable in this browser session')
                      } catch (e) {
                        console.error('Fallback connect error', e)
                        alert('Failed to connect wallet')
                      }
                    }}
                  >
                    <Wallet className="mr-2" size={20} />
                    Connect Wallet
                  </Button>
                </div>
              )
            }
            
            // Connected - show buy and disconnect buttons
            return (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6"
                    disabled={!amount || Number.parseFloat(amount) < MIN_CONTRIBUTION_ETH}
                    onClick={async () => {
                      if (typeof window === 'undefined' || !(window as any).ethereum) {
                        alert('Wallet not connected')
                        return
                      }

                      const ethAmount = Number.parseFloat(amount || '0')
                      if (!ethAmount || ethAmount < MIN_CONTRIBUTION_ETH) {
                        alert(`Enter an amount (min ${MIN_CONTRIBUTION_ETH} ETH)`)
                        return
                      }

                      try {
                        addLog(`attempting buy: ${ethAmount} ETH to ${PRESALE_CONTRACT}`)
                        const provider = new ethers.providers.Web3Provider((window as any).ethereum)
                        const signer = provider.getSigner()
                        
                        // Check network
                        const network = await provider.getNetwork()
                        addLog(`current network: ${network.chainId}`)
                        if (network.chainId !== NETWORK_CONFIG.chainId) {
                          const networkName = NETWORK_CONFIG.chainId === 11155111 ? 'Sepolia Testnet' : NETWORK_CONFIG.chainId === 8453 ? 'Base Network' : 'Ethereum Mainnet'
                          alert(`Wrong Network!\n\nYou are connected to Chain ID: ${network.chainId}\nPlease switch to ${networkName} (Chain ID: ${NETWORK_CONFIG.chainId})`)
                          try {
                            await (window as any).ethereum.request({
                              method: 'wallet_switchEthereumChain',
                              params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
                            })
                            // Re-check after switch attempt
                            const newNetwork = await provider.getNetwork()
                            if (newNetwork.chainId !== NETWORK_CONFIG.chainId) {
                              addLog('network switch failed or cancelled')
                              return
                            }
                          } catch (switchError: any) {
                            addLog(`network switch error: ${switchError.code}`)
                            if (switchError.code === 4902) {
                              alert(`${networkName} is not added to your wallet.\n\nPlease add it manually:\nNetwork: ${networkName}\nChain ID: ${NETWORK_CONFIG.chainId}\nRPC: ${NETWORK_CONFIG.rpcUrl}`)
                            }
                            return
                          }
                        }
                        
                        // Call buy() function on presale contract
                        const presaleABI = ['function buy() payable']
                        const presaleContract = new ethers.Contract(PRESALE_CONTRACT, presaleABI, signer)
                        const tx = await presaleContract.buy({ value: ethers.utils.parseEther(String(ethAmount)) })
                        
                        addLog(`tx sent: ${tx.hash}`)
                        console.log('[presale] Payment tx sent', tx.hash)
                        alert(`Transaction sent: ${tx.hash}\n\nTokens will be sent to your wallet once confirmed!`)
                        try {
                          const stored = JSON.parse(localStorage.getItem('bbux_local_tx') || '[]')
                          stored.push({ txHash: tx.hash, account, amount: ethAmount, tokens: tokensToReceive, network: NETWORK_CONFIG.chainId })
                          localStorage.setItem('bbux_local_tx', JSON.stringify(stored))
                        } catch (e) {}
                      } catch (e: any) {
                        const msg = e?.message || String(e)
                        addLog(`buy failed: ${msg}`)
                        console.error('Buy error', e)
                        alert(`Transaction failed: ${msg}`)
                      }
                    }}
                  >
                    Buy BBUX
                  </Button>

                  <Button
                    variant="ghost"
                    className="px-4 py-6 border rounded text-sm"
                    onClick={() => {
                      try {
                        localStorage.removeItem('bbux_wallet_address')
                        window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address: null } }))
                      } catch (e) {}
                      setAccount(null)
                      setIsConnected(false)
                      addLog('disconnected')
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {account ? `${account.slice(0,6)}...${account.slice(-4)}` : ''}
                </div>
              </div>
            )
          }
          // Wagmi is ready - use WalletControlsInner
          return (
            <WalletControlsInner
              amount={amount}
              tokensToReceive={tokensToReceive}
              addLog={addLog}
              prefetchWalletConnect={prefetchWalletConnect}
              wcRef={wcRef}
              setAccount={setAccount}
              setIsConnected={setIsConnected}
              account={account}
              isConnected={isConnected}
            />
          )
        })()}

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>
            Contract: {PRESALE_CONTRACT.slice(0, 6)}...{PRESALE_CONTRACT.slice(-4)}
          </p>
          <p>By purchasing, you agree to our terms and conditions</p>
        </div>
      </CardContent>
    </Card>
  )
}

declare global {
  interface Window {
    paypal: any
  }
}
