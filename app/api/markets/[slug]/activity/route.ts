import { NextRequest, NextResponse } from 'next/server'
import Web3 from 'web3'
import { PREDICTION_MARKET_ABI, MarketAction } from '@/lib/abis/PredictionMarketV3_4'

const MYRIAD_API_URL = process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'
const PM_CONTRACT = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as string
const CELO_RPC = 'https://forno.celo-sepolia.celo-testnet.org'

// In-memory cache for 5 minutes (activity updates more frequently)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Check cache
    const cached = cache.get(slug)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        }
      })
    }

    // Fetch market data
    const marketResponse = await fetch(`${MYRIAD_API_URL}/markets/${slug}`)
    if (!marketResponse.ok) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    const market = await marketResponse.json()
    const marketId = market.id
    const outcomes = market.outcomes

    console.log(`🔍 Fetching activity for market ${marketId}...`)

    // Initialize Web3
    const web3 = new Web3(CELO_RPC)
    const contract = new web3.eth.Contract(PREDICTION_MARKET_ABI as any, PM_CONTRACT)

    // Get recent blocks (last ~24 hours on Celo Sepolia = ~17280 blocks at 5s per block)
    const latestBlock = Number(await web3.eth.getBlockNumber())
    const fromBlock = latestBlock - 17280 // Last 24 hours

    console.log(`📊 Querying blocks ${fromBlock} to ${latestBlock}`)

    // Get MarketActionTx events for this market
    const events = await contract.getPastEvents('MarketActionTx', {
      fromBlock: fromBlock.toString(),
      toBlock: 'latest',
      filter: {
        marketId: [marketId] // Filter by this specific market
      }
    })

    console.log(`📝 Found ${events.length} MarketActionTx events for market ${marketId}`)

    console.log(`📝 Found ${events.length} MarketActionTx events for market ${marketId}`)

    // Process events into activities
    const activities: Array<{
      user: string
      outcome: string
      side: 'Buy' | 'Sell'
      shares: string
      timestamp: number
      txHash: string
    }> = []

    for (const event of events) {
      const { user, action, outcomeId, shares, value, timestamp } = event.returnValues as any
      
      // Only include BUY (0) and SELL (1) actions
      if (Number(action) === MarketAction.BUY || Number(action) === MarketAction.SELL) {
        const outcomeIndex = Number(outcomeId)
        const outcomeTitle = outcomes[outcomeIndex]?.title || `Outcome ${outcomeIndex}`
        
        // Use value (USDT spent) as the amount, formatted with 6 decimals
        const amount = (Number(value) / 1e6).toFixed(2)
        
        activities.push({
          user: user as string,
          outcome: outcomeTitle,
          side: Number(action) === MarketAction.BUY ? 'Buy' : 'Sell',
          shares: amount, // Using USDT value as shares display
          timestamp: Number(timestamp),
          txHash: event.transactionHash
        })
      }
    }

    // Sort by timestamp descending (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp)

    // Take last 50 activities
    const recentActivities = activities.slice(0, 50)

    console.log(`✅ Found ${recentActivities.length} activities for market ${marketId}`)

    const responseData = {
      marketId,
      activities: recentActivities,
      cachedAt: new Date().toISOString()
    }

    // Cache for 5 minutes
    cache.set(slug, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('❌ Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
