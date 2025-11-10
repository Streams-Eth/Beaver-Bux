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
      // Defensive: ensure injected() exists and returns a sensible connector
      let injectedConnector: any = null
      try {
        if (typeof impl.injected === 'function') injectedConnector = impl.injected()
      } catch (e) {
        console.error('Injected connector init failed:', e)
        injectedConnector = null
      }

      if (!injectedConnector) {
        // If we couldn't initialize the injected connector, avoid calling
        // createConfig with a broken connectors array. Mark a load error so
        // we stop blocking the app and render children unwrapped.
        setLoadError(true)
        return null
      }

      return impl.createConfig({ autoConnect: true, connectors: [injectedConnector] })
    } catch (e) {
      console.error("Failed to create wagmi config:", e)
      setLoadError(true)
      return null
    }
  }, [impl])

  // Do not render children until the wagmi implementation and provider are ready.
  // Rendering children early causes hooks like useAccount/useConnect to run
  // without a WagmiProvider which throws at runtime. Show a minimal placeholder
  // while wagmi is loading on the client.
  if (!impl || !provider) {
    // If we failed to load wagmi, don't render children (they may call
    // wagmi hooks and throw). Instead show an explicit, visible fallback
    // message with a retry action so the site doesn't appear blank.
    if (loadError) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 8 }}>Wallet integration unavailable</h2>
          <p style={{ marginBottom: 12 }}>
            We couldn't initialize the on-page wallet integration (wagmi). Wallet
            features have been disabled for this session. You can reload the page
            or try again below.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                // attempt to re-run the dynamic import flow
                setLoadError(false)
                setImpl(null)
                // re-run effect by toggling a small state; we simply reassign
                // impl via the existing effect which watches nothing, so call
                // the import again manually here.
                ;(async () => {
                  try {
                    const [{ WagmiConfig }, core] = await Promise.all([
                      import('wagmi'),
                      import('@wagmi/core'),
                    ])
                    setImpl({ WagmiConfig, createConfig: core.createConfig, injected: core.injected })
                  } catch (e) {
                    console.error('Retry: Failed to load wagmi on client:', e)
                    setLoadError(true)
                  }
                })()
              }}
            >
              Retry
            </button>
            <button onClick={() => window.location.reload()}>Reload page</button>
          </div>
        </div>
      )
    }

    return <div aria-hidden="true" id="web3-loading" />
  }

  const WagmiConfig = impl.WagmiConfig
  return <WagmiConfig config={provider}>{children}</WagmiConfig>
}
