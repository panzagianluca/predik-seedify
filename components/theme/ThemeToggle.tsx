'use client'

import * as React from 'react'
import { ThemeTogglerButton } from '@/components/animate-ui/components/buttons/theme-toggler'

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return null during SSR to prevent hydration mismatch
    return null
  }

  return (
    <ThemeTogglerButton 
      direction="ttb"
      variant="ghost"
      size="sm"
      modes={['light', 'dark']}
      className="hover:text-electric-purple !hover:bg-transparent !bg-transparent border-0"
    />
  )
}
