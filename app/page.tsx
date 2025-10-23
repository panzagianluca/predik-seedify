import { MarketsGrid } from '@/components/market/MarketsGrid'
import { LogoSpinner } from '@/components/ui/logo-spinner'
import { Suspense } from 'react'

const MYRIAD_API_URL = process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'

async function getMarkets() {
  try {
    const params = new URLSearchParams({
      network_id: '11142220',
      token: 'USDT',
    })
    
    const response = await fetch(`${MYRIAD_API_URL}/markets?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    })
    
    if (!response.ok) {
      console.error('Failed to fetch markets:', response.statusText)
      return []
    }
    
    const data = await response.json()
    return data
  } catch (err) {
    console.error('Error loading markets:', err)
    return []
  }
}

export default async function Home() {
  const markets = await getMarkets()

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h1 className="text-[30px] mb-4">
          El futuro tiene precio
        </h1>

        {/* Market Grid Section */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <LogoSpinner size={32} />
          </div>
        }>
          <MarketsGrid markets={markets} />
        </Suspense>
      </div>
    </div>
  )
}
