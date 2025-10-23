'use client'

import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { OpenPosition } from '@/hooks/use-user-transactions'

interface MarketInfo {
  id: number
  title: string
  outcomes: {
    id: number
    title: string
    price: number
  }[]
  state: string
}

interface PositionsListProps {
  positions: OpenPosition[]
  tokenDecimals?: number
  tokenSymbol?: string
}

// Helper function to calculate position metrics
const calculatePositionMetrics = (
  position: OpenPosition,
  currentPrice: number,
  tokenDecimals: number
) => {
  const shares = Number(formatUnits(position.shares, tokenDecimals))
  // avgEntryPrice is the ratio (invested wei / shares wei) - already normalized
  const avgPrice = position.avgEntryPrice
  const currentValue = shares * currentPrice
  const invested = Number(formatUnits(position.invested, tokenDecimals))
  const receivedFromSells = Number(formatUnits(position.receivedFromSells, tokenDecimals))
  const netInvested = invested - receivedFromSells
  const unrealizedPnL = currentValue - netInvested
  const pnlPercentage = netInvested > 0 ? (unrealizedPnL / netInvested) * 100 : 0

  return { shares, avgPrice, currentValue, unrealizedPnL, pnlPercentage }
}

// Position Row Component
function PositionRow({
  position,
  market,
  isLoadingMarkets,
  tokenDecimals,
  tokenSymbol,
}: {
  position: OpenPosition
  market?: MarketInfo
  isLoadingMarkets: boolean
  tokenDecimals: number
  tokenSymbol: string
}) {
  const marketName = market?.title || `Market #${position.marketId}`
  const outcome = market?.outcomes?.find(o => o.id.toString() === position.outcomeId)
  const outcomeName = outcome?.title || (position.outcomeId === '1' ? 'YES' : 'NO')
  const currentPrice = outcome?.price || 0
  
  const { shares, avgPrice, currentValue, unrealizedPnL, pnlPercentage } = 
    calculatePositionMetrics(position, currentPrice, tokenDecimals)

  return (
    <tr className="border-b border-border/50 hover:bg-muted/50 transition-colors">
      <td className="py-3 px-4">
        <div className="max-w-[300px]">
          <p className="font-medium text-sm truncate">
            {isLoadingMarkets ? (
              <span className="animate-pulse">Cargando...</span>
            ) : (
              marketName
            )}
          </p>
          {market?.state && (
            <p className="text-xs text-muted-foreground capitalize">{market.state}</p>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className={`flex items-center gap-2 ${
          position.outcomeId === '1' ? 'text-green-500' : 'text-red-500'
        }`}>
          {position.outcomeId === '1' ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span className="font-medium text-sm">{outcomeName}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-semibold">{shares.toFixed(2)}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm">{avgPrice.toFixed(2)}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium">{currentPrice.toFixed(2)}</span>
      </td>
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-semibold">
          {currentValue.toFixed(2)} {tokenSymbol}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex flex-col items-end">
          <span 
            className={`text-sm font-semibold ${
              unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {unrealizedPnL >= 0 ? '+' : ''}{unrealizedPnL.toFixed(2)} {tokenSymbol}
          </span>
          <span 
            className={`text-xs ${
              pnlPercentage >= 0 ? 'text-green-500/70' : 'text-red-500/70'
            }`}
          >
            ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%)
          </span>
        </div>
      </td>
    </tr>
  )
}

export function PositionsList({ 
  positions, 
  tokenDecimals = 18,
  tokenSymbol = 'cUSD'
}: PositionsListProps) {
  const [marketData, setMarketData] = useState<Map<string, MarketInfo>>(new Map())
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Calculate pagination
  const totalPages = Math.ceil(positions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPositions = positions.slice(startIndex, endIndex)
  const showPagination = positions.length > itemsPerPage

  useEffect(() => {
    if (positions.length === 0) return

    const fetchMarketData = async () => {
      setIsLoadingMarkets(true)
      
      try {
        const uniqueMarketIds = [...new Set(positions.map(p => p.marketId))]
        const network_id = process.env.NEXT_PUBLIC_NETWORK_ID || '11142220'
        
        // Fetch from all states
        const states = ['open', 'closed', 'resolved']
        const allStatesPromises = states.map(state =>
          fetch(`/api/markets?state=${state}&network_id=${network_id}`)
        )
        
        const responses = await Promise.all(allStatesPromises)
        const marketsArrays = await Promise.all(responses.map(r => r.json()))
        
        const allMarkets: MarketInfo[] = marketsArrays.flat()
        
        console.log(`Fetched ${allMarkets.length} markets for positions`)
        
        const dataMap = new Map<string, MarketInfo>()
        uniqueMarketIds.forEach(marketId => {
          const market = allMarkets.find(m => m.id.toString() === marketId)
          if (market) {
            console.log(`Found market ${marketId}: ${market.title}`)
            dataMap.set(marketId, market)
          } else {
            console.log(`Market ${marketId} not found in API`)
          }
        })
        
        setMarketData(dataMap)
      } catch (err) {
        console.error('Error fetching market data:', err)
      } finally {
        setIsLoadingMarkets(false)
      }
    }

    fetchMarketData()
  }, [positions])

  if (positions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay posiciones abiertas</p>
        <p className="text-sm mt-2">Tus posiciones activas aparecerán acá</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Mercado</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Posición</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Shares</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Precio Prom.</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Precio Actual</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Valor</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">PnL</th>
          </tr>
        </thead>
        <tbody>
          {currentPositions.map((position, index) => (
            <PositionRow
              key={`${position.marketId}-${position.outcomeId}-${index}`}
              position={position}
              market={marketData.get(position.marketId)}
              isLoadingMarkets={isLoadingMarkets}
              tokenDecimals={tokenDecimals}
              tokenSymbol={tokenSymbol}
            />
          ))}
        </tbody>
      </table>

      {showPagination && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} - {Math.min(endIndex, positions.length)} de {positions.length} posiciones
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium px-3">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
