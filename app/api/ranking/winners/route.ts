import { NextRequest, NextResponse } from 'next/server'
import Web3 from 'web3'
import { PREDICTION_MARKET_ABI, MarketAction } from '@/lib/abis/PredictionMarketV3_4'

const PM_CONTRACT = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as string
const CELO_RPC = 'https://forno.celo-sepolia.celo-testnet.org'

// Cache for 1 hour
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'month'
    const cacheKey = `winners-${timeframe}`

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

    console.log(`🏆 Fetching winners ranking for timeframe: ${timeframe}`)

    // Initialize Web3
    const web3 = new Web3(CELO_RPC)
    const contract = new web3.eth.Contract(PREDICTION_MARKET_ABI as any, PM_CONTRACT)

    // Calculate timestamp for filtering (if month)
    let fromBlock = '0'
    if (timeframe === 'month') {
      const oneMonthAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60)
      // Get approximate block number (Celo has ~5 sec block time)
      const currentBlock = await web3.eth.getBlockNumber()
      const blocksPerDay = (24 * 60 * 60) / 5
      const blocksToGoBack = Math.floor(30 * blocksPerDay)
      fromBlock = Math.max(0, Number(currentBlock) - blocksToGoBack).toString()
    }

    console.log(`📊 Scanning from block ${fromBlock}...`)

    // Get MarketActionTx events with CLAIM_WINNINGS action
    const claimEvents = await contract.getPastEvents('MarketActionTx', {
      fromBlock,
      toBlock: 'latest',
      filter: {
        action: [MarketAction.CLAIM_WINNINGS]
      }
    })

    console.log(`💰 Found ${claimEvents.length} claim winnings events`)

    // Aggregate winnings per user (value field = winnings claimed)
    const userWinnings: Record<string, bigint> = {}

    for (const event of claimEvents) {
      const { user, value } = event.returnValues as any
      const userAddress = (user as string).toLowerCase()
      const winningsAmount = BigInt(value)

      if (!userWinnings[userAddress]) {
        userWinnings[userAddress] = BigInt(0)
      }

      userWinnings[userAddress] += winningsAmount
    }

    // Convert to ranked list
    const rankedWinners = Object.entries(userWinnings)
      .map(([address, winnings]) => ({
        address,
        value: (Number(winnings) / 1e18).toFixed(2) // Using 18 decimals for internal contract representation
      }))
      .filter(user => parseFloat(user.value) > 0)
      .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
      .slice(0, 10) // Top 10
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }))

    console.log(`🏆 Top winners:`, rankedWinners.slice(0, 3))

    // Cache the result
    cache.set(cacheKey, { data: rankedWinners, timestamp: Date.now() })

    return NextResponse.json(rankedWinners, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('❌ Error fetching winners ranking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch winners ranking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
