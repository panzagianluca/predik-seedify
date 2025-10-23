/**
 * Skeleton loader for Ranking Page
 * Matches the exact layout of the rankings page
 */

export function RankingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Each Ranking Card */}
      {[
        { title: 'Top Ganadores', icon: '🏆' },
        { title: 'Top Holders', icon: '👥' },
        { title: 'Top Traders', icon: '📈' }
      ].map((card, cardIndex) => (
        <div 
          key={cardIndex}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          {/* Card Header */}
          <div className="p-4 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded" />
              <div className="h-5 w-32 bg-muted rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4">
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    i < 3 ? 'bg-muted/30' : ''
                  } relative overflow-hidden`}
                  style={{
                    animationDelay: `${(cardIndex * 100) + (i * 50)}ms`
                  }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`h-4 ${i < 3 ? 'w-8' : 'w-6'} bg-muted rounded`} />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                  <div className="relative z-10">
                    <div className="h-4 w-20 bg-muted rounded mb-1" />
                    <div className="h-3 w-16 bg-muted/70 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
