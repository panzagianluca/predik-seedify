'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/animate-ui/components/radix/dialog'
import { Input } from '@/components/ui/input'
import { Market } from '@/types/market'

export interface MobileSearchRef {
  open: () => void
}

export const MobileSearch = forwardRef<MobileSearchRef>((props, ref) => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [markets, setMarkets] = useState<Market[]>([])
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Expose open method to parent
  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }))

  // Prefetch market page on hover
  const handleMouseEnter = (slug: string) => {
    router.prefetch(`/markets/${slug}`)
  }

  // Fetch markets on dialog open
  useEffect(() => {
    if (open) {
      fetchMarkets()
    } else {
      // Reset search when closed
      setSearchQuery('')
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
        market.outcomes.some((outcome) => outcome.title.toLowerCase().includes(query))
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
      <DialogContent
        from="top"
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="max-w-full md:max-w-2xl w-full p-0 gap-0 rounded-2xl border-0 md:border border-border/60 shadow-xl backdrop-blur max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">Buscar Mercados</DialogTitle>

        {/* Search Header with Close Button */}
        <div className="border-b flex-shrink-0 flex items-center gap-2 px-4">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Buscar mercados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
            autoFocus
          />
          <button
            onClick={() => setOpen(false)}
            className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 mobile-scroll">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-2 border-electric-purple border-t-transparent rounded-full mx-auto mb-3" />
              Cargando mercados...
            </div>
          ) : !searchQuery.trim() ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Escribe para buscar mercados</p>
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No se encontraron mercados</p>
              <p className="text-xs mt-2">Intenta con otros términos de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => handleSelectMarket(market)}
                  onMouseEnter={() => handleMouseEnter(market.slug)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 text-left hover:bg-electric-purple/10 active:bg-electric-purple/20"
                >
                  {/* Market Image */}
                  {market.image_url && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={market.image_url}
                        alt={market.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Market Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-2 text-sm mb-1.5">{market.title}</h4>

                    {/* Outcomes */}
                    <div className="flex items-center gap-3">
                      {market.outcomes.slice(0, 2).map((outcome) => (
                        <div key={outcome.id} className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">{outcome.title}:</span>
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
})

MobileSearch.displayName = 'MobileSearch'
