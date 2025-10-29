/**/**/**

 * Biconomy Smart Accounts Hook with Privy Integration

 *  * Biconomy Smart Accounts Hook with Privy Integration * Biconomy Supertransaction API hooks

 * This hook provides:

 * - EIP-7702 authorization for gasless transactions *  * Provides gasless transaction functionality using Privy + Biconomy

 * - Smart account creation on BSC Testnet

 * - Composable batch operations (approve + buy in one tx) * This hook provides: */

 * - Runtime parameter injection

 * - Gasless execution via MEE * - EIP-7702 authorization for gasless transactions

 * 

 * Based on: https://docs.biconomy.io/new/integration-guides/wallets-and-signers/privy * - Smart account creation on BSC Testnetimport { useState, useCallback } from 'react'

 */

 * - Composable batch operations (approve + buy in one tx)import { usePrivy, useWallets } from '@privy-io/react-auth'

import { useState, useCallback } from 'react'

import { useWallets, useSignAuthorization } from '@privy-io/react-auth' * - Runtime parameter injectionimport {

import {

  createWalletClient, * - Gasless execution via MEE  getQuote,

  custom,

  type Address, *   executeSupertransaction,

  type Hex,

} from 'viem' * Based on: https://docs.biconomy.io/new/integration-guides/wallets-and-signers/privy  getSupertransactionStatus,

import { bscTestnet } from 'viem/chains'

import { */  createRouterInstruction,

  createMeeClient,

  toMultichainNexusAccount,  type QuoteResponse,

  type MultichainNexusAccount,

} from '@biconomy/abstractjs'import { useState, useCallback } from 'react'  type ExecuteResponse,

import {

  BSC_TESTNET_CONFIG,import { useWallets, useSignAuthorization } from '@privy-io/react-auth'  type ComposeFlow,

  NEXUS_IMPLEMENTATION,

  getMEEClientConfig,import {} from '@/lib/biconomy-config'

  CONTRACTS,

} from '@/lib/biconomy-config'  createWalletClient,

import { ROUTER_ABI } from '@/lib/abis/Router'

  createPublicClient,/**

export interface UseBiconomyReturn {

  // Smart account state  http, * Hook to access Biconomy smart account functionality

  smartAccount: MultichainNexusAccount | null

  smartAccountAddress: Address | null  custom, */

  isInitialized: boolean

  isInitializing: boolean  erc20Abi,export function useBiconomy() {

  

  // Actions  parseUnits,  const { user, authenticated } = usePrivy()

  initializeSmartAccount: () => Promise<void>

  executeGaslessBuy: (marketId: bigint, outcome: number, shares: bigint, maxCost: bigint) => Promise<Hex>  type Address,  const { wallets } = useWallets()

  executeGaslessSell: (marketId: bigint, outcome: number, shares: bigint, minPayout: bigint) => Promise<Hex>

  executeBatchBuy: (marketId: bigint, outcome: number, shares: bigint, maxCost: bigint, approvalAmount: bigint) => Promise<Hex>  type Hex,  const [isLoading, setIsLoading] = useState(false)

  

  // Status} from 'viem'  const [error, setError] = useState<Error | null>(null)

  error: string | null

  lastTxHash: Hex | nullimport { bscTestnet } from 'viem/chains'

}

import {  // Get the user's embedded wallet (created by Privy)

/**

 * Hook to use Biconomy Smart Accounts with Privy wallets  createMeeClient,  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy')

 */

export function useBiconomy(): UseBiconomyReturn {  toMultichainNexusAccount,  

  const { wallets } = useWallets()

  const { signAuthorization } = useSignAuthorization()  runtimeERC20BalanceOf,  // User's EOA address (used as owner for smart account)

  

  const [smartAccount, setSmartAccount] = useState<MultichainNexusAccount | null>(null)  greaterThanOrEqualTo,  const ownerAddress = embeddedWallet?.address || user?.wallet?.address

  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null)

  const [isInitialized, setIsInitialized] = useState(false)  type MultichainNexusAccount,

  const [isInitializing, setIsInitializing] = useState(false)

  const [error, setError] = useState<string | null>(null)} from '@biconomy/abstractjs'  /**

  const [lastTxHash, setLastTxHash] = useState<Hex | null>(null)

import {   * Sign a message using Privy wallet

  /**

   * Initialize Smart Account with EIP-7702  BSC_TESTNET_CONFIG,   */

   * This signs an authorization to install Nexus on the user's EOA

   */  NEXUS_IMPLEMENTATION,  const signMessage = useCallback(

  const initializeSmartAccount = useCallback(async () => {

    try {  getMEEClientConfig,    async (message: string): Promise<string> => {

      setIsInitializing(true)

      setError(null)  CONTRACTS,      if (!embeddedWallet) {



      // Get Privy embedded wallet} from '@/lib/biconomy-config'        throw new Error('No wallet connected')

      const embeddedWallet = wallets?.[0]

      if (!embeddedWallet) {import { routerAbi } from '@/lib/abis/router'      }

        throw new Error('No embedded wallet found. Please connect with Privy.')

      }



      // Switch to BSC Testnetexport interface UseBiconomyReturn {      try {

      await embeddedWallet.switchChain(bscTestnet.id)

      const provider = await embeddedWallet.getEthereumProvider()  // Smart account state        // Switch to embedded wallet and sign



      // Create wallet client  smartAccount: MultichainNexusAccount | null        await embeddedWallet.switchChain(97) // BNB Testnet

      const walletClient = createWalletClient({

        account: embeddedWallet.address as Address,  smartAccountAddress: Address | null        const provider = await embeddedWallet.getEthereumProvider()

        chain: bscTestnet,

        transport: custom(provider),  isInitialized: boolean        const signature = await provider.request({

      })

  isInitializing: boolean          method: 'personal_sign',

      // Sign EIP-7702 authorization (installs Nexus on EOA)

      const authorization = await signAuthorization({            params: [message, ownerAddress],

        contractAddress: NEXUS_IMPLEMENTATION,

        chainId: 0, // 0 means all chains  // Actions        })

      })

  initializeSmartAccount: () => Promise<void>        

      // Create Nexus smart account

      const nexusAccount = await toMultichainNexusAccount({  executeGaslessBuy: (marketId: bigint, outcome: number, shares: bigint, maxCost: bigint) => Promise<Hex>        return signature as string

        chainConfigurations: [BSC_TESTNET_CONFIG],

        signer: walletClient.account,  executeGaslessSell: (marketId: bigint, outcome: number, shares: bigint, minPayout: bigint) => Promise<Hex>      } catch (err) {

        accountAddress: embeddedWallet.address as Address, // Use EOA address for EIP-7702

      })  executeBatchBuy: (marketId: bigint, outcome: number, shares: bigint, maxCost: bigint, approvalAmount: bigint) => Promise<Hex>        console.error('Error signing message:', err)



      setSmartAccount(nexusAccount)          throw err

      setSmartAccountAddress(nexusAccount.addressOn(bscTestnet.id, true) as Address)

      setIsInitialized(true)  // Status      }



      console.log('✅ Smart Account initialized:', nexusAccount.addressOn(bscTestnet.id, true))  error: string | null    },

    } catch (err) {

      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize smart account'  lastTxHash: Hex | null    [embeddedWallet, ownerAddress]

      setError(errorMsg)

      console.error('❌ Smart Account initialization failed:', err)}  )

      throw err

    } finally {

      setIsInitializing(false)

    }/**  /**

  }, [wallets, signAuthorization])

 * Hook to use Biconomy Smart Accounts with Privy wallets   * Execute a gasless supertransaction

  /**

   * Execute gasless buy operation */   */

   * Approves USDT and buys outcome tokens in a single transaction

   */export function useBiconomy(): UseBiconomyReturn {  const executeGasless = useCallback(

  const executeBatchBuy = useCallback(

    async (  const { wallets } = useWallets()    async (

      marketId: bigint,

      outcome: number,  const { signAuthorization } = useSignAuthorization()      composeFlows: ComposeFlow[],

      shares: bigint,

      maxCost: bigint,        sponsored: boolean = true

      approvalAmount: bigint

    ): Promise<Hex> => {  const [smartAccount, setSmartAccount] = useState<MultichainNexusAccount | null>(null)    ): Promise<ExecuteResponse> => {

      if (!smartAccount) {

        throw new Error('Smart account not initialized. Call initializeSmartAccount() first.')  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null)      if (!authenticated || !ownerAddress) {

      }

  const [isInitialized, setIsInitialized] = useState(false)        throw new Error('User not authenticated')

      try {

        setError(null)  const [isInitializing, setIsInitializing] = useState(false)      }



        // Get Privy wallet for authorization  const [error, setError] = useState<string | null>(null)

        const embeddedWallet = wallets?.[0]

        if (!embeddedWallet) {  const [lastTxHash, setLastTxHash] = useState<Hex | null>(null)      setIsLoading(true)

          throw new Error('No wallet found')

        }      setError(null)



        const provider = await embeddedWallet.getEthereumProvider()  /**

        const walletClient = createWalletClient({

          account: embeddedWallet.address as Address,   * Initialize Smart Account with EIP-7702      try {

          chain: bscTestnet,

          transport: custom(provider),   * This signs an authorization to install Nexus on the user's EOA        // Step 1: Get quote

        })

   */        console.log('Getting quote for gasless transaction...')

        // Sign authorization

        const authorization = await signAuthorization({  const initializeSmartAccount = useCallback(async () => {        const quote = await getQuote(ownerAddress, composeFlows, sponsored)

          contractAddress: NEXUS_IMPLEMENTATION,

          chainId: 0,    try {        

        })

      setIsInitializing(true)        console.log('Quote received:', quote)

        // Create MEE client

        const meeClient = await createMeeClient({      setError(null)        console.log('Quote type:', quote.quoteType)

          account: smartAccount,

          ...getMEEClientConfig(),

        })

      // Get Privy embedded wallet        // Step 2: Sign payload

        // Build approve instruction

        const approveInstruction = await smartAccount.buildComposable({      const embeddedWallet = wallets?.[0]        const signedPayload = []

          type: 'approve' as const,

          data: {      if (!embeddedWallet) {        for (const payload of quote.payloadToSign) {

            spender: CONTRACTS.ROUTER,

            tokenAddress: CONTRACTS.MOCK_USDT,        throw new Error('No embedded wallet found. Please connect with Privy.')          console.log('Signing payload...')

            chainId: bscTestnet.id,

            amount: approvalAmount,      }          const signature = await signMessage(payload.message)

          },

        })          signedPayload.push({ ...payload, signature })



        // Build buy instruction      // Switch to BSC Testnet        }

        const buyInstruction = await smartAccount.buildComposable({

          type: 'default' as const,      await embeddedWallet.switchChain(bscTestnet.id)

          data: {

            abi: ROUTER_ABI,      const provider = await embeddedWallet.getEthereumProvider()        // Step 3: Execute

            functionName: 'buyOutcomeTokens',

            chainId: bscTestnet.id,        console.log('Executing supertransaction...')

            to: CONTRACTS.ROUTER,

            args: [marketId, outcome, shares, maxCost],      // Create wallet client        const result = await executeSupertransaction({

          },

        })      const walletClient = createWalletClient({          ...quote,



        // Execute batch with gasless transaction (sponsored by MEE)        account: embeddedWallet.address as Address,          payloadToSign: signedPayload,

        const { hash } = await meeClient.execute({

          authorization,        chain: bscTestnet,        })

          delegate: true, // Required for EIP-7702

          sponsorship: true, // Enable gasless transactions        transport: custom(provider),

          instructions: [approveInstruction, buyInstruction],

        })      })        console.log('Supertransaction executed:', result)



        setLastTxHash(hash as Hex)        return result

        console.log('✅ Batch buy executed:', hash)

      // Sign EIP-7702 authorization (installs Nexus on EOA)      } catch (err) {

        // Wait for receipt

        const receipt = await meeClient.waitForSupertransactionReceipt({ hash })      const authorization = await signAuthorization({        const error = err as Error

        console.log('✅ Transaction confirmed:', receipt.hash)

        contractAddress: NEXUS_IMPLEMENTATION,        console.error('Error executing gasless transaction:', error)

        return hash as Hex

      } catch (err) {        chainId: 0, // 0 means all chains        setError(error)

        const errorMsg = err instanceof Error ? err.message : 'Batch buy failed'

        setError(errorMsg)      })        throw error

        console.error('❌ Batch buy failed:', err)

        throw err      } finally {

      }

    },      // Create Nexus smart account        setIsLoading(false)

    [smartAccount, wallets, signAuthorization]

  )      const nexusAccount = await toMultichainNexusAccount({      }



  /**        chainConfigurations: [BSC_TESTNET_CONFIG],    },

   * Execute gasless buy (simple version - assumes USDT is already approved)

   */        signer: walletClient.account,    [authenticated, ownerAddress, signMessage]

  const executeGaslessBuy = useCallback(

    async (        accountAddress: embeddedWallet.address as Address, // Use EOA address for EIP-7702  )

      marketId: bigint,

      outcome: number,      })

      shares: bigint,

      maxCost: bigint  /**

    ): Promise<Hex> => {

      if (!smartAccount) {      setSmartAccount(nexusAccount)   * Check supertransaction status

        throw new Error('Smart account not initialized')

      }      setSmartAccountAddress(nexusAccount.addressOn(bscTestnet.id, true) as Address)   */



      try {      setIsInitialized(true)  const checkStatus = useCallback(

        setError(null)

    async (supertxHash: string) => {

        const embeddedWallet = wallets?.[0]

        if (!embeddedWallet) throw new Error('No wallet found')      console.log('✅ Smart Account initialized:', nexusAccount.addressOn(bscTestnet.id, true))      try {



        const authorization = await signAuthorization({    } catch (err) {        return await getSupertransactionStatus(supertxHash)

          contractAddress: NEXUS_IMPLEMENTATION,

          chainId: 0,      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize smart account'      } catch (err) {

        })

      setError(errorMsg)        console.error('Error checking status:', err)

        const meeClient = await createMeeClient({

          account: smartAccount,      console.error('❌ Smart Account initialization failed:', err)        throw err

          ...getMEEClientConfig(),

        })      throw err      }



        const buyInstruction = await smartAccount.buildComposable({    } finally {    },

          type: 'default' as const,

          data: {      setIsInitializing(false)    []

            abi: ROUTER_ABI,

            functionName: 'buyOutcomeTokens',    }  )

            chainId: bscTestnet.id,

            to: CONTRACTS.ROUTER,  }, [wallets, signAuthorization])

            args: [marketId, outcome, shares, maxCost],

          },  return {

        })

  /**    ownerAddress,

        const { hash } = await meeClient.execute({

          authorization,   * Execute gasless buy operation    isLoading,

          delegate: true,

          sponsorship: true,   * Approves USDT and buys outcome tokens in a single transaction    error,

          instructions: [buyInstruction],

        })   */    executeGasless,



        setLastTxHash(hash as Hex)  const executeBatchBuy = useCallback(    checkStatus,

        return hash as Hex

      } catch (err) {    async (    isReady: authenticated && !!ownerAddress,

        const errorMsg = err instanceof Error ? err.message : 'Gasless buy failed'

        setError(errorMsg)      marketId: bigint,  }

        throw err

      }      outcome: number,}

    },

    [smartAccount, wallets, signAuthorization]      shares: bigint,

  )

      maxCost: bigint,/**

  /**

   * Execute gasless sell operation      approvalAmount: bigint * Hook for gasless trading operations

   */

  const executeGaslessSell = useCallback(    ): Promise<Hex> => { */

    async (

      marketId: bigint,      if (!smartAccount) {export function useGaslessTrade(marketAddress: string) {

      outcome: number,

      shares: bigint,        throw new Error('Smart account not initialized. Call initializeSmartAccount() first.')  const { executeGasless, isLoading, error } = useBiconomy()

      minPayout: bigint

    ): Promise<Hex> => {      }

      if (!smartAccount) {

        throw new Error('Smart account not initialized')  /**

      }

      try {   * Buy shares gaslessly

      try {

        setError(null)        setError(null)   * @param outcomeId - Outcome index (0, 1, etc.)



        const embeddedWallet = wallets?.[0]   * @param shares - Number of shares to buy (in wei, 18 decimals)

        if (!embeddedWallet) throw new Error('No wallet found')

        // Get Privy wallet for authorization   */

        const authorization = await signAuthorization({

          contractAddress: NEXUS_IMPLEMENTATION,        const embeddedWallet = wallets?.[0]  const buyShares = useCallback(

          chainId: 0,

        })        if (!embeddedWallet) {    async (outcomeId: number, shares: bigint) => {



        const meeClient = await createMeeClient({          throw new Error('No wallet found')      try {

          account: smartAccount,

          ...getMEEClientConfig(),        }        // Create instruction to call buy() on market contract through Router

        })

        // The Router will forward the call to the market

        const sellInstruction = await smartAccount.buildComposable({

          type: 'default' as const,        const provider = await embeddedWallet.getEthereumProvider()        const instruction = createRouterInstruction(

          data: {

            abi: ROUTER_ABI,        const walletClient = createWalletClient({          'function buy(uint8 outcomeId, uint256 deltaShares) returns (uint256)',

            functionName: 'sellOutcomeTokens',

            chainId: bscTestnet.id,          account: embeddedWallet.address as Address,          [outcomeId, shares.toString()],

            to: CONTRACTS.ROUTER,

            args: [marketId, outcome, shares, minPayout],          chain: bscTestnet,          '300000' // Gas limit

          },

        })          transport: custom(provider),        )



        const { hash } = await meeClient.execute({        })

          authorization,

          delegate: true,        // Override the 'to' address to be the market, not the router

          sponsorship: true,

          instructions: [sellInstruction],        // Sign authorization        instruction.data.to = marketAddress

        })

        const authorization = await signAuthorization({

        setLastTxHash(hash as Hex)

        return hash as Hex          contractAddress: NEXUS_IMPLEMENTATION,        // Execute gaslessly

      } catch (err) {

        const errorMsg = err instanceof Error ? err.message : 'Gasless sell failed'          chainId: 0,        return await executeGasless([instruction], true) // sponsored = true

        setError(errorMsg)

        throw err        })      } catch (err) {

      }

    },        console.error('Error buying shares:', err)

    [smartAccount, wallets, signAuthorization]

  )        // Create MEE client        throw err



  return {        const meeClient = await createMeeClient({      }

    smartAccount,

    smartAccountAddress,          account: smartAccount,    },

    isInitialized,

    isInitializing,          ...getMEEClientConfig(),    [executeGasless, marketAddress]

    initializeSmartAccount,

    executeGaslessBuy,        })  )

    executeGaslessSell,

    executeBatchBuy,

    error,

    lastTxHash,        // Build approve instruction  /**

  }

}        const approveInstruction = await smartAccount.buildComposable({   * Sell shares gaslessly


          type: 'approve' as const,   * @param outcomeId - Outcome index (0, 1, etc.)

          data: {   * @param shares - Number of shares to sell (in wei, 18 decimals)

            spender: CONTRACTS.ROUTER,   */

            tokenAddress: CONTRACTS.MOCK_USDT,  const sellShares = useCallback(

            chainId: bscTestnet.id,    async (outcomeId: number, shares: bigint) => {

            amount: approvalAmount,      try {

          },        // Create instruction to call sell() on market contract through Router

        })        const instruction = createRouterInstruction(

          'function sell(uint8 outcomeId, uint256 deltaShares) returns (uint256)',

        // Build buy instruction          [outcomeId, shares.toString()],

        const buyInstruction = await smartAccount.buildComposable({          '250000' // Gas limit

          type: 'default' as const,        )

          data: {

            abi: routerAbi,        // Override the 'to' address to be the market, not the router

            functionName: 'buyOutcomeTokens',        instruction.data.to = marketAddress

            chainId: bscTestnet.id,

            to: CONTRACTS.ROUTER,        // Execute gaslessly

            args: [marketId, outcome, shares, maxCost],        return await executeGasless([instruction], true) // sponsored = true

          },      } catch (err) {

        })        console.error('Error selling shares:', err)

        throw err

        // Execute batch with gasless transaction (sponsored by MEE)      }

        const { hash } = await meeClient.execute({    },

          authorization,    [executeGasless, marketAddress]

          delegate: true, // Required for EIP-7702  )

          sponsorship: true, // Enable gasless transactions

          instructions: [approveInstruction, buyInstruction],  /**

        })   * Claim winnings gaslessly

   */

        setLastTxHash(hash as Hex)  const claimWinnings = useCallback(

        console.log('✅ Batch buy executed:', hash)    async () => {

      try {

        // Wait for receipt        // Create instruction to call claimWinnings() on market contract

        const receipt = await meeClient.waitForSupertransactionReceipt({ hash })        const instruction = createRouterInstruction(

        console.log('✅ Transaction confirmed:', receipt.hash)          'function claimWinnings() returns (uint256)',

          [],

        return hash as Hex          '200000' // Gas limit

      } catch (err) {        )

        const errorMsg = err instanceof Error ? err.message : 'Batch buy failed'

        setError(errorMsg)        // Override the 'to' address to be the market, not the router

        console.error('❌ Batch buy failed:', err)        instruction.data.to = marketAddress

        throw err

      }        // Execute gaslessly

    },        return await executeGasless([instruction], true) // sponsored = true

    [smartAccount, wallets, signAuthorization]      } catch (err) {

  )        console.error('Error claiming winnings:', err)

        throw err

  /**      }

   * Execute gasless buy (simple version - assumes USDT is already approved)    },

   */    [executeGasless, marketAddress]

  const executeGaslessBuy = useCallback(  )

    async (

      marketId: bigint,  return {

      outcome: number,    buyShares,

      shares: bigint,    sellShares,

      maxCost: bigint    claimWinnings,

    ): Promise<Hex> => {    isLoading,

      if (!smartAccount) {    error,

        throw new Error('Smart account not initialized')  }

      }}



      try {/**

        setError(null) * Hook to format transaction results for display

 */

        const embeddedWallet = wallets?.[0]export function useTransactionFormatter() {

        if (!embeddedWallet) throw new Error('No wallet found')  const formatResult = useCallback((result: ExecuteResponse) => {

    return {

        const authorization = await signAuthorization({      hash: result.supertxHash,

          contractAddress: NEXUS_IMPLEMENTATION,      transactionHash: result.transactionHash,

          chainId: 0,      userOps: result.userOps,

        })      explorerUrl: `https://testnet.bscscan.com/tx/${result.transactionHash}`,

    }

        const meeClient = await createMeeClient({  }, [])

          account: smartAccount,

          ...getMEEClientConfig(),  return { formatResult }

        })}


        const buyInstruction = await smartAccount.buildComposable({
          type: 'default' as const,
          data: {
            abi: routerAbi,
            functionName: 'buyOutcomeTokens',
            chainId: bscTestnet.id,
            to: CONTRACTS.ROUTER,
            args: [marketId, outcome, shares, maxCost],
          },
        })

        const { hash } = await meeClient.execute({
          authorization,
          delegate: true,
          sponsorship: true,
          instructions: [buyInstruction],
        })

        setLastTxHash(hash as Hex)
        return hash as Hex
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Gasless buy failed'
        setError(errorMsg)
        throw err
      }
    },
    [smartAccount, wallets, signAuthorization]
  )

  /**
   * Execute gasless sell operation
   */
  const executeGaslessSell = useCallback(
    async (
      marketId: bigint,
      outcome: number,
      shares: bigint,
      minPayout: bigint
    ): Promise<Hex> => {
      if (!smartAccount) {
        throw new Error('Smart account not initialized')
      }

      try {
        setError(null)

        const embeddedWallet = wallets?.[0]
        if (!embeddedWallet) throw new Error('No wallet found')

        const authorization = await signAuthorization({
          contractAddress: NEXUS_IMPLEMENTATION,
          chainId: 0,
        })

        const meeClient = await createMeeClient({
          account: smartAccount,
          ...getMEEClientConfig(),
        })

        const sellInstruction = await smartAccount.buildComposable({
          type: 'default' as const,
          data: {
            abi: routerAbi,
            functionName: 'sellOutcomeTokens',
            chainId: bscTestnet.id,
            to: CONTRACTS.ROUTER,
            args: [marketId, outcome, shares, minPayout],
          },
        })

        const { hash } = await meeClient.execute({
          authorization,
          delegate: true,
          sponsorship: true,
          instructions: [sellInstruction],
        })

        setLastTxHash(hash as Hex)
        return hash as Hex
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Gasless sell failed'
        setError(errorMsg)
        throw err
      }
    },
    [smartAccount, wallets, signAuthorization]
  )

  return {
    smartAccount,
    smartAccountAddress,
    isInitialized,
    isInitializing,
    initializeSmartAccount,
    executeGaslessBuy,
    executeGaslessSell,
    executeBatchBuy,
    error,
    lastTxHash,
  }
}
