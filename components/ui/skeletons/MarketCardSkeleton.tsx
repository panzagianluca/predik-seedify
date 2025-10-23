/**
 * Skeleton loader for Market Card in grid
 */

export function MarketCardSkeleton() {
  return (
    <div className="w-full md:max-w-[300px] rounded-xl overflow-hidden border border-border bg-card animate-pulse">
      {/* Header Section */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Image Skeleton */}
          <div className="relative w-12 h-12 rounded-xl bg-muted flex-shrink-0" />
          
          {/* Title Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>

      {/* Outcomes Section */}
      <div className="px-4 pb-4 space-y-2">
        {/* Outcome 1 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
          <div className="w-full bg-muted rounded-full h-2" />
        </div>

        {/* Outcome 2 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="h-4 w-12 bg-muted rounded" />
            <div className="h-4 w-12 bg-muted rounded" />
          </div>
          <div className="w-full bg-muted rounded-full h-2" />
        </div>

        {/* Footer Metadata */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-4">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton loader for Market Grid
 */
export function MarketGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <MarketCardSkeleton key={index} />
      ))}
    </div>
  )
}
