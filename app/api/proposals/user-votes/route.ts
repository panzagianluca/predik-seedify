import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { proposalVotes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/proposals/user-votes - Get all proposal IDs that a user has voted on
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const voterAddress = searchParams.get('voterAddress')

    if (!voterAddress) {
      return NextResponse.json(
        { error: 'voterAddress is required' },
        { status: 400 }
      )
    }

    // Normalize address for consistency
    const normalizedAddress = voterAddress.toLowerCase()

    // Fetch all votes by this user
    const votes = await db
      .select({ proposalId: proposalVotes.proposalId })
      .from(proposalVotes)
      .where(eq(proposalVotes.voterAddress, normalizedAddress))

    // Return array of proposal IDs
    const proposalIds = votes.map(v => v.proposalId)
    
    return NextResponse.json(proposalIds, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Error fetching user votes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user votes' },
      { status: 500 }
    )
  }
}
