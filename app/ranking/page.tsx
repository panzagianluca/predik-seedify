'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RankingSkeleton } from '@/components/ui/skeletons/RankingSkeleton'
import { Trophy, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RankingUser {
  address: string
  value: string
  rank: number
}

interface RankingData {
  winners: RankingUser[]
  holders: RankingUser[]
  traders: RankingUser[]
}

export default function RankingPage() {
  const [timeframe, setTimeframe] = useState<'month' | 'all'>('month')
  const [data, setData] = useState<RankingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [winnersRes, holdersRes, tradersRes] = await Promise.all([
          fetch(`/api/ranking/winners?timeframe=${timeframe}`),
          fetch(`/api/ranking/holders?timeframe=${timeframe}`),
          fetch(`/api/ranking/traders?timeframe=${timeframe}`)
        ])

        if (!winnersRes.ok || !holdersRes.ok || !tradersRes.ok) {
          throw new Error('Failed to fetch ranking data')
        }

        const [winners, holders, traders] = await Promise.all([
          winnersRes.json(),
          holdersRes.json(),
          tradersRes.json()
        ])

        setData({ winners, holders, traders })
      } catch (err) {
        console.error('Error fetching rankings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load rankings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [timeframe])

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const formatValue = (value: string, suffix: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return value + suffix
    
    // Format with commas for thousands
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + suffix
  }

  const RankingCard = ({ 
    title, 
    icon: Icon, 
    users, 
    valueLabel, 
    valueSuffix = '',
    emptyMessage 
  }: { 
    title: string
    icon: any
    users: RankingUser[]
    valueLabel: string
    valueSuffix?: string
    emptyMessage: string
  }) => (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-electric-purple" />
          <h3 className="text-[16px] font-medium">{title}</h3>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div 
                key={user.address}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-muted/50",
                  user.rank <= 3 && "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "font-bold min-w-[3ch]",
                    user.rank <= 3 ? "text-lg" : "text-sm",
                    user.rank === 1 && "text-yellow-500",
                    user.rank === 2 && "text-gray-400",
                    user.rank === 3 && "text-amber-600"
                  )}>
                    {getRankBadge(user.rank)}
                  </span>
                  <a
                    href={`https://celo-sepolia.blockscout.com/address/${user.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono hover:text-electric-purple transition-colors"
                  >
                    {truncateAddress(user.address)}
                  </a>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">
                    {formatValue(user.value, valueSuffix)}
                  </span>
                  <p className="text-xs text-muted-foreground">{valueLabel}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="pb-4">
          <h1 className="text-[24px] font-medium">Rankings</h1>
        </div>

        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as 'month' | 'all')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 my-3 mb-8">
            <TabsTrigger value="month">Este Mes</TabsTrigger>
            <TabsTrigger value="all">Todos los Tiempos</TabsTrigger>
          </TabsList>

          <TabsContents>
            <TabsContent value="month">
              {isLoading ? (
                <RankingSkeleton />
              ) : error || !data ? (
                <div className="py-20 text-center">
                  <p className="text-red-500 mb-4">{error || 'Failed to load rankings'}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-electric-purple hover:underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <RankingCard
                    title="Top Ganadores"
                    icon={Trophy}
                    users={data.winners}
                    valueLabel="Ganancias"
                    valueSuffix=" USDT"
                    emptyMessage="No hay datos de ganadores este mes"
                  />
                  <RankingCard
                    title="Top Holders"
                    icon={Users}
                    users={data.holders}
                    valueLabel="Shares totales"
                    emptyMessage="No hay holders este mes"
                  />
                  <RankingCard
                    title="Top Traders"
                    icon={TrendingUp}
                    users={data.traders}
                    valueLabel="Volumen"
                    valueSuffix=" USDT"
                    emptyMessage="No hay traders este mes"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="all">
              {isLoading ? (
                <RankingSkeleton />
              ) : error || !data ? (
                <div className="py-20 text-center">
                  <p className="text-red-500 mb-4">{error || 'Failed to load rankings'}</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-electric-purple hover:underline"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <RankingCard
                    title="Top Ganadores"
                    icon={Trophy}
                    users={data.winners}
                    valueLabel="Ganancias"
                    valueSuffix=" USDT"
                    emptyMessage="No hay datos de ganadores"
                  />
                  <RankingCard
                    title="Top Holders"
                    icon={Users}
                    users={data.holders}
                    valueLabel="Shares totales"
                    emptyMessage="No hay holders"
                  />
                  <RankingCard
                    title="Top Traders"
                    icon={TrendingUp}
                    users={data.traders}
                    valueLabel="Volumen"
                    valueSuffix=" USDT"
                    emptyMessage="No hay traders"
                  />
                </div>
              )}
            </TabsContent>
          </TabsContents>
        </Tabs>
      </div>
    </div>
  )
}
