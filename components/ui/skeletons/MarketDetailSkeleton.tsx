/**
 * Skeleton loader for Market Detail Page
 * Matches the exact layout of the actual market page with mobile/desktop variations
 */

export function MarketDetailSkeleton() {
  return (
    <div className="pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_318px] gap-6 pt-6">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            
            {/* Title and Badges Section - SAME FOR MOBILE AND DESKTOP */}
            <div className="space-y-3">
              <div className="flex items-center md:items-start gap-3">
                {/* Market Image Skeleton - 64px on left */}
                <div className="relative w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Title Skeleton - 20px mobile, 24px desktop, LEFT aligned */}
                  <div className="h-[20px] md:h-[24px] bg-muted rounded w-3/4 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  
                  {/* Badges Skeleton - Desktop only (inline with title) */}
                  <div className="hidden md:flex items-center gap-2 flex-wrap">
                    <div className="h-7 w-20 bg-muted rounded-full relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className="h-7 w-24 bg-muted rounded-full relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className="h-7 w-16 bg-muted rounded-full relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges Skeleton - Mobile only, BELOW image */}
              <div className="flex md:hidden items-center gap-2 flex-wrap">
                <div className="h-6 w-20 bg-muted rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-6 w-24 bg-muted rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-6 w-16 bg-muted rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>

              {/* Metadata Bar Skeleton */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="h-5 w-32 bg-muted rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className="h-5 w-28 bg-muted rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className="h-5 w-36 bg-muted rounded relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                </div>
                {/* Period selector skeleton - Desktop only */}
                <div className="hidden md:flex gap-2">
                  <div className="h-7 w-12 bg-muted rounded" />
                  <div className="h-7 w-12 bg-muted rounded" />
                  <div className="h-7 w-12 bg-muted rounded" />
                  <div className="h-7 w-16 bg-muted rounded" />
                </div>
              </div>
            </div>
            
            {/* Chart Skeleton */}
            <div className="space-y-4">
              <div className="h-[400px] bg-muted rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Period Selector - Mobile: Below chart */}
              <div className="flex md:hidden items-center justify-center gap-2">
                <div className="h-7 w-12 bg-muted rounded" />
                <div className="h-7 w-12 bg-muted rounded" />
                <div className="h-7 w-12 bg-muted rounded" />
                <div className="h-7 w-16 bg-muted rounded" />
              </div>
            </div>

            {/* Description Section Skeleton */}
            <div className="border-t border-b border-border py-6 space-y-4">
              <div className="h-5 w-24 bg-muted rounded mb-3 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-4 bg-muted rounded w-full relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-4 bg-muted rounded w-3/4 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            </div>

            {/* MOBILE: Stats Card ABOVE Tabs */}
            <div className="lg:hidden bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="h-[14px] w-28 bg-muted rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                ))}
              </div>
              
              {/* Probabilities section */}
              <div className="border-t pt-4 space-y-2">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-border">
                <div className="h-10 w-32 bg-muted rounded-t relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-10 w-24 bg-muted/50 rounded-t" />
                <div className="h-10 w-28 bg-muted/50 rounded-t" />
              </div>
              <div className="space-y-3">
                <div className="h-20 bg-muted rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-20 bg-muted rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-20 bg-muted rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - DESKTOP ONLY */}
          <div className="space-y-6 hidden lg:block">
            
            {/* Trading Panel Skeleton */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="h-6 w-32 bg-muted rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              
              {/* Outcomes */}
              <div className="space-y-3">
                <div className="h-16 bg-muted rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="h-16 bg-muted rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
              
              {/* Amount input */}
              <div>
                <div className="h-4 w-20 bg-muted rounded mb-2" />
                <div className="h-12 bg-muted rounded relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
              
              {/* Summary section */}
              <div className="border-t pt-4 space-y-2">
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
              </div>
              
              {/* Button */}
              <div className="h-12 bg-muted rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>

            {/* Stats Skeleton - DESKTOP: In sidebar */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="h-5 w-28 bg-muted rounded relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                ))}
              </div>
              
              {/* Probabilities section */}
              <div className="border-t pt-4 space-y-2">
                <div className="h-4 w-32 bg-muted rounded mb-2" />
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE: Fixed Bottom Action Bar Skeleton */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="flex gap-2">
            <div className="flex-1 h-12 bg-muted rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="flex-1 h-12 bg-muted rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
