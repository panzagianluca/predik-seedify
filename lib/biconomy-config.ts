/**
 * Biconomy Supertransaction API Configuration
 * Using the new Supertransaction API for gasless, multi-chain transactions
 * Docs: https://docs.biconomy.io/supertransaction-api
 */

import { bscTestnet } from 'viem/chains'

// BNB Testnet Chain ID
export const CHAIN_ID = 97

// Biconomy Supertransaction API configuration
export const biconomyConfig = {
  apiKey: process.env.NEXT_PUBLIC_BICONOMY_API_KEY || '',
  projectId: process.env.NEXT_PUBLIC_BICONOMY_PROJECT_ID || '',
  apiBaseUrl: 'https://api.biconomy.io',
  explorerBaseUrl: 'https://network.biconomy.io/v1/explorer',
  rpcUrl: process.env.NEXT_PUBLIC_BNB_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  chainId: CHAIN_ID,
  chain: bscTestnet,
}

// Contract addresses for our deployed contracts
export const contractAddresses = {
  router: process.env.NEXT_PUBLIC_ROUTER_ADDRESS as `0x${string}`,
  marketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as `0x${string}`,
  mockUSDT: process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS as `0x${string}`,
  outcome1155: process.env.NEXT_PUBLIC_OUTCOME1155_ADDRESS as `0x${string}`,
  treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS as `0x${string}`,
} as const

/**
 * Quote request for Biconomy Supertransaction API
 */
export interface QuoteRequest {
  mode: 'smart-account' | 'eoa' | 'eoa-7702'
  ownerAddress: string
  feeToken?: {
    address: string
    chainId: number
  }
  composeFlows: ComposeFlow[]
}

/**
 * Compose flow instruction types
 */
export type ComposeFlow = {
  type: '/instructions/build' | '/instructions/build-raw' | '/instructions/intent' | '/instructions/intent-simple'
  data: any
}

/**
 * Build instruction for custom contract calls
 */
export interface BuildInstruction {
  type: '/instructions/build'
  data: {
    functionSignature: string
    args: any[]
    to: string
    chainId: number
    gasLimit?: string
    value?: string
  }
}

/**
 * Quote response from Biconomy API
 */
export interface QuoteResponse {
  quoteType: 'simple' | 'permit' | 'onchain'
  payloadToSign: PayloadToSign[]
  fee?: {
    amount: string
    token: string
  }
  returnedData?: any[]
  [key: string]: any
}

/**
 * Payload to sign
 */
export interface PayloadToSign {
  message: string
  signature?: string
}

/**
 * Execute request
 */
export interface ExecuteRequest extends QuoteResponse {
  payloadToSign: PayloadToSign[]
}

/**
 * Execute response
 */
export interface ExecuteResponse {
  supertxHash: string
  transactionHash?: string
  userOps?: any[]
  [key: string]: any
}

/**
 * Get a quote for a gasless transaction
 * @param ownerAddress - User's EOA address (from Privy)
 * @param composeFlows - Array of instructions to execute
 * @param sponsored - Whether to sponsor gas (default: true)
 */
export async function getQuote(
  ownerAddress: string,
  composeFlows: ComposeFlow[],
  sponsored: boolean = true
): Promise<QuoteResponse> {
  const quoteRequest: QuoteRequest = {
    mode: 'smart-account',
    ownerAddress,
    composeFlows,
  }

  // If not sponsored, user pays in USDT
  if (!sponsored) {
    quoteRequest.feeToken = {
      address: contractAddresses.mockUSDT,
      chainId: CHAIN_ID,
    }
  }

  const response = await fetch(`${biconomyConfig.apiBaseUrl}/v1/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': biconomyConfig.apiKey,
    },
    body: JSON.stringify(quoteRequest),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Quote failed: ${JSON.stringify(error)}`)
  }

  return response.json()
}

/**
 * Execute a supertransaction
 * @param quote - Quote response with signed payload
 */
export async function executeSupertransaction(
  quote: ExecuteRequest
): Promise<ExecuteResponse> {
  const response = await fetch(`${biconomyConfig.apiBaseUrl}/v1/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': biconomyConfig.apiKey,
    },
    body: JSON.stringify(quote),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Execution failed: ${JSON.stringify(error)}`)
  }

  return response.json()
}

/**
 * Get supertransaction status
 * @param supertxHash - Supertransaction hash from execute response
 */
export async function getSupertransactionStatus(
  supertxHash: string
): Promise<any> {
  const response = await fetch(
    `${biconomyConfig.explorerBaseUrl}/${supertxHash}`,
    {
      headers: {
        Authorization: `Bearer ${biconomyConfig.apiKey}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Status check failed: ${JSON.stringify(error)}`)
  }

  return response.json()
}

/**
 * Helper to create a build instruction for Router contract calls
 */
export function createRouterInstruction(
  functionSignature: string,
  args: any[],
  gasLimit: string = '500000'
): BuildInstruction {
  return {
    type: '/instructions/build',
    data: {
      functionSignature,
      args,
      to: contractAddresses.router,
      chainId: CHAIN_ID,
      gasLimit,
    },
  }
}
