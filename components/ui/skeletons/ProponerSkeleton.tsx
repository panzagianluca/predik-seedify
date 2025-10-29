/**
 * Skeleton loader for Proponer Page
 * Matches the exact layout of the proposals page
 */

const DEFAULT_CARD_COUNT = 5

export function ProponerSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-2">
      {/* Left Column: Submit Button + Top Contributors */}
      <div className="space-y-6">
        {/* Submit Button Skeleton */}
        <div className="w-full h-9 my-3 bg-electric-purple/20 rounded-md relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Top Contributors Skeleton - Desktop Only */}
        <div className="hidden lg:block rounded-xl border bg-card text-card-foreground shadow">
          <div className="flex items-center gap-2 p-6 pb-4">
            <div className="h-5 w-5 bg-muted rounded" />
            <div className="h-5 w-40 bg-muted rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {[...Array(DEFAULT_CARD_COUNT)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-6 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="h-4 w-8 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Filter Buttons + Proposals Grid */}
      <div>
        {/* Filter Buttons Skeleton */}
        <ProponerFiltersSkeleton />

        {/* Proposals Grid Skeleton */}
        <ProponerCardsSkeleton />
      </div>
    </div>
  )
}

export function ProponerFiltersSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg py-3 mb-4">
      <div className="h-[36px] w-[80px] bg-electric-purple/10 rounded-md relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      <div className="h-[36px] w-[60px] bg-muted rounded-md relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="lg:hidden ml-auto h-[36px] w-[120px] bg-muted rounded-md relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  )
}

export function ProponerCardsSkeleton({ count = DEFAULT_CARD_COUNT }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 relative overflow-hidden"
          style={{
            animationDelay: `${i * 100}ms`
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          <div className="flex gap-3">
            {/* Upvote button placeholder */}
            <div className="flex flex-col items-center gap-1 px-2 py-1 rounded-md bg-muted/40 min-w-[50px]">
              <div className="h-5 w-5 bg-muted rounded" />
              <div className="h-4 w-8 bg-muted rounded" />
            </div>

            {/* Proposal content placeholder */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                <div className="h-5 w-full md:w-3/4 bg-muted rounded" />
                <div className="hidden md:flex items-center gap-2">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2 w-2 bg-muted rounded-full" />
                  <div className="h-3 w-28 bg-muted rounded" />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-4 w-20 bg-muted rounded-full" />
                <div className="h-2 w-2 bg-muted rounded-full" />
                <div className="h-3 w-32 bg-muted rounded" />
                <div className="md:hidden h-2 w-2 bg-muted rounded-full" />
                <div className="md:hidden h-3 w-32 bg-muted rounded" />
                <div className="md:hidden h-2 w-2 bg-muted rounded-full" />
                <div className="md:hidden h-3 w-24 bg-muted rounded" />
                <div className="hidden md:inline-flex ml-auto h-3 w-16 bg-muted rounded" />
              </div>

              <div className="md:hidden flex items-center gap-2">
                <div className="h-3 w-28 bg-muted rounded" />
                <div className="h-2 w-2 bg-muted rounded-full" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
