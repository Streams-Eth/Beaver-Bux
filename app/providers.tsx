"use client"

import React from "react"
import { Web3Provider } from "@/components/web3-provider"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({}))
  // Allow quickly disabling the wagmi/Web3 provider for local dev/debugging.
  // This helps when wallet/provider wiring causes a blank page — set the
  // env var NEXT_PUBLIC_DISABLE_WAGMI=true in .env.local (or set
  // window.__BBUX_DISABLE_WAGMI = true in the browser console) to bypass
  // creating/using the Web3Provider while still keeping react-query active.
  const disabledAtBuild = (process.env.NEXT_PUBLIC_DISABLE_WAGMI === '1' || process.env.NEXT_PUBLIC_DISABLE_WAGMI === 'true')
  // TEMP: Force disable wagmi due to persistent QueryClient mount errors
  // The fallback wallet connection (MetaMask direct) works fine without wagmi
  const [disableWagmi, setDisableWagmi] = React.useState<boolean>(true)
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if ((window as any).__BBUX_DISABLE_WAGMI) setDisableWagmi(true)
      }
    } catch (e) {}
  }, [])
  React.useEffect(() => {
    try {
      // Signal to other client code that a QueryClientProvider has been
      // mounted and react-query context is available. Components that use
      // wagmi/react-query should wait for this flag before calling hooks.
      if (typeof window !== 'undefined') (window as any).__BBUX_QUERY_CLIENT = true
    } catch (e) {}
    return () => {
      try { if (typeof window !== 'undefined') delete (window as any).__BBUX_QUERY_CLIENT } catch (e) {}
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {/* Pass the same QueryClient instance into Web3Provider so wagmi uses
          the identical react-query context instead of creating a separate
          instance. This prevents "No QueryClient set" or mismatched-context
          errors when wagmi expects the QueryClient passed into createConfig. */}
      {disableWagmi ? (
        // Render children without Web3Provider when disabled so the app can
        // continue loading other UI while we fix the wallet/provider issue.
        <>{children}</>
      ) : (
        <Web3Provider queryClient={queryClient}>{children}</Web3Provider>
      )}
    </QueryClientProvider>
  )
}
