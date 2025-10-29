// Market types based on Myriad API
export interface Market {
  id: number
  network_id: number
  slug: string
  title: string
  description: string
  created_at: string
  expires_at: string
  scheduled_at: string | null
  fee: number
  treasury_fee: number
  treasury: string
  state: 'open' | 'closed' | 'resolved'
  verified: boolean
  category: string
  subcategory: string
  topics: string[]
  resolution_source: string
  resolution_title: string
  token: Token
  image_url: string
  banner_url: string
  og_image_url: string
  image_ipfs_hash: string
  liquidity: number
  liquidity_eur: number
  liquidity_price: number
  volume: number
  volume_eur: number
  shares: number
  question_id: string
  resolved_outcome_id: number | null
  voided: boolean
  trading_view_symbol: string | null
  news: any[]
  votes: { up: number; down: number }
  users: number
  likes: number
  comments: number
  featured: boolean
  featured_at: string | null
  publish_status: string
  edit_history: any[]
  tournaments: any[]
  outcomes: Outcome[]
  liked: boolean
  related_markets?: Market[]
}

export interface Token {
  name: string
  address: string
  symbol: string
  decimals: number
  wrapped: boolean
}

export interface Outcome {
  id: number
  market_id: number
  title: string
  shares: number
  shares_held?: number
  price: number
  closing_price: number | null
  price_change_24h?: number
  image_url: string | null
  image_ipfs_hash: string | null
  price_charts?: PriceChart[]
}

export interface PriceChart {
  timeframe: string
  prices: PricePoint[]
}

export interface PricePoint {
  value: number
  timestamp: number
  date: string
}
