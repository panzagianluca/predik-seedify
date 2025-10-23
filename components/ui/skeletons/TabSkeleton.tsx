/**
 * Skeleton loader for Tab Content
 */

export function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3">
          {/* Avatar + Content Row */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>

          {/* Divider */}
          {index < 2 && <div className="h-px bg-border" />}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for comment section
 */
export function CommentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border border-border rounded-lg p-4 space-y-3">
          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-16 bg-muted rounded ml-auto" />
          </div>
          
          {/* Comment content */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <div className="h-6 w-12 bg-muted rounded" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
