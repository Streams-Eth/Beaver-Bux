"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ethers } from "ethers"

export default function ClaimPage({ params }: { params: { token: string } }) {
  const token = params.token
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState<any>(null)
  const [wallet, setWallet] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/claim/${token}`)
        const json = await res.json()
        if (json.ok) setPayment(json.payment)
        else setError(json.error || 'Payment not found')
      } catch (e) {
        setError(String(e))
      }
    }
    load()
  }, [token])

  async function connectWallet() {
    setError(null)
    try {
      if (!(window as any).ethereum) return setError('No Web3 wallet detected')
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' })
      setWallet(accounts && accounts[0])
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  async function signAndClaim() {
    setError(null)
    if (!payment) return setError('Payment not loaded')
    if (!(window as any).ethereum) return setError('No Web3 wallet detected')

    try {
      setLoading(true)
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      const msg = `I claim transaction ${payment.transaction_id} for ${payment.tokens} BBUX (claim: ${token})`
      setMessage(msg)
      const signature = await signer.signMessage(msg)

      // post claim
      const resp = await fetch(`/api/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, signature }),
      })
      const j = await resp.json()
      if (!j.ok) {
        setError(j.error || 'Claim failed')
      } else {
        setResult(j)
      }
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Claim Beaver Bux</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {!payment ? (
        <div>Loading claim...</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded">
            <div className="font-semibold">Payment</div>
            <div>{payment.quantity} × {payment.item_description}</div>
            <div className="text-sm text-muted-foreground">Transaction: {payment.transaction_id}</div>
            <div className="text-sm text-muted-foreground">Expires: {payment.claim_expires}</div>
          </div>

          <div>
            <div className="mb-2">Connect a wallet you control to claim your tokens.</div>
            {!wallet ? (
              <Button onClick={connectWallet}>Connect Wallet</Button>
            ) : (
              <div className="mb-2">Connected: {wallet}</div>
            )}
          </div>

          <div>
            <div className="mb-2">Claim message (you will sign):</div>
            <pre className="bg-surface p-3 rounded text-sm whitespace-pre-wrap">{`I claim transaction ${payment.transaction_id} for ${payment.tokens} BBUX (claim: ${token})`}</pre>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={signAndClaim} disabled={loading}>{loading ? 'Signing...' : 'Sign & Claim'}</Button>
            <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(message || '') }}>Copy message</Button>
          </div>

          {result && (
            <div className="bg-green-100 p-3 rounded">
              <div className="font-semibold">Claim successful</div>
              <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
              {result.deliverResult?.txHash && (
                <div className="mt-2">Transaction: <a className="text-primary" href={`https://sepolia.etherscan.io/tx/${result.deliverResult.txHash}`} target="_blank" rel="noreferrer">{result.deliverResult.txHash}</a></div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
