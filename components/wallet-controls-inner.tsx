"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const DynamicHooks = dynamic(() => import('./wallet-controls-hooks'), { ssr: false })

export default function WalletControlsInner(props: any) {
  // Only render the hooks-using component when both wagmi and the app-level
  // QueryClient are signalled as ready. This avoids calling wagmi hooks before
  // the QueryClientProvider is mounted which causes the "No QueryClient set"
  // runtime error.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const check = () => {
      try {
        // Prefer the explicit provider-ready flag or the body attribute which
        // the Web3Provider sets when the wagmi provider has been created.
        const bodyReady = typeof document !== 'undefined' && document.body?.getAttribute?.('data-wagmi-provider') === 'ready'
        const flagReady = !!(window as any).__WAGMI_PROVIDER_READY
        const queryReady = !!(window as any).__BBUX_QUERY_CLIENT
        const isReady = (bodyReady || flagReady) && queryReady
        console.debug('WalletControlsInner readiness check:', { bodyReady, flagReady, queryReady, isReady })
        return isReady
      } catch (e) {
        return false
      }
    }
    const i = setInterval(() => {
      if (check()) {
        setReady(true)
        clearInterval(i)
      }
    }, 150)
    return () => clearInterval(i)
  }, [])

  if (!ready) {
    // Render nothing (or a neutral placeholder). The parent `PresaleWidget`
    // renders a fallback connect button when the provider isn't ready.
    return null
  }

  return <DynamicHooks {...props} />
}
