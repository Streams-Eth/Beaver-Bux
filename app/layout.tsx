import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Beaver Bux | The Official Canadian Meme Coin",
  description:
    "Join the Beaver Bux revolution - Canada's premier meme cryptocurrency. Invest in the North's future today!",
  generator: "v0.app",
  alternates: {
    canonical: "https://beaverbux.io/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Beaver Bux | The Official Canadian Meme Coin",
    description:
      "Join the Beaver Bux revolution - Canada's premier meme cryptocurrency. Invest in the North's future today!",
    url: "https://beaverbux.io/",
    siteName: "Beaver Bux",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbuxbank-VOUNgxqX5pxf8wkmDJCNJGoxPDQFyA.png",
        width: 1200,
        height: 630,
        alt: "Beaver Bux Bank - Woodland Creatures with BBUX Coins",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beaver Bux | The Official Canadian Meme Coin",
    description:
      "Join the Beaver Bux revolution - Canada's premier meme cryptocurrency. Invest in the North's future today!",
    images: ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bbuxbank-VOUNgxqX5pxf8wkmDJCNJGoxPDQFyA.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Beaver Bux",
    url: "https://beaverbux.io/",
    logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-PWoLbePYdidboO5s67YqD1BhEvhSCH.png",
    sameAs: [
      "https://x.com/beaver_bux",
      "https://www.facebook.com/profile.php?id=61577355935290",
      "https://www.youtube.com/@BeaverBux",
      "https://discord.gg/dGSYrPV552",
      "https://t.me/BeaverBux",
    ],
  }

  try {
    return (
      <html lang="en">
        <head>
          <link
            rel="preconnect"
            href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com"
            crossOrigin="anonymous"
          />
          <link rel="icon" href="/favicon.ico" />
          <link rel="canonical" href="https://beaverbux.io/" />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <script
            src="https://www.paypal.com/sdk/js?client-id=AS6HlfoJXWFF-xqbhTeLn84IyegiYZwt9jQwfcwpdtaM0xbn2fIliPkGZWDsTjcrRYgbNWS3dUz-emhx&currency=CAD"
            async
          />
        </head>
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
          <Suspense fallback={null}>
            <Providers>{children}</Providers>
          </Suspense>
          <Analytics />
        </body>
      </html>
    )
  } catch (e) {
    // Defensive fallback for prerender/build environments. If an unexpected
    // runtime error occurs while rendering the root layout (which would
    // otherwise fail the build during prerender), return a minimal HTML
    // shell so the build can continue and surface the underlying error in
    // logs instead of aborting the whole process.
    console.error('RootLayout render error:', e)
    return (
      <html lang="en">
        <head />
        <body>
          <div style={{ padding: 32 }}>
            <h1>Beaver Bux</h1>
            <p>Site is temporarily unavailable during build. Check logs for details.</p>
          </div>
        </body>
      </html>
    )
  }
}
