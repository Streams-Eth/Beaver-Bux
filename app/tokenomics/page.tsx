export default function Tokenomics() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">📊 BBUX Tokenomics</h1>
      <p className="mb-6">
        Total Supply: <strong>1,000,000,000 BBUX</strong> (Fixed)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold">🔹 Presale – 10%</h2>
          <p>100M BBUX across 4 stages (Nov–Feb)</p>
        </div>
        <div className="border p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold">🔹 Liquidity & CEX – 20%</h2>
          <p>200M BBUX reserved for liquidity and future listings</p>
        </div>
        <div className="border p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold">🔹 Team & Advisors – 15%</h2>
          <p>Locked and vested over time to ensure long-term alignment</p>
        </div>
        <div className="border p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold">🔹 Staking & Rewards – 20%</h2>
          <p>Incentives for holders, gamers, and early adopters</p>
        </div>
        <div className="border p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold">🔹 Treasury – 25%</h2>
          <p>Governed by DAO for growth, partnerships, and development</p>
        </div>
        <div className="border p-4 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold">🔹 Community & Airdrops – 10%</h2>
          <p>Giveaways, contests, meme bounties, and viral marketing</p>
        </div>
      </div>
    </div>
  )
}
