import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export function TokenomicsSection() {
  const data = [
    { name: "Treasury", value: 25, color: "#2d7a4f" },
    { name: "Liquidity & CEX", value: 20, color: "#c9a961" },
    { name: "Staking & Rewards", value: 20, color: "#5a8a6f" },
    { name: "Team & Advisors", value: 15, color: "#c94f3f" },
    { name: "Presale", value: 10, color: "#d4a574" },
    { name: "Community", value: 10, color: "#8ab88a" },
  ]

  const stats = [
    { label: "Total Supply", value: "1,000,000,000 BBUX" },
    { label: "Presale Allocation", value: "100M BBUX (10%)" },
    { label: "Liquidity & CEX", value: "200M BBUX (20%)" },
    { label: "Blockchain", value: "Base (ERC-20)", showBaseLogo: true },
  ]

  return (
    <section id="tokenomics" className="py-20 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Tokenomics</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            A fair and transparent distribution designed for long-term success
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Pie Chart */}
          <Card className="bg-card border-border p-6">
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">{stat.label}</span>
                    <span className="text-foreground font-bold text-lg flex items-center gap-2">
                      {stat.showBaseLogo && (
                        <svg width="20" height="20" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="#0052FF"/>
                        </svg>
                      )}
                      {stat.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 space-y-3">
                <h4 className="text-xl font-bold text-foreground">Distribution Breakdown</h4>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>10% Presale:</strong> 100M BBUX (Nov–Feb stages)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>15% Team & Advisors:</strong> Locked and vested
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>10% Community:</strong> Airdrops, contests, memes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>20% Liquidity & CEX:</strong> 200M BBUX (LP + listings)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>20% Staking & Rewards:</strong> Ecosystem and games
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>25% Treasury:</strong> DAO and development
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
