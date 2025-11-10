"use client"

import React, { useEffect, useState } from "react"

// Client-only provider that dynamically imports wagmi and @wagmi/core
// at runtime so no browser-dependent code runs during server build/prerender.
// This keeps the server bundles free of wallets code that expects window/localStorage.

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [impl, setImpl] = useState<{
    WagmiConfig: any
    createConfig: (opts: any) => any
    injected?: () => any
    walletConnect?: (opts: any) => any
  } | null>(null)

  const [providerConfig, setProviderConfig] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [{ WagmiConfig }, core] = await Promise.all([
          import('wagmi'),
          import('@wagmi/core'),
        ])
        if (!mounted) return
        const newImpl = {
          WagmiConfig,
          createConfig: core.createConfig,
          injected: (core as any).injected,
          walletConnect: (core as any).walletConnect || (core as any).walletConnectConnector,
        }
        setImpl(newImpl)
        try {
          if (typeof window !== 'undefined') {
            ;(window as any).__WAGMI_IMPL_LOADED = true
            document?.body?.setAttribute?.('data-wagmi-impl', 'loaded')
            console.info('Web3Provider: wagmi impl loaded')
          }
        } catch (e) {}
      } catch (e) {
        console.error('Failed to load wagmi on client:', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  // When `impl` is ready, attempt to construct connectors explicitly and create
  // the wagmi config. Doing this async avoids depending on possibly-mismatched
  // factory exports and gives us control over connector construction.
  useEffect(() => {
    let mounted = true
    if (!impl) return
    ;(async () => {
      const connectors: any[] = []
      const projectId = (process.env.NEXT_PUBLIC_WC_PROJECT_ID as string) || 'de11ba5f58d1e55215339c2ebec078ac'

      // Try explicit InjectedConnector
      try {
        // @ts-ignore - some wagmi builds don't expose typings for the deep import
        const injectedMod = await import('wagmi/connectors/injected')
        const InjectedConnector = injectedMod?.InjectedConnector || injectedMod?.default || injectedMod
        if (InjectedConnector) {
          try { connectors.push(new InjectedConnector({})) } catch (e) { console.warn('Web3Provider: failed to instantiate InjectedConnector', e) }
        }
      } catch (e) {
        try { const inj = impl.injected && impl.injected(); if (inj) connectors.push(inj) } catch (ee) { console.warn('Web3Provider: no injected connector available', ee) }
      }

      // Try explicit WalletConnect connector
      try {
        // @ts-ignore - some wagmi builds don't expose typings for the deep import
        const wcMod = await import('wagmi/connectors/walletConnect')
        const WalletConnectConnector = wcMod?.WalletConnectConnector || wcMod?.default || wcMod
        if (WalletConnectConnector && projectId) {
          try { connectors.push(new WalletConnectConnector({ options: { projectId } })) } catch (e) { console.warn('Web3Provider: failed to instantiate WalletConnectConnector', e) }
        }
      } catch (e) {
        try { if (impl.walletConnect && projectId) { const wcFactory = impl.walletConnect; const wc = wcFactory({ projectId }); if (wc) connectors.push(wc) } } catch (ee) { console.warn('Web3Provider: walletConnect connector creation failed', ee) }
      }

      // Diagnostics
      try {
        const snapshot = connectors.map((c: any, i: number) => ({ index: i, type: typeof c, id: (c && (c.id || c.name)) || null, hasConnect: !!(c && (c.connect || c.connectAsync)) }))
        console.info('Web3Provider: connectors snapshot', snapshot)
        try { document?.body?.setAttribute?.('data-wagmi-connectors', JSON.stringify(snapshot)) } catch (e) {}
      } catch (e) {}

      if (connectors.length === 0) {
        console.warn('Web3Provider: no connectors available; skipping wagmi config')
        try { if (typeof window !== 'undefined') (window as any).__WAGMI_READY = false } catch (e) {}
        return
      }

      const bad = connectors.find((c) => !c || (typeof c !== 'object' && typeof c !== 'function'))
      if (bad) {
        console.warn('Web3Provider: found invalid connector, skipping wagmi config', bad)
        try { if (typeof window !== 'undefined') (window as any).__WAGMI_READY = false } catch (e) {}
        return
      }

      try {
        const cfg = impl.createConfig({ autoConnect: true, connectors })
        if (!mounted) return
        setProviderConfig(cfg)
        try { if (typeof window !== 'undefined') (window as any).__WAGMI_READY = true } catch (e) {}
        try { if (typeof window !== 'undefined') { (window as any).__WAGMI_PROVIDER_READY = true; document?.body?.setAttribute?.('data-wagmi-provider', 'ready'); console.info('Web3Provider: wagmi provider created') } } catch (e) {}
      } catch (createErr) {
        console.error('Web3Provider: createConfig failed, skipping wagmi provider', createErr)
        try { if (typeof window !== 'undefined') (window as any).__WAGMI_READY = false } catch (e) {}
        setProviderConfig(null)
      }
    })()
    return () => { mounted = false }
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

  if (!providerConfig) {
    // Failed to initialize wagmi provider — render children so the app is
    // usable (wallet-specific features will be no-ops). Log for debugging.
    console.warn("Wagmi provider not available; rendering children without Wagmi")
    return <>{children}</>
  }

  const WagmiConfig = impl.WagmiConfig
  return <WagmiConfig config={providerConfig}>{children}</WagmiConfig>
}
