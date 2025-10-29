'use client'

import { useState, useEffect, useRef } from 'react'
import { ProposalCard } from '@/components/proponer/ProposalCard'
import { SubmitProposalModal } from '@/components/proponer/SubmitProposalModal'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ProponerSkeleton, ProponerCardsSkeleton } from '@/components/ui/skeletons/ProponerSkeleton'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/animate-ui/components/radix/dialog'

type SortFilter = 'most-voted' | 'recent'

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

export default function ProponerPage() {
  const { address } = useAccount()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isListLoading, setIsListLoading] = useState(false)
  const [sortFilter, setSortFilter] = useState<SortFilter>('most-voted')
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [topContributors, setTopContributors] = useState<Array<{ address: string; count: number }>>([])
  const [showContributors, setShowContributors] = useState(false)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    const isInitialLoad = !hasLoadedRef.current
    fetchProposals({ initial: isInitialLoad })
    hasLoadedRef.current = true
    if (address) {
      fetchUserVotes()
    }
  }, [sortFilter, address])

  const fetchProposals = async ({ initial = false }: { initial?: boolean } = {}) => {
    if (initial) {
      setIsLoading(true)
    } else {
      setIsListLoading(true)
    }
    try {
      const params = new URLSearchParams({
        sort: sortFilter
      })
      
      const response = await fetch(`/api/proposals?${params}`)
      if (!response.ok) throw new Error('Failed to fetch proposals')
      
      const data = await response.json()
      setProposals(data)
      
      // Calculate top contributors
      const contributorMap = new Map<string, number>()
      data.forEach((p: Proposal) => {
        contributorMap.set(p.createdBy, (contributorMap.get(p.createdBy) || 0) + 1)
      })
      
      const sorted = Array.from(contributorMap.entries())
        .map(([address, count]) => ({ address, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      
      setTopContributors(sorted)
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      if (initial) {
        setIsLoading(false)
      }
      setIsListLoading(false)
    }
  }

  const fetchUserVotes = async () => {
    if (!address) return
    
    try {
      // Fetch all proposal IDs that the user has voted on
      const response = await fetch(`/api/proposals/user-votes?voterAddress=${address}`)
      if (response.ok) {
        const votedProposalIds = await response.json()
        setUserVotes(new Set(votedProposalIds))
      }
    } catch (error) {
      console.error('Error fetching user votes:', error)
    }
  }

  const handleVote = async (proposalId: string) => {
    // Just refresh proposals to keep counts in sync
    // The ProposalCard component handles the actual voting
    await fetchProposals()
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const sortFilters: Array<{
    id: SortFilter
    label: string
  }> = [
    { id: 'most-voted', label: 'Más Votados' },
    { id: 'recent', label: 'Recientes' },
  ]

  return (
    <div className="pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="pb-4">
          <h1 className="text-[24px] font-medium">Proponer Mercados</h1>
        </div>

        {isLoading ? (
          <ProponerSkeleton />
        ) : (
          <>
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-2">
              {/* Left Column: Submit Button + Top Contributors */}
              <div className="space-y-4">
                {/* Submit Button */}
                <SubmitProposalModal
                  userAddress={address}
                  onProposalCreated={fetchProposals}
                />

                {/* Top Contributors */}
                {topContributors.length > 0 && (
                  <Card className="hidden lg:block">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-electric-purple" />
                        <h3 className="text-[16px] font-medium">Mejores Contribuidores</h3>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {topContributors.map((contributor, index) => (
                          <div key={contributor.address} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-muted-foreground min-w-[1.5ch]">
                                {index + 1}.
                              </span>
                              <a
                                href={`https://celo-sepolia.blockscout.com/address/${contributor.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-mono hover:text-electric-purple transition-colors"
                              >
                                {truncateAddress(contributor.address)}
                              </a>
                            </div>
                            <span className="text-sm font-semibold">{contributor.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Filter Banner + Proposals Grid */}
              <div>
                {/* Filter Banner */}
                <div className="flex flex-wrap items-center gap-2 rounded-lg py-3 mb-4">
                  {/* Sort Filters - Ghost buttons */}
                  {sortFilters.map((filter) => {
                    const isActive = sortFilter === filter.id
                    return (
                      <motion.button
                        key={filter.id}
                        onClick={() => setSortFilter(filter.id)}
                        className={cn(
                          'px-4 h-[36px] rounded-md transition-all duration-200 font-medium text-[14px] relative overflow-hidden',
                          isActive
                            ? 'text-electric-purple bg-electric-purple/5'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeSortFilter"
                            className="absolute inset-0 bg-electric-purple/5 rounded-md"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          />
                        )}
                        <span className="relative z-10">{filter.label}</span>
                      </motion.button>
                    )
                  })}

                  {/* Contribuidores Button - Mobile Only */}
                  {topContributors.length > 0 && (
                    <motion.button
                      onClick={() => setShowContributors(true)}
                      className="lg:hidden ml-auto px-4 h-[36px] rounded-md transition-all duration-200 font-medium text-[14px] text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Contribuidores</span>
                    </motion.button>
                  )}
                </div>

                {/* Proposals Grid */}
                {isListLoading ? (
                  <ProponerCardsSkeleton />
                ) : proposals.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground text-lg">
                      No hay propuestas aún. ¡Sé el primero en proponer un mercado!
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={sortFilter}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="grid grid-cols-1 gap-4"
                    >
                      {proposals.map((proposal, index) => (
                        <motion.div
                          key={proposal.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: index * 0.05,
                            ease: "easeOut"
                          }}
                        >
                          <ProposalCard
                            proposal={proposal}
                            userAddress={address}
                            userVoted={userVotes.has(proposal.id)}
                            onVote={handleVote}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contributors Dialog - Mobile Only */}
      <Dialog open={showContributors} onOpenChange={setShowContributors}>
        <DialogContent 
          className="sm:max-w-md w-[calc(100%-2rem)] md:w-full p-0 gap-0 max-h-[90vh] overflow-hidden"
          from="top"
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <DialogTitle className="sr-only">Mejores Contribuidores</DialogTitle>
          
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-electric-purple" />
              <h3 className="text-[18px] font-semibold">Mejores Contribuidores</h3>
            </div>

            {topContributors.length > 0 ? (
              <div className="space-y-3">
                {topContributors.map((contributor, index) => (
                  <div key={contributor.address} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-muted-foreground min-w-[1.5ch]">
                        {index + 1}.
                      </span>
                      <a
                        href={`https://celo-sepolia.blockscout.com/address/${contributor.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono hover:text-electric-purple transition-colors"
                      >
                        {truncateAddress(contributor.address)}
                      </a>
                    </div>
                    <span className="text-sm font-semibold">{contributor.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay contribuidores aún
              </p>
            )}

            <button
              onClick={() => setShowContributors(false)}
              className="mt-6 w-full py-2.5 bg-electric-purple text-white rounded-lg font-medium hover:bg-electric-purple/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
