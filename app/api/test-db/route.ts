import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export async function GET() {
  try {
    // Test query to check if tables exist
    const userCount = await db.select().from(users)
    
    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      userCount: userCount.length,
      tables: ['users', 'user_stats', 'email_verification_tokens']
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Make sure DATABASE_URL is set and migrations are applied'
    }, { status: 500 })
  }
}
