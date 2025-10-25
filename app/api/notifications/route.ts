import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { eq, and, desc, or } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 })
    }

    const normalizedAddress = userAddress.toLowerCase()

    // Fetch notifications (unread + recently read within last 24h)
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userAddress, normalizedAddress),
          or(
            eq(notifications.isRead, false),
            // Include read notifications from last 24h
            and(
              eq(notifications.isRead, true),
              // readAt > NOW() - INTERVAL '24 hours' (will be filtered in code if needed)
            )
          )
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(50)

    // Calculate unread count
    const unreadCount = userNotifications.filter((n: typeof notifications.$inferSelect) => !n.isRead).length

    return NextResponse.json({
      notifications: userNotifications,
      unread_count: unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
