import { MarketCreated } from "../generated/MarketFactory/MarketFactory"
import { LMSRMarket as LMSRMarketTemplate } from "../generated/templates"
import { Market, User, GlobalStats } from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"

export function handleMarketCreated(event: MarketCreated): void {
  // Create market entity
  let market = new Market(event.params.marketAddress.toHexString())
  
  market.marketId = event.params.marketId
  market.title = event.params.title
  market.description = event.params.description
  market.category = event.params.category
  market.imageUrl = event.params.imageUrl
  market.outcomes = event.params.outcomes
  market.createdAt = event.block.timestamp
  market.tradingEndsAt = event.params.tradingEndsAt
  market.liquidityParameter = event.params.liquidityParameter
  market.outcomeCount = event.params.outcomes.length
  
  // Initial state
  market.state = "Trading"
  market.winningOutcome = 0
  market.invalid = false
  market.resolved = false
  market.finalizedAt = BigInt.fromI32(0)
  
  // Statistics
  market.totalVolume = BigInt.fromI32(0)
  market.totalTrades = 0
  market.uniqueTraders = 0
  
  // Initialize prices array with equal probabilities
  let initialPrices: BigInt[] = []
  let equalPrice = BigInt.fromString("1000000000000000000").div(BigInt.fromI32(market.outcomeCount)) // 1.0 / outcomeCount in UD60x18
  for (let i = 0; i < market.outcomeCount; i++) {
    initialPrices.push(equalPrice)
  }
  market.prices = initialPrices
  
  // Get or create creator
  let creatorId = event.params.creator.toHexString().toLowerCase()
  let creator = User.load(creatorId)
  if (creator == null) {
    creator = new User(creatorId)
    creator.totalVolume = BigInt.fromI32(0)
    creator.totalTrades = 0
    creator.marketsTraded = 0
    creator.winnings = BigInt.fromI32(0)
    creator.firstTradeAt = BigInt.fromI32(0)
    creator.lastTradeAt = BigInt.fromI32(0)
    creator.save()
    
    // Update global user count
    updateGlobalStats(true, false)
  }
  market.creator = creatorId
  
  market.save()
  
  // Start indexing this market's events
  LMSRMarketTemplate.create(event.params.marketAddress)
  
  // Update global market count
  updateGlobalStats(false, true)
}

function updateGlobalStats(newUser: bool, newMarket: bool): void {
  let stats = GlobalStats.load("1")
  if (stats == null) {
    stats = new GlobalStats("1")
    stats.totalMarkets = 0
    stats.totalVolume = BigInt.fromI32(0)
    stats.totalTrades = 0
    stats.totalUsers = 0
  }
  
  if (newUser) {
    stats.totalUsers = stats.totalUsers + 1
  }
  if (newMarket) {
    stats.totalMarkets = stats.totalMarkets + 1
  }
  
  stats.lastUpdated = BigInt.fromI32(0) // Will be set by trade handlers
  stats.save()
}
