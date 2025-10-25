import { NextRequest, NextResponse } from 'next/server'
import Web3 from 'web3'
import { PREDICTION_MARKET_ABI, MarketAction } from '@/lib/abis/PredictionMarketV3_4'

const MYRIAD_API_URL = process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'
const PM_CONTRACT = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as string
const CELO_RPC = 'https://forno.celo-sepolia.celo-testnet.org'

// Cache for 1 hour
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'month'
    const cacheKey = `holders-${timeframe}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'X-Cache': 'HIT'
        }
      })
    }

    console.log(`💎 Fetching holders ranking for timeframe: ${timeframe}`)

    // Initialize Web3
    const web3 = new Web3(CELO_RPC)
    const contract = new web3.eth.Contract(PREDICTION_MARKET_ABI as any, PM_CONTRACT)

    // Calculate from block (if month)
    let fromBlock = '0'
    if (timeframe === 'month') {
      const currentBlock = await web3.eth.getBlockNumber()
      const blocksPerDay = (24 * 60 * 60) / 5 // Celo ~5 sec block time
      const blocksToGoBack = Math.floor(30 * blocksPerDay)
      fromBlock = Math.max(0, Number(currentBlock) - blocksToGoBack).toString()
    }

    console.log(`📊 Scanning from block ${fromBlock}...`)

    // Get ALL MarketActionTx events across all markets
    const events = await contract.getPastEvents('MarketActionTx', {
      fromBlock,
      toBlock: 'latest'
    })

    console.log(`📊 Found ${events.length} total transactions`)

    // Calculate current balances per user across all markets
    const userBalances: Record<string, Record<number, Record<number, bigint>>> = {}

    // Process events chronologically to calculate current holdings
    for (const event of events) {
      if (typeof event === 'string') continue
      const { user, action, marketId, outcomeId, shares } = event.returnValues as any
      const userAddress = (user as string).toLowerCase()
      const marketIdNum = Number(marketId)
      const outcomeIdNum = Number(outcomeId)
      const shareAmount = BigInt(shares)

      // Initialize nested structure
      if (!userBalances[userAddress]) {
        userBalances[userAddress] = {}
      }
      if (!userBalances[userAddress][marketIdNum]) {
        userBalances[userAddress][marketIdNum] = {}
      }
      if (!userBalances[userAddress][marketIdNum][outcomeIdNum]) {
        userBalances[userAddress][marketIdNum][outcomeIdNum] = BigInt(0)
      }

      // Update balance based on action
      if (Number(action) === MarketAction.BUY) {
        userBalances[userAddress][marketIdNum][outcomeIdNum] += shareAmount
      } else if (Number(action) === MarketAction.SELL) {
        userBalances[userAddress][marketIdNum][outcomeIdNum] -= shareAmount
      }
    }

    // Aggregate total shares per user
    const userTotalShares: Record<string, bigint> = {}

    for (const [userAddress, markets] of Object.entries(userBalances)) {
      let totalShares = BigInt(0)
      for (const [marketId, outcomes] of Object.entries(markets)) {
        for (const [outcomeId, shares] of Object.entries(outcomes)) {
          if (shares > BigInt(0)) {
            totalShares += shares
          }
        }
      }
      if (totalShares > BigInt(0)) {
        userTotalShares[userAddress] = totalShares
      }
    }

    // Convert to ranked list
    const rankedHolders = Object.entries(userTotalShares)
      .map(([address, shares]) => ({
        address,
        value: (Number(shares) / 1e18).toFixed(2) // Using 18 decimals for internal contract representation
      }))
      .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
      .slice(0, 10) // Top 10
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }))

    console.log(`💎 Top holders:`, rankedHolders.slice(0, 3))

    // Cache the result
    cache.set(cacheKey, { data: rankedHolders, timestamp: Date.now() })

    return NextResponse.json(rankedHolders, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('❌ Error fetching holders ranking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch holders ranking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
