"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            <a href="#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="#how-to-buy" className="text-foreground hover:text-primary transition-colors">
              How to Buy
            </a>
            <a href="/tokenomics" className="text-foreground hover:text-primary transition-colors">
              Tokenomics
            </a>
            <a href="#roadmap" className="text-foreground hover:text-primary transition-colors">
              Roadmap
            </a>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Connect Wallet</Button>
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
              href="#about"
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </a>
            <a
              href="#how-to-buy"
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
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Connect Wallet</Button>
          </nav>
        )}
      </div>
    </header>
  )
}
