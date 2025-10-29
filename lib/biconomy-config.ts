/**
 * Biconomy Smart Accounts Configuration for BNB Mainnet
 * 
 * This configuration sets up:
 * - Multichain Nexus Smart Accounts
 * - MEE (Modular Execution Environment) for gasless transactions
 * - EIP-7702 integration with Privy embedded wallets
 * 
 * Docs: https://docs.biconomy.io/new/getting-started/getting-started
 */

import { getMEEVersion, MEEVersion } from '@biconomy/abstractjs'
import { http } from 'viem'
import { bsc } from 'viem/chains'

/**
 * BNB Mainnet Configuration (Chain ID: 56)
 */
export const BSC_MAINNET_CONFIG = {
  chain: bsc,
  transport: http(process.env.NEXT_PUBLIC_BNB_RPC || 'https://bsc-dataseed.binance.org/'),
  version: getMEEVersion(MEEVersion.V2_1_0),
} as const

/**
 * Nexus Implementation Address (EIP-7702)
 * This is the smart account implementation that gets installed on EOAs
 */
export const NEXUS_IMPLEMENTATION = '0x000000004F43C49e93C970E84001853a70923B03' as const

/**
 * MEE Client Configuration
 * API Key is optional but recommended for production to avoid rate limiting
 */
export const getMEEClientConfig = () => ({
  apiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY,
  // url is optional - defaults to Biconomy Network
})

/**
 * Contract Addresses
 */
export const CONTRACTS = {
  MOCK_USDT: process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS as `0x${string}`,
  ROUTER: process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}`,
  MARKET_FACTORY: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as `0x${string}`,
  OUTCOME1155: process.env.NEXT_PUBLIC_OUTCOME1155_ADDRESS as `0x${string}`,
  TREASURY: process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
  ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS as `0x${string}`,
} as const

/**
 * Get BNB Mainnet chain configuration for Nexus
 */
export function getBSCMainnetChainConfig() {
  return BSC_MAINNET_CONFIG
}

/**
 * Utility: Check if Biconomy is configured
 */
export function isBiconomyConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS &&
    process.env.NEXT_PUBLIC_ROUTER_ADDRESS
  )
}
