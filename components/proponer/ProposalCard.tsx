'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Triangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Proposal {
  id: string
  title: string
  category: string
  endDate: string
  source: string | null
  outcomes: string
  createdBy: string
  upvotes: number
  createdAt: string
}

interface ProposalCardProps {
  proposal: Proposal
  userAddress?: string
  userVoted?: boolean
  onVote?: (proposalId: string) => Promise<void>
}

export function ProposalCard({ proposal, userAddress, userVoted = false, onVote }: ProposalCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(userVoted)
  const [voteCount, setVoteCount] = useState(proposal.upvotes)

  // Sync hasVoted state when prop changes (e.g., after fetching user votes)
  useEffect(() => {
    setHasVoted(userVoted)
  }, [userVoted])

  // Sync voteCount when proposal upvotes change
  useEffect(() => {
    setVoteCount(proposal.upvotes)
  }, [proposal.upvotes])

  const handleVote = async () => {
    if (!userAddress || isVoting) return

    setIsVoting(true)
    
    // Optimistic update
    const newHasVoted = !hasVoted
    const newVoteCount = hasVoted ? voteCount - 1 : voteCount + 1
    setHasVoted(newHasVoted)
    setVoteCount(newVoteCount)

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/vote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterAddress: userAddress })
      })

      if (!response.ok) throw new Error('Vote failed')

      const data = await response.json()
      setVoteCount(data.upvotes)
      setHasVoted(data.hasVoted)
      
      if (onVote) {
        onVote(proposal.id)
      }
    } catch (error) {
      console.error('Error voting:', error)
      // Revert optimistic update
      setHasVoted(hasVoted)
      setVoteCount(voteCount)
    } finally {
      setIsVoting(false)
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const outcomes = JSON.parse(proposal.outcomes)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Upvote Button + Count */}
          <button
            onClick={handleVote}
            disabled={!userAddress || isVoting}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-all min-w-[50px] h-fit",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              hasVoted
                ? "bg-electric-purple/20 text-electric-purple hover:bg-electric-purple/30"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
            aria-label={hasVoted ? "Remove vote" : "Vote"}
          >
            <Triangle
              className={cn(
                "h-5 w-5 transition-all",
                hasVoted && "fill-current"
              )}
            />
            <span className="text-sm font-bold">{voteCount}</span>
          </button>

          {/* Content - 2 Rows on Mobile, Single Row on Desktop */}
          <div className="flex-1 space-y-2">
            {/* ROW 1: Title (Mobile) / Title + Meta (Desktop) */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
              <h3 className="font-medium leading-tight flex-1">{proposal.title}</h3>
              {/* Meta info - Hidden on mobile, shown on desktop */}
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                <span>por {truncateAddress(proposal.createdBy)}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(proposal.createdAt), {
                    addSuffix: true,
                    locale: es
                  })}
                </span>
              </div>
            </div>

            {/* ROW 2: ALL metadata in ONE single row */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Category Badge */}
              <span className="px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                {proposal.category}
              </span>
              
              {/* Options */}
              {outcomes.length > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {outcomes.join(' / ')}
                  </span>
                </>
              )}

              {/* Meta info - Mobile only */}
              <span className="md:hidden text-muted-foreground">•</span>
              <span className="md:hidden text-muted-foreground">
                por {truncateAddress(proposal.createdBy)}
              </span>
              <span className="md:hidden text-muted-foreground">•</span>
              <span className="md:hidden text-muted-foreground">
                {formatDistanceToNow(new Date(proposal.createdAt), {
                  addSuffix: true,
                  locale: es
                })}
              </span>

              {/* Source - Desktop */}
              {proposal.source && (
                <a
                  href={proposal.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline text-electric-purple hover:underline ml-auto"
                >
                  Fuente →
                </a>
              )}

              {/* Source - Mobile */}
              {proposal.source && (
                <>
                  <span className="md:hidden text-muted-foreground">•</span>
                  <a
                    href={proposal.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="md:hidden text-electric-purple hover:underline"
                  >
                    Fuente →
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
