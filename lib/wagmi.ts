import { http, createConfig } from 'wagmi'
import { bscTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Simple wagmi config for BNB Testnet - Privy handles authentication
// This is just for contract interactions via useReadContract, useWriteContract, etc.
export const config = createConfig({
  chains: [bscTestnet],
  connectors: [injected()], // Just injected connector (MetaMask, Coinbase Wallet, etc.)
  transports: {
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BNB_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/'),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
