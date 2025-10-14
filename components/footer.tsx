import Image from "next/image"
import { Twitter, Send, Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-PWoLbePYdidboO5s67YqD1BhEvhSCH.png"
                alt="Beaver Bux Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-xl font-bold">BEAVER BUX</span>
            </div>
            <p className="text-sm text-background/70 text-pretty">
              The Official Meme Currency of the North. Join the revolution, eh!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-background/70 hover:text-background transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#how-to-buy" className="text-background/70 hover:text-background transition-colors">
                  How to Buy
                </a>
              </li>
              <li>
                <a href="/tokenomics" className="text-background/70 hover:text-background transition-colors">
                  Tokenomics
                </a>
              </li>
              <li>
                <a href="#roadmap" className="text-background/70 hover:text-background transition-colors">
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/whitepaper" className="text-background/70 hover:text-background transition-colors">
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors">
                  Audit Report
                </a>
              </li>
              <li>
                <a href="/blog" className="text-background/70 hover:text-background transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-bold mb-4">Community</h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
              >
                <Send size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
              >
                <Github size={20} />
              </a>
            </div>
            <p className="text-sm text-background/70 mt-4">Join our community of over 10,000 members!</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/70">© 2025 Beaver Bux. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-background/70 hover:text-background transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-background/70 hover:text-background transition-colors">
              Terms of Service
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-xs text-background/50 text-center max-w-4xl mx-auto">
          <p className="text-pretty">
            Disclaimer: Cryptocurrency investments carry risk. BBUX is a meme token created for entertainment and
            community purposes. Always do your own research and never invest more than you can afford to lose. This is
            not financial advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
