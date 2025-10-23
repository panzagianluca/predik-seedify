'use client'

import { Market } from '@/types/market'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/animate-ui/components/animate/tooltip'
import { Calendar, Users, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import CountUp from 'react-countup'
import { haptics } from '@/lib/haptics'

interface MarketCardProps {
  market: Market
}

export function MarketCard({ market }: MarketCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Trigger animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Format date to relative (e.g., "58 days")
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Closed'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    return `${diffDays} days`
  }

  // Format absolute date (e.g., "Dec 31, 2025")
  const formatAbsoluteDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format volume with K/M suffix
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`
    }
    if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`
    }
    return `$${volume.toFixed(2)}`
  }

  // Format full volume for tooltip
  const formatFullVolume = (volume: number) => {
    return `$${volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Get outcome color
  const getOutcomeColor = (index: number) => {
    return index === 0 ? '#22c55e' : '#ef4444' // Green for first, Red for second
  }

  return (
    <Card
      className="w-full md:max-w-[300px] rounded-xl overflow-hidden transition-all duration-200 ease-in-out"
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 25px rgba(0, 0, 0, 0.1)' : '0 0 0 rgba(0, 0, 0, 0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => haptics.light()}
    >
      {/* Header Section */}
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Market Image */}
          {market.image_url && (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={market.image_url}
                alt={market.title}
                fill
                sizes="48px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Market Title - Clickable */}
          <Link href={`/markets/${market.slug}`} className="flex-1 min-w-0" prefetch={true}>
            <h3 className="text-base font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors duration-200">
              {market.title}
            </h3>
          </Link>
        </div>
      </CardHeader>

      {/* Outcomes Section */}
      <CardContent className="px-4 pb-4 space-y-2">
        {market.outcomes.map((outcome, index) => {
          const probability = outcome.price * 100
          const outcomeColor = getOutcomeColor(index)
          
          return (
            <Link 
              key={outcome.id} 
              href={`/markets/${market.slug}?outcome=${outcome.id}`}
              className="block group"
              prefetch={true}
            >
              <div className="space-y-1 hover:opacity-80 transition-opacity duration-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{outcome.title}</span>
                  <span 
                    className="font-bold"
                    style={{ color: outcomeColor }}
                  >
                    <CountUp
                      start={probability > 10 ? probability - 5 : 0}
                      end={probability}
                      duration={0.8}
                      decimals={2}
                      suffix="%"
                      preserveValue
                    />
                  </span>
                </div>
                
                {/* Animated Progress Bar */}
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full relative overflow-hidden"
                    style={{ backgroundColor: outcomeColor }}
                    initial={{ width: '0%' }}
                    animate={{ width: isVisible ? `${probability}%` : '0%' }}
                    transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </motion.div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Footer Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border mt-4 gap-1">
          {/* Close Date with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1 flex-1 hover:text-foreground transition-colors duration-200">
                <Calendar className="w-3 h-3" />
                <span>{formatRelativeDate(market.expires_at)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Closes: {formatAbsoluteDate(market.expires_at)}
            </TooltipContent>
          </Tooltip>

          <span className="text-muted-foreground/50">|</span>

          {/* Traders with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1 flex-1 hover:text-foreground transition-colors duration-200">
                <Users className="w-3 h-3" />
                <span>{market.users}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Traders: {market.users.toLocaleString()}
            </TooltipContent>
          </Tooltip>

          <span className="text-muted-foreground/50">|</span>

          {/* Volume with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center gap-1 flex-1 hover:text-foreground transition-colors duration-200">
                <TrendingUp className="w-3 h-3" />
                <span>{formatVolume(market.volume_eur)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Volume: {formatFullVolume(market.volume_eur)}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}
