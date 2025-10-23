'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme, lightTheme, type Theme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from '@/lib/wagmi'
import { ReactNode, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const ACCENT_COLOR = '#A855F7'

const baseDarkTheme = darkTheme({
  accentColor: ACCENT_COLOR,
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'rounded',
})

const baseLightTheme = lightTheme({
  accentColor: ACCENT_COLOR,
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'rounded',
})

const modalRadius = '0.5rem'

const customDarkTheme: Theme = {
  ...baseDarkTheme,
  colors: {
    ...baseDarkTheme.colors,
    modalBackground: '#1C1917', // slate-black from our theme
    menuItemBackground: 'transparent',
  },
  radii: {
    ...baseDarkTheme.radii,
    modal: modalRadius,
    modalMobile: modalRadius,
    connectButton: modalRadius,
    actionButton: modalRadius,
  },
  fonts: {
    body: 'Satoshi, system-ui, sans-serif',
  },
}

const customLightTheme: Theme = {
  ...baseLightTheme,
  colors: {
    ...baseLightTheme.colors,
    modalBackground: '#FFFFFF', // white from our theme
    menuItemBackground: 'transparent',
  },
  radii: {
    ...baseLightTheme.radii,
    modal: modalRadius,
    modalMobile: modalRadius,
    connectButton: modalRadius,
    actionButton: modalRadius,
  },
  fonts: {
    body: 'Satoshi, system-ui, sans-serif',
  },
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={mounted && resolvedTheme === 'dark' ? customDarkTheme : customLightTheme}
          modalSize="compact"
          showRecentTransactions={true}
          appInfo={{
            appName: 'Predik',
            disclaimer: undefined,
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
