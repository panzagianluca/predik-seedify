'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoteButtonsProps {
  commentId: string
  initialVotes: number
  initialHasVoted?: boolean
  userAddress?: string
  onVoteChange?: (votes: number, hasVoted: boolean) => void
}

export function VoteButtons({ 
  commentId, 
  initialVotes, 
  initialHasVoted = false, 
  userAddress,
  onVoteChange 
}: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes)
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [isVoting, setIsVoting] = useState(false)

  const handleToggleVote = async () => {
    if (isVoting || !userAddress) return

    setIsVoting(true)
    
    // Optimistic update
    const newHasVoted = !hasVoted
    const newVotes = hasVoted ? votes - 1 : votes + 1
    setHasVoted(newHasVoted)
    setVotes(newVotes)

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      })

      if (!response.ok) throw new Error('Vote failed')

      const data = await response.json()
      setVotes(data.votes)
      setHasVoted(data.hasVoted)
      
      if (onVoteChange) {
        onVoteChange(data.votes, data.hasVoted)
      }
    } catch (error) {
      console.error('Error voting:', error)
      // Revert optimistic update
      setHasVoted(hasVoted)
      setVotes(votes)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleVote}
        disabled={isVoting || !userAddress}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          hasVoted 
            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" 
            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        )}
        aria-label={hasVoted ? "Remove upvote" : "Upvote"}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-all",
            hasVoted && "fill-current"
          )} 
        />
        <span className="text-sm font-medium">
          {votes}
        </span>
      </button>
    </div>
  )
}
