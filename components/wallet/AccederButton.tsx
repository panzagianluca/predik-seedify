'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, Wallet } from 'lucide-react'
import { useState } from 'react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu'

/**
 * AccederButton - Spanish-first login button for Privy authentication
 * Replaces RainbowKit's ConnectButton with a simpler, gasless UX
 */
export function AccederButton() {
  const { login, logout, authenticated, user, ready } = usePrivy()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await login()
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!ready) {
    return (
      <Button disabled variant="outline" size="sm">
        <Wallet className="mr-2 h-4 w-4" />
        Cargando...
      </Button>
    )
  }

  if (!authenticated) {
    return (
      <Button 
        onClick={handleLogin} 
        disabled={isLoading}
        size="sm"
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        <LogIn className="mr-2 h-4 w-4" />
        {isLoading ? 'Cargando...' : 'Acceder'}
      </Button>
    )
  }

  // Get user's display address
  const walletAddress = user?.wallet?.address
  const displayAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Usuario'

  // Get login method icon/text
  const authMethod = user?.email ? 'Email' : user?.google ? 'Google' : 'Wallet'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {displayAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Mi Cuenta</p>
            <p className="text-xs leading-none text-muted-foreground">
              Conectado con {authMethod}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {walletAddress && (
          <>
            <DropdownMenuItem 
              onClick={() => navigator.clipboard.writeText(walletAddress)}
              className="cursor-pointer"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Copiar dirección
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoading}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? 'Cerrando...' : 'Cerrar sesión'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
