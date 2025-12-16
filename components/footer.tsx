import Image from "next/image"
import Script from "next/script"
import { Twitter, Youtube } from "lucide-react"

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
                <a href="https://www.freshcoins.io/audit/beaver-bux" className="text-background/70 hover:text-background transition-colors">
                  Audit Report
                </a>
              </li>
                <li>
                <a href="https://github.com/freshcoins/KYC/blob/main/BeaverBux_KYC.pdf" className="text-background/70 hover:text-background transition-colors">
                  KYC
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
                href="https://x.com/beaver_bux"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61577355935290"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                aria-label="Beaver Bux on Facebook"
              >
                {/* Simple Facebook "f" svg */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M22 12C22 6.48 17.52 2 12 2S2 6.48 2 12c0 4.84 3.44 8.84 8 9.8V14.7H7.5v-2.7H10V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6v1.8h2.7l-.4 2.7h-2.3V21.8c4.6-.96 8-4.96 8-9.8z" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://discord.gg/dGSYrPV552"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                aria-label="Beaver Bux on Discord"
              >
                {/* Discord logo svg */}
                <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M60.104 4.552A58.768 58.768 0 0047.58.77a41.59 41.59 0 00-2.2 4.48c-6.62-1.01-13.41-1.01-20.02 0a41.487 41.487 0 00-2.21-4.48 58.806 58.806 0 00-12.525 3.782C3.5 18.07-.5 31.06.5 43.943 14.02 50.14 27.36 50.68 40.9 50.5c13.61.18 26.99-.77 39.47-6.557 1.1-13.002-3.9-26.013-19.266-39.391zM23.5 37.2c-3.1 0-5.6-2.8-5.6-6.2 0-3.4 2.5-6.2 5.6-6.2 3.1 0 5.6 2.8 5.6 6.2 0 3.4-2.5 6.2-5.6 6.2zm24 0c-3.1 0-5.6-2.8-5.6-6.2 0-3.4 2.5-6.2 5.6-6.2 3.1 0 5.6 2.8 5.6 6.2 0 3.4-2.5 6.2-5.6 6.2z" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@BeaverBux"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 flex items-center justify-center transition-colors"
                aria-label="Beaver Bux on YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
            <p className="text-sm text-background/70 mt-4">Join our community of over 10,000 members!</p>
            <div className="mt-4">
              <Script src="https://www.freshcoins.io/widget.js" strategy="lazyOnload" />
              <div id="fcn-widget" data-slug="beaver-bux" data-market="false" data-style="light"></div>
            </div>
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
