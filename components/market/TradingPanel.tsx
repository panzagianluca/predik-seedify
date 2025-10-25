'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs'
import { Market, Outcome } from '@/types/market'
import { Loader2, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip'
import { LogoSpinner } from '@/components/ui/logo-spinner'

interface TradingPanelProps {
  market: Market
  userAddress?: string
  isConnected: boolean
  onTradeComplete?: () => void
  className?: string
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

interface UserPosition {
  shares: number
  value: number
  percentChange: number
  dollarChange: number
}

export function TradingPanel({ market, userAddress, isConnected, onTradeComplete, className }: TradingPanelProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(market.outcomes[0] || null)
  const [amount, setAmount] = useState<string>('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [calculation, setCalculation] = useState<TradeCalculation | null>(null)
  const [balance, setBalance] = useState<any>(0) // Keep as any like Markets tab
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)
  const [error, setError] = useState<string | null>(null)

  const quickAmounts = [1, 5, 25, 100]

  // Load user balance
  useEffect(() => {
    if (!isConnected || !userAddress || typeof window === 'undefined' || !window.ethereum) {
      setBalance(0)
      return
    }

    loadBalance()
  }, [isConnected, userAddress, market.token.address])

  // Load user position for this market
  useEffect(() => {
    if (!isConnected || !userAddress || !selectedOutcome) {
      setUserPosition(null)
      return
    }

    loadUserPosition()
  }, [isConnected, userAddress, market.id, selectedOutcome?.id])

  // Calculate trade when amount or outcome changes
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
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const erc20 = polkamarkets.getERC20Contract({
        contractAddress: market.token.address,
      })

      console.log('🔍 Loading balance for:', {
        userAddress,
        tokenAddress: market.token.address,
        tokenSymbol: market.token.symbol,
        tokenDecimals: market.token.decimals,
      })

      // Try direct contract call first (more reliable)
      try {
        const balanceWei = await erc20.getContract().methods.balanceOf(userAddress).call()
        const decimals = market.token.decimals || 18
        const balanceFormatted = Number(balanceWei) / Math.pow(10, decimals)
        console.log('💰 Balance from direct contract call:', balanceFormatted, market.token.symbol)
        setBalance(balanceFormatted)
      } catch (directErr) {
        console.error('❌ Direct contract call failed:', directErr)
        // Fallback to SDK method
        try {
          const tokenBalance = await erc20.getTokenAmount(userAddress!)
          console.log('💰 Fallback to SDK method:', tokenBalance)
          if (tokenBalance !== null && tokenBalance !== undefined && !isNaN(Number(tokenBalance))) {
            setBalance(tokenBalance)
          } else {
            console.error('❌ SDK method also returned invalid balance')
            setBalance(0)
          }
        } catch (sdkErr) {
          console.error('❌ SDK method also failed:', sdkErr)
          setBalance(0)
        }
      }
    } catch (err) {
      console.error('❌ Error loading balance:', err)
      setBalance(0)
    }
  }

  const loadUserPosition = async () => {
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

      const pm = polkamarkets.getPredictionMarketV3PlusContract({
        contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
        querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || '',
      })

      const userMarketShares = await pm.getContract().methods.getUserMarketShares(market.id, userAddress).call()
      const outcomeShares = userMarketShares[1]

      const outcomeIndex = market.outcomes.findIndex(o => o.id === selectedOutcome!.id)
      const sharesRaw = outcomeShares[outcomeIndex]
      const decimals = market.token.decimals || 18
      const shares = Number(sharesRaw) / Math.pow(10, decimals)

      if (shares > 0) {
        // Calculate current value and P&L
        const currentValue = shares * selectedOutcome!.price
        // We don't have purchase price, so we'll show unrealized based on current price vs 0.5 (neutral)
        const neutralValue = shares * 0.5
        const dollarChange = currentValue - neutralValue
        const percentChange = ((currentValue - neutralValue) / neutralValue) * 100

        setUserPosition({
          shares,
          value: currentValue,
          dollarChange,
          percentChange,
        })
      } else {
        setUserPosition(null)
      }
    } catch (err) {
      console.error('Error loading user position:', err)
      setUserPosition(null)
    }
  }

  const calculateTrade = async () => {
    if (!selectedOutcome || !amount) return

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
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const pm = polkamarkets.getPredictionMarketV3PlusContract({
        contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
        querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || '',
      })

      const tradeAmount = parseFloat(amount)
      const priceFrom = selectedOutcome.price

      console.log('📊 Calculating trade:', {
        type: tradeType,
        marketId: market.id,
        outcomeId: selectedOutcome.id,
        amount: tradeAmount,
        currentPrice: priceFrom,
        token: market.token.symbol,
      })

      let shares: number
      let priceTo: number

      if (tradeType === 'buy') {
        const calcResult = await pm.calcBuyAmount({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
        })
        shares = Number(calcResult)

        // Calculate new price after buy: shares received / amount spent
        // The actual price you're paying per share on average
        priceTo = tradeAmount / shares
      } else {
        const calcResult = await pm.calcSellAmount({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
        })
        shares = Number(calcResult)

        // Calculate new price after sell: amount received / shares sold
        priceTo = tradeAmount / shares
      }

      // Average price is what you pay/receive per share
      const avgPrice = tradeAmount / shares
      
      // Fee calculation
      const fee = tradeAmount * market.fee
      
      // Max profit calculation for buys: if outcome wins (goes to 1.0 = 100%)
      // You receive 1 token per share, so profit = (shares * 1) - amount spent - fee
      const maxProfit = tradeType === 'buy' 
        ? shares - tradeAmount
        : 0 // For sells, we can't calculate max profit without knowing original purchase price
      
      const maxProfitPercent = tradeType === 'buy'
        ? ((maxProfit / tradeAmount) * 100)
        : 0

      // Price impact: difference between current market price and your average fill price
      const priceImpact = ((avgPrice - priceFrom) / priceFrom) * 100

      console.log('✅ Calculation result:', {
        shares: shares.toFixed(2),
        avgPrice: (avgPrice * 100).toFixed(2) + '%',
        fee: fee.toFixed(2),
        maxProfit: maxProfit.toFixed(2),
        priceImpact: priceImpact.toFixed(2) + '%',
      })

      setCalculation({
        shares: shares,
        priceFrom,
        priceTo: avgPrice, // Use avgPrice as the actual execution price
        avgPrice,
        fee,
        maxProfit,
        maxProfitPercent,
        priceImpact,
      })
    } catch (err) {
      console.error('Calculation error:', err)
      setError('No se puede calcular la operación. El mercado puede estar cerrado o tener liquidez insuficiente.')
      setCalculation(null)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleExecuteTrade = async () => {
    if (!isConnected || !userAddress || !selectedOutcome || !amount) {
      setError('Please connect your wallet and enter an amount')
      return
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet!')
      return
    }

    const tradeAmount = parseFloat(amount)

    if (tradeAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    console.log('💰 Balance check before trade:', {
      balance,
      balanceType: typeof balance,
      tradeAmount,
      tradeAmountType: typeof tradeAmount,
      tradeType,
    })

    if (tradeType === 'buy' && tradeAmount > balance) {
      console.log('❌ Insufficient balance check:', {
        tradeAmount,
        balance,
        comparison: `${tradeAmount} > ${balance}`,
        result: tradeAmount > balance,
      })
      setError(`Saldo insuficiente de ${market.token.symbol}. Tienes ${balance.toFixed(2)}, necesitas ${tradeAmount}`)
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      console.log('🚀 Starting trade execution:', {
        type: tradeType,
        marketId: market.id,
        outcomeId: selectedOutcome.id,
        amount: tradeAmount,
        userAddress,
        tokenAddress: market.token.address,
        pmContract: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS,
      })

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

      const pm = polkamarkets.getPredictionMarketV3PlusContract({
        contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
        querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || '',
      })

      const erc20 = polkamarkets.getERC20Contract({
        contractAddress: market.token.address,
      })

      if (tradeType === 'buy') {
        // Check and approve if needed
        const spenderAddress = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || ''
        const isApproved = await erc20.isApproved({
          address: userAddress,
          amount: tradeAmount,
          spenderAddress,
        })

        console.log('💰 Token approval status:', { isApproved, spenderAddress, amount: tradeAmount })

        if (!isApproved) {
          console.log('⏳ Approving token spend...')
          await erc20.approve({
            address: spenderAddress,
            amount: tradeAmount * 10,
          })
          console.log('✅ Approval complete')
        }

        // Calculate shares with slippage
        const minShares = await pm.calcBuyAmount({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
        })
        const minSharesWithSlippage = Number(minShares) * 0.98

        console.log('📊 Buy calculation:', {
          minShares: Number(minShares),
          minSharesWithSlippage,
          slippage: '2%',
        })

        // Execute buy
        console.log('🔄 Executing buy transaction...')
        const buyTx = await pm.buy({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
          minOutcomeSharesToBuy: minSharesWithSlippage,
        })

        console.log('✅ Buy successful:', buyTx)
      } else {
        // Execute sell
        const maxShares = await pm.calcSellAmount({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
        })

        console.log('📊 Sell calculation:', {
          maxShares: Number(maxShares),
        })

        console.log('🔄 Executing sell transaction...')
        const sellTx = await pm.sell({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          value: tradeAmount,
          maxOutcomeSharesToSell: Number(maxShares),
        })

        console.log('✅ Sell successful:', sellTx)
      }

      // Reset form
      setAmount('')
      setCalculation(null)

      // Reload data
      console.log('🔄 Reloading balance and position...')
      await loadBalance()
      await loadUserPosition()

      if (onTradeComplete) {
        onTradeComplete()
      }
    } catch (err) {
      console.error('❌ Trade execution error:', err)
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Operación fallida: ${message}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleQuickAmount = (quickAmount: number | 'max') => {
    if (quickAmount === 'max') {
      // Use the actual balance value
      const maxAmount = typeof balance === 'number' ? balance : Number(balance) || 0
      setAmount(maxAmount > 0 ? maxAmount.toString() : '0')
    } else {
      setAmount(quickAmount.toString())
    }
  }

  if (!selectedOutcome) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No hay resultados disponibles para este mercado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card className="w-[320px]">
        <CardContent className="p-4 space-y-4">
          {/* Buy/Sell Tabs */}
          <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="data-[state=active]:text-green-600">
                Comprar
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:text-red-600">
                Vender
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Outcome Selection */}
          <div className="space-y-2">
            <Label>Seleccionar Resultado</Label>
            <div className="grid grid-cols-2 gap-2 relative">
              {market.outcomes.map((outcome) => (
                <Button
                  key={outcome.id}
                  variant={selectedOutcome?.id === outcome.id ? 'default' : 'outline'}
                  onClick={() => setSelectedOutcome(outcome)}
                  className={cn(
                    'h-auto py-3 transition-all duration-300 ease-in-out relative overflow-hidden',
                    selectedOutcome?.id === outcome.id && 'bg-electric-purple hover:bg-electric-purple/90 border-electric-purple shadow-lg shadow-electric-purple/20'
                  )}
                >
                  {selectedOutcome?.id === outcome.id && (
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  )}
                  <div className="flex items-center justify-between w-full gap-2 relative z-10">
                    <span className="font-semibold text-sm">{outcome.title}</span>
                    <span className="text-xs opacity-80">
                      {(outcome.price * 100).toFixed(2)}%
                    </span>
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

          {/* Execute Button */}
          <Button
            onClick={handleExecuteTrade}
            disabled={!isConnected || isExecuting || isCalculating || !amount || parseFloat(amount) <= 0 || !!error}
            className={cn(
              'w-full transition-all duration-300',
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

          {/* Loading Summary Skeleton */}
          {isCalculating && amount && parseFloat(amount) > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-center">
                <LogoSpinner size={40} />
              </div>
            </div>
          )}

          {/* Transaction Summary */}
          {!isCalculating && calculation && !error && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold text-sm">Resumen</h4>
              
              {/* Price Changes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Precio Actual</span>
                  <span className="font-medium">{(calculation.priceFrom * 100).toFixed(2)}%</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tu Precio Promedio</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{(calculation.avgPrice * 100).toFixed(2)}%</span>
                    <span className={cn(
                      'text-xs',
                      calculation.priceImpact > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      ({calculation.priceImpact > 0 ? '+' : ''}{calculation.priceImpact.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* Shares */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Acciones {tradeType === 'buy' ? 'Recibidas' : 'Vendidas'}</span>
                  <span className="font-medium">{calculation.shares.toFixed(2)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t my-3" />

              {/* Fee and Profit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tarifa ({(market.fee * 100).toFixed(2)}%)</span>
                  <span>{calculation.fee.toFixed(2)} {market.token.symbol}</span>
                </div>

                {tradeType === 'buy' && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Ganancia Máxima</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
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

        </CardContent>
      </Card>

      {/* User Position Box */}
      {isConnected && userPosition && (
        <Card className="w-[320px] border-electric-purple/50">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-semibold text-sm mb-4">Tu Posición</h4>
            
            {/* Compact List Style */}
            <div className="space-y-2">
              {/* Acciones */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acciones</span>
                <span className="font-semibold">{userPosition.shares.toFixed(2)}</span>
              </div>
              
              {/* Valor */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="font-semibold">${userPosition.value.toFixed(2)}</span>
              </div>
              
              {/* Resultado */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resultado</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-semibold',
                    userPosition.dollarChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {userPosition.dollarChange >= 0 ? '+' : ''}${userPosition.dollarChange.toFixed(2)}
                  </span>
                  <span className={cn(
                    'text-sm flex items-center',
                    userPosition.percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {userPosition.percentChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(userPosition.percentChange).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
