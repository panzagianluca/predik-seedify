import { NextRequest, NextResponse } from 'next/server'
import Web3 from 'web3'
import { PREDICTION_MARKET_ABI, MarketAction } from '@/lib/abis/PredictionMarketV3_4'

const MYRIAD_API_URL = process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'
const PM_CONTRACT = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as string
const CELO_RPC = 'https://forno.celo-sepolia.celo-testnet.org'

// In-memory cache for 5 minutes (real-time updates)
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

    console.log(`🔍 Calculating holders for market ${marketId} from blockchain events...`)

    // Initialize Web3
    const web3 = new Web3(CELO_RPC)
    const contract = new web3.eth.Contract(PREDICTION_MARKET_ABI as any, PM_CONTRACT)

    // Get ALL MarketActionTx events for this market (from block 0)
    const events = await contract.getPastEvents('MarketActionTx', {
      fromBlock: '0',
      toBlock: 'latest',
      filter: {
        marketId: [marketId]
      }
    })

    console.log(`📊 Found ${events.length} total transactions for market ${marketId}`)

    // Calculate balances per user per outcome
    const balances: Record<number, Record<string, bigint>> = {}
    
    // Initialize outcome balances
    outcomes.forEach((outcome: any, index: number) => {
      balances[index] = {}
    })

    // Process events chronologically
    for (const event of events) {
      const { user, action, outcomeId, shares } = event.returnValues as any
      const outcomeIndex = Number(outcomeId)
      const userAddress = (user as string).toLowerCase()
      const shareAmount = BigInt(shares)

      // Initialize user balance if not exists
      if (!balances[outcomeIndex][userAddress]) {
        balances[outcomeIndex][userAddress] = BigInt(0)
      }

      // Update balance based on action
      if (Number(action) === MarketAction.BUY) {
        balances[outcomeIndex][userAddress] += shareAmount
      } else if (Number(action) === MarketAction.SELL) {
        balances[outcomeIndex][userAddress] -= shareAmount
      }
      // Ignore other actions (ADD_LIQUIDITY, REMOVE_LIQUIDITY, etc.)
    }

    // Convert to holder lists per outcome
    const holdersData = {
      marketId,
      outcomes: outcomes.map((outcome: any, index: number) => {
        // Get all holders with non-zero balance for this outcome
        const holders = Object.entries(balances[index])
          .filter(([_, balance]) => balance > BigInt(0))
          .map(([address, balance]) => ({
            address,
            shares: (Number(balance) / 1e6).toFixed(2) // Try 6 decimals like USDT
          }))
          .sort((a, b) => parseFloat(b.shares) - parseFloat(a.shares)) // Sort by balance descending
          .slice(0, 20) // Top 20 holders

        return {
          id: outcome.id,
          title: outcome.title,
          holders
        }
      }),
      note: 'Real-time blockchain data - cached for 5 minutes',
      cachedAt: new Date().toISOString()
    }

    console.log(`✅ Calculated holders:`, outcomes.map((o: any, i: number) => 
      `${o.title}: ${holdersData.outcomes[i].holders.length} holders`
    ).join(', '))

    // Cache for 5 minutes
    cache.set(slug, { data: holdersData, timestamp: Date.now() })

    return NextResponse.json(holdersData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('❌ Error calculating holders:', error)
    return NextResponse.json(
      { error: 'Failed to calculate holders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
