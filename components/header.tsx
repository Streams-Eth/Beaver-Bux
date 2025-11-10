"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const connectWallet = async () => {
    try {
      // Try injected provider (MetaMask) first
      if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
          const accs = Array.isArray(accounts) ? accounts : []
          if (accs.length > 0) {
            const address = accs[0]
            const shortened = `${address.slice(0, 6)}...${address.slice(-4)}`
            setWalletAddress(shortened)
            try { localStorage.setItem('bbux_wallet_address', address) } catch (e) {}
            try { window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address } })) } catch (e) {}
            return
          }
        } catch (e) {
          console.warn('Injected provider connection failed, will try WalletConnect fallback', e)
        }
      }

      // If no injected provider (typical on mobile) or injected attempt failed,
      // fall back to WalletConnect Universal Provider which handles mobile deep links.
      try {
        const projectId = (process.env.NEXT_PUBLIC_WC_PROJECT_ID as string) || 'de11ba5f58d1e55215339c2ebec078ac'
        const UniversalProviderModule = await import('@walletconnect/universal-provider')
        const UniversalProvider = (UniversalProviderModule as any).default || UniversalProviderModule
        const wc = await UniversalProvider.init({ projectId })
        await wc.connect()
        const accounts = (wc as any).accounts || (wc as any).session?.namespaces?.eip155?.accounts || []
        let address: string | null = null
        if (Array.isArray(accounts) && accounts.length > 0) {
          const raw = accounts[0]
          const parts = String(raw).split(':')
          address = parts[parts.length - 1]
        }
        if (address) {
          const shortened = `${address.slice(0, 6)}...${address.slice(-4)}`
          setWalletAddress(shortened)
          try { localStorage.setItem('bbux_wallet_address', address) } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address } })) } catch (e) {}
          return
        }
      } catch (e) {
        console.warn('WalletConnect fallback failed', e)
      }

      // Nothing worked
      alert('Please install MetaMask or connect via WalletConnect (mobile)')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Failed to connect wallet. Please try again.')
    }
  }

  const disconnectWallet = () => {
    try {
      localStorage.removeItem('bbux_wallet_address')
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address: null } }))
    } catch (e) {}
    setWalletAddress(null)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-PWoLbePYdidboO5s67YqD1BhEvhSCH.png"
              alt="Beaver Bux Logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-foreground">BEAVER BUX</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="/#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="/#how-to-buy" className="text-foreground hover:text-primary transition-colors">
              How to Buy
            </a>
            <a href="/tokenomics" className="text-foreground hover:text-primary transition-colors">
              Tokenomics
            </a>
            <a href="#roadmap" className="text-foreground hover:text-primary transition-colors">
              Roadmap
            </a>
            {!walletAddress ? (
              <Button 
                onClick={connectWallet}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Connect Wallet
              </Button>
            ) : (
              <Button onClick={disconnectWallet} className="bg-muted text-foreground">
                Disconnect ({walletAddress})
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            <a
              href="/#about"
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
            <a
              href="/#how-to-buy"
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              How to Buy
            </a>
            <a
              href="/tokenomics"
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tokenomics
            </a>
            <a
              href="#roadmap"
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Roadmap
            </a>
            {!walletAddress ? (
              <Button 
                onClick={connectWallet}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Connect Wallet
              </Button>
            ) : (
              <Button onClick={disconnectWallet} className="bg-muted text-foreground">
                Disconnect ({walletAddress})
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}