import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function Whitepaper() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-8 pt-32">
          <h1 className="text-4xl font-bold mb-6">Beaver Bux (BBUX) Whitepaper</h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Beaver Bux (BBUX) is a community-driven ERC-20 token that merges meme culture with real DeFi utility.
              Inspired by the industrious nature of beavers, BBUX empowers users to build, stake, and earn in a humorous
              yet functional Web3 ecosystem.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">2. Problem Statement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Most meme coins lack substance or sustainability. BBUX changes this by delivering both hype and utility
              through transparent tokenomics, a clear roadmap, and staking/gaming integrations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">3. Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              Build a meme-powered financial ecosystem where BBUX holders can laugh, earn, and govern the future of the
              Beaververse.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">4. Utility</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>Buy goods and services within the ecosystem</li>
              <li>Participate in mini-games and staking</li>
              <li>Vote in future DAO proposals</li>
              <li>Access exclusive NFT drops and events</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">5. Roadmap</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Q4 2025:</strong> Website launch, smart contracts deployed, presale begins
              </li>
              <li>
                <strong>Q1 2026:</strong> DEX listing, staking pool, meme competitions
              </li>
              <li>
                <strong>Q2 2026:</strong> DAO launch, NFT marketplace, mobile beta
              </li>
              <li>
                <strong>Q3 2026:</strong> Full game release, Tier 1 CEX listing push
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-2">6. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              BBUX uses verified ERC-20 contracts with locked liquidity, a capped total supply, and no mint functions —
              making it unruggable and fully transparent.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
