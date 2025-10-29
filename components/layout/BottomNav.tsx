'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Search, Lightbulb, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'
import { MobileDrawer } from './MobileDrawer'
import { MobileSearch, type MobileSearchRef } from './MobileSearch'

/**
 * Mobile Bottom Navigation
 * Only visible on mobile (hidden on md:desktop+)
 * 
 * Features:
 * - Fixed bottom position
 * - Icon + text layout
 * - Active state indicator
 * - Touch-optimized tap targets (44x44px minimum)
 * - Smooth transitions
 * - Opens drawer menu for "Mas"
 */
export function BottomNav() {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const mobileSearchRef = useRef<MobileSearchRef>(null)

  const navItems = [
    {
      label: 'Inicio',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Ranking',
      href: '/ranking',
      icon: Trophy,
      isActive: pathname === '/ranking',
    },
    {
      label: 'Buscar',
      href: '#',
      icon: Search,
      isActive: false,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        mobileSearchRef.current?.open()
      },
    },
    {
      label: 'Proponer',
      href: '/proponer',
      icon: Lightbulb,
      isActive: pathname === '/proponer',
    },
    {
      label: 'Mas',
      href: '#',
      icon: Menu,
      isActive: false,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDrawerOpen(true)
      },
    },
  ]

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.isActive

            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[44px] rounded-lg transition-all duration-200',
                    'hover:bg-electric-purple/10 active:bg-electric-purple/20 active:scale-95',
                    isActive ? 'text-electric-purple bg-electric-purple/10' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'fill-electric-purple/20')} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[44px] rounded-lg transition-all duration-200',
                  'hover:bg-electric-purple/10 active:bg-electric-purple/20 active:scale-95',
                  isActive ? 'text-electric-purple bg-electric-purple/10' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'fill-electric-purple/20')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Mobile Search */}
      <MobileSearch ref={mobileSearchRef} />
    </>
  )
}
