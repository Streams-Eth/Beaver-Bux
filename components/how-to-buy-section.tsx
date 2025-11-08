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
      color: "bg-accent/10 text-accent",
    },
  ]

  return (
    <section id="how-to-buy" className="py-20 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">How to Buy BBUX</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Get started in three simple steps. It's easier than ordering poutine!
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
          <p className="text-sm text-muted-foreground">
            Need help? Join our {" "}
            <a href="#" className="text-primary hover:underline font-semibold">
              Telegram community
            </a>{" "}
            or check out our {" "}
            <a href="#" className="text-primary hover:underline font-semibold">
              detailed guide
            </a>
          </p>

          <div className="mt-4">
            <a
              href="/claim/bbux-claim-sara-0003"
              className="inline-block px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Claim your tokens
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
