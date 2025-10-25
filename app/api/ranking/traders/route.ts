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
    const cacheKey = `traders-${timeframe}`

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

    console.log(`📈 Fetching traders ranking for timeframe: ${timeframe}`)

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

    // Get ALL MarketActionTx events (buy/sell only)
    const events = await contract.getPastEvents('MarketActionTx', {
      fromBlock,
      toBlock: 'latest'
    })

    console.log(`📊 Found ${events.length} total transactions`)

    // Calculate trading volume per user (sum of all buy + sell values)
    const userVolumes: Record<string, bigint> = {}

    for (const event of events) {
      if (typeof event === 'string') continue
      const { user, action, value } = event.returnValues as any
      const userAddress = (user as string).toLowerCase()
      const actionValue = BigInt(value)
      const actionNum = Number(action)

      // Only count BUY and SELL actions
      if (actionNum === MarketAction.BUY || actionNum === MarketAction.SELL) {
        if (!userVolumes[userAddress]) {
          userVolumes[userAddress] = BigInt(0)
        }
        userVolumes[userAddress] += actionValue
      }
    }

    // Convert to ranked list
    const rankedTraders = Object.entries(userVolumes)
      .map(([address, volume]) => ({
        address,
        value: (Number(volume) / 1e18).toFixed(2) // Using 18 decimals for internal contract representation
      }))
      .filter(user => parseFloat(user.value) > 0)
      .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
      .slice(0, 10) // Top 10
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }))

    console.log(`📈 Top traders:`, rankedTraders.slice(0, 3))

    // Cache the result
    cache.set(cacheKey, { data: rankedTraders, timestamp: Date.now() })

    return NextResponse.json(rankedTraders, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('❌ Error fetching traders ranking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch traders ranking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
