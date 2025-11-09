"use client"

import React from "react"
import { configureChains, createClient, WagmiConfig } from "wagmi"
import { mainnet } from "wagmi/chains"
import { w3mProvider, w3mConnectors, EthereumClient } from "@web3modal/ethereum"
import { Web3Modal } from "@web3modal/react"

const chains = [mainnet]
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

const { provider } = configureChains(chains, [w3mProvider({ projectId })])

const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  provider,
})

const ethereumClient = new EthereumClient(wagmiClient, chains)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig client={wagmiClient}>
      {children}
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </WagmiConfig>
  )
}
