const faqs = [
  {
    question: "What is Beaver Bux?",
    answer:
      "Beaver Bux (BBUX) is a community-driven meme token focused on friendly, transparent participation and Canadian spirit.",
  },
  {
    question: "How do I buy BBUX?",
    answer:
      "Use the presale widget on the homepage to contribute with ETH, CAD, or PayPal (after connecting a wallet for delivery).",
  },
  {
    question: "When can I claim my tokens?",
    answer: "Claiming opens post-presale to ensure fair distribution and liquidity setup.",
  },
  {
    question: "What networks are supported?",
    answer:
      "The presale is live on Base mainnet. Confirm your wallet is connected to the correct chain before purchasing.",
  },
  {
    question: "Is there a minimum or maximum contribution?",
    answer:
      "Yes. The current range is 0.0005 ETH minimum and 0.25 ETH maximum per transaction during the presale stages.",
  },
  {
    question: "Where can I learn more?",
    answer: "Check the Whitepaper and Blog from the Resources section or reach us at hello@beaverbux.ca.",
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">Frequently Asked Questions</h1>
        <p className="text-lg text-foreground/80 mb-10">
          Quick answers to the most common questions about Beaver Bux and the presale.
        </p>
        <div className="grid gap-6">
          {faqs.map((item) => (
            <div key={item.question} className="p-6 rounded-lg border border-foreground/10 bg-card shadow-sm">
              <h2 className="text-xl font-semibold text-foreground mb-2">{item.question}</h2>
              <p className="text-foreground/80 leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
