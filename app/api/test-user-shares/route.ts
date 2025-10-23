import { NextResponse } from 'next/server'
import { getHolderShares } from '@/lib/getHolderShares'

export async function GET() {
  try {
    // Test with market 4 (F1 market) and known holders
    const marketId = 4
    const testAddresses = [
      '0xfddf82BbB370557a2d4a0c9A786fB3F6843291A2',
      '0xfacA5d95B87B58DE1B999550e1c81a6F76e0526A',
      '0x039471CDDbBED199C07Dd40cBfE6cD38f47ca70B'
    ]

    const results: any[] = []

    for (const address of testAddresses) {
      try {
        console.log(`\n🔍 Testing ${address}...`)
        const { liquidityShares, outcomeShares } = await getHolderShares(marketId, address)
        
        results.push({
          address,
          success: true,
          liquidityShares: liquidityShares.toString(),
          outcomeShares: outcomeShares.map(s => s.toString()),
          outcomeSharesFormatted: outcomeShares.map(s => (Number(s) / 1e6).toFixed(2))
        })
        
        console.log(`  ✅ Success! Liquidity:`, liquidityShares.toString())
        console.log(`  ✅ Outcome Shares:`, outcomeShares.map(s => s.toString()))
      } catch (err) {
        results.push({
          address,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
        console.error(`  ❌ Error:`, err)
      }
    }

    return NextResponse.json({
      marketId,
      testAddresses,
      results,
      note: 'Testing getUserMarketShares with Web3.js'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
