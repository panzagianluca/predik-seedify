import { PrivyClientConfig } from '@privy-io/react-auth'
import { bscTestnet } from 'viem/chains'

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

export const privyConfig: PrivyClientConfig = {
  // Appearance - Spanish-first branding
  appearance: {
    theme: 'dark',
    accentColor: '#A855F7', // Electric purple from theme
    logo: '/logo.png',
    landingHeader: 'Acceder a Predik',
    loginMessage: 'Inicia sesión para comenzar a predecir',
    walletChainType: 'ethereum-only',
  },
  
  // Login methods - Google and Email primary (no complex wallet setup)
  loginMethods: ['google', 'email', 'wallet'],
  
  // Embedded wallets config - always create for social login users
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    showWalletUIs: true,
  },
  
  // Supported chains - BNB Testnet only
  supportedChains: [bscTestnet],
  
  defaultChain: bscTestnet,
  
  // Legal compliance
  legal: {
    termsAndConditionsUrl: 'https://predik.io/terminos',
    privacyPolicyUrl: 'https://predik.io/privacidad',
  },
}
