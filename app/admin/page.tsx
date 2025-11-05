"use client"

import { useEffect, useState } from 'react'

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

export default function AdminPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/payments')
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to fetch')
      setPayments(json.payments || [])
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin — Pending Payments</h1>
      <div className="mb-4">
        <button onClick={fetchPayments} className="px-3 py-2 bg-primary text-white rounded">Refresh</button>
      </div>

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
          {payments.map((p: any) => (
            <tr key={p.transaction_id || Math.random()} className="border-t">
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
