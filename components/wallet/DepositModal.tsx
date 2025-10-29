'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/animate-ui/components/radix/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs'
import { Button } from '@/components/ui/button'
import { Check, Copy, ExternalLink, ChevronDown, HelpCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { LiFiWidget } from '@lifi/widget'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  walletAddress: string
}

export function DepositModal({ isOpen, onClose, walletAddress }: DepositModalProps) {
  const [copied, setCopied] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showBridgeTooltip, setShowBridgeTooltip] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Li.Fi Widget Configuration
  const lifiConfig = {
    integrator: 'Predik',
    theme: {
      container: {
        boxShadow: 'none',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px] w-full p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden"
        from="top"
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <DialogTitle className="sr-only">Depositar USDT</DialogTitle>
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <h2 className="text-xl font-semibold">Depositar USDT</h2>
        </div>

        {/* Tabs Section - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <Tabs defaultValue="cex" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cex">Desde CEX</TabsTrigger>
              <TabsTrigger value="bridge">Puente</TabsTrigger>
            </TabsList>

            {/* Tab 1: CEX */}
            <TabsContent value="cex" className="space-y-4 mt-4">
              <div className="rounded-lg border bg-card p-4">
                {/* QR Code */}
                <div className="flex flex-col items-center gap-3 py-4 bg-white dark:bg-muted rounded-lg mb-4">
                  <QRCodeSVG
                    value={walletAddress}
                    size={160}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                  <p className="text-xs text-center text-muted-foreground px-4">
                    Escaneá para enviar USDT a Celo
                  </p>
                </div>

                {/* Full Wallet Address */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-muted border rounded-md text-xs font-mono break-all">
                      {walletAddress}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-auto shrink-0"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-medium mb-3">
                    Retirá USDT vía Celo desde:
                  </p>
                  <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-electric-purple" />
                      <span>Lemon Cash</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-electric-purple" />
                      <span>Bitget</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-electric-purple" />
                      <span>Binance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-electric-purple" />
                      <span>Bybit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-electric-purple" />
                      <span>OKX</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-electric-purple" />
                      <span>Cualquier otro exchange</span>
                    </li>
                  </ul>
                </div>

                {/* Instructions Accordion */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full flex items-center justify-between text-sm font-medium py-2 hover:text-electric-purple transition-colors"
                  >
                    <span>¿Cómo retirar?</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {showInstructions && (
                    <ol className="text-sm text-muted-foreground space-y-1.5 ml-4 mt-2">
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">1.</span>
                        <span>Abrí tu exchange</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">2.</span>
                        <span>Buscá USDT y tocá &quot;Retirar&quot;</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">3.</span>
                        <span>Seleccioná red <strong>Celo</strong></span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">4.</span>
                        <span>Pegá la dirección de arriba</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-semibold text-foreground">5.</span>
                        <span>Confirmá el retiro</span>
                      </li>
                    </ol>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Bridge (Li.Fi Widget) */}
            <TabsContent value="bridge" className="space-y-4 mt-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold">
                    Transferir desde otra red
                  </h3>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowBridgeTooltip(true)}
                      onMouseLeave={() => setShowBridgeTooltip(false)}
                      onClick={() => setShowBridgeTooltip(!showBridgeTooltip)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                    {showBridgeTooltip && (
                      <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-popover border rounded-md shadow-lg text-xs text-popover-foreground">
                        Si ya tenés USDT en otra blockchain (Ethereum, Polygon, etc.), podés hacer bridge a Celo
                      </div>
                    )}
                  </div>
                </div>

                {/* Li.Fi Widget */}
                <div className="rounded-lg overflow-hidden">
                  <LiFiWidget
                    integrator="Predik"
                    config={lifiConfig}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
