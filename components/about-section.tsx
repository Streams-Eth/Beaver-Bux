import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Coins, Shield, Users, Zap } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">About Beaver Bux</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            The next evolution of meme coins, eh? Beaver Bux is a community-driven cryptocurrency celebrating Canadian
            culture and bringing the power of decentralized finance to the Great White North.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-foreground text-balance">Why Beaver Bux?</h3>
            <p className="text-lg text-muted-foreground text-pretty">
              At the heart of the ecosystem lies $BBUX, the utility token fueling every corner of the Beaver Bux
              network. You&apos;re still early—just in time to witness the rise of a new golden era of meme coins, with the
              Beaver reigning supreme as king and Beaver Bux as the unstoppable force.
            </p>
            <p className="text-lg text-muted-foreground text-pretty">
              Built on cutting-edge blockchain technology, Beaver Bux combines the fun of meme culture with real utility
              and community governance. Join thousands of Canadians (and honorary Canadians) in building the future of
              crypto!
            </p>
          </div>

          <div className="relative">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbuxnorth-jLsLuOqN0VaRhe8zvuEn3WvpJKwdwm.png"
              alt="Beaver Bux Branding"
              width={600}
              height={400}
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="text-primary" size={24} />
              </div>
              <h4 className="text-xl font-bold text-foreground">Fair Launch</h4>
              <p className="text-muted-foreground text-pretty">
                No pre-mine, no team allocation. Everyone gets a fair shot at the presale.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Shield className="text-secondary" size={24} />
              </div>
              <h4 className="text-xl font-bold text-foreground">Secure & Audited</h4>
              <p className="text-muted-foreground text-pretty">
                Smart contracts audited by leading security firms for your peace of mind.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="text-accent" size={24} />
              </div>
              <h4 className="text-xl font-bold text-foreground">Community Driven</h4>
              <p className="text-muted-foreground text-pretty">
                Governance by the people, for the people. Your voice matters, eh!
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="pt-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Zap className="text-chart-4" size={24} />
              </div>
              <h4 className="text-xl font-bold text-foreground">Lightning Fast</h4>
              <p className="text-muted-foreground text-pretty">
                Built for speed with low fees. Trade faster than a beaver builds a dam!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
