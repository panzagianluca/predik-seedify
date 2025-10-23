'use client'

import { Market } from '@/types/market'
import Link from 'next/link'
import Image from 'next/image'

interface RelatedMarketCardProps {
  market: Market
}

export function RelatedMarketCard({ market }: RelatedMarketCardProps) {
  // Get the most probable outcome (highest price)
  const mostProbableOutcome = market.outcomes.reduce((prev, current) => 
    current.price > prev.price ? current : prev
  , market.outcomes[0])

  const probability = mostProbableOutcome.price * 100

  // Get outcome color (green for first, red for second)
  const outcomeColor = market.outcomes.findIndex(o => o.id === mostProbableOutcome.id) === 0 
    ? '#22c55e' 
    : '#ef4444'

  return (
    <Link 
      href={`/markets/${market.slug}`}
      className="block hover:opacity-80 transition-opacity duration-200"
      prefetch={true}
    >
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
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-medium leading-tight line-clamp-2 mb-1">
            {market.title}
          </h4>
          
          {/* Most Probable Outcome */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{mostProbableOutcome.title}:</span>
            <span 
              className="font-bold"
              style={{ color: outcomeColor }}
            >
              {probability.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
