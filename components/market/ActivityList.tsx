'use client'

import { useEffect, useState } from 'react'
import { LogoSpinner } from '@/components/ui/logo-spinner'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Activity {
  user: string
  outcome: string
  side: 'Buy' | 'Sell'
  shares: string
  timestamp: number
  txHash: string
}

interface ActivityData {
  marketId: number
  activities: Activity[]
  cachedAt: string
}

interface ActivityListProps {
  marketSlug: string
}

export function ActivityList({ marketSlug }: ActivityListProps) {
  const [data, setData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🎬 ActivityList mounted, fetching activity for:', marketSlug)
    const fetchActivity = async () => {
      try {
        setIsLoading(true)
        console.log('🔄 Fetching activity from API...')
        const response = await fetch(`/api/markets/${marketSlug}/activity`)
        console.log('📡 Activity API response:', response.status, response.ok)
        
        if (!response.ok) {
          throw new Error('Failed to fetch activity')
        }

        const activityData = await response.json()
        console.log('📊 Activity data received:', activityData)
        console.log('📋 Number of activities:', activityData.activities?.length || 0)
        setData(activityData)
      } catch (err) {
        console.error('Error fetching activity:', err)
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
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
        <p>{error || 'No se pudo cargar la actividad'}</p>
        <p className="text-sm mt-2">Intenta recargar la página</p>
      </div>
    )
  }

  if (data.activities.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No hay actividad reciente en este mercado</p>
        <p className="text-sm mt-2">Las transacciones de las últimas 24h aparecerán acá</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                User
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Side
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Outcome
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                Amount
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {data.activities.map((activity, index) => (
              <tr key={`${activity.txHash}-${index}`} className="hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4">
                  <a
                    href={`https://celo-sepolia.blockscout.com/address/${activity.user}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-electric-purple transition-colors"
                  >
                    {truncateAddress(activity.user)}
                  </a>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-sm font-medium ${
                    activity.side === 'Buy' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {activity.side}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm">
                    {activity.outcome}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-medium">
                    {activity.shares} shares
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp * 1000), {
                      addSuffix: true,
                      locale: es
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cache info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Última actualización: {new Date(data.cachedAt).toLocaleString('es-AR')}
          <span className="mx-2">•</span>
          Mostrando actividad de las últimas 24 horas
        </p>
      </div>
    </div>
  )
}
