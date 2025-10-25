import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from '@biconomy/account'
import { Bundler } from '@biconomy/bundler'
import { BiconomyPaymaster } from '@biconomy/paymaster'
import { createWalletClient, http } from 'viem'
import { bscTestnet } from 'viem/chains'

// BNB Testnet Chain ID
export const CHAIN_ID = 97

// Biconomy configuration for BNB Testnet
export const biconomyConfig = {
  bundlerUrl: process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL || `https://bundler.biconomy.io/api/v2/${CHAIN_ID}/${process.env.NEXT_PUBLIC_BICONOMY_API_KEY}`,
  paymasterUrl: process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_URL || `https://paymaster.biconomy.io/api/v1/${CHAIN_ID}/${process.env.NEXT_PUBLIC_BICONOMY_API_KEY}`,
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
}

/**
 * Create a Biconomy Smart Account for gasless transactions
 * @param signer - Privy embedded wallet or external wallet
 */
export async function createSmartAccount(signer: any) {
  try {
    // Initialize bundler
    const bundler = new Bundler({
      bundlerUrl: biconomyConfig.bundlerUrl,
      chainId: CHAIN_ID,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    })

    // Initialize paymaster
    const paymaster = new BiconomyPaymaster({
      paymasterUrl: biconomyConfig.paymasterUrl,
    })

    // Create smart account
    const smartAccount = await BiconomySmartAccountV2.create({
      chainId: CHAIN_ID,
      bundler,
      paymaster,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: signer,
      activeValidationModule: signer,
      signer,
    })

    const smartAccountAddress = await smartAccount.getAccountAddress()
    
    console.log('Smart Account created:', smartAccountAddress)
    
    return {
      smartAccount,
      address: smartAccountAddress,
    }
  } catch (error) {
    console.error('Error creating smart account:', error)
    throw error
  }
}

/**
 * Send a gasless transaction using Biconomy
 */
export async function sendGaslessTransaction(
  smartAccount: BiconomySmartAccountV2,
  to: string,
  data: string,
  value: bigint = 0n
) {
  try {
    const userOp = await smartAccount.buildUserOp([
      {
        to,
        data,
        value,
      },
    ])

    const userOpResponse = await smartAccount.sendUserOp(userOp)
    const transactionDetails = await userOpResponse.wait()

    console.log('Gasless transaction successful:', transactionDetails)
    
    return transactionDetails
  } catch (error) {
    console.error('Error sending gasless transaction:', error)
    throw error
  }
}
