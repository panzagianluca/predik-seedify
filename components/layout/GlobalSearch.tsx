'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'
import { Input } from '@/components/ui/input'
import { Market } from '@/types/market'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [markets, setMarkets] = useState<Market[]>([])
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Prefetch market page on hover
  const handleMouseEnter = (slug: string) => {
    router.prefetch(`/markets/${slug}`)
  }

  // Fetch markets on dialog open
  useEffect(() => {
    if (open) {
      fetchMarkets()
    }
  }, [open])

  // Filter markets based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMarkets([])
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = markets.filter((market) => {
      return (
        market.title.toLowerCase().includes(query) ||
        market.category?.toLowerCase().includes(query) ||
        market.outcomes.some((outcome) =>
          outcome.title.toLowerCase().includes(query)
        )
      )
    })

    setFilteredMarkets(filtered.slice(0, 10)) // Show max 10 results
  }, [searchQuery, markets])

  const fetchMarkets = async () => {
    setIsLoading(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
      const endpoint = apiBase ? `${apiBase}/api/markets` : '/api/markets'
      const response = await fetch(endpoint, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch markets')
      }
      
      const data = await response.json()
      setMarkets(data)
    } catch (error) {
      console.error('Error fetching markets:', error)
      setMarkets([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMarket = (market: Market) => {
    setOpen(false)
    setSearchQuery('')
    router.push(`/markets/${market.slug}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full max-w-[360px] items-center gap-2 rounded-md border border-transparent bg-muted/70 px-4 h-9 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted/90 hover:text-foreground dark:bg-muted/40 dark:hover:bg-muted/60 mr-4 md:mr-6">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="hidden md:inline whitespace-nowrap">Buscar Mercados</span>
        </button>
      </DialogTrigger>

      <DialogContent
        from="top"
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="max-w-2xl w-full p-0 gap-0 rounded-2xl border border-border/60 shadow-xl backdrop-blur max-h-[85vh] flex flex-col"
        showCloseButton={true}
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">Buscar Mercados</DialogTitle>
        
        {/* Search Input */}
        <div className="border-b flex-shrink-0">
          <div className="relative h-14">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar mercados, categorías, resultados..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-full rounded-none border-0 pl-12 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 mobile-scroll">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando mercados...
            </div>
          ) : !searchQuery.trim() ? (
            <div className="text-center py-8 text-muted-foreground">
              Escribe para buscar mercados
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron mercados
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => handleSelectMarket(market)}
                  onMouseEnter={() => handleMouseEnter(market.slug)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 text-left hover:bg-electric-purple/20 dark:hover:bg-electric-purple/40"
                >
                  {/* Market Image */}
                  {market.image_url && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
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

                  {/* Market Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-2 text-sm">
                      {market.title}
                    </h4>
                    
                    {/* Outcomes */}
                    <div className="flex items-center gap-3 mt-1">
                      {market.outcomes.slice(0, 2).map((outcome) => (
                        <div
                          key={outcome.id}
                          className="flex items-center gap-1 text-xs"
                        >
                          <span className="text-muted-foreground">
                            {outcome.title}:
                          </span>
                          <span
                            className="font-semibold"
                            style={{
                              color:
                                outcome.title.toLowerCase() === 'yes' ||
                                outcome.title.toLowerCase() === 'si'
                                  ? '#22c55e'
                                  : '#ef4444',
                            }}
                          >
                            {(outcome.price * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
