'use client'

import { useState } from 'react'
import { MarketCard } from '@/components/market/MarketCard'
import { Market } from '@/types/market'
import { TrendingUp, Clock, Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/animate-ui/primitives/animate/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '@/lib/haptics'

type TimeFilter = 'trending' | 'recent' | 'closing-soon' | 'closed'
type CategoryFilter = 'all' | 'sports' | 'economy' | 'politics' | 'crypto' | 'culture'

interface MarketsGridProps {
  markets: Market[]
}

export function MarketsGrid({ markets }: MarketsGridProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('trending')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  // Filter markets based on selected filters
  const filteredMarkets = markets.filter(market => {
    // Time filter logic
    if (timeFilter === 'closed') {
      // Show only closed or resolved markets
      if (market.state !== 'closed' && market.state !== 'resolved') return false
    } else {
      // For all other filters, only show open markets
      if (market.state !== 'open') return false
    }
    
    // Category filter - check both category and topics
    if (categoryFilter !== 'all') {
      const categoryMap: Record<CategoryFilter, string[]> = {
        all: [],
        sports: ['Deportes', 'Sports', 'Deporte'],
        economy: ['Economía', 'Economy', 'Economia'],
        politics: ['Política', 'Politics', 'Politica'],
        crypto: ['Crypto', 'Cryptocurrency'],
        culture: ['Cultura', 'Culture']
      }
      
      const allowedCategories = categoryMap[categoryFilter]
      
      // Check if market.category matches
      const categoryMatches = market.category && allowedCategories.some(cat => 
        market.category.toLowerCase().includes(cat.toLowerCase())
      )
      
      // Check if any topic matches
      const topicMatches = market.topics && market.topics.some(topic =>
        allowedCategories.some(cat => topic.toLowerCase().includes(cat.toLowerCase()))
      )
      
      if (!categoryMatches && !topicMatches) return false
    }
    
    return true
  })

  // Sort markets based on time filter
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (timeFilter === 'trending') {
      // Trending: Most volume first
      return b.volume - a.volume
    }
    if (timeFilter === 'recent') {
      // Recientes: Most recently created first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (timeFilter === 'closing-soon') {
      // Cierra Pronto: Soonest to expire first (only open markets)
      if (a.state !== 'open' || b.state !== 'open') return 0
      if (!a.expires_at || !b.expires_at) return 0
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    }
    if (timeFilter === 'closed') {
      // Cerrados: Most recently closed first
      return new Date(b.expires_at).getTime() - new Date(a.expires_at).getTime()
    }
    return 0
  })

  const timeFilters: Array<{
    id: TimeFilter
    label: string
    icon: React.ComponentType<{ className?: string }>
  }> = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recientes', icon: Clock },
    { id: 'closing-soon', label: 'Cierra Pronto', icon: Calendar },
    { id: 'closed', label: 'Cerrados', icon: X },
  ]

  const categoryFilters: Array<{
    id: CategoryFilter
    label: string
  }> = [
    { id: 'all', label: 'Todos' },
    { id: 'sports', label: 'Deportes' },
    { id: 'economy', label: 'Economía' },
    { id: 'politics', label: 'Política' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'culture', label: 'Cultura' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter Banner */}
      <div className="space-y-3 md:space-y-0">
        {/* Mobile: Two separate scrollable rows */}
        <div className="md:hidden space-y-3">
          {/* Time Filters Row - Mobile */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1 -mx-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {timeFilters.map((filter) => {
              const Icon = filter.icon
              const isActive = timeFilter === filter.id
              return (
                <motion.button
                  key={filter.id}
                  onClick={() => {
                    haptics.selection()
                    setTimeFilter(filter.id)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 h-[36px] rounded-md border-2 transition-all duration-200 text-[14px] relative overflow-hidden flex-shrink-0',
                    isActive
                      ? 'bg-electric-purple text-white border-electric-purple font-semibold'
                      : 'bg-background border-border hover:border-electric-purple/50 text-foreground font-medium'
                  )}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTimeFilterMobile"
                      className="absolute inset-0 bg-electric-purple rounded-md -z-10"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{filter.label}</span>
                </motion.button>
              )
            })}
          </div>

          {/* Category Filters Row - Mobile */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1 -mx-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {categoryFilters.map((filter) => {
              const isActive = categoryFilter === filter.id
              return (
                <motion.button
                  key={filter.id}
                  onClick={() => {
                    haptics.selection()
                    setCategoryFilter(filter.id)
                  }}
                  className={cn(
                    'px-4 h-[36px] rounded-md transition-all duration-200 font-medium text-[14px] relative overflow-hidden flex-shrink-0',
                    isActive
                      ? 'text-electric-purple bg-electric-purple/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryFilterMobile"
                      className="absolute inset-0 bg-electric-purple/5 rounded-md"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                  <span className="relative z-10">{filter.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Desktop: Single row with wrapping */}
        <div className="hidden md:flex flex-wrap items-center gap-4 rounded-lg py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filters - Desktop */}
            {timeFilters.map((filter) => {
              const Icon = filter.icon
              const isActive = timeFilter === filter.id
              return (
                <motion.button
                  key={filter.id}
                  onClick={() => {
                    haptics.selection()
                    setTimeFilter(filter.id)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 h-[36px] rounded-md border-2 transition-all duration-200 text-[14px] relative overflow-hidden',
                    isActive
                      ? 'bg-electric-purple text-white border-electric-purple font-semibold'
                      : 'bg-background border-border hover:border-electric-purple/50 text-foreground font-medium'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTimeFilter"
                      className="absolute inset-0 bg-electric-purple rounded-md -z-10"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{filter.label}</span>
                </motion.button>
              )
            })}

            {/* Divider */}
            <div className="h-8 w-px bg-border mx-2" />

            {/* Category Filters - Desktop */}
            {categoryFilters.map((filter) => {
              const isActive = categoryFilter === filter.id
              return (
                <motion.button
                  key={filter.id}
                  onClick={() => {
                    haptics.selection()
                    setCategoryFilter(filter.id)
                  }}
                  className={cn(
                    'px-4 h-[36px] rounded-md transition-all duration-200 font-medium text-[14px] relative overflow-hidden',
                    isActive
                      ? 'text-electric-purple bg-electric-purple/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryFilter"
                      className="absolute inset-0 bg-electric-purple/5 rounded-md"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                  <span className="relative z-10">{filter.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Market Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${timeFilter}-${categoryFilter}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {sortedMarkets.length > 0 ? (
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedMarkets.map((market, index) => (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.2, 
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                  >
                    <MarketCard market={market} />
                  </motion.div>
                ))}
              </div>
            </TooltipProvider>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No se encontraron mercados con estos filtros
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
