'use client'

import { ConnectButton } from "@/components/wallet/ConnectButton"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { ProbabilityChart } from "@/components/market/ProbabilityChart"
import { MarketCard } from "@/components/market/MarketCard"
import { TradingPanel } from "@/components/market/TradingPanel"
import { TooltipProvider } from "@/components/animate-ui/primitives/animate/tooltip"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/animate-ui/components/radix/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/animate-ui/components/radix/toggle-group"
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { useEffect, useState } from "react"
import { fetchMarkets, fetchMarket } from "@/lib/myriad/api"
import { Market } from "@/types/market"
import { Loader2, TrendingUp, BarChart3, ListFilter, MousePointerClick, ChevronDown } from "lucide-react"
import { LogoSpinner } from "@/components/ui/logo-spinner"

export default function UITestPage() {
  const { address, isConnected, chain } = useAccount()
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buyingMarket, setBuyingMarket] = useState<number | null>(null)
  const [sellingMarket, setSellingMarket] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [userShares, setUserShares] = useState<Record<number, Record<number, number>>>({})
  const [loadingShares, setLoadingShares] = useState(false)
  const [selectedMarketSlug, setSelectedMarketSlug] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('24h')
  const [selectedMarketDetails, setSelectedMarketDetails] = useState<Market | null>(null)
  const [loadingMarketDetails, setLoadingMarketDetails] = useState(false)
  const [selectedTradingMarket, setSelectedTradingMarket] = useState<Market | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadMarkets = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMarkets({
        // No state filter = ALL markets (open, closed, resolved)
        token: 'USDT', // REQUIRED!
        network_id: '11142220' // Celo Sepolia
      })
      setMarkets(data)
      console.log('📊 Markets refreshed:', data.length, 'markets loaded')
      
      // Load user shares if connected
      if (isConnected && address) {
        await loadUserShares(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch markets')
    } finally {
      setLoading(false)
    }
  }

  const loadUserShares = async (marketsData: Market[]) => {
    if (!address || typeof window === 'undefined' || !window.ethereum) {
      console.log('⚠️ Cannot load shares: no address or ethereum provider')
      return
    }
    
    setLoadingShares(true)
    console.log('🔍 Loading shares for address:', address)
    
    try {
      const polkamarketsjs = await import('polkamarkets-js')
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
      
      console.log('📝 PM Contract:', process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS)
      
      const sharesData: Record<number, Record<number, number>> = {}
      
      // Fetch shares for each market using getUserMarketShares
      for (const market of marketsData) {
        console.log(`\n🔍 Checking market ${market.id}: "${market.title}"`)
        sharesData[market.id] = {}
        
        try {
          // Get user's shares for this market (returns [liquidityShares, outcomeShares[]])
          const userMarketShares = await pm.getContract().methods.getUserMarketShares(market.id, address).call()
          console.log(`  Raw user market shares:`, userMarketShares)
          
          const liquidityShares = userMarketShares[0]
          const outcomeShares = userMarketShares[1]
          
          console.log(`  Liquidity shares: ${liquidityShares}`)
          
          // Parse outcome shares array
          for (let i = 0; i < market.outcomes.length; i++) {
            const outcome = market.outcomes[i]
            const sharesRaw = outcomeShares[i]
            
            const decimals = market.token.decimals || 18
            const sharesFormatted = Number(sharesRaw) / Math.pow(10, decimals)
            
            sharesData[market.id][outcome.id] = sharesFormatted
            
            if (sharesFormatted > 0) {
              console.log(`  ✅ Outcome ${outcome.id} (${outcome.title}): ${sharesFormatted.toFixed(6)} shares`)
            } else {
              console.log(`  ⚪ Outcome ${outcome.id} (${outcome.title}): No shares`)
            }
          }
        } catch (err) {
          console.error(`  ❌ Error fetching shares for market ${market.id}:`, err)
          // Initialize all outcomes with 0
          for (const outcome of market.outcomes) {
            sharesData[market.id][outcome.id] = 0
          }
        }
      }
      
      setUserShares(sharesData)
      console.log('\n💼 Final user shares data:', sharesData)
      
      // Summary
      const totalPositions = Object.values(sharesData).reduce((acc, marketShares) => 
        acc + Object.values(marketShares).filter(s => s > 0).length, 0
      )
      console.log(`📊 Summary: ${totalPositions} active position(s)`)
      
    } catch (err) {
      console.error('❌ Error loading user shares:', err)
    } finally {
      setLoadingShares(false)
    }
  }

  useEffect(() => {
    loadMarkets()
  }, [])

  const handleBuy = async (market: Market, outcomeId: number) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first!')
      return
    }

    // Check if window.ethereum exists
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet!')
      return
    }

    setBuyingMarket(market.id)
    try {
      // Dynamic import of polkamarkets-js to avoid SSR issues
      const polkamarketsjs = await import('polkamarkets-js')
      const web3Module = await import('web3')
      const Web3 = web3Module.default || web3Module
      
      // Initialize Polkamarkets with window.ethereum provider
      const polkamarkets = new polkamarketsjs.Application({
        web3Provider: window.ethereum, // Use window.ethereum directly!
      })

      // Establish Web3 connection using modern requestAccounts flow
      const web3 = new Web3(window.ethereum as any)
      ;(window as any).web3 = web3
      ;(polkamarkets as any).web3 = web3
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Get prediction market contract
      const pm = polkamarkets.getPredictionMarketV3PlusContract({
        contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
        querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || '',
      })

      // Get ERC20 token contract
      const erc20 = polkamarkets.getERC20Contract({
        contractAddress: market.token.address,
      })

      const buyAmount = 1 // Buy 1 token worth
      const balance = await erc20.getTokenAmount(address)
      
      console.log('🔍 Pre-buy diagnostics:', {
        userAddress: address,
        tokenAddress: market.token.address,
        tokenSymbol: market.token.symbol,
        balance: balance,
        buyAmount: buyAmount,
        marketId: market.id,
        marketState: market.state,
        pmContract: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS,
      })
      
      if (balance < buyAmount) {
        const tokenSymbol = market.token.symbol
        alert(`❌ Insufficient ${tokenSymbol} balance. You have ${balance.toFixed(4)}, need at least ${buyAmount}.\n\nGet testnet USDT at: https://faucet.celo.org or mint via contract.`)
        return
      }

      const spenderAddress = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || ''

      // Check and approve if needed
      const isApproved = await erc20.isApproved({
        address: address,
        amount: buyAmount,
        spenderAddress,
      })
      
      console.log('💰 Token approval status:', { isApproved, spenderAddress })

      if (!isApproved) {
        console.log('⏳ Approving token spend...')
        const approveTx = await erc20.approve({
          address: spenderAddress,
          amount: buyAmount * 10, // Approve 10x for multiple trades
          callback: () => console.log('✅ Approval confirmed')
        })
        console.log('✅ Approval transaction:', approveTx)
      }

      // Calculate minimum shares to buy
      const minShares = await pm.calcBuyAmount({
        marketId: market.id,
        outcomeId,
        value: buyAmount,
      })
      
      // Apply 2% slippage tolerance (reduce minShares by 2%)
      const minSharesWithSlippage = Number(minShares) * 0.98
      
      console.log('📊 Calculated shares:', {
        minShares,
        minSharesNumber: Number(minShares),
        minSharesWithSlippage,
        slippageTolerance: '2%',
        isValid: minSharesWithSlippage > 0
      })

      if (minSharesWithSlippage <= 0) {
        alert(`❌ Unable to calculate shares for this outcome.\n\nThis usually means:\n• Market is closed or resolved\n• Liquidity is too low\n• Outcome price is at extreme (0% or 100%)`)
        return
      }

      console.log('🚀 Executing buy...', { marketId: market.id, outcomeId, value: buyAmount, minShares: minSharesWithSlippage })

      // Execute buy
      const buyTx = await pm.buy({
        marketId: market.id,
        outcomeId,
        value: buyAmount,
        minOutcomeSharesToBuy: minSharesWithSlippage,
      })
      
      console.log('✅ Buy transaction successful:', buyTx)
      alert(`✅ Successfully bought shares for outcome ${outcomeId}!\n\nTx: ${buyTx?.transactionHash || 'pending'}\n\n🔄 Refreshing market data...`)
      
      // Refresh markets to show updated probabilities
      await loadMarkets()
    } catch (err) {
      console.error('❌ Buy error:', err)
      const message = err instanceof Error ? err.message : 'Unknown error'
      const revertReason = typeof err === 'object' && err && 'data' in err && (err as any).data?.message
      const errorDetails = typeof err === 'object' && err ? JSON.stringify(err, null, 2) : message
      
      console.error('Full error details:', errorDetails)
      
      alert(`❌ Buy transaction failed!\n\n${revertReason || message}\n\nCheck console for full error details.\n\nCommon causes:\n• Insufficient USDT balance\n• USDT approval didn't complete\n• Market is closed/resolved\n• Price slippage too high`)
    } finally {
      setBuyingMarket(null)
    }
  }

  const handleSell = async (market: Market, outcomeId: number) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first!')
      return
    }

    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet!')
      return
    }

    setSellingMarket(market.id)
    try {
      const polkamarketsjs = await import('polkamarkets-js')
      const web3Module = await import('web3')
      const Web3 = web3Module.default || web3Module
      
      const polkamarkets = new polkamarketsjs.Application({
        web3Provider: window.ethereum, // Use window.ethereum directly!
      })

      const web3 = new Web3(window.ethereum as any)
      ;(window as any).web3 = web3
      ;(polkamarkets as any).web3 = web3
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      const pm = polkamarkets.getPredictionMarketV3PlusContract({
        contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '',
        querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER || '',
      })

      const sellAmount = 0.5 // Sell 0.5 tokens worth

      // Calculate max shares to sell
      const maxShares = await pm.calcSellAmount({
        marketId: market.id,
        outcomeId,
        value: sellAmount,
      })

      console.log('Selling shares...', { marketId: market.id, outcomeId, value: sellAmount, maxShares })

      // Execute sell
      await pm.sell({
        marketId: market.id,
        outcomeId,
        value: sellAmount,
        maxOutcomeSharesToSell: maxShares,
      })

      alert(`✅ Successfully sold shares for outcome ${outcomeId}!\n\n🔄 Refreshing market data...`)
      
      // Refresh markets to show updated probabilities
      await loadMarkets()
    } catch (err) {
      console.error('Sell error:', err)
      alert(`Sell failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSellingMarket(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="text-electric-purple">UI Test Page</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Testing UI components and functionality
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>

        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection Status</CardTitle>
            <CardDescription>Current wallet and network information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              {!mounted ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                <span className={isConnected ? "text-green-500" : "text-red-500"}>
                  {isConnected ? "✓ Connected" : "✗ Disconnected"}
                </span>
              )}
            </div>
            {mounted && address && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Address:</span>
                <code className="bg-muted px-2 py-1 rounded text-sm">{address}</code>
              </div>
            )}
            {mounted && chain && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Network:</span>
                <span>{chain.name} (ID: {chain.id})</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Different Test Sections */}
        <Tabs defaultValue="markets" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="markets" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Markets
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Trading Panel
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
              Market List
            </TabsTrigger>
            <TabsTrigger value="buttons" className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />
              Buttons
            </TabsTrigger>
          </TabsList>

          {/* Wrap all TabsContent in TabsContents with transition */}
          <TabsContents transition={{ duration: 0.2, ease: "easeInOut" }}>
            {/* Markets Tab */}
            <TabsContent value="markets" className="space-y-4">
              {/* Market Cards Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Cards</CardTitle>
                  <CardDescription>Responsive grid of market cards for homepage</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <LogoSpinner size={40} />
                    </div>
                  )}

                  {!loading && markets.length > 0 && (
                    <TooltipProvider>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                        {markets.slice(0, 8).map((market) => (
                          <MarketCard key={market.id} market={market} />
                        ))}
                      </div>
                    </TooltipProvider>
                  )}

                  {!loading && markets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No markets available
                    </div>
                  )}
                </CardContent>
              </Card>

            <Card>
              <CardHeader>
                <CardTitle>Markets from Myriad API (Celo Sepolia)</CardTitle>
                <CardDescription>
                  Fetching ALL markets (open, closed, resolved) - USDT token - Network ID: 11142220
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <LogoSpinner size={40} />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">Error: {error}</p>
                  </div>
                )}

                {!loading && !error && markets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No markets found on Celo Sepolia
                  </div>
                )}

                {!loading && markets.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Found {markets.length} market(s)
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {markets.map((market) => (
                        <Card key={market.id} className="hover:border-electric-purple transition-colors overflow-hidden">
                          {/* Market Banner Image */}
                          {market.banner_url && (
                            <div className="w-full h-32 overflow-hidden bg-gradient-to-br from-electric-purple/20 to-blue-500/20">
                              <img 
                                src={market.banner_url} 
                                alt={market.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg line-clamp-2 flex items-start gap-2">
                              <span className="flex-1">{market.title}</span>
                              {market.verified && (
                                <span className="text-green-500 text-sm shrink-0" title="Verified Market">✓</span>
                              )}
                            </CardTitle>
                            <CardDescription className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs bg-electric-purple/10 text-electric-purple px-2 py-0.5 rounded font-medium">
                                  {market.state.toUpperCase()}
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                  {market.token.symbol}
                                </span>
                                {market.category && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                    {market.category}
                                  </span>
                                )}
                                {market.users > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    👥 {market.users} trader{market.users !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              
                              {market.expires_at && market.state === 'open' && (
                                <div className="text-xs text-muted-foreground">
                                  ⏰ Closes: {new Date(market.expires_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </CardDescription>
                          </CardHeader>
                          
                          <CardContent className="space-y-3 text-sm">
                            {market.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2 pb-2 border-b">
                                {market.description}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">💰 Liquidity:</span>
                                <span className="font-semibold">{market.liquidity.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">📊 Volume:</span>
                                <span className="font-semibold">{market.volume.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">💸 Fee:</span>
                                <span className="font-semibold">{(market.fee * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">💬 Comments:</span>
                                <span className="font-semibold">{market.comments}</span>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">
                                Outcomes ({market.outcomes.length}):
                              </p>
                              <div className="space-y-2">
                                {market.outcomes.map((outcome) => {
                                  const userShareBalance = userShares[market.id]?.[outcome.id] || 0
                                  const hasShares = userShareBalance > 0
                                  
                                  return (
                                    <div key={outcome.id} className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 flex-1">
                                          <span className="text-xs font-medium">{outcome.title}</span>
                                          {outcome.price_change_24h !== undefined && outcome.price_change_24h !== 0 && (
                                            <span className={`text-xs ${outcome.price_change_24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                              {outcome.price_change_24h > 0 ? '↑' : '↓'} {Math.abs(outcome.price_change_24h * 100).toFixed(1)}%
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-sm font-bold text-electric-purple">
                                          {(outcome.price * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                      
                                      {mounted && isConnected && (
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">
                                            {loadingShares ? (
                                              <span className="flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Loading shares...
                                              </span>
                                            ) : hasShares ? (
                                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                                📊 You own: {userShareBalance.toFixed(4)} shares
                                              </span>
                                            ) : (
                                              <span className="text-muted-foreground/50">You own: 0 shares</span>
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                                          onClick={() => handleBuy(market, outcome.id)}
                                          disabled={!isConnected || buyingMarket === market.id || market.state !== 'open'}
                                        >
                                          {buyingMarket === market.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            'Buy'
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 h-7 text-xs border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                          onClick={() => handleSell(market, outcome.id)}
                                          disabled={!isConnected || sellingMarket === market.id || market.state !== 'open' || !hasShares}
                                          title={!hasShares ? "You don't own any shares to sell" : "Sell your shares"}
                                        >
                                          {sellingMarket === market.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            'Sell'
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            
                            {(market.likes > 0 || market.votes.up > 0 || market.votes.down > 0) && (
                              <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
                                {market.likes > 0 && <span>❤️ {market.likes}</span>}
                                {market.votes.up > 0 && <span>👍 {market.votes.up}</span>}
                                {market.votes.down > 0 && <span>👎 {market.votes.down}</span>}
                              </div>
                            )}
                            
                            <div className="pt-2 border-t">
                              <span className="text-xs text-muted-foreground font-mono">ID: {market.id}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart Tab */}
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Probability Chart</CardTitle>
                <CardDescription>Real-time market probability trends over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Market Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Market</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedMarketSlug 
                          ? markets.find(m => m.slug === selectedMarketSlug)?.title || 'Choose a market...'
                          : 'Choose a market to view chart...'
                        }
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {markets.map((market) => (
                        <DropdownMenuItem 
                          key={market.slug}
                          onClick={async () => {
                            setSelectedMarketSlug(market.slug)
                            setLoadingMarketDetails(true)
                            try {
                              const marketDetails = await fetchMarket(market.slug)
                              setSelectedMarketDetails(marketDetails)
                              console.log('📊 Loaded market details:', marketDetails)
                            } catch (err) {
                              console.error('Failed to load market details:', err)
                              setSelectedMarketDetails(null)
                            } finally {
                              setLoadingMarketDetails(false)
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {market.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Timeframe Selector */}
                {selectedMarketSlug && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeframe</label>
                    <ToggleGroup 
                      type="single" 
                      value={selectedTimeframe}
                      onValueChange={(value) => {
                        if (value) setSelectedTimeframe(value as '24h' | '7d' | '30d' | 'all')
                      }}
                    >
                      <ToggleGroupItem value="24h" aria-label="24 hours">
                        24h
                      </ToggleGroupItem>
                      <ToggleGroupItem value="7d" aria-label="7 days">
                        7d
                      </ToggleGroupItem>
                      <ToggleGroupItem value="30d" aria-label="30 days">
                        30d
                      </ToggleGroupItem>
                      <ToggleGroupItem value="all" aria-label="All time">
                        All
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                )}

                {/* Chart Display */}
                {loading || loadingMarketDetails ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <LogoSpinner size={40} />
                  </div>
                ) : selectedMarketDetails && selectedMarketDetails.outcomes ? (
                  <div className="space-y-2">
                    <ProbabilityChart 
                      outcomes={selectedMarketDetails.outcomes} 
                      timeframe={selectedTimeframe}
                      className="h-[400px]"
                    />
                  </div>
                ) : selectedMarketSlug ? (
                  <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <p className="text-muted-foreground">No chart data available for this market</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <p className="text-muted-foreground">Select a market above to view probability chart</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trading Panel Tab */}
          <TabsContent value="trading" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Panel</CardTitle>
                <CardDescription>Buy and sell outcome shares with real-time calculations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Market Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Market to Trade</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedTradingMarket 
                          ? selectedTradingMarket.title
                          : 'Choose a market to trade...'
                        }
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-[--radix-dropdown-menu-trigger-width] max-h-[300px] overflow-y-auto"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      {markets
                        .filter(m => m.state === 'open') // Only show open markets for trading
                        .map((market) => (
                          <DropdownMenuItem 
                            key={market.id}
                            onClick={() => setSelectedTradingMarket(market)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span>{market.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {market.outcomes.length} outcomes • {market.token.symbol}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      {markets.filter(m => m.state === 'open').length === 0 && (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No open markets available
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Trading Panel */}
                {selectedTradingMarket ? (
                  <TradingPanel
                    market={selectedTradingMarket}
                    userAddress={address}
                    isConnected={isConnected}
                    onTradeComplete={loadMarkets}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <p className="text-muted-foreground">Select a market above to start trading</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market List Tab */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Market List Components</CardTitle>
                <CardDescription>Test market cards, filters, and list layouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-muted-foreground">Market list components will be tested here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buttons Tab */}
          <TabsContent value="buttons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Button Components</CardTitle>
                <CardDescription>Test all button variants and states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Logo Spinner Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Logo Spinner</h3>
                  <p className="text-sm text-muted-foreground">
                    Rotating curved line with easing animation (fast at bottom, slow at top)
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-8 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/30">
                    {/* Different sizes */}
                    <div className="flex flex-col items-center gap-2">
                      <LogoSpinner size={40} />
                      <span className="text-xs text-muted-foreground">Small (40px)</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <LogoSpinner size={60} />
                      <span className="text-xs text-muted-foreground">Medium (60px)</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <LogoSpinner size={80} />
                      <span className="text-xs text-muted-foreground">Default (80px)</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <LogoSpinner size={120} />
                      <span className="text-xs text-muted-foreground">Large (120px)</span>
                    </div>
                  </div>
                  
                  {/* Usage example */}
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-xs font-mono text-muted-foreground mb-2">Usage:</p>
                    <code className="text-xs">
                      {`<LogoSpinner size={80} />`}
                    </code>
                  </div>
                </div>

                {/* Other button tests placeholder */}
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <p className="text-muted-foreground">Additional button components will be tested here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </TabsContents>
        </Tabs>

        {/* Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Myriad API:</span>
              <span className="truncate">
                {process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'}
              </span>
              
              <span className="text-muted-foreground">Network ID:</span>
              <span>{process.env.NEXT_PUBLIC_MYRIAD_NETWORK_ID || '11142220'}</span>
              
              <span className="text-muted-foreground">Chain ID:</span>
              <span>{process.env.NEXT_PUBLIC_CHAIN_ID || '44787'}</span>
              
              <span className="text-muted-foreground">PM Contract:</span>
              <span className="truncate">{process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
