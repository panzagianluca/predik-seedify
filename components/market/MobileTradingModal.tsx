'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Info } from 'lucide-react'
import { Market, Outcome } from '@/types/market'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'

interface MobileTradingModalProps {
  isOpen: boolean
  onClose: () => void
  market: Market
  preselectedOutcomeId?: string
  userAddress?: string
  isConnected: boolean
  onTradeComplete?: () => void
}

interface TradeCalculation {
  shares: number
  priceFrom: number
  priceTo: number
  avgPrice: number
  fee: number
  maxProfit: number
  maxProfitPercent: number
  priceImpact: number
}

export function MobileTradingModal({
  isOpen,
  onClose,
  market,
  preselectedOutcomeId,
  userAddress,
  isConnected,
  onTradeComplete
}: MobileTradingModalProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [calculation, setCalculation] = useState<TradeCalculation | null>(null)
  const [balance, setBalance] = useState<any>(0)
  const [error, setError] = useState<string | null>(null)

  const quickAmounts = [1, 5, 25, 100]

  // Set preselected outcome
  useEffect(() => {
    if (preselectedOutcomeId && isOpen) {
      const outcome = market.outcomes.find(o => String(o.id) === String(preselectedOutcomeId))
      if (outcome) {
        setSelectedOutcome(outcome)
      }
    } else if (isOpen && !selectedOutcome) {
      setSelectedOutcome(market.outcomes[0] || null)
    }
  }, [preselectedOutcomeId, isOpen, market.outcomes])

  // Load balance
  useEffect(() => {
    if (!isConnected || !userAddress || !isOpen || typeof window === 'undefined' || !window.ethereum) {
      setBalance(0)
      return
    }
    loadBalance()
  }, [isConnected, userAddress, isOpen, market.token.address])

  // Calculate trade
  useEffect(() => {
    if (!amount || !selectedOutcome || parseFloat(amount) <= 0) {
      setCalculation(null)
      return
    }
    calculateTrade()
  }, [amount, selectedOutcome, tradeType])

  const loadBalance = async () => {
    try {
      const polkamarketsjs = await import('./polkamarkets-stub')
      const web3Module = await import('web3')
      const Web3 = web3Module.default || web3Module

      const polkamarkets = new polkamarketsjs.Application({
        web3Provider: window.ethereum,
      })

      const web3 = new Web3(window.ethereum as any)
      ;(window as any).web3 = web3
      ;(polkamarkets as any).web3 = web3
      
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const erc20 = polkamarkets.getERC20Contract({
        contractAddress: market.token.address,
      })

      try {
        const balanceWei = await erc20.getContract().methods.balanceOf(userAddress).call()
        const decimals = market.token.decimals || 18
        const balanceFormatted = Number(balanceWei) / Math.pow(10, decimals)
        setBalance(balanceFormatted)
      } catch (directErr) {
        try {
          const tokenBalance = await erc20.getTokenAmount(userAddress!)
          if (tokenBalance !== null && tokenBalance !== undefined && !isNaN(Number(tokenBalance))) {
            setBalance(tokenBalance)
          } else {
            setBalance(0)
          }
        } catch (sdkErr) {
          setBalance(0)
        }
      }
    } catch (err) {
      console.error('❌ Error loading balance:', err)
      setBalance(0)
    }
  }

  const calculateTrade = async () => {
    if (!selectedOutcome || !amount || parseFloat(amount) <= 0) {
      setCalculation(null)
      return
    }

    setIsCalculating(true)
    setError(null)

    try {
      const polkamarketsjs = await import('./polkamarkets-stub')
      const web3Module = await import('web3')
      const Web3 = web3Module.default || web3Module

      const polkamarkets = new polkamarketsjs.Application({
        web3Provider: window.ethereum,
      })

      const web3 = new Web3(window.ethereum as any)
      ;(window as any).web3 = web3
      ;(polkamarkets as any).web3 = web3

      const predictionMarket = polkamarkets.getPredictionMarketV3PlusContract({
        contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
        querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || '',
      })

      const tradeAmount = parseFloat(amount)

      console.log('🔢 Trade calculation:', {
        tradeType,
        marketId: market.id,
        outcomeId: selectedOutcome.id,
        amount: tradeAmount,
      })

      if (tradeType === 'buy') {
        if (tradeAmount > Number(balance)) {
          setError(`Saldo insuficiente. Tienes ${Number(balance).toFixed(2)} ${market.token.symbol}`)
          setCalculation(null)
          return
        }

        // Use exact same API as desktop
        const calcResult = await predictionMarket.calcBuyAmount({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
        })

        const shares = Number(calcResult)
        const priceTo = tradeAmount / shares
        const avgPrice = (selectedOutcome.price + priceTo) / 2
        const fee = tradeAmount * market.fee
        const maxProfit = shares - tradeAmount
        const priceImpact = ((priceTo - selectedOutcome.price) / selectedOutcome.price) * 100

        console.log('📊 Buy calculation result:', {
          shares,
          priceTo,
          avgPrice,
          fee,
          maxProfit,
          priceImpact,
        })

        const calc: TradeCalculation = {
          shares,
          priceFrom: selectedOutcome.price,
          priceTo,
          avgPrice,
          fee,
          maxProfit,
          maxProfitPercent: (maxProfit / tradeAmount) * 100,
          priceImpact,
        }

        setCalculation(calc)
      } else {
        // Use exact same API as desktop
        const calcResult = await predictionMarket.calcSellAmount({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
        })

        const returnAmount = Number(calcResult)
        const priceTo = returnAmount / tradeAmount
        const avgPrice = (selectedOutcome.price + priceTo) / 2
        const fee = returnAmount * market.fee
        const priceImpact = ((priceTo - selectedOutcome.price) / selectedOutcome.price) * 100

        console.log('📊 Sell calculation result:', {
          shares: tradeAmount,
          returnAmount,
          priceTo,
          avgPrice,
          fee,
          priceImpact,
        })

        const calc: TradeCalculation = {
          shares: tradeAmount,
          priceFrom: selectedOutcome.price,
          priceTo,
          avgPrice,
          fee,
          maxProfit: 0,
          maxProfitPercent: 0,
          priceImpact,
        }

        setCalculation(calc)
      }
    } catch (err) {
      console.error('Error calculating trade:', err)
      setError('Error al calcular la operación')
      setCalculation(null)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleExecuteTrade = async () => {
    if (!isConnected || !userAddress || !selectedOutcome || !amount) return

    setIsExecuting(true)
    setError(null)
    haptics.medium()

    try {
      // TODO: Update to use custom MarketFactory contracts + Wagmi hooks instead of Polkamarkets SDK
      // The Polkamarkets SDK stubs don't match the full API.
      // For now, trading functionality is disabled to unblock Vercel builds.
      
      // const polkamarketsjs = await import('./polkamarkets-stub')
      // const web3Module = await import('web3')
      // const Web3 = web3Module.default || web3Module

      // const polkamarkets = new polkamarketsjs.Application({
      //   web3Provider: window.ethereum,
      // })

      // const web3 = new Web3(window.ethereum as any)
      // ;(window as any).web3 = web3
      // ;(polkamarkets as any).web3 = web3

      // await window.ethereum.request({ method: 'eth_requestAccounts' })

      // const predictionMarket = polkamarkets.getPredictionMarketV3PlusContract({
      //   contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
      //   querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || '',
      // })

      // const erc20 = polkamarkets.getERC20Contract({
      //   contractAddress: market.token.address,
      // })

      // const tradeAmount = parseFloat(amount)

      // console.log('💰 Executing trade:', {
      //   tradeType,
      //   marketId: market.id,
      //   outcomeId: selectedOutcome.id,
      //   amount: tradeAmount,
      // })

      // if (tradeType === 'buy') {
      //   // Check and approve if needed (same as desktop)
      //   const spenderAddress = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || ''
      //   const isApproved = await erc20.isApproved({
      //     address: userAddress,
      //     amount: tradeAmount,
      //     spenderAddress,
      //   })

      //   console.log('💰 Token approval status:', { isApproved, spenderAddress, amount: tradeAmount })

      //   if (!isApproved) {
      //     console.log('⏳ Approving token spend...')
      //     await erc20.approve({
      //       address: spenderAddress,
      //       amount: tradeAmount * 10,
      //     })
      //     console.log('✅ Approval complete')
      //   }

      //   // Calculate shares with slippage (same as desktop)
      //   const minShares = await predictionMarket.calcBuyAmount({
      //     marketId: market.id,
      //     outcomeId: selectedOutcome.id,
      //     value: tradeAmount,
      //   })
      //   const minSharesWithSlippage = Number(minShares) * 0.98

      //   console.log('📊 Buy calculation:', {
      //     minShares: Number(minShares),
      //     minSharesWithSlippage,
      //     slippage: '2%',
      //   })

      //   // Execute buy (same as desktop)
      //   console.log('🔄 Executing buy transaction...')
      //   const buyTx = await predictionMarket.buy({
      //     marketId: market.id,
      //     outcomeId: selectedOutcome.id,
      //     value: tradeAmount,
      //     minOutcomeSharesToBuy: minSharesWithSlippage,
      //   })

      //   console.log('✅ Buy successful:', buyTx)
      //   haptics.success()
      // } else {
      //   // Execute sell (same as desktop)
      //   const maxShares = await predictionMarket.calcSellAmount({
      //     marketId: market.id,
      //     outcomeId: selectedOutcome.id,
      //     value: tradeAmount,
      //   })

      //   console.log('📊 Sell calculation:', {
      //     maxShares: Number(maxShares),
      //   })

      //   console.log('🔄 Executing sell transaction...')
      //   const sellTx = await predictionMarket.sell({
      //     marketId: market.id,
      //     outcomeId: selectedOutcome.id,
      //     value: tradeAmount,
      //     maxOutcomeSharesToSell: Number(maxShares),
      //   })

      //   console.log('✅ Sell successful:', sellTx)
      //   haptics.success()
      // }

      // setAmount('')
      // setCalculation(null)
      // onTradeComplete?.()
      // onClose()
      
      haptics.error()
      setError('⚠️ Trading functionality temporarily disabled.\n\nThis component uses the old Polkamarkets SDK which has been replaced by custom contracts.\n\nPlease use the desktop trading panel for now.')
    } catch (err: any) {
      console.error('Trade execution error:', err)
      haptics.error()
      setError(err.message || 'Error al ejecutar la operación')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleQuickAmount = (value: number | 'max') => {
    if (value === 'max') {
      setAmount(Number(balance).toFixed(2))
    } else {
      setAmount(value.toString())
    }
  }

  const handleClose = () => {
    setAmount('')
    setCalculation(null)
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            onClick={handleClose}
          />

          {/* Modal - Slides from bottom, ALIGNED TO TOP for keyboard */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background border-t border-border rounded-t-3xl z-[60] lg:hidden h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={market.image_url}
                  alt={market.title}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
                <h3 className="font-semibold text-[16px] leading-tight truncate">{market.title}</h3>
              </div>
              <button
                onClick={handleClose}
                className="h-10 w-10 rounded-lg flex items-center justify-center transition-colors hover:bg-electric-purple/10 active:bg-electric-purple/20 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - Scrollable, starts at TOP */}
            <div className="overflow-y-auto flex-1 p-4 pb-24 space-y-4">
              {/* Buy/Sell Tabs */}
              <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" onClick={() => haptics.selection()}>Comprar</TabsTrigger>
                  <TabsTrigger value="sell" onClick={() => haptics.selection()}>Vender</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Balance Display */}
              {isConnected && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="font-semibold">{Number(balance).toFixed(2)} {market.token.symbol}</span>
                </div>
              )}

              {/* Outcome Selection */}
              <div className="space-y-2">
                <Label>Seleccionar Resultado</Label>
                <div className="grid grid-cols-2 gap-2">
                  {market.outcomes.map((outcome) => (
                    <Button
                      key={outcome.id}
                      variant={selectedOutcome?.id === outcome.id ? 'default' : 'outline'}
                      onClick={() => setSelectedOutcome(outcome)}
                      className={cn(
                        'h-auto py-3 transition-all duration-300',
                        selectedOutcome?.id === outcome.id && 'bg-electric-purple hover:bg-electric-purple/90'
                      )}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-semibold text-sm">{outcome.title}</span>
                        <span className="text-xs opacity-80">{(outcome.price * 100).toFixed(2)}%</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={isExecuting}
                />

                {/* Quick Amount Buttons */}
                <div className="flex gap-2">
                  {quickAmounts.map((qa) => (
                    <Button
                      key={qa}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(qa)}
                      disabled={isExecuting}
                      className="flex-1"
                    >
                      {qa}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount('max')}
                    disabled={isExecuting || !isConnected || Number(balance) === 0}
                    className="flex-1"
                  >
                    MÁX
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Trade Summary */}
              {calculation && !isCalculating && (
                <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                  <h4 className="font-semibold text-sm">Resumen de Operación</h4>
                  
                  <div className="space-y-2">
                    {/* Price Range */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Precio</span>
                      <span className="font-medium">
                        {(calculation.priceFrom * 100).toFixed(2)}% → {(calculation.priceTo * 100).toFixed(2)}%
                      </span>
                    </div>

                    {/* Shares */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Acciones {tradeType === 'buy' ? 'Recibidas' : 'Vendidas'}</span>
                      <span className="font-medium">{calculation.shares.toFixed(2)}</span>
                    </div>

                    {/* Fee */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tarifa</span>
                      <span>{calculation.fee.toFixed(2)} {market.token.symbol}</span>
                    </div>

                    {/* Max Profit (Buy only) */}
                    {tradeType === 'buy' && (
                      <div className="flex items-center justify-between text-sm border-t pt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Ganancia Máxima</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Si este resultado gana (llega al 100%)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">
                            +{calculation.maxProfit.toFixed(2)} {market.token.symbol}
                          </span>
                          <span className="text-xs text-green-600">
                            ({calculation.maxProfitPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isCalculating && amount && parseFloat(amount) > 0 && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-electric-purple" />
                </div>
              )}
            </div>

            {/* Footer - Execute Button */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <Button
                onClick={handleExecuteTrade}
                disabled={!isConnected || isExecuting || isCalculating || !amount || parseFloat(amount) <= 0 || !!error}
                className={cn(
                  'w-full transition-all duration-300 h-12',
                  tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                )}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {tradeType === 'buy' ? 'Comprar Acciones' : 'Vender Acciones'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
