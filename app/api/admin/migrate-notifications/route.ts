import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_address varchar(42) NOT NULL,
        type varchar(20) NOT NULL,
        title text NOT NULL,
        message text NOT NULL,
        link text NOT NULL,
        market_slug varchar(255),
        comment_id uuid,
        from_user_address varchar(42),
        is_read boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        read_at timestamp
      )
    `)

    // Add foreign key constraint (will skip if already exists)
    try {
      await db.execute(sql`
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_comment_id_comments_id_fk 
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE cascade
      `)
    } catch (e) {
      console.log('Foreign key constraint already exists or failed:', e)
    }

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_user_address_idx ON notifications(user_address)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_address, is_read)`)

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications table and indexes created successfully' 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
