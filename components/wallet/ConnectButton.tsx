'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ConnectButton() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !ready) {
    return (
      <Button disabled variant="outline">
        Cargando...
      </Button>
    )
  }

  // User is logged in - show wallet address
  if (authenticated && user?.wallet?.address) {
    const address = user.wallet.address
    return (
      <Button onClick={logout} variant="outline">
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    )
  }

  // Not logged in - show login button (Privy will handle the modal)
  return (
    <div className="flex gap-2">
      <Button
        onClick={login}
        className="bg-electric-purple hover:bg-electric-purple/90"
        title="Acceder con Google, Email o Billetera"
      >
        � Acceder
      </Button>
    </div>
  )
}
