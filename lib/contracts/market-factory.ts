/**
 * MarketFactory contract queries
 * Replaces Myriad API for fetching market data from BNB Testnet
 */

import { createPublicClient, http, Address } from 'viem'
import { bscTestnet } from 'viem/chains'
import { MARKET_FACTORY_ABI } from '@/lib/abis'

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(process.env.NEXT_PUBLIC_BNB_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/')
})

const MARKET_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as Address

/**
 * Get all market addresses from the factory
 */
export async function getAllMarkets(): Promise<Address[]> {
  try {
    const markets = await publicClient.readContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MARKET_FACTORY_ABI,
      functionName: 'getAllMarkets',
    })
    return markets as Address[]
  } catch (error) {
    console.error('Error fetching markets from factory:', error)
    return []
  }
}

/**
 * Get total number of markets
 */
export async function getMarketCount(): Promise<number> {
  try {
    const count = await publicClient.readContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MARKET_FACTORY_ABI,
      functionName: 'getMarketCount',
    })
    return Number(count)
  } catch (error) {
    console.error('Error fetching market count:', error)
    return 0
  }
}

/**
 * Get market address by ID
 */
export async function getMarketById(marketId: number): Promise<Address | null> {
  try {
    const market = await publicClient.readContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MARKET_FACTORY_ABI,
      functionName: 'getMarket',
      args: [BigInt(marketId)],
    })
    return market as Address
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error)
    return null
  }
}
