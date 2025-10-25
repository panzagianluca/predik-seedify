import { PrivyClientConfig } from '@privy-io/react-auth'
import { bscTestnet } from 'viem/chains'

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

export const privyConfig: PrivyClientConfig = {
  // Appearance
  appearance: {
    theme: 'dark',
    accentColor: '#A855F7', // Electric purple from your theme
    logo: '/logo.png',
  },
  
  // Login methods
  loginMethods: ['email', 'google', 'wallet'],
  
  // Embedded wallets config - create wallet for users without one
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  } as any,
  
  // Supported chains
  supportedChains: [bscTestnet],
  
  defaultChain: bscTestnet,
}
