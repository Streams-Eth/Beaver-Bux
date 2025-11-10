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
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        
        const accs = Array.isArray(accounts) ? accounts : []
        if (accs.length > 0) {
          // Shorten the address for display
          const address = accs[0]
          const shortened = `${address.slice(0, 6)}...${address.slice(-4)}`
          setWalletAddress(shortened)
          try {
            // Persist raw address so other components can pick it up
            localStorage.setItem('bbux_wallet_address', address)
            // notify other components
            window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address } }))
          } catch (e) {}
        }
      } else {
        alert('Please install MetaMask or another Web3 wallet!')
      }
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