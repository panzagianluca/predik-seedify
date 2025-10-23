'use client'

import { useEffect, useState } from 'react'
import { UserTransaction, MarketAction } from '@/hooks/use-user-transactions'
import { formatUnits } from 'viem'
import { TrendingUp, TrendingDown, ArrowRight, Award, ChevronLeft, ChevronRight } from 'lucide-react'

interface MarketInfo {
  id: number
  title: string
  slug: string
  created_at: string
}

interface TransactionsListProps {
  transactions: UserTransaction[]
  tokenDecimals?: number
  tokenSymbol?: string
}

export function TransactionsList({ 
  transactions, 
  tokenDecimals = 6,
  tokenSymbol = 'USDT' 
}: TransactionsListProps) {
  const [marketNames, setMarketNames] = useState<Map<string, string>>(new Map())
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTransactions = transactions.slice(startIndex, endIndex)
  const showPagination = transactions.length > itemsPerPage

  useEffect(() => {
    if (transactions.length === 0) return

    const fetchMarketNames = async () => {
      setIsLoadingMarkets(true)
      try {
        // Get unique market IDs
        const uniqueMarketIds = Array.from(new Set(transactions.map(tx => tx.marketId.toString())))
        
        const networkId = process.env.NEXT_PUBLIC_MYRIAD_NETWORK_ID || '11142220'
        
        console.log('🔍 Fetching markets via API route')
        console.log('🔢 On-chain market IDs to lookup:', uniqueMarketIds)
        
        // Use our Next.js API route to avoid CORS issues
        // Fetch ALL markets (including all states) to get complete list
        const allStatesPromises = [
          fetch(`/api/markets?token=USDT&network_id=${networkId}&state=open`),
          fetch(`/api/markets?token=USDT&network_id=${networkId}&state=closed`),
          fetch(`/api/markets?token=USDT&network_id=${networkId}&state=resolved`)
        ]
        
        const responses = await Promise.all(allStatesPromises)
        const marketsArrays = await Promise.all(responses.map(r => r.json()))
        
        // Combine all markets from different states
        const allMarkets: MarketInfo[] = marketsArrays.flat()
        
        console.log(`Fetched ${allMarkets.length} total markets (all states)`)
        console.log('Available markets:', allMarkets.map(m => ({ id: m.id, title: m.title.substring(0, 60) })))
        
        // The blockchain marketId IS the same as the API's id field!
        // Match by ID directly
        const namesMap = new Map<string, string>()
        uniqueMarketIds.forEach(marketId => {
          console.log(`Looking up market ID ${marketId}`)
          
          const market = allMarkets.find(m => m.id.toString() === marketId)
          
          if (market) {
            console.log(`  Found: ${market.title}`)
            namesMap.set(marketId, market.title)
          } else {
            console.log(`  Not found in API response`)
            namesMap.set(marketId, `Market #${marketId}`)
          }
        })

        setMarketNames(namesMap)
      } catch (error) {
        console.error('Error fetching market names:', error)
        // Fallback: use market IDs as names
        const fallbackMap = new Map<string, string>()
        transactions.forEach(tx => {
          const marketId = tx.marketId.toString()
          fallbackMap.set(marketId, `Market #${marketId}`)
        })
        setMarketNames(fallbackMap)
      } finally {
        setIsLoadingMarkets(false)
      }
    }

    fetchMarketNames()
  }, [transactions])

  const getSideInfo = (action: MarketAction) => {
    switch (action) {
      case MarketAction.BUY:
        return { label: 'Compra', icon: TrendingUp, color: 'text-green-500' }
      case MarketAction.SELL:
        return { label: 'Venta', icon: TrendingDown, color: 'text-red-500' }
      case MarketAction.ADD_LIQUIDITY:
        return { label: 'Agregar Liquidez', icon: TrendingUp, color: 'text-blue-500' }
      case MarketAction.REMOVE_LIQUIDITY:
        return { label: 'Quitar Liquidez', icon: TrendingDown, color: 'text-orange-500' }
      case MarketAction.CLAIM_WINNINGS:
        return { label: 'Cobrar Ganancias', icon: Award, color: 'text-green-500' }
      case MarketAction.CLAIM_LIQUIDITY:
        return { label: 'Cobrar Liquidez', icon: Award, color: 'text-blue-500' }
      case MarketAction.CLAIM_FEES:
        return { label: 'Cobrar Comisiones', icon: Award, color: 'text-purple-500' }
      case MarketAction.CLAIM_VOIDED:
        return { label: 'Cobrar Anulado', icon: Award, color: 'text-gray-500' }
      default:
        return { label: 'Desconocido', icon: ArrowRight, color: 'text-gray-500' }
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No hay transacciones todavía</p>
        <p className="text-sm mt-2">Tus operaciones aparecerán acá</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Mercado</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Tipo</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Shares</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Costo</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {currentTransactions.map((tx, index) => {
            const sideInfo = getSideInfo(tx.action)
            const SideIcon = sideInfo.icon
            const cost = Number(formatUnits(tx.value, tokenDecimals))
            const marketName = marketNames.get(tx.marketId.toString()) || `Market #${tx.marketId}`
            const date = new Date(tx.timestamp * 1000)
            const dateStr = date.toLocaleDateString('es-AR', { 
              day: 'numeric', 
              month: 'short',
              year: 'numeric'
            })
            const timeStr = date.toLocaleTimeString('es-AR', { 
              hour: '2-digit', 
              minute: '2-digit'
            })

            return (
              <tr 
                key={`${tx.hash}-${index}`}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="max-w-[300px]">
                    <p className="font-medium text-sm truncate">
                      {isLoadingMarkets ? (
                        <span className="animate-pulse">Cargando...</span>
                      ) : (
                        marketName
                      )}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={`flex items-center gap-2 ${sideInfo.color}`}>
                    <SideIcon className="h-4 w-4" />
                    <span className="font-medium text-sm">{sideInfo.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-semibold">
                    {Number(formatUnits(tx.shares, tokenDecimals)).toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-semibold">
                    {cost.toFixed(2)} {tokenSymbol}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="text-sm">
                    <p className="font-medium">{dateStr}</p>
                    <p className="text-xs text-muted-foreground">{timeStr}</p>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {showPagination && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} - {Math.min(endIndex, transactions.length)} de {transactions.length} transacciones
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
