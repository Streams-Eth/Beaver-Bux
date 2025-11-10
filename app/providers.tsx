"use client"

import React from "react"
import { Web3Provider } from "@/components/web3-provider"
import ClientErrorBoundary from "@/components/client-error-boundary"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientErrorBoundary>
      <Web3Provider>{children}</Web3Provider>
    </ClientErrorBoundary>
  )
}
