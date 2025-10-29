import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 })
    }

    const normalizedAddress = userAddress.toLowerCase()

    // Mark all user's notifications as read
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(notifications.userAddress, normalizedAddress))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
  }
}
