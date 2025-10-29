import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Mark notification as read
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
