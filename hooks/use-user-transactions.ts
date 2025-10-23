'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { Address, parseAbiItem } from 'viem'
import { PREDICTION_MARKET_ABI, MARKET_ACTION_LABELS } from '@/lib/abis/PredictionMarketV3_4'
import { MarketAction } from '@/lib/abis/PredictionMarketV3_4'

// Re-export for convenience
export { MarketAction } from '@/lib/abis/PredictionMarketV3_4'

export interface UserTransaction {
  hash: string
  marketId: bigint
  action: MarketAction
  actionLabel: string
  outcomeId: bigint
  shares: bigint
  value: bigint
  timestamp: number
  blockNumber: bigint
}

export interface TransactionStats {
  totalInvested: bigint
  totalWithdrawn: bigint
  netPosition: bigint
  transactionCount: number
  marketsTraded: Set<string>
}

export interface OpenPosition {
  marketId: string
  outcomeId: string // '0' for NO, '1' for YES
  shares: bigint // net shares held
  totalBought: bigint // total shares bought
  totalSold: bigint // total shares sold
  invested: bigint // total money spent on buys
  receivedFromSells: bigint // total money from sells
  avgEntryPrice: number // invested / totalBought (in token units)
}

interface UseUserTransactionsResult {
  transactions: UserTransaction[]
  stats: TransactionStats
  positions: OpenPosition[]
  isLoading: boolean
  error: Error | null
}

const PM_CONTRACT = (process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '') as Address

export function useUserTransactions(userAddress?: Address): UseUserTransactionsResult {
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<UserTransaction[]>([])
  const [positions, setPositions] = useState<OpenPosition[]>([])
  const [stats, setStats] = useState<TransactionStats>({
    totalInvested: BigInt(0),
    totalWithdrawn: BigInt(0),
    netPosition: BigInt(0),
    transactionCount: 0,
    marketsTraded: new Set(),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userAddress || !publicClient || !PM_CONTRACT) {
      setTransactions([])
      setPositions([])
      setStats({
        totalInvested: BigInt(0),
        totalWithdrawn: BigInt(0),
        netPosition: BigInt(0),
        transactionCount: 0,
        marketsTraded: new Set(),
      })
      return
    }

    const fetchTransactions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber()
        
        // Query logs from the last ~30 days (assuming ~2s block time on Abstract)
        // 30 days * 24 hours * 60 minutes * 60 seconds / 2 seconds per block = ~1,296,000 blocks
        const blocksToQuery = BigInt(1_296_000)
        const fromBlock = currentBlock > blocksToQuery ? currentBlock - blocksToQuery : BigInt(0)

        console.log('🔍 Fetching user transactions...', {
          userAddress,
          pmContract: PM_CONTRACT,
          fromBlock: fromBlock.toString(),
          toBlock: currentBlock.toString(),
        })

        // Fetch MarketActionTx events for this user
        const logs = await publicClient.getLogs({
          address: PM_CONTRACT,
          event: PREDICTION_MARKET_ABI[0], // MarketActionTx event
          args: {
            user: userAddress,
          },
          fromBlock,
          toBlock: currentBlock,
        })

        console.log(`📊 Found ${logs.length} transactions for user`)

        // Parse logs into transactions
        const parsedTransactions: UserTransaction[] = logs.map((log) => {
          const { user, action, marketId, outcomeId, shares, value, timestamp } = log.args

          return {
            hash: log.transactionHash || '',
            marketId: marketId || BigInt(0),
            action: Number(action) as MarketAction,
            actionLabel: MARKET_ACTION_LABELS[Number(action) as MarketAction] || 'Unknown',
            outcomeId: outcomeId || BigInt(0),
            shares: shares || BigInt(0),
            value: value || BigInt(0),
            timestamp: Number(timestamp || 0),
            blockNumber: log.blockNumber || BigInt(0),
          }
        })

        // Sort by timestamp descending (newest first)
        parsedTransactions.sort((a, b) => b.timestamp - a.timestamp)

        // Calculate stats
        let totalInvested = BigInt(0)
        let totalWithdrawn = BigInt(0)
        const marketsTraded = new Set<string>()

        parsedTransactions.forEach((tx) => {
          marketsTraded.add(tx.marketId.toString())

          // Money going in: Buy, Add Liquidity
          if (tx.action === MarketAction.BUY || tx.action === MarketAction.ADD_LIQUIDITY) {
            totalInvested += tx.value
          }

          // Money coming out: Sell, Remove Liquidity, Claims
          if (
            tx.action === MarketAction.SELL ||
            tx.action === MarketAction.REMOVE_LIQUIDITY ||
            tx.action === MarketAction.CLAIM_WINNINGS ||
            tx.action === MarketAction.CLAIM_LIQUIDITY ||
            tx.action === MarketAction.CLAIM_FEES ||
            tx.action === MarketAction.CLAIM_VOIDED
          ) {
            totalWithdrawn += tx.value
          }
        })

        const netPosition = totalWithdrawn - totalInvested

        // Calculate open positions
        const positionMap = new Map<string, OpenPosition>()

        parsedTransactions.forEach((tx) => {
          // Only track BUY and SELL actions for positions
          if (tx.action !== MarketAction.BUY && tx.action !== MarketAction.SELL) {
            return
          }

          const key = `${tx.marketId}-${tx.outcomeId}`
          const existing = positionMap.get(key) || {
            marketId: tx.marketId.toString(),
            outcomeId: tx.outcomeId.toString(),
            shares: BigInt(0),
            totalBought: BigInt(0),
            totalSold: BigInt(0),
            invested: BigInt(0),
            receivedFromSells: BigInt(0),
            avgEntryPrice: 0,
          }

          if (tx.action === MarketAction.BUY) {
            existing.shares += tx.shares
            existing.totalBought += tx.shares
            existing.invested += tx.value
          } else if (tx.action === MarketAction.SELL) {
            existing.shares -= tx.shares
            existing.totalSold += tx.shares
            existing.receivedFromSells += tx.value
          }

          // Calculate average entry price (value per share in wei)
          if (existing.totalBought > BigInt(0)) {
            // Average price = total invested / total shares bought
            // Both are in wei, so result is dimensionless (price per share)
            // We'll format it in the UI component
            const investedNum = Number(existing.invested)
            const sharesNum = Number(existing.totalBought)
            existing.avgEntryPrice = investedNum / sharesNum
          }

          positionMap.set(key, existing)
        })

        // Filter to only open positions (shares > 0)
        const openPositions = Array.from(positionMap.values()).filter(
          (pos) => pos.shares > BigInt(0)
        )

        console.log(`📈 Found ${openPositions.length} open positions`)

        setTransactions(parsedTransactions)
        setPositions(openPositions)
        setStats({
          totalInvested,
          totalWithdrawn,
          netPosition,
          transactionCount: parsedTransactions.length,
          marketsTraded,
        })
      } catch (err) {
        console.error('❌ Error fetching transactions:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch transactions'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [userAddress, publicClient])

  return {
    transactions,
    positions,
    stats,
    isLoading,
    error,
  }
}
