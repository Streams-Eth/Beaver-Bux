"use client"

import React, { useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { ethers } from 'ethers'
import { normalizeAddress } from '@/lib/utils'

export default function WalletControlsHooks({
  amount,
  tokensToReceive,
  addLog,
  prefetchWalletConnect,
  wcRef,
  setAccount,
  setIsConnected,
  account,
  isConnected,
}: any) {
  const { address, isConnected: wagmiIsConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    if (wagmiIsConnected && address) {
      setAccount(address)
      setIsConnected(true)
    } else {
      setAccount(null)
      setIsConnected(false)
    }
  }, [wagmiIsConnected, address, setAccount, setIsConnected])

  useEffect(() => {
    try {
      if (wagmiIsConnected && address) {
        try { const norm = normalizeAddress(address) || address; localStorage.setItem('bbux_wallet_address', norm) } catch (e) {}
        window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address } }))
      } else {
        localStorage.removeItem('bbux_wallet_address')
        window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address: null } }))
      }
    } catch (e) {}
  }, [wagmiIsConnected, address])

  return (
    <div className="flex gap-2">
      {!isConnected ? (
        <Button
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6"
          onPointerEnter={prefetchWalletConnect}
          onMouseEnter={prefetchWalletConnect}
          onTouchStart={prefetchWalletConnect}
          onClick={async () => {
            try {
              const injected = connectors.find((c: any) => c.id === 'injected')
              const connectorToUse = injected || connectors[0]
              await connect({ connector: connectorToUse })
            } catch (e) {
              console.error('Wallet connect error:', e)
              alert('Failed to connect wallet')
            }
          }}
        >
          <Wallet className="mr-2" size={20} />
          Connect Wallet
        </Button>
      ) : (
        <>
          <Button
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6"
            disabled={!amount || Number.parseFloat(amount) < 0.0005}
            onClick={async () => {
              if (typeof window === 'undefined' || !(window as any).ethereum) {
                alert('Wallet not connected')
                return
              }

              const ethAmount = Number.parseFloat(amount || '0')
              if (!ethAmount || ethAmount < 0.0005) {
                alert(`Enter an amount (min 0.0005 ETH)`)
                return
              }

              try {
                const provider = new ethers.providers.Web3Provider((window as any).ethereum)
                const signer = provider.getSigner()
                const tx = await signer.sendTransaction({
                  to: '0x45482E0858689E2dDd8F4bAEB95d4Fd5f292c564',
                  value: ethers.utils.parseEther(String(ethAmount)),
                })
                console.log('[v0] Payment tx sent', tx.hash)
                alert(`Transaction sent: ${tx.hash}. You will receive ${tokensToReceive.toLocaleString()} BBUX once confirmed.`)
                try {
                  const stored = JSON.parse(localStorage.getItem('bbux_local_tx') || '[]')
                  stored.push({ txHash: tx.hash, account, amount: ethAmount, tokens: tokensToReceive })
                  localStorage.setItem('bbux_local_tx', JSON.stringify(stored))
                } catch (e) {}
              } catch (e) {
                console.error('Buy error', e)
                alert('Failed to send transaction')
              }
            }}
          >
            Buy BBUX
          </Button>

          <Button
            variant="ghost"
            className="px-4 py-6 border rounded text-sm"
            onClick={() => {
              try {
                disconnect?.()
              } catch (e) {}
              try {
                localStorage.removeItem('bbux_wallet_address')
              } catch (e) {}
              try {
                window.dispatchEvent(new CustomEvent('bbux:wallet-changed', { detail: { address: null } }))
              } catch (e) {}
              setAccount(null)
              setIsConnected(false)
            }}
          >
            Disconnect ({account ? `${account.slice(0,6)}...${account.slice(-4)}` : '—'})
          </Button>
        </>
      )}
    </div>
  )
}
