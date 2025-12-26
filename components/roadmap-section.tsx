import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

export function RoadmapSection() {
  const phases = [
    {
      phase: "Phase 1",
      title: "Foundation",
      status: "completed",
      items: ["Smart contract development", "Website launch", "Community building", "Social media presence"],
    },
    {
      phase: "Phase 2",
      title: "Presale Launch",
      status: "current",
      items: ["Multi-stage presale", "Marketing campaign", "Partnerships & collaborations", "Airdrop distribution"],
    },
    {
      phase: "Phase 3",
      title: "Exchange Listings",
      status: "upcoming",
      items: ["DEX launch (Uniswap)", "CoinGecko listing", "CoinMarketCap listing", "CEX negotiations"],
    },
    {
      phase: "Phase 4",
      title: "Ecosystem Growth",
      status: "upcoming",
      items: ["NFT collection launch", "Staking platform", "Mobile app development", "Major exchange listings"],
    },
  ]

  return (
    <section id="roadmap" className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Roadmap</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Our journey to becoming Canada&apos;s #1 meme coin
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {phases.map((phase, index) => (
            <Card
              key={index}
              className={`bg-card border-2 ${
                phase.status === "current"
                  ? "border-primary shadow-lg shadow-primary/20"
                  : phase.status === "completed"
                    ? "border-primary/30"
                    : "border-border"
              }`}
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">{phase.phase}</span>
                  {phase.status === "completed" && <CheckCircle2 className="text-primary" size={20} />}
                  {phase.status === "current" && <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />}
                </div>

                <h3 className="text-2xl font-bold text-foreground">{phase.title}</h3>

                <ul className="space-y-2">
                  {phase.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm">
                      {phase.status === "completed" ? (
                        <CheckCircle2 className="text-primary mt-0.5 flex-shrink-0" size={16} />
                      ) : (
                        <Circle className="text-muted-foreground mt-0.5 flex-shrink-0" size={16} />
                      )}
                      <span
                        className={
                          phase.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {phase.status === "current" && (
                  <div className="pt-2">
                    <div className="text-xs text-primary font-semibold">IN PROGRESS</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
