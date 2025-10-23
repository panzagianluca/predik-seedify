import { NextRequest, NextResponse } from 'next/server'

const MYRIAD_API_URL = process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')
    const token = searchParams.get('token') || 'USDT' // DEFAULT TO USDT
    const network_id = searchParams.get('network_id') || '11142220'

    // Build query params for Myriad API
    const params = new URLSearchParams({
      network_id,
      token, // TOKEN IS REQUIRED!
      ...(state && { state }),
    })

    const response = await fetch(`${MYRIAD_API_URL}/markets?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds, then revalidate
    })

    console.log('📡 Myriad API request:', `${MYRIAD_API_URL}/markets?${params}`)

    if (!response.ok) {
      console.error('❌ Myriad API error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Failed to fetch markets: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Myriad API response:', data.length || 0, 'markets')

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}
