"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PresaleWidget } from "@/components/presale-widget"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Content */}
          <div className="space-y-8">
            <div className="inline-block">
              <div className="bg-accent/10 border border-accent/20 rounded-full px-4 py-2 text-sm font-medium text-accent">
                🍁 The Official Canadian Meme Coin
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight text-balance">BEAVER BUX</h1>

            <p className="text-2xl md:text-3xl text-muted-foreground font-medium text-balance">
              The Official Meme Currency of the North
            </p>

            <p className="text-lg text-muted-foreground max-w-xl text-pretty">
              Join the revolution! Beaver Bux is Canada's premier meme cryptocurrency, bringing the spirit of the Great
              White North to the blockchain. Eh, what are you waiting for?
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8">
                Buy BBUX Now
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent" asChild>
                <a href="/whitepaper">View Whitepaper</a>
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">$0.0001</div>
                <div className="text-sm text-muted-foreground">Current Price</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">Stage 1</div>
                <div className="text-sm text-muted-foreground">Presale Phase</div>
              </div>
            </div>
          </div>

          {/* Right Column - Presale Widget */}
          <div className="flex justify-center lg:justify-end">
            <PresaleWidget />
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 rounded-2xl overflow-hidden border border-border shadow-2xl">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbuxbank-VOUNgxqX5pxf8wkmDJCNJGoxPDQFyA.png"
            alt="Beaver Bux Bank - Woodland Creatures with BBUX Coins"
            width={1200}
            height={600}
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  )
}
