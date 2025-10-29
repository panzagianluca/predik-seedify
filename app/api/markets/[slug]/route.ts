import { NextRequest, NextResponse } from 'next/server'

const MYRIAD_API_URL = process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const response = await fetch(`${MYRIAD_API_URL}/markets/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch market: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching market:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market' },
      { status: 500 }
    )
  }
}
