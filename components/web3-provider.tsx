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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [{ WagmiConfig }, core] = await Promise.all([
          import("wagmi"),
          import("@wagmi/core"),
        ])
        if (!mounted) return
        const newImpl = { WagmiConfig, createConfig: core.createConfig, injected: core.injected }
        setImpl(newImpl)
        try {
          if (typeof window !== "undefined") {
            ;(window as any).__WAGMI_IMPL_LOADED = true
            // expose for quick debugging in deployed consoles
            document?.body?.setAttribute?.('data-wagmi-impl', 'loaded')
            console.info('Web3Provider: wagmi impl loaded')
          }
        } catch (e) {}
      } catch (e) {
        // If dynamic import fails, we fall back to rendering children without Wagmi.
        console.error("Failed to load wagmi on client:", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const provider = useMemo(() => {
    if (!impl) return null
    try {
      const cfg = impl.createConfig({ autoConnect: true, connectors: [impl.injected()] })
      try {
        // Mark global flag so client components can detect that a Wagmi
        // provider was successfully created. Some components render before
        // the provider is ready; they can check this flag and avoid calling
        // wagmi hooks when false to prevent provider-not-found errors.
        if (typeof window !== "undefined") (window as any).__WAGMI_READY = true
        try {
          if (typeof window !== "undefined") {
            ;(window as any).__WAGMI_PROVIDER_READY = true
            document?.body?.setAttribute?.('data-wagmi-provider', 'ready')
            console.info('Web3Provider: wagmi provider created')
          }
        } catch (e) {}
      } catch (e) {
        // ignore
      }
      return cfg
    } catch (e) {
      console.error("Failed to create wagmi config:", e)
      try {
        if (typeof window !== "undefined") (window as any).__WAGMI_READY = false
      } catch (ee) {}
      return null
    }
  }, [impl])

  // While wagmi is still being dynamically imported, keep a minimal loading
  // placeholder so server/client hydration remains stable. Once the import
  // has completed (`impl` is set) but we couldn't create a provider, allow
  // the app to render children unwrapped (this prevents a blank page). Some
  // components may still call wagmi hooks and will throw if they expect the
  // provider; if that happens we should add targeted guards in those
  // components. For now prefer showing the UI rather than a blank screen.
  if (!impl) {
    return <div aria-hidden="true" id="web3-loading" />
  }

  if (!provider) {
    // Failed to initialize wagmi provider — render children so the app is
    // usable (wallet-specific features will be no-ops). Log for debugging.
    console.warn("Wagmi provider not available; rendering children without Wagmi")
    return <>{children}</>
  }

  const WagmiConfig = impl.WagmiConfig
  return <WagmiConfig config={provider}>{children}</WagmiConfig>
}
