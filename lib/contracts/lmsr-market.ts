/**
 * LMSRMarket contract queries
 * Reads individual market on-chain data from BNB Testnet
 * NOTE: Metadata (title, description, category, imageUrl) should come from off-chain storage or The Graph
 */

import { createPublicClient, http, Address, formatUnits, parseUnits } from 'viem'
import { bscTestnet } from 'viem/chains'
import { LMSR_MARKET_ABI } from '@/lib/abis'

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(process.env.NEXT_PUBLIC_BNB_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/')
})

/**
 * On-chain market state (no metadata like title/description)
 */
export interface MarketOnChainState {
  address: Address
  marketId: bigint
  outcomeCount: number
  liquidityB: bigint // LMSR b parameter
  tradingEndsAt: number // timestamp
  state: number // 0=Trading, 1=Resolving, 2=Finalized
  winningOutcome: number
  invalid: boolean
  tradeFee: bigint
  totalVolume: bigint
}

export interface MarketPrices {
  prices: number[] // 0-100 probabilities
}

export interface UserPosition {
  shares: bigint[]
  formattedShares: number[]
}

/**
 * Get on-chain market state (no metadata)
 * For metadata (title, description, category, etc.), query The Graph or off-chain DB
 */
export async function getMarketOnChainState(marketAddress: Address): Promise<MarketOnChainState | null> {
  try {
    const [
      marketId,
      outcomeCount,
      liquidityB,
      tradingEndsAt,
      state,
      winningOutcome,
      invalid,
      tradeFee,
      totalVolume
    ] = await Promise.all([
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'marketId',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'outcomeCount',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'liquidityB',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'tradingEndsAt',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'state',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'winningOutcome',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'invalid',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'tradeFee',
      }),
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'totalVolume',
      }),
    ])

    return {
      address: marketAddress,
      marketId: marketId as bigint,
      outcomeCount: Number(outcomeCount),
      liquidityB: liquidityB as bigint,
      tradingEndsAt: Number(tradingEndsAt),
      state: Number(state),
      winningOutcome: Number(winningOutcome),
      invalid: invalid as boolean,
      tradeFee: tradeFee as bigint,
      totalVolume: totalVolume as bigint,
    }
  } catch (error) {
    console.error(`Error fetching market state for ${marketAddress}:`, error)
    return null
  }
}

/**
 * Get current market prices for each outcome (0-100 probabilities)
 */
export async function getMarketPrices(marketAddress: Address, outcomeCount: number): Promise<MarketPrices | null> {
  try {
    // Get price for each outcome
    const pricePromises = Array.from({ length: outcomeCount }, (_, i) =>
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'getPrice',
        args: [i],
      })
    )

    const prices = await Promise.all(pricePromises)

    // Convert prices from UD60x18 (18 decimals) to 0-100 probabilities
    const formattedPrices = prices.map(p => Number(formatUnits(p as bigint, 18)) * 100)

    return {
      prices: formattedPrices,
    }
  } catch (error) {
    console.error(`Error fetching prices for ${marketAddress}:`, error)
    return null
  }
}

/**
 * Get user's position in a market
 */
export async function getUserPosition(
  marketAddress: Address,
  userAddress: Address,
  outcomeCount: number
): Promise<UserPosition | null> {
  try {
    // Get shares for each outcome
    const sharePromises = Array.from({ length: outcomeCount }, (_, i) =>
      publicClient.readContract({
        address: marketAddress,
        abi: LMSR_MARKET_ABI,
        functionName: 'outstandingShares',
        args: [i],
      })
    )

    const shares = await Promise.all(sharePromises) as bigint[]
    const formattedShares = shares.map(s => Number(formatUnits(s, 18)))

    return {
      shares,
      formattedShares,
    }
  } catch (error) {
    console.error(`Error fetching position for ${userAddress} in ${marketAddress}:`, error)
    return null
  }
}

/**
 * Preview buy cost (includes fees)
 */
export async function previewBuyCost(
  marketAddress: Address,
  outcomeIndex: number,
  shares: string // formatted amount (e.g., "10.5")
): Promise<{ cost: string; fee: string; total: string } | null> {
  try {
    const sharesWei = parseUnits(shares, 18)
    
    const result = await publicClient.readContract({
      address: marketAddress,
      abi: LMSR_MARKET_ABI,
      functionName: 'previewBuy',
      args: [outcomeIndex, sharesWei],
    }) as readonly [bigint, bigint, bigint] // [costRaw, feeRaw, totalRaw]

    return {
      cost: formatUnits(result[0], 6), // Cost before fees (USDT)
      fee: formatUnits(result[1], 6),  // Fee amount (USDT)
      total: formatUnits(result[2], 6), // Total cost including fees (USDT)
    }
  } catch (error) {
    console.error(`Error previewing buy cost:`, error)
    return null
  }
}

/**
 * Preview sell proceeds (after fees)
 */
export async function previewSellProceeds(
  marketAddress: Address,
  outcomeIndex: number,
  shares: string // formatted amount
): Promise<{ gross: string; fee: string; net: string } | null> {
  try {
    const sharesWei = parseUnits(shares, 18)
    
    const result = await publicClient.readContract({
      address: marketAddress,
      abi: LMSR_MARKET_ABI,
      functionName: 'previewSell',
      args: [outcomeIndex, sharesWei],
    }) as readonly [bigint, bigint, bigint] // [grossRaw, feeRaw, netRaw]

    return {
      gross: formatUnits(result[0], 6), // Gross payout before fees (USDT)
      fee: formatUnits(result[1], 6),   // Fee amount (USDT)
      net: formatUnits(result[2], 6),   // Net payout after fees (USDT)
    }
  } catch (error) {
    console.error(`Error previewing sell proceeds:`, error)
    return null
  }
}
