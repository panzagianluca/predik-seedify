'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/animate-ui/components/radix/dropdown-menu'
import { Menu, Activity, Trophy, Lightbulb, FileText, Shield, Sun, Moon, AlertCircle, Bell, ChevronDown, User, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/animate-ui/components/radix/dialog'
import { Confetti } from '@/components/ui/confetti'
import { useUSDTBalance } from '@/hooks/use-usdt-balance'
import { getProfilePicture } from '@/lib/profileUtils'
import { useDisconnect, useAccount } from 'wagmi'

// Lazy load DepositModal - only loads when needed
const DepositModal = dynamic(() => import('@/components/wallet/DepositModal').then(mod => ({ default: mod.DepositModal })), {
  ssr: false,
  loading: () => null
})

export function Navbar() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(1)
  const [showTutorial, setShowTutorial] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<'si' | 'no'>('si')
  const [triggerConfetti, setTriggerConfetti] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string>('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const openConnectModalRef = useRef<(() => void) | null>(null)
  const { disconnect } = useDisconnect()
  const { formatted: usdtBalance, isLoading: isLoadingBalance } = useUSDTBalance()
  const { address } = useAccount()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load user avatar from database
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!address) {
        setUserAvatar('')
        setIsLoadingProfile(false)
        return
      }

      setIsLoadingProfile(true)
      try {
        // Add cache-busting timestamp to force fresh data
        const timestamp = Date.now()
        const response = await fetch(`/api/profile/update?walletAddress=${address}&_t=${timestamp}`, {
          cache: 'no-store', // Prevent caching
        })
        if (response.ok) {
          const userData = await response.json()
          setUserAvatar(userData.customAvatar || getProfilePicture(address))
        } else {
          setUserAvatar(getProfilePicture(address))
        }
      } catch (error) {
        setUserAvatar(getProfilePicture(address))
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadUserAvatar()
  }, [address])

  // Determine which logo to show
  const logoSrc = mounted && (resolvedTheme === 'dark' || theme === 'dark')
    ? '/prediksvgwhite.svg'
    : '/svglogoblack.svg'

  return (
    <>
    <nav className="w-full bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            {mounted && (
              <Image 
                src={logoSrc} 
                alt="Predik" 
                width={80} 
                height={20}
                className="h-5 w-auto transition-opacity duration-300"
                priority
                quality={100}
              />
            )}
          </Link>

          {/* Desktop: Global Search + Help Icon - Hidden on mobile */}
          <div className="hidden md:flex ml-6 lg:ml-8 flex-1 max-w-xl items-center">
            <GlobalSearch />
            
            {/* Help Dialog */}
            <Dialog 
              open={showTutorial} 
              onOpenChange={(open) => {
                setShowTutorial(open)
                // Reset to step 1 when dialog closes OR opens
                if (!open || open) {
                  setTutorialStep(1)
                }
              }}
            >
              <DialogTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-electric-purple transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <AlertCircle className="h-5 w-5" />
                  <span>Como Funciona?</span>
                </button>
              </DialogTrigger>
              <DialogContent 
                className="sm:max-w-md w-full p-0 gap-0 max-h-[90vh] overflow-hidden"
                from="top"
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                <DialogTitle className="sr-only">Como Funciona Predik</DialogTitle>
                
                {tutorialStep === 1 && (
                  <div className="p-6">
                    {/* Title */}
                    <h2 className="text-xl font-semibold mb-4">Como Funciona Predik?</h2>
                    
                    {/* Instruction */}
                    <p className="text-sm text-muted-foreground mb-4">Elegí un mercado</p>
                    
                    {/* Market Options */}
                    <div className="space-y-2 mb-4">
                      {/* Skeleton Placeholder 1 */}
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>

                      {/* Dummy Market Card - "Pasará esto?" */}
                      <button
                        onClick={() => setTutorialStep(2)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 w-full text-left transition-all duration-300 hover:border-electric-purple/50 hover:bg-electric-purple/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        style={{
                          animation: 'pulse-scale 2s ease-in-out infinite',
                        }}
                      >
                        {/* Predik Logo as Market Image */}
                        <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                          <div className="relative w-8 h-8">
                            <Image
                              src="/prediklogoonly.svg"
                              alt="Predik"
                              fill
                              sizes="32px"
                              className="object-contain"
                            />
                          </div>
                        </div>

                        {/* Market Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">
                            Pasará esto?
                          </h4>
                          
                          {/* Outcomes */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">Si:</span>
                              <span className="font-semibold text-[#22c55e]">65.0%</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-muted-foreground">No:</span>
                              <span className="font-semibold text-[#ef4444]">35.0%</span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Skeleton Placeholder 2 */}
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tutorialStep === 2 && (
                  <div className="p-6">
                    {/* Title */}
                    <h2 className="text-xl font-semibold mb-4">Como Funciona Predik?</h2>
                    
                    {/* Instruction */}
                    <p className="text-sm text-muted-foreground mb-4">Hacé tu predicción</p>
                    
                    {/* Market Display - Selected State */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-electric-purple bg-electric-purple/5 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                        <div className="relative w-8 h-8">
                          <Image
                            src="/prediklogoonly.svg"
                            alt="Predik"
                            fill
                            sizes="32px"
                            className="object-contain"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">Pasará esto?</h4>
                        
                        {/* Outcomes */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">Si:</span>
                            <span className="font-semibold text-[#22c55e]">65.0%</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">No:</span>
                            <span className="font-semibold text-[#ef4444]">35.0%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trading Interface */}
                    <div className="space-y-4">
                      {/* Yes/No Buttons */}
                      <div className="grid grid-cols-2 gap-2 relative">
                        {/* Sliding background indicator */}
                        <motion.div
                          layoutId="tutorial-outcome-selector"
                          className="absolute rounded-md border-2"
                          style={{
                            width: 'calc(50% - 4px)',
                            height: '100%',
                            top: 0,
                            backgroundColor: selectedOutcome === 'si' ? 'rgb(34 197 94 / 0.2)' : 'rgb(239 68 68 / 0.2)',
                            borderColor: selectedOutcome === 'si' ? 'rgb(34 197 94)' : 'rgb(239 68 68)',
                          }}
                          initial={false}
                          animate={{
                            left: selectedOutcome === 'si' ? '0px' : 'calc(50% + 4px)',
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                        
                        <button
                          onClick={() => setSelectedOutcome('si')}
                          className={`h-auto py-3 rounded-md border-2 flex items-center justify-between px-4 transition-colors relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                            selectedOutcome === 'si' 
                              ? 'border-transparent bg-transparent' 
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <span className="font-semibold text-sm text-green-700 dark:text-green-400">
                            Si
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-500">
                            65.0%
                          </span>
                        </button>
                        <button
                          onClick={() => setSelectedOutcome('no')}
                          className={`h-auto py-3 rounded-md border-2 flex items-center justify-between px-4 transition-colors relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                            selectedOutcome === 'no' 
                              ? 'border-transparent bg-transparent' 
                              : 'border-border bg-muted/30'
                          }`}
                        >
                          <span className="font-semibold text-sm text-red-700 dark:text-red-400">
                            No
                          </span>
                          <span className="text-xs text-red-600 dark:text-red-500">
                            35.0%
                          </span>
                        </button>
                      </div>

                      {/* Amount Display */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cantidad</label>
                        <div className="h-9 px-3 rounded-md border border-input bg-background flex items-center justify-between text-sm">
                          <span>100</span>
                          <span className="text-muted-foreground">USDT</span>
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-semibold text-sm">Resumen</h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Acciones totales de {selectedOutcome === 'si' ? 'Si' : 'No'}
                            </span>
                            <span className="font-medium">
                              {selectedOutcome === 'si' ? '154' : '286'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Ganancia Máxima</span>
                            <span className="font-semibold text-green-600">
                              {selectedOutcome === 'si' ? '+54 USDT' : '+186 USDT'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Buy Button */}
                    <Button
                      onClick={() => setTutorialStep(3)}
                      className="w-full h-9 mt-4"
                    >
                      Comprar {selectedOutcome === 'si' ? 'Si' : 'No'}
                    </Button>
                  </div>
                )}

                {tutorialStep === 3 && (
                  <div className="p-6 relative">
                    {/* Title */}
                    <h2 className="text-xl font-semibold mb-4">Como Funciona Predik?</h2>
                    
                    {/* Instruction */}
                    <p className="text-sm text-muted-foreground mb-4">
                      Disfrutá tus ganancias
                    </p>

                    {/* Winning Summary */}
                    <div className="space-y-4 mb-4">
                      {/* Selected Market */}
                      <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-green-500 bg-green-500/10">
                        <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                          <div className="relative w-8 h-8">
                            <Image
                              src="/prediklogoonly.svg"
                              alt="Predik"
                              fill
                              sizes="32px"
                              className="object-contain"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm mb-1">Pasará esto?</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Tu predicción:</span>
                            <span className="font-semibold text-green-600">
                              {selectedOutcome === 'si' ? 'Si' : 'No'} ✓
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Winning Stats */}
                      <div className="space-y-3 border-t pt-4">
                        <h4 className="font-semibold text-sm">Resumen de Ganancias</h4>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Acciones de {selectedOutcome === 'si' ? 'Si' : 'No'}</span>
                            <span className="font-medium">{selectedOutcome === 'si' ? '154' : '286'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Inversión inicial</span>
                            <span className="font-medium">100 USDT</span>
                          </div>
                          <div className="flex items-center justify-between text-sm border-t pt-2">
                            <span className="text-muted-foreground font-semibold">Total ganado</span>
                            <span className="font-bold text-green-600 text-base">
                              {selectedOutcome === 'si' ? '154 USDT' : '286 USDT'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Ganancia neta</span>
                            <span className="font-semibold text-green-600">
                              {selectedOutcome === 'si' ? '+54 USDT' : '+186 USDT'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Start Button */}
                    <Button
                      onClick={() => {
                        setShowTutorial(false)
                        // If user is logged in, open deposit modal, otherwise open connect wallet
                        if (address) {
                          setShowDepositModal(true)
                        } else if (openConnectModalRef.current) {
                          openConnectModalRef.current()
                        }
                      }}
                      className="w-full h-9"
                    >
                      Comenzar
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Side: Wallet + Menu */}
          <div className="flex items-center gap-3 ml-auto">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                mounted,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
              }) => {
                const ready = mounted && authenticationStatus !== 'loading'
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus || authenticationStatus === 'authenticated')

                // Store openConnectModal in ref for tutorial use
                openConnectModalRef.current = openConnectModal

                return (
                  <div
                    className="flex items-center gap-3"
                    {...(!ready && {
                      'aria-hidden': true,
                      className: 'opacity-0 pointer-events-none select-none',
                    })}
                  >
                    {!connected ? (
                      <>
                        <button
                          className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-electric-purple backdrop-blur-lg px-6 h-9 text-[14px] sm:text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-electric-purple/50"
                          onClick={openConnectModal}
                          type="button"
                        >
                          <span className="relative z-10">Acceder</span>
                          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                            <div className="relative h-full w-10 bg-white/30"></div>
                          </div>
                        </button>
                        
                        {/* Hamburger Menu - Only visible when NOT connected - Hidden on mobile */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="default"
                              variant="ghost"
                              className="hidden md:flex h-10 w-10 p-0 hover:bg-transparent hover:text-electric-purple transition-colors"
                            >
                              <Menu className="h-7 w-7" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-auto min-w-[160px]"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            <Link href="/ranking">
                              <DropdownMenuItem className="justify-start">
                                <Trophy className="mr-2 h-4 w-4" />
                                <span>Ranking</span>
                              </DropdownMenuItem>
                            </Link>
                            <Link href="/proponer">
                              <DropdownMenuItem className="justify-start">
                                <Lightbulb className="mr-2 h-4 w-4" />
                                <span>Proponer</span>
                              </DropdownMenuItem>
                            </Link>
                            
                            <DropdownMenuSeparator />
                            
                            <Link href="/terminos">
                              <DropdownMenuItem className="justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Términos</span>
                              </DropdownMenuItem>
                            </Link>
                            <Link href="/privacidad">
                              <DropdownMenuItem className="justify-start">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Privacidad</span>
                              </DropdownMenuItem>
                            </Link>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Theme Selector */}
                            <div className="px-2 py-2">
                              <div className="flex items-center gap-1 bg-muted rounded-md p-1 w-full relative">
                                {/* Sliding background indicator */}
                                <motion.div
                                  layoutId="theme-selector-bg"
                                  className="absolute bg-background rounded shadow-sm"
                                  style={{
                                    width: 'calc(50% - 4px)',
                                    height: 'calc(100% - 8px)',
                                    top: '4px',
                                  }}
                                  initial={false}
                                  animate={{
                                    left: resolvedTheme === 'light' ? '4px' : 'calc(50%)',
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 35,
                                  }}
                                />
                                
                                <button
                                  onClick={() => setTheme('light')}
                                  className={`p-1.5 rounded transition-colors duration-200 flex-1 flex items-center justify-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                    resolvedTheme === 'light' 
                                      ? 'text-foreground' 
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <Sun className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setTheme('dark')}
                                  className={`p-1.5 rounded transition-colors duration-200 flex-1 flex items-center justify-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                    resolvedTheme === 'dark' 
                                      ? 'text-foreground' 
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <Moon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : chain.unsupported ? (
                      <Button
                        size="default"
                        variant="destructive"
                        className="h-9 px-4"
                        onClick={openChainModal}
                        type="button"
                      >
                        Wrong network
                      </Button>
                    ) : (
                      // LOGGED IN STATE
                      <div className="flex items-center gap-3">
                        {/* USDT Balance */}
                        <div className="flex flex-col items-center justify-center h-9 px-2 sm:px-4">
                          <span className="text-[10px] sm:text-[12px] leading-tight">Balance</span>
                          {isLoadingBalance ? (
                            <div className="h-5 w-12 sm:w-16 bg-muted animate-pulse rounded mt-0.5" />
                          ) : (
                            <span className="text-[14px] sm:text-[16px] font-bold leading-tight">
                              ${parseFloat(usdtBalance).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Depositar Button */}
                        <button
                          className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md bg-electric-purple backdrop-blur-lg px-4 sm:px-6 h-9 text-[14px] sm:text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:shadow-electric-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          onClick={() => setShowDepositModal(true)}
                          type="button"
                        >
                          <span className="relative z-10">Depositar</span>
                          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                            <div className="relative h-full w-10 bg-white/30"></div>
                          </div>
                        </button>

                        {/* Desktop Only: Notification Bell + Divider + Profile Dropdown */}
                        {/* Notification Bell - Desktop Only */}
                        <div className="hidden md:block">
                          <NotificationBell />
                        </div>

                        {/* Vertical Divider - Desktop Only */}
                        <div className="hidden md:block h-6 w-px bg-border"></div>

                        {/* Profile Dropdown - Desktop Only */}
                        <div className="hidden md:block">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                              <div className="relative h-9 w-9 rounded-xl overflow-hidden">
                                {isLoadingProfile ? (
                                  <div className="h-9 w-9 bg-muted animate-pulse rounded-xl" />
                                ) : (
                                  <Image
                                    src={userAvatar || getProfilePicture(account.address)}
                                    alt="Profile"
                                    fill
                                    sizes="36px"
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <ChevronDown className="h-4 w-4 text-foreground/70" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="w-[160px]"
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                          >
                            {/* Wallet Address */}
                            <div className="px-2 py-2 text-sm font-satoshi text-muted-foreground flex items-center gap-2">
                              <div className="relative w-3 h-3 p-1 rounded bg-[#FCFF52] flex items-center justify-center">
                                <Image 
                                  src="/celo.png" 
                                  alt="Celo" 
                                  fill 
                                  sizes="12px" 
                                  className="object-contain p-[2px]" 
                                />
                              </div>
                              {`${account.address.slice(0, 6)}...${account.address.slice(-6)}`}
                            </div>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Profile */}
                            <Link href="/perfil" prefetch={true}>
                              <DropdownMenuItem className="justify-start">
                                <User className="mr-2 h-4 w-4" />
                                <span>Perfil</span>
                              </DropdownMenuItem>
                            </Link>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Ranking */}
                            <Link href="/ranking" prefetch={true}>
                              <DropdownMenuItem className="justify-start">
                                <Trophy className="mr-2 h-4 w-4" />
                                <span>Ranking</span>
                              </DropdownMenuItem>
                            </Link>
                            
                            {/* Proponer */}
                            <Link href="/proponer">
                              <DropdownMenuItem className="justify-start">
                                <Lightbulb className="mr-2 h-4 w-4" />
                                <span>Proponer</span>
                              </DropdownMenuItem>
                            </Link>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Términos */}
                            <Link href="/terminos" prefetch={true}>
                              <DropdownMenuItem className="justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Términos</span>
                              </DropdownMenuItem>
                            </Link>
                            
                            {/* Privacidad */}
                            <Link href="/privacidad" prefetch={true}>
                              <DropdownMenuItem className="justify-start">
                                <Shield className="mr-2 h-4 w-4" />
                                <span>Privacidad</span>
                              </DropdownMenuItem>
                            </Link>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Theme Selector */}
                            <div className="px-2 py-2">
                              <div className="flex items-center gap-1 bg-muted rounded-md p-1 w-full relative">
                                {/* Sliding background indicator */}
                                <motion.div
                                  layoutId="theme-selector-bg-profile"
                                  className="absolute bg-background rounded shadow-sm"
                                  style={{
                                    width: 'calc(50% - 4px)',
                                    height: 'calc(100% - 8px)',
                                    top: '4px',
                                  }}
                                  initial={false}
                                  animate={{
                                    left: resolvedTheme === 'light' ? '4px' : 'calc(50%)',
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 35,
                                  }}
                                />
                                
                                <button
                                  onClick={() => setTheme('light')}
                                  className={`p-1.5 rounded transition-colors duration-200 flex-1 flex items-center justify-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                    resolvedTheme === 'light' 
                                      ? 'text-foreground' 
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <Sun className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setTheme('dark')}
                                  className={`p-1.5 rounded transition-colors duration-200 flex-1 flex items-center justify-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                                    resolvedTheme === 'dark' 
                                      ? 'text-foreground' 
                                      : 'text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <Moon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Cerrar Sesión (Disconnect) */}
                            <DropdownMenuItem 
                              className="justify-start text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                              onClick={() => disconnect()}
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                        {/* End Desktop Only Profile Dropdown */}

                        {/* Deposit Modal */}
                        {account?.address && (
                          <DepositModal
                            isOpen={showDepositModal}
                            onClose={() => setShowDepositModal(false)}
                            walletAddress={account.address}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </nav>
    
    {/* Confetti Effect - Rendered outside dialog for proper display */}
    {showTutorial && tutorialStep === 3 && (
      <Confetti
        className="fixed left-1/2 top-[calc(50%-200px)] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[600px] pointer-events-none z-[100]"
        manualstart={triggerConfetti}
      />
    )}
  </>
  )
}
