"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet } from "lucide-react"

const PRESALE_CONTRACT = "0xF479063E290E85e1470a11821128392F6063790B"
const MIN_CONTRIBUTION_ETH = 0.0005
const MAX_CONTRIBUTION_ETH = 0.25
const TOTAL_TOKENS_FOR_SALE = 100_000_000

// Stage configuration from contract
const STAGES = [
  {
    id: 1,
    start: new Date("2025-11-01T00:00:00Z"),
    end: new Date("2025-11-30T23:59:59Z"),
    pricePerToken: 0.0000005, // ETH per BBUX
    allocation: 30_000_000,
  },
  {
    id: 2,
    start: new Date("2025-12-01T00:00:00Z"),
    end: new Date("2025-12-31T23:59:59Z"),
    pricePerToken: 0.0000006,
    allocation: 30_000_000,
  },
  {
    id: 3,
    start: new Date("2026-01-01T00:00:00Z"),
    end: new Date("2026-01-31T23:59:59Z"),
    pricePerToken: 0.0000007,
    allocation: 20_000_000,
  },
  {
    id: 4,
    start: new Date("2026-02-01T00:00:00Z"),
    end: new Date("2026-02-28T23:59:59Z"),
    pricePerToken: 0.0000008,
    allocation: 20_000_000,
  },
]

const ETH_TO_CAD = 4200
const PAYPAL_CLIENT_ID = "AS6HlfoJXWFF-xqbhTeLn84IyegiYZwt9jQwfcwpdtaM0xbn2fIliPkGZWDsTjcrRYgbNWS3dUz-emhx"

export function PresaleWidget() {
  const [amount, setAmount] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [currentStage, setCurrentStage] = useState(STAGES[0])
  const [nextStage, setNextStage] = useState(STAGES[1])
  const paypalRef = useRef<HTMLDivElement>(null)
  const [countdown, setCountdown] = useState("")

  useEffect(() => {
    const targetDate = new Date("2025-11-01T00:00:00Z").getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance < 0) {
        setCountdown("🚀 Presale is now LIVE!")
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setCountdown(`⏳ ${days}d ${hours}h ${minutes}m ${seconds}s until presale starts`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const now = new Date()
    const active = STAGES.find((stage) => now >= stage.start && now <= stage.end)
    if (active) {
      setCurrentStage(active)
      const nextIndex = STAGES.findIndex((s) => s.id === active.id) + 1
      if (nextIndex < STAGES.length) {
        setNextStage(STAGES[nextIndex])
      }
    }
  }, [])

  const calculateTokens = (ethAmount: number) => {
    return ethAmount / currentStage.pricePerToken
  }

  const tokensToReceive = amount ? calculateTokens(Number.parseFloat(amount)) : 0
  const cadEquivalent = amount ? Number.parseFloat(amount) * ETH_TO_CAD : 0

  useEffect(() => {
    if (paypalRef.current && window.paypal && amount && Number.parseFloat(amount) >= MIN_CONTRIBUTION_ETH) {
      const cadAmount = (Number.parseFloat(amount) * ETH_TO_CAD).toFixed(2)

      window.paypal
        .Buttons({
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: cadAmount,
                    currency_code: "CAD",
                  },
                  description: `${tokensToReceive.toLocaleString()} BBUX Tokens`,
                },
              ],
            })
          },
          onApprove: async (data: any, actions: any) => {
            const order = await actions.order.capture()
            console.log("[v0] PayPal payment successful:", order)
            // TODO: Process the payment and call presale contract
            alert(`Payment successful! You will receive ${tokensToReceive.toLocaleString()} BBUX tokens.`)
          },
          onError: (err: any) => {
            console.error("[v0] PayPal error:", err)
            alert("Payment failed. Please try again.")
          },
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
          },
        })
        .render(paypalRef.current)
    }
  }, [amount, tokensToReceive])

  return (
    <Card className="w-full max-w-md bg-card border-2 border-primary/20 shadow-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground">{countdown}</CardTitle>
          <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-semibold">
            Stage {currentStage.id}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Next Stage Price:{" "}
          <span className="font-semibold text-foreground">
            ${(nextStage.pricePerToken * ETH_TO_CAD).toFixed(6)} CAD
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stage {currentStage.id} Progress</span>
            <span className="font-semibold text-foreground">
              {((currentStage.allocation / TOTAL_TOKENS_FOR_SALE) * 100).toFixed(0)}% of Total
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "15%" }} />
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {currentStage.allocation.toLocaleString()} BBUX available in Stage {currentStage.id}
          </div>
        </div>

        <Tabs defaultValue="eth" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="eth">ETH</TabsTrigger>
            <TabsTrigger value="cad">CAD</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>

          <TabsContent value="eth" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount (ETH)</label>
              <Input
                type="number"
                placeholder={`Min: ${MIN_CONTRIBUTION_ETH} ETH`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                min={MIN_CONTRIBUTION_ETH}
                max={MAX_CONTRIBUTION_ETH}
                step="0.001"
              />
              <div className="text-xs text-muted-foreground">
                Min: {MIN_CONTRIBUTION_ETH} ETH • Max: {MAX_CONTRIBUTION_ETH} ETH
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-semibold text-foreground">{tokensToReceive.toLocaleString()} BBUX</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">CAD equivalent:</span>
                <span className="text-muted-foreground">${cadEquivalent.toFixed(2)} CAD</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cad" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount (CAD)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount ? (Number.parseFloat(amount) * ETH_TO_CAD).toFixed(2) : ""}
                onChange={(e) => setAmount((Number.parseFloat(e.target.value || "0") / ETH_TO_CAD).toString())}
                className="text-lg"
              />
              <div className="text-xs text-muted-foreground">
                Min: ${(MIN_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD • Max: $
                {(MAX_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-semibold text-foreground">{tokensToReceive.toLocaleString()} BBUX</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ETH equivalent:</span>
                <span className="text-muted-foreground">{amount ? Number.parseFloat(amount).toFixed(4) : "0"} ETH</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount (CAD)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount ? (Number.parseFloat(amount) * ETH_TO_CAD).toFixed(2) : ""}
                onChange={(e) => setAmount((Number.parseFloat(e.target.value || "0") / ETH_TO_CAD).toString())}
                className="text-lg"
              />
              <div className="text-xs text-muted-foreground">
                Min: ${(MIN_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD • Max: $
                {(MAX_CONTRIBUTION_ETH * ETH_TO_CAD).toFixed(2)} CAD
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You receive:</span>
                <span className="font-semibold text-foreground">{tokensToReceive.toLocaleString()} BBUX</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">ETH equivalent:</span>
                <span className="text-muted-foreground">{amount ? Number.parseFloat(amount).toFixed(4) : "0"} ETH</span>
              </div>
            </div>

            {amount && Number.parseFloat(amount) >= MIN_CONTRIBUTION_ETH ? (
              <div ref={paypalRef} className="w-full" />
            ) : (
              <div className="bg-muted rounded-lg p-4 text-sm text-center text-muted-foreground">
                Enter an amount to see PayPal payment options
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        {!isConnected ? (
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6"
            onClick={() => setIsConnected(true)}
          >
            <Wallet className="mr-2" size={20} />
            Connect Wallet
          </Button>
        ) : (
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6"
            disabled={!amount || Number.parseFloat(amount) < MIN_CONTRIBUTION_ETH}
          >
            Buy BBUX
          </Button>
        )}

        <div className="text-xs text-center text-muted-foreground space-y-1">
          <p>
            Contract: {PRESALE_CONTRACT.slice(0, 6)}...{PRESALE_CONTRACT.slice(-4)}
          </p>
          <p>By purchasing, you agree to our terms and conditions</p>
        </div>
      </CardContent>
    </Card>
  )
}

declare global {
  interface Window {
    paypal: any
  }
}
