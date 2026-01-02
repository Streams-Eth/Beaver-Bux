"use client"

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

type Payment = {
  transaction_id?: string
  buyer_name?: string
  buyer_email?: string
  tokens?: number
  gross_cad?: number
  paypal_fee_cad?: number
  net_cad?: number
  delivered?: boolean
  delivery_tx_hash?: string
}

function AdminPageClient() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [walletAddr, setWalletAddr] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/payments', { credentials: 'include' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Request failed (${res.status}): ${text || res.statusText}`)
      }
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to fetch')
      setPayments(json.payments || [])
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    } catch (e) {
      // ignore
    }
    setWalletAddr(null)
    await fetchPayments()
  }

  const walletLogin = async () => {
    setAuthError(null)
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No wallet detected in browser')
      }
      const provider = new ethers.providers.Web3Provider((window as any).ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      const message = `BBUX Admin Login ${Date.now()}`
      const signature = await signer.signMessage(message)

      const resp = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address, signature, message }),
      })
      const json = await resp.json().catch(() => ({}))
      if (!resp.ok || !json.ok) {
        throw new Error(json?.error || `Login failed (${resp.status})`)
      }

      setWalletAddr(address)
      // After auth, refetch payments
      await fetchPayments()
    } catch (e: any) {
      setAuthError(e?.message || String(e))
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchPayments()
  }, [])

  const deliver = async (txId?: string, tokens?: number) => {
    if (!txId) return alert('Missing transaction id')
    const to = prompt('Enter recipient wallet address (0x...)')
    if (!to) return

    try {
      const res = await fetch('/api/admin/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId, to }),
      })
      const json = await res.json()
      if (!json.ok) {
        alert('Deliver failed: ' + (json.error || 'unknown'))
      } else {
        alert('Deliver tx: ' + json.txHash)
        fetchPayments()
      }
    } catch (e) {
      alert('Deliver error: ' + String(e))
    }
  }

  if (!mounted) return null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin — Pending Payments</h1>
    <div className="mb-4 flex flex-wrap gap-3 items-center">
      <button onClick={fetchPayments} className="px-3 py-2 bg-primary text-white rounded">Refresh</button>
      <button onClick={walletLogin} className="px-3 py-2 border rounded">Connect Wallet</button>
      <button onClick={logout} className="px-3 py-2 border rounded">Disconnect Wallet</button>
      {walletAddr && (
        <span className="text-sm text-muted-foreground">Authenticated as {walletAddr.slice(0,6)}...{walletAddr.slice(-4)}</span>
      )}
    </div>

    {authError && <div className="text-red-600 mb-2">Auth error: {authError}</div>}

    {loading && <div>Loading…</div>}
    {error && <div className="text-red-600">{error}</div>}

    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left p-2">Txn ID</th>
          <th className="text-left p-2">Buyer</th>
          <th className="text-right p-2">Tokens</th>
          <th className="text-right p-2">Gross CAD</th>
          <th className="text-right p-2">Net CAD</th>
          <th className="p-2">Status</th>
          <th className="p-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {payments.length === 0 && (
          <tr><td colSpan={7} className="p-4 text-center">No payments</td></tr>
        )}
        {payments.map((p: any, idx: number) => (
          <tr key={p.transaction_id || p.tx_hash || `row-${idx}`} className="border-t">
            <td className="p-2 align-top"><code className="text-sm">{p.transaction_id}</code></td>
            <td className="p-2 align-top">
              <div className="text-sm">{p.buyer_name || p.buyer_email}</div>
              <div className="text-xs text-muted-foreground">{p.buyer_email}</div>
            </td>
            <td className="p-2 text-right align-top">{p.tokens ?? '-'}</td>
            <td className="p-2 text-right align-top">{p.gross_cad ? `$${p.gross_cad.toFixed(2)}` : '-'}</td>
            <td className="p-2 text-right align-top">{p.net_cad ? `$${p.net_cad.toFixed(2)}` : '-'}</td>
            <td className="p-2 align-top">{p.delivered ? (<span className="text-green-600">Delivered</span>) : (<span className="text-orange-600">Pending</span>)}</td>
            <td className="p-2 align-top">
              {!p.delivered ? (
                <button onClick={() => deliver(p.transaction_id, p.tokens)} className="px-2 py-1 bg-accent text-white rounded">Deliver</button>
              ) : (
                <a className="text-sm" href={`https://etherscan.io/tx/${p.delivery_tx_hash}`} target="_blank" rel="noreferrer">View Tx</a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

export default dynamic(() => Promise.resolve(AdminPageClient), { ssr: false })
