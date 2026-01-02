import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function Whitepaper() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-8 pt-32">
          <h1 className="text-4xl font-bold mb-4">Beaver Bux (BBUX) - Technical Overview</h1>
          <p className="text-muted-foreground mb-8">Version: 1.0 • Date: January 2, 2026</p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">1. Token Specifications</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>Network: Base (Ethereum L2)</li>
              <li>Standard: ERC-20</li>
              <li>Total Supply: 1,000,000,000 BBUX (fixed)</li>
              <li>Decimals: 18</li>
              <li>
                Contract: <a className="text-primary hover:underline" href="https://basescan.org/token/0xfe8cd3d5d38bfd9bd7499def67ed170c53583b86">0xFE8Cd3d5D38bFd9BD7499dEF67ed170C53583B86</a>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">2. Distribution</h2>
            <div className="my-4 w-full overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="bg-transparent whitespace-nowrap border-b border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-4 sm:text-sm">Purpose</th>
                    <th className="bg-transparent whitespace-nowrap border-b border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-4 sm:text-sm">Amount</th>
                    <th className="bg-transparent whitespace-nowrap border-b border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-4 sm:text-sm">%</th>
                    <th className="bg-transparent whitespace-nowrap border-b border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 sm:px-4 sm:text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">Presale</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">100,000,000</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">10%</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">Active</td>
                  </tr>
                  <tr className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">Liquidity</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">400,000,000</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">40%</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">Lock post-presale</td>
                  </tr>
                  <tr className="border-b border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">Community Reserve</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">500,000,000</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">50%</td>
                    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 sm:px-4 sm:text-base">Airdrops &amp; governance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">3. Security Framework</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>
                Ownership: Gnosis Safe multisig (<a className="text-primary hover:underline" href="https://basescan.org/address/0x2aaac9046c18951e1ac8359ceaec75326c5f1f88">0x2aaac904...26C5f1F88</a>)
              </li>
              <li>Liquidity Lock: To be executed via PinkLock (proof published post-lock)</li>
              <li>
                Audits: <a className="text-primary hover:underline" href="https://www.freshcoins.io/audit/beaver-bux">FreshCoins Report</a>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">4. Operational Processes</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>
                Presale: Managed by contract <a className="text-primary hover:underline" href="https://basescan.org/address/0xf479063e290e85e1470a11821128392f6063790b">0xf479063e...F6063790b</a>
              </li>
              <li>Airdrops: Conducted using Disperse.app with on-chain verification</li>
              <li>Governance: Future proposals via Snapshot.org</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-3">5. Roadmap</h2>
            <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
              <li>Q1 2026: CEX listings, liquidity lock</li>
              <li>Q2 2026: Community governance launch</li>
              <li>Q3 2026: Merchant payment integrations</li>
            </ul>
          </section>

          <div className="mt-8 text-sm text-muted-foreground flex flex-wrap gap-4">
            <a className="text-primary hover:underline" href="https://beaverbux.ca/security">Security Portal</a>
            <span className="text-foreground/40">|</span>
            <a className="text-primary hover:underline" href="https://basescan.org/token/0xfe8cd3d5d38bfd9bd7499def67ed170c53583b86">BaseScan Contract</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
