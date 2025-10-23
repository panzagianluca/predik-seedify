import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { marketProposals, proposalVotes } from '@/lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

// GET /api/proposals - Fetch all proposals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'most-voted'

    // Base query
    let query = db.select().from(marketProposals)

    // Filter by category if specified
    if (category && category !== 'all') {
      query = query.where(eq(marketProposals.category, category)) as any
    }

    // Apply sorting
    let proposals
    if (sort === 'recent') {
      proposals = await query.orderBy(desc(marketProposals.createdAt))
    } else {
      // Default: most-voted
      proposals = await query.orderBy(desc(marketProposals.upvotes))
    }

    return NextResponse.json(proposals)
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    )
  }
}

// POST /api/proposals - Create new proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, endDate, source, outcomes, createdBy } = body

    // Validate required fields
    if (!title || !category || !endDate || !outcomes || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate outcomes format
    let parsedOutcomes
    try {
      parsedOutcomes = typeof outcomes === 'string' ? JSON.parse(outcomes) : outcomes
      if (!Array.isArray(parsedOutcomes) || parsedOutcomes.length < 2) {
        throw new Error('Outcomes must be an array with at least 2 options')
      }
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid outcomes format' },
        { status: 400 }
      )
    }

    // Insert proposal
    const [proposal] = await db.insert(marketProposals).values({
      title,
      category,
      endDate: new Date(endDate),
      source: source || null,
      outcomes: JSON.stringify(parsedOutcomes),
      createdBy,
    }).returning()

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    )
  }
}
