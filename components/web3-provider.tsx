"use client"

import React, { useEffect, useState } from "react"
import { normalizeAddress } from '@/lib/utils'

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

  // Normalize any existing bbux_wallet_address in localStorage on client startup.
  // If a stored address is not checksummed/normalized, replace it and broadcast
  // a `bbux:wallet-changed` event so other parts of the UI pick up the change.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const raw = localStorage.getItem('bbux_wallet_address')
      if (!raw) return
      const norm = normalizeAddress(raw) || raw
      if (norm && norm !== raw) {
        try { localStorage.setItem('bbux_wallet_address', norm) } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address: norm } })) } catch (e) {}
        console.info('Web3Provider: normalized stored bbux_wallet_address', { raw, norm })
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // When `impl` is ready, attempt to construct connectors explicitly and create
  // the wagmi config. Doing this async avoids depending on possibly-mismatched
  // factory exports and gives us control over connector construction.
  useEffect(() => {
    let mounted = true
    if (!impl) return
    ;(async () => {
  const connectors: any[] = []
  // finalConnectors will be assigned after we attempt normalization
  let finalConnectors: any[] = []
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
        // Normalize connectors: some impls return constructor functions or factories
        const normalized: any[] = []
        for (let i = 0; i < connectors.length; i++) {
          const c = connectors[i]
          if (!c) continue
          try {
            if (typeof c === 'function') {
              // Try calling, then try `new`, then try calling with projectId as fallback
              let inst: any = null
              try { inst = c() } catch (e) { /* ignore */ }
              if (!inst) {
                try { inst = new (c as any)() } catch (e) { /* ignore */ }
              }
              if (!inst && typeof projectId !== 'undefined') {
                try { inst = c({ projectId }) } catch (e) { /* ignore */ }
              }
              if (inst && (inst.connect || inst.connectAsync)) {
                normalized.push(inst)
                continue
              }
              // If still a function, push it through for diagnostics (we'll catch later)
              normalized.push(c)
              continue
            }
            if (typeof c === 'object') {
              // Already an instance-like object
              normalized.push(c)
              continue
            }
            // otherwise push as-is
            normalized.push(c)
          } catch (e) {
            console.warn('Web3Provider: error normalizing connector', e)
          }
        }

        const snapshot = normalized.map((c: any, i: number) => {
          let keys: string[] | null = null
          try { if (c && typeof c === 'object') keys = Object.keys(c).slice(0, 8) } catch (e) {}
          return {
            index: i,
            type: typeof c,
            id: (c && (c.id || c.name)) || null,
            hasConnect: !!(c && (c.connect || c.connectAsync)),
            keys,
          }
        })
        console.info('Web3Provider: connectors snapshot', snapshot)
        try { document?.body?.setAttribute?.('data-wagmi-connectors', JSON.stringify(snapshot)) } catch (e) {}
        // replace connectors with normalized set for createConfig
        // Only keep items that look like connector instances (have connect/connectAsync)
        const filtered = normalized.filter((c: any) => !!(c && (c.connect || c.connectAsync)))
        if (filtered.length !== normalized.length) {
          console.warn('Web3Provider: some connectors were dropped because they did not expose connect/connectAsync', { normalized, filtered })
        }
        finalConnectors = filtered
      } catch (e) {}

      if (connectors.length === 0) {
        console.warn('Web3Provider: no connectors available; skipping wagmi config')
        try { if (typeof window !== 'undefined') (window as any).__WAGMI_READY = false } catch (e) {}
        return
      }

      const bad = finalConnectors.find((c: any) => !c || (typeof c !== 'object' && typeof c !== 'function'))
      if (bad) {
        console.warn('Web3Provider: found invalid connector, skipping wagmi config', bad)
        try { if (typeof window !== 'undefined') (window as any).__WAGMI_READY = false } catch (e) {}
        return
      }

      try {
        // Wrap connectors in a small adapter layer to ensure the shape
        // createConfig expects (some wagmi builds return plain objects/functions)
        const adapters = finalConnectors.map((c: any) => {
          const id = (c && (c.id || c.name)) || 'unknown'
          const name = (c && c.name) || id
          return {
            id,
            name,
            // prefer connectAsync if available
            connectAsync: async (...args: any[]) => {
              if (!c) throw new Error('no connector')
              if (typeof c.connectAsync === 'function') return c.connectAsync(...args)
              if (typeof c.connect === 'function') return c.connect(...args)
              if (typeof c === 'function') return c(...args)
              throw new Error('connector has no connect function')
            },
            connect: async (...args: any[]) => {
              if (!c) throw new Error('no connector')
              if (typeof c.connect === 'function') return c.connect(...args)
              if (typeof c.connectAsync === 'function') return c.connectAsync(...args)
              if (typeof c === 'function') return c(...args)
              throw new Error('connector has no connect function')
            },
            disconnect: typeof c?.disconnect === 'function' ? (...a: any[]) => c.disconnect(...a) : undefined,
            getProvider: typeof c?.getProvider === 'function' ? (...a: any[]) => c.getProvider(...a) : undefined,
            getSigner: typeof c?.getSigner === 'function' ? (...a: any[]) => c.getSigner(...a) : undefined,
          }
        })
        console.info('Web3Provider: connector adapters prepared', adapters.map((a: any) => ({ id: a.id, name: a.name })))
        let cfg
        try {
          cfg = impl.createConfig({ autoConnect: true, connectors: adapters })
        } catch (innerErr) {
          console.warn('Web3Provider: createConfig with adapters failed, retrying with raw connectors', innerErr)
          try {
            cfg = impl.createConfig({ autoConnect: true, connectors: finalConnectors })
          } catch (rawErr) {
            // Extra diagnostics: serialize connector shapes (keys, function names, prototype)
            try {
              const details = (finalConnectors || []).map((c: any, i: number) => {
                const keys = [] as string[]
                const fns = [] as string[]
                try { Object.keys(c || {}).forEach(k => { keys.push(k); try { if (typeof (c as any)[k] === 'function') fns.push(k) } catch(e){} }) } catch(e){}
                let protoName = null
                try { const p = Object.getPrototypeOf(c); protoName = p && p.constructor && p.constructor.name } catch(e){}
                return { index: i, id: (c && (c.id || c.name)) || null, type: typeof c, keys, fns, protoName }
              })
              try { document?.body?.setAttribute?.('data-wagmi-connectors-detailed', JSON.stringify(details)) } catch(e){}
              console.error('Web3Provider: createConfig failed for raw connectors', rawErr, { details })
            } catch (ee) {}
            throw rawErr
          }
        }
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
