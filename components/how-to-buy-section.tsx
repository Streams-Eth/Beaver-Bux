import { Card, CardContent } from "@/components/ui/card"
import { Wallet, ArrowRightLeft, ShoppingCart } from "lucide-react"

export function HowToBuySection() {
  const steps = [
    {
      icon: Wallet,
      title: "Connect Your Wallet",
      description:
        "Get a DeFi crypto wallet such as MetaMask, Trust Wallet, or Coinbase Wallet. Connect it to the presale widget at the top of this page.",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: ArrowRightLeft,
      title: "Buy With ETH or USDT",
      description:
        "Transfer ETH or USDT to your wallet. Make sure you have enough ETH to cover gas fees. Use ETH (ERC20) or USDT to purchase BBUX.",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: ShoppingCart,
      title: "Claim Your BBUX",
      description:
        "After the presale ends, return to this site and claim your BBUX tokens. You can also claim airdrop rewards if eligible!",
      color: "bg-accent text-accent-foreground shadow-sm",
    },
  ]

  return (
    <section id="how-to-buy" className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">How to Buy BBUX</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Get started in three simple steps. It&apos;s easier than ordering poutine!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="bg-card border-border relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-full ${step.color} flex items-center justify-center`}>
                    <step.icon size={28} />
                  </div>
                  <div className="text-6xl font-bold text-muted/10 group-hover:text-primary/10 transition-colors">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground text-balance">{step.title}</h3>
                <p className="text-muted-foreground text-pretty">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            Need help? Join our
              <a
                href="https://t.me/BeaverBuxChannel"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                aria-label="Join the Beaver Bux Telegram community"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-.99.53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.03-.74 4.04-1.76 6.73-2.92 8.08-3.49 3.85-1.61 4.65-1.89 5.17-1.9.11 0 .37.03.54.17.14.11.18.26.2.37.01.08.03.29.01.45z" fill="currentColor"/>
                </svg>
                Telegram community
              </a>
            or email us @
            <a href="mailto:hello@beaverbux.ca" className="text-primary hover:underline font-semibold">
              hello@beaverbux.ca
            </a>
          </p>

          <div className="mt-4">
            <div className="inline-block px-6 py-2 bg-muted text-muted-foreground rounded-lg font-semibold cursor-not-allowed" title="Token claims available after Stage 1 ends (March 31, 2026)">
              Claim Tokens (Coming Soon)
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tokens claimable after Stage 1 ends: March 31, 2026</p>
          </div>
        </div>
      </div>
    </section>
  )
}
