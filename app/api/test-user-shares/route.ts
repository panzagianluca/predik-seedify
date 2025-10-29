import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    error: 'This test endpoint is deprecated',
    message: 'The old Polkamarkets contract is no longer in use. Use the new LMSRMarket contracts with Outcome1155 tokens for share tracking.',
    suggestion: 'Query user balances via Outcome1155.balanceOf() or use The Graph for historical data'
  }, { status: 410 }) // 410 Gone
}
