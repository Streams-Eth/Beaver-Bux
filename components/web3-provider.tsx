"use client"

import React, { useEffect, useState, useMemo } from "react"

// Client-only provider that dynamically imports wagmi and @wagmi/core
// at runtime so no browser-dependent code runs during server build/prerender.
// This keeps the server bundles free of wallets code that expects window/localStorage.

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [impl, setImpl] = useState<{
    WagmiConfig: any
    createConfig: (opts: any) => any
    injected: () => any
  } | null>(null)
  const [loadError, setLoadError] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [{ WagmiConfig }, core] = await Promise.all([
          import("wagmi"),
          import("@wagmi/core"),
        ])
        if (!mounted) return
        setImpl({ WagmiConfig, createConfig: core.createConfig, injected: core.injected })
      } catch (e) {
        // If dynamic import fails, we fall back to rendering children without Wagmi.
        console.error("Failed to load wagmi on client:", e)
        setLoadError(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const provider = useMemo(() => {
    if (!impl) return null
    try {
      return impl.createConfig({ autoConnect: true, connectors: [impl.injected()] })
    } catch (e) {
      console.error("Failed to create wagmi config:", e)
      return null
    }
  }, [impl])

  // Do not render children until the wagmi implementation and provider are ready.
  // Rendering children early causes hooks like useAccount/useConnect to run
  // without a WagmiProvider which throws at runtime. Show a minimal placeholder
  // while wagmi is loading on the client.
  if (!impl || !provider) {
    // If we failed to load wagmi (e.g. dynamic import error), stop blocking
    // the entire app and render children unwrapped so the site doesn't show
    // an empty page. This keeps the app usable even when wagmi cannot be
    // initialized in the client environment.
    if (loadError) {
      return <>{children}</>
    }

    return <div aria-hidden="true" id="web3-loading" />
  }

  const WagmiConfig = impl.WagmiConfig
  return <WagmiConfig config={provider}>{children}</WagmiConfig>
}
