import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { celoAlfajores } from 'viem/chains'

const CELO_RPC = 'https://alfajores-forno.celo-testnet.org'
const PM_CONTRACT = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS as `0x${string}`

const ERC1155_ABI = [
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export async function GET() {
  try {
    const client = createPublicClient({
      chain: celoAlfajores,
      transport: http(CELO_RPC)
    })

    // Test with known holders from market 5
    const marketId = 5
    const testAddress = '0x127ADa0c7becaD68FD4806eBB3E7e810A7321011' // First top holder

    const results: any[] = []

    // Try different token ID calculations
    for (let outcomeId = 0; outcomeId < 2; outcomeId++) {
      // Try formula: marketId * 2 + outcomeId
      const tokenId1 = BigInt(marketId * 2 + outcomeId)
      
      // Try formula: just outcomeId
      const tokenId2 = BigInt(outcomeId)
      
      // Try formula: marketId + outcomeId
      const tokenId3 = BigInt(marketId + outcomeId)

      try {
        const balance1 = await client.readContract({
          address: PM_CONTRACT,
          abi: ERC1155_ABI,
          functionName: 'balanceOf',
          args: [testAddress as `0x${string}`, tokenId1]
        })

        const balance2 = await client.readContract({
          address: PM_CONTRACT,
          abi: ERC1155_ABI,
          functionName: 'balanceOf',
          args: [testAddress as `0x${string}`, tokenId2]
        })

        const balance3 = await client.readContract({
          address: PM_CONTRACT,
          abi: ERC1155_ABI,
          functionName: 'balanceOf',
          args: [testAddress as `0x${string}`, tokenId3]
        })

        results.push({
          outcomeId,
          testAddress,
          tokenId1: tokenId1.toString(),
          balance1: balance1.toString(),
          tokenId2: tokenId2.toString(),
          balance2: balance2.toString(),
          tokenId3: tokenId3.toString(),
          balance3: balance3.toString()
        })
      } catch (err) {
        results.push({
          outcomeId,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      marketId,
      testAddress,
      results,
      note: 'Testing different token ID formulas to find which one works'
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
