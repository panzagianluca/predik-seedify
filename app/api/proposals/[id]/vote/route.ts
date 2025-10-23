import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { marketProposals, proposalVotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// PATCH /api/proposals/[id]/vote - Toggle vote on a proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { voterAddress } = body

    if (!voterAddress) {
      return NextResponse.json(
        { error: 'voterAddress is required' },
        { status: 400 }
      )
    }

    // Normalize address for consistency
    const normalizedAddress = voterAddress.toLowerCase()

    // Fetch current proposal
    const [proposal] = await db
      .select()
      .from(marketProposals)
      .where(eq(marketProposals.id, id))
      .limit(1)

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Check if user has already voted
    const [existingVote] = await db
      .select()
      .from(proposalVotes)
      .where(and(
        eq(proposalVotes.proposalId, id),
        eq(proposalVotes.voterAddress, normalizedAddress)
      ))
      .limit(1)

    let newVotes: number
    let hasVoted: boolean

    if (existingVote) {
      // Remove vote (toggle off)
      await db
        .delete(proposalVotes)
        .where(eq(proposalVotes.id, existingVote.id))
      
      newVotes = proposal.upvotes - 1
      hasVoted = false
    } else {
      // Add vote (toggle on)
      await db
        .insert(proposalVotes)
        .values({
          proposalId: id,
          voterAddress: normalizedAddress
        })
      
      newVotes = proposal.upvotes + 1
      hasVoted = true
    }

    // Update proposal vote count
    const [updatedProposal] = await db
      .update(marketProposals)
      .set({ 
        upvotes: newVotes
      })
      .where(eq(marketProposals.id, id))
      .returning()

    return NextResponse.json({
      id: updatedProposal.id,
      upvotes: updatedProposal.upvotes,
      hasVoted
    })
  } catch (error) {
    console.error('Error voting on proposal:', error)
    return NextResponse.json(
      { error: 'Failed to vote on proposal' },
      { status: 500 }
    )
  }
}
