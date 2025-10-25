/**
 * Biconomy Supertransaction API hooks
 * Provides gasless transaction functionality using Privy + Biconomy
 */

import { useState, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import {
  getQuote,
  executeSupertransaction,
  getSupertransactionStatus,
  createRouterInstruction,
  type QuoteResponse,
  type ExecuteResponse,
  type ComposeFlow,
} from '@/lib/biconomy-config'

/**
 * Hook to access Biconomy smart account functionality
 */
export function useBiconomy() {
  const { user, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Get the user's embedded wallet (created by Privy)
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy')
  
  // User's EOA address (used as owner for smart account)
  const ownerAddress = embeddedWallet?.address || user?.wallet?.address

  /**
   * Sign a message using Privy wallet
   */
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!embeddedWallet) {
        throw new Error('No wallet connected')
      }

      try {
        // Switch to embedded wallet and sign
        await embeddedWallet.switchChain(97) // BNB Testnet
        const provider = await embeddedWallet.getEthereumProvider()
        const signature = await provider.request({
          method: 'personal_sign',
          params: [message, ownerAddress],
        })
        
        return signature as string
      } catch (err) {
        console.error('Error signing message:', err)
        throw err
      }
    },
    [embeddedWallet, ownerAddress]
  )

  /**
   * Execute a gasless supertransaction
   */
  const executeGasless = useCallback(
    async (
      composeFlows: ComposeFlow[],
      sponsored: boolean = true
    ): Promise<ExecuteResponse> => {
      if (!authenticated || !ownerAddress) {
        throw new Error('User not authenticated')
      }

      setIsLoading(true)
      setError(null)

      try {
        // Step 1: Get quote
        console.log('Getting quote for gasless transaction...')
        const quote = await getQuote(ownerAddress, composeFlows, sponsored)
        
        console.log('Quote received:', quote)
        console.log('Quote type:', quote.quoteType)

        // Step 2: Sign payload
        const signedPayload = []
        for (const payload of quote.payloadToSign) {
          console.log('Signing payload...')
          const signature = await signMessage(payload.message)
          signedPayload.push({ ...payload, signature })
        }

        // Step 3: Execute
        console.log('Executing supertransaction...')
        const result = await executeSupertransaction({
          ...quote,
          payloadToSign: signedPayload,
        })

        console.log('Supertransaction executed:', result)
        return result
      } catch (err) {
        const error = err as Error
        console.error('Error executing gasless transaction:', error)
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [authenticated, ownerAddress, signMessage]
  )

  /**
   * Check supertransaction status
   */
  const checkStatus = useCallback(
    async (supertxHash: string) => {
      try {
        return await getSupertransactionStatus(supertxHash)
      } catch (err) {
        console.error('Error checking status:', err)
        throw err
      }
    },
    []
  )

  return {
    ownerAddress,
    isLoading,
    error,
    executeGasless,
    checkStatus,
    isReady: authenticated && !!ownerAddress,
  }
}

/**
 * Hook for gasless trading operations
 */
export function useGaslessTrade(marketAddress: string) {
  const { executeGasless, isLoading, error } = useBiconomy()

  /**
   * Buy shares gaslessly
   * @param outcomeId - Outcome index (0, 1, etc.)
   * @param shares - Number of shares to buy (in wei, 18 decimals)
   */
  const buyShares = useCallback(
    async (outcomeId: number, shares: bigint) => {
      try {
        // Create instruction to call buy() on market contract through Router
        // The Router will forward the call to the market
        const instruction = createRouterInstruction(
          'function buy(uint8 outcomeId, uint256 deltaShares) returns (uint256)',
          [outcomeId, shares.toString()],
          '300000' // Gas limit
        )

        // Override the 'to' address to be the market, not the router
        instruction.data.to = marketAddress

        // Execute gaslessly
        return await executeGasless([instruction], true) // sponsored = true
      } catch (err) {
        console.error('Error buying shares:', err)
        throw err
      }
    },
    [executeGasless, marketAddress]
  )

  /**
   * Sell shares gaslessly
   * @param outcomeId - Outcome index (0, 1, etc.)
   * @param shares - Number of shares to sell (in wei, 18 decimals)
   */
  const sellShares = useCallback(
    async (outcomeId: number, shares: bigint) => {
      try {
        // Create instruction to call sell() on market contract through Router
        const instruction = createRouterInstruction(
          'function sell(uint8 outcomeId, uint256 deltaShares) returns (uint256)',
          [outcomeId, shares.toString()],
          '250000' // Gas limit
        )

        // Override the 'to' address to be the market, not the router
        instruction.data.to = marketAddress

        // Execute gaslessly
        return await executeGasless([instruction], true) // sponsored = true
      } catch (err) {
        console.error('Error selling shares:', err)
        throw err
      }
    },
    [executeGasless, marketAddress]
  )

  /**
   * Claim winnings gaslessly
   */
  const claimWinnings = useCallback(
    async () => {
      try {
        // Create instruction to call claimWinnings() on market contract
        const instruction = createRouterInstruction(
          'function claimWinnings() returns (uint256)',
          [],
          '200000' // Gas limit
        )

        // Override the 'to' address to be the market, not the router
        instruction.data.to = marketAddress

        // Execute gaslessly
        return await executeGasless([instruction], true) // sponsored = true
      } catch (err) {
        console.error('Error claiming winnings:', err)
        throw err
      }
    },
    [executeGasless, marketAddress]
  )

  return {
    buyShares,
    sellShares,
    claimWinnings,
    isLoading,
    error,
  }
}

/**
 * Hook to format transaction results for display
 */
export function useTransactionFormatter() {
  const formatResult = useCallback((result: ExecuteResponse) => {
    return {
      hash: result.supertxHash,
      transactionHash: result.transactionHash,
      userOps: result.userOps,
      explorerUrl: `https://testnet.bscscan.com/tx/${result.transactionHash}`,
    }
  }, [])

  return { formatResult }
}
