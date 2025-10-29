'use client'

import { useEffect, useState } from 'react'
import { LogoSpinner } from '@/components/ui/logo-spinner'

interface Holder {
  address: string
  shares: string
  usdValue: string
}

interface Outcome {
  id: number
  title: string
  price: number
  holders: Holder[]
}

interface HoldersData {
  marketId: number
  outcomes: Outcome[]
  cachedAt: string
}

interface HoldersListProps {
  marketSlug: string
}

export function HoldersList({ marketSlug }: HoldersListProps) {
  const [data, setData] = useState<HoldersData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHolders = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/markets/${marketSlug}/holders`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch holders')
        }

        const holdersData = await response.json()
        setData(holdersData)
      } catch (err) {
        console.error('Error fetching holders:', err)
        setError(err instanceof Error ? err.message : 'Failed to load holders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHolders()
  }, [marketSlug])

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LogoSpinner size={40} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>{error || 'No se pudieron cargar los holders'}</p>
        <p className="text-sm mt-2">Intenta recargar la página</p>
      </div>
    )
  }

  // Ensure we have exactly 2 outcomes
  if (data.outcomes.length !== 2) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Este mercado no tiene el formato esperado de outcomes</p>
      </div>
    )
  }

  const [outcome1, outcome2] = data.outcomes

  return (
    <div className="py-6">
      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Outcome 1 Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  {outcome1.title}
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Shares
                </th>
              </tr>
            </thead>
            <tbody>
              {outcome1.holders.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                    No hay holders aún
                  </td>
                </tr>
              ) : (
                outcome1.holders.map((holder, index) => (
                  <tr key={holder.address} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {truncateAddress(holder.address)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium">
                        {holder.shares}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Outcome 2 Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  {outcome2.title}
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Shares
                </th>
              </tr>
            </thead>
            <tbody>
              {outcome2.holders.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                    No hay holders aún
                  </td>
                </tr>
              ) : (
                outcome2.holders.map((holder, index) => (
                  <tr key={holder.address} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {truncateAddress(holder.address)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium">
                        {holder.shares}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cache info */}
      <div className="mt-6 pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Datos actualizados: {new Date(data.cachedAt).toLocaleString('es-AR')}
          <span className="mx-2">•</span>
          Actualización cada hora
        </p>
      </div>
    </div>
  )
}
