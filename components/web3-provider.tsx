"use client"

import React, { useEffect, useState } from "react"
import { QueryClientProvider } from '@tanstack/react-query'
import { normalizeAddress } from '@/lib/utils'

// Client-only provider that dynamically imports wagmi and @wagmi/core
// at runtime so no browser-dependent code runs during server build/prerender.
// This keeps the server bundles free of wallets code that expects window/localStorage.

export function Web3Provider({ children, queryClient: passedQueryClient }: { children: React.ReactNode, queryClient?: any }) {
  // Ensure we have a QueryClient instance to provide to react-query hooks.
  // Prefer the QueryClient passed from app-level Providers so the same instance
  // is shared across the app. If none is passed, create a local one.
  const [internalQueryClient, setInternalQueryClient] = useState<any>(() => passedQueryClient || undefined)
  const [internalRQModule, setInternalRQModule] = useState<any>(null)
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
        // Import wagmi and @wagmi/core. Different builds may export members
        // under default or named exports; be defensive about locating
        // `WagmiConfig` and `createConfig`.
      const wagmiMod = await import('wagmi')
        const core = await import('@wagmi/core')
        if (!mounted) return
        const WagmiConfig = wagmiMod.WagmiConfig || (wagmiMod as any).default?.WagmiConfig || (wagmiMod as any).default || wagmiMod
        const createConfig = core.createConfig || (core as any).default?.createConfig || (core as any).createConfig
        const newImpl = {
          WagmiConfig,
          createConfig,
          Context: wagmiMod.Context,
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
  const InjectedConnector = injectedMod?.InjectedConnector || (injectedMod as any).default || injectedMod
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
  const WalletConnectConnector = wcMod?.WalletConnectConnector || (wcMod as any).default || wcMod
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
        // createConfig expects an array of connector *factory* functions
        // (each called with { emitter, chains, storage, transports }) that
        // return the connector object. We may have instances or plain
        // objects at runtime, so wrap them into factory functions that
        // delegate to the underlying implementation.
        const connectorFns = finalConnectors.map((c: any) => {
          const id = (c && (c.id || c.name)) || 'unknown'
          const name = (c && c.name) || id
          // Return a factory function with the expected signature
          const factory: any = (params: any) => {
            // If the candidate already looks like a factory (function), try to call it
            if (typeof c === 'function') {
              try {
                const maybe = c(params)
                if (maybe && typeof maybe === 'object') return maybe
              } catch (e) {
                // ignore and fallthrough to wrapper below
              }
            }
            // Wrap the existing instance/object into the connector shape
            const wrapper: any = {
              id,
              name,
              type: c?.type || 'injected',
              // setup may be used by wagmi; forward to underlying if present
              setup: typeof c?.setup === 'function' ? () => c.setup(params) : undefined,
              // Provide connect/connectAsync that delegate to the underlying connector
              connect: async (connectParams?: any) => {
                if (!c) throw new Error('no connector')
                if (typeof c.connect === 'function') return c.connect(connectParams)
                if (typeof c.connectAsync === 'function') return c.connectAsync(connectParams)
                // Some connectors return a function (callable) that performs connect
                if (typeof c === 'function') return c(connectParams)
                throw new Error('connector has no connect function')
              },
              connectAsync: async (connectParams?: any) => {
                if (!c) throw new Error('no connector')
                if (typeof c.connectAsync === 'function') return c.connectAsync(connectParams)
                if (typeof c.connect === 'function') return c.connect(connectParams)
                if (typeof c === 'function') return c(connectParams)
                throw new Error('connector has no connect function')
              },
              disconnect: typeof c?.disconnect === 'function' ? (...a: any[]) => c.disconnect(...a) : undefined,
              getProvider: typeof c?.getProvider === 'function' ? (...a: any[]) => c.getProvider(...a) : undefined,
              getSigner: typeof c?.getSigner === 'function' ? (...a: any[]) => c.getSigner(...a) : undefined,
              getAccounts: typeof c?.getAccounts === 'function' ? (...a: any[]) => c.getAccounts(...a) : undefined,
              getChainId: typeof c?.getChainId === 'function' ? (...a: any[]) => c.getChainId(...a) : undefined,
              // allow connector to advertise rdns (multi-injected discovery)
              rdns: c?.rdns,
              supportsSimulation: c?.supportsSimulation,
            }
            // Provide a minimal setStorage implementation expected by some wagmi versions
            // If the underlying connector supports setStorage, forward to it. Otherwise
            // store the storage object locally so other wrapper methods can access it.
            try {
              wrapper.setStorage = (s: any) => {
                try {
                  if (c && typeof c.setStorage === 'function') return c.setStorage(s)
                } catch (e) {}
                ;(wrapper as any)._storage = s
              }
            } catch (e) {}
            // If the factory previously received a storage object, populate wrapper
            try {
              if ((factory as any)._storage) {
                ;(wrapper as any)._storage = (factory as any)._storage
              }
            } catch (e) {}
            return wrapper
          }
          // Some wagmi versions call setStorage on the connector *factory* itself
          // before invoking it. Provide that API and forward to underlying connector
          // or stash the storage on the factory for later when wrapper is created.
          try {
            factory.setStorage = (s: any) => {
              try {
                if (c && typeof c.setStorage === 'function') return c.setStorage(s)
              } catch (e) {}
              ;(factory as any)._storage = s
            }
          } catch (e) {}
          return factory
        })
        console.info('Web3Provider: connector factories prepared', connectorFns.map((f: any, i: number) => ({ index: i })))
        let cfg
        try {
          // Some wagmi builds expect a QueryClient instance passed into createConfig
          // to populate react-query context used by wagmi hooks. Dynamically import
          // @tanstack/react-query here so we use the same runtime copy and avoid
          // "No QueryClient set" errors (or mismatched instances).
          let queryClient: any = undefined
          // Only use the QueryClient passed from the app to avoid module mismatches
          if (passedQueryClient) {
            queryClient = passedQueryClient
            console.debug('Web3Provider: using app-provided QueryClient')
          } else {
            console.warn('Web3Provider: no app QueryClient provided, creating config without queryClient')
          }
          const cfgOpts: any = { autoConnect: true, connectors: connectorFns }
          // Prefer a QueryClient passed from the app-level Providers to ensure a
          // single react-query instance is shared across the app and wagmi.
          if (passedQueryClient) cfgOpts.queryClient = passedQueryClient
          else if (queryClient) cfgOpts.queryClient = queryClient
          try {
            console.debug('Web3Provider: createConfig cfgOpts queryClient present?', !!cfgOpts.queryClient, cfgOpts.queryClient && cfgOpts.queryClient.constructor && cfgOpts.queryClient.constructor.name)
          } catch (e) {}
          cfg = impl.createConfig(cfgOpts)
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
  }, [impl, passedQueryClient])

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

  // Resolve possible module shapes for WagmiConfig (named export, default export,
  // or wrapped module). Be defensive because different bundlings expose members
  // differently. Prefer using the exported `Context.Provider` when available
  // because it is a stable React context object and avoids calling into a
  // wrapper component that may have bundler-specific expectations.
  let WagmiConfig: any = impl.WagmiConfig
  try {
    if (!WagmiConfig) {
      // try fallback locations
      WagmiConfig = (impl as any).WagmiConfig || (impl as any).default || (impl as any)
    }
    // If it's a module namespace with .default or nested WagmiConfig, prefer that
    if (WagmiConfig && typeof WagmiConfig === 'object') {
      WagmiConfig = WagmiConfig.WagmiConfig || WagmiConfig.default || WagmiConfig
    }
  } catch (e) {
    console.warn('Web3Provider: unable to normalize WagmiConfig', e)
  }

  // Prefer rendering the bundled WagmiConfig component when available. Wagmi's
  // `WagmiConfig` mounts internal providers (including react-query's
  // QueryClientProvider) that wagmi's hooks expect. Falling back to
  // rendering `Context.Provider` alone is unsafe because it doesn't set up
  // react-query context; in that case we attempt to wrap the Context with the
  // react-query QueryClientProvider using the QueryClient from the provider
  // config (if present).
  try {
    try {
      console.debug('Web3Provider: WagmiConfig type:', typeof WagmiConfig)
      console.debug('Web3Provider: WagmiConfig:', WagmiConfig)
      console.debug('Web3Provider: providerConfig keys:', providerConfig && Object.keys(providerConfig || {}))
      console.debug('Web3Provider: impl keys:', impl && Object.keys(impl || {}))
    } catch (logErr) {
      /* ignore logging errors */
    }
    // Prefer WagmiConfig component (it often sets up internal react-query
    // provider). Wrap it in the app's QueryClientProvider to ensure the
    // react-query context available to wagmi hooks is the same instance the
    // rest of the app uses. This avoids "No QueryClient set" and mismatch
    // issues when wagmi and the app otherwise end up using different
    // react-query instances.
    if (WagmiConfig && (typeof WagmiConfig === 'function' || typeof WagmiConfig === 'object')) {
      // Only use the app-provided QueryClient to avoid module mismatches
      const qc = passedQueryClient
      
      if (!qc) {
        console.warn('Web3Provider: no app QueryClient available, rendering children without wagmi')
        return <>{children}</>
      }
      try {
        try { console.debug('Web3Provider: wrapping WagmiConfig with QueryClient of type', qc && qc.constructor && qc.constructor.name) } catch (e) {}
        try { console.debug('Web3Provider: queryClient keys', Object.keys(qc || {}).slice(0,20)) } catch (e) {}
        try { console.debug('Web3Provider: queryClient.mount exists?', !!(qc as any)?.mount) } catch (e) {}
      } catch (e) {}

      // Use the static QueryClientProvider (imported at top of file) since we're only
      // using the app-provided QueryClient which comes from the same module
      console.debug('Web3Provider: using static QueryClientProvider')

      // Final safety check before rendering
      try {
        if (!qc || typeof qc !== 'object' || !qc.constructor) {
          console.warn('Web3Provider: Final safety check failed, rendering without wagmi provider', {
            hasQc: !!qc,
            qcType: typeof qc,
            hasConstructor: !!(qc && qc.constructor)
          })
          return <>{children}</>
        }
      } catch (e) {
        console.warn('Web3Provider: Final safety check threw error, rendering without wagmi provider', e)
        return <>{children}</>
      }

      // Wrap the wagmi rendering in try-catch to prevent mount errors from crashing the app
      try {
        console.debug('Web3Provider: attempting to render WagmiConfig with QueryClientProvider')
        return (
          <QueryClientProvider client={qc}>
            <WagmiConfig config={providerConfig}>{children}</WagmiConfig>
          </QueryClientProvider>
        )
      } catch (renderError) {
        console.error('Web3Provider: failed to render WagmiConfig due to QueryClient mount error, falling back to children only', renderError)
        return <>{children}</>
      }
    }

    // If WagmiConfig isn't available, try to render Context.Provider but
    // ensure a QueryClientProvider wraps it if wagmi created one in its args.
    if (impl && (impl as any).Context && (impl as any).Context.Provider) {
      const Provider = (impl as any).Context.Provider
      // providerConfig may include the queryClient under .args.queryClient
      const maybeQueryClient = providerConfig && providerConfig.args && providerConfig.args.queryClient
      if (maybeQueryClient) {
        return (
          <QueryClientProvider client={maybeQueryClient}>
            <Provider value={providerConfig}>{children}</Provider>
          </QueryClientProvider>
        )
      }
      return <Provider value={providerConfig}>{children}</Provider>
    }

    console.warn('Web3Provider: no valid wagmi provider found, rendering children without Wagmi')
    return <>{children}</>
  } catch (e) {
    console.error('Web3Provider: failed to render wagmi provider, falling back to children', e)
    try { console.error('Web3Provider: WagmiConfig value (raw):', WagmiConfig) } catch (ee) {}
    try { console.error('Web3Provider: providerConfig (raw):', providerConfig) } catch (ee) {}
    try { console.error('Web3Provider: impl (raw):', impl) } catch (ee) {}
    return <>{children}</>
  }
}
