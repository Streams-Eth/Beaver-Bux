export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">Beaver Bux Blog</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Stay updated with the latest news, updates, and stories from the Beaver Bux community.
          </p>

          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground text-lg">
              Blog posts coming soon! Follow us on social media for the latest updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
