import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comments, commentVotes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// DELETE /api/comments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('user_address')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'user_address is required' },
        { status: 400 }
      )
    }

    // Fetch comment to verify ownership
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Case-insensitive address comparison
    if (comment.userAddress.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    // Delete comment (and all replies if it's a top-level comment)
    await db.delete(comments).where(eq(comments.id, id))

    // Also delete all replies to this comment
    await db.delete(comments).where(eq(comments.parentId, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

// PATCH /api/comments/[id] - Toggle upvote on a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userAddress } = body

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      )
    }

    // Normalize address for consistency
    const normalizedAddress = userAddress.toLowerCase()

    // Fetch current comment
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1)

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user has already voted
    const [existingVote] = await db
      .select()
      .from(commentVotes)
      .where(and(
        eq(commentVotes.commentId, id),
        eq(commentVotes.userAddress, normalizedAddress)
      ))
      .limit(1)

    let newVotes: number
    let hasVoted: boolean

    if (existingVote) {
      // Remove vote (toggle off)
      await db
        .delete(commentVotes)
        .where(eq(commentVotes.id, existingVote.id))
      
      newVotes = comment.votes - 1
      hasVoted = false
    } else {
      // Add vote (toggle on)
      await db
        .insert(commentVotes)
        .values({
          commentId: id,
          userAddress: normalizedAddress
        })
      
      newVotes = comment.votes + 1
      hasVoted = true
    }

    // Update comment vote count
    const [updatedComment] = await db
      .update(comments)
      .set({ 
        votes: newVotes,
        updatedAt: new Date()
      })
      .where(eq(comments.id, id))
      .returning()

    return NextResponse.json({
      id: updatedComment.id,
      votes: updatedComment.votes,
      hasVoted
    })
  } catch (error) {
    console.error('Error voting on comment:', error)
    return NextResponse.json(
      { error: 'Failed to vote on comment' },
      { status: 500 }
    )
  }
}
