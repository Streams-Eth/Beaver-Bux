"use client"

import React from "react"
import { WagmiConfig } from "wagmi"
import { createConfig, injected } from "@wagmi/core"
import { useMemo } from "react"

// Minimal client-only Wagmi provider using the injected connector.
// This avoids pulling in @web3modal/* packages which have incompatible
// peer dependency expectations with the installed wagmi/@wagmi/core versions
// and caused build-time resolution errors on Netlify.

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const config = useMemo(() => createConfig({ autoConnect: true, connectors: [injected()] }), [])
  return <WagmiConfig config={config}>{children}</WagmiConfig>
}
