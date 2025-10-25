import { 
  Buy, 
  Sell, 
  Resolved,
  MarketFinalized,
  Redeemed,
  LMSRMarket
} from "../generated/templates/LMSRMarket/LMSRMarket"
import { Market, Trade, User, Position, GlobalStats } from "../generated/schema"
import { BigInt, Bytes, log } from "@graphprotocol/graph-ts"

export function handleBuy(event: Buy): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)
  
  // Early return if market doesn't exist
  if (market == null) {
    log.warning("Market not found: {}", [marketId])
    return
  }
  
  // Get or create User
  let traderId = event.params.trader.toHexString()
  let trader = User.load(traderId)
  if (trader == null) {
    trader = new User(traderId)
    trader.totalTrades = 0
    trader.totalVolume = BigInt.fromI32(0)
    trader.marketsTraded = 0
    trader.winnings = BigInt.fromI32(0)
    trader.save()
  }
  
  // Create Trade entity
  let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let trade = new Trade(tradeId)
  trade.market = marketId
  trade.trader = traderId
  trade.type = "BUY"
  trade.outcomeIndex = event.params.outcome
  trade.shares = event.params.shares
  trade.amount = event.params.cost
  trade.fee = event.params.fee
  trade.timestamp = event.block.timestamp
  trade.blockNumber = event.block.number
  trade.transactionHash = event.transaction.hash
  
  // Get price from market prices array
  let prices = market.prices
  if (event.params.outcome < prices.length) {
    trade.price = prices[event.params.outcome]
  } else {
    trade.price = BigInt.fromI32(0)
  }
  
  trade.save()
  
  log.info("Buy trade saved: {}", [tradeId])
}

export function handleSell(event: Sell): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)
  
  if (market == null) {
    log.warning("Market not found: {}", [marketId])
    return
  }
  
  // Get or create User
  let traderId = event.params.trader.toHexString()
  let trader = User.load(traderId)
  if (trader == null) {
    trader = new User(traderId)
    trader.totalTrades = 0
    trader.totalVolume = BigInt.fromI32(0)
    trader.marketsTraded = 0
    trader.winnings = BigInt.fromI32(0)
    trader.save()
  }
  
  // Create Trade entity
  let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let trade = new Trade(tradeId)
  trade.market = marketId
  trade.trader = traderId
  trade.type = "SELL"
  trade.outcomeIndex = event.params.outcome
  trade.shares = event.params.shares
  trade.amount = event.params.payout
  trade.fee = event.params.fee
  trade.timestamp = event.block.timestamp
  trade.blockNumber = event.block.number
  trade.transactionHash = event.transaction.hash
  
  // Get price from market prices array
  let prices = market.prices
  if (event.params.outcome < prices.length) {
    trade.price = prices[event.params.outcome]
  } else {
    trade.price = BigInt.fromI32(0)
  }
  
  trade.save()
  
  log.info("Sell trade saved: {}", [tradeId])
}

export function handleResolved(event: Resolved): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)
  
  if (market == null) {
    log.warning("Market not found: {}", [marketId])
    return
  }
  
  // Update market state to Resolving
  market.state = "Resolving"
  market.save()
  
  log.info("Market resolution started: {}", [marketId])
}

export function handleMarketFinalized(event: MarketFinalized): void {
  let marketId = event.address.toHexString()
  let market = Market.load(marketId)
  
  if (market == null) {
    log.warning("Market not found: {}", [marketId])
    return
  }
  
  // Update market to Finalized state
  market.state = "Finalized"
  market.winningOutcome = event.params.winningOutcome
  market.invalid = event.params.invalid
  market.finalizedAt = event.block.timestamp
  market.save()
  
  log.info("Market finalized: {} - Winning outcome: {}", [marketId, event.params.winningOutcome.toString()])
}

export function handleRedeemed(event: Redeemed): void {
  let marketId = event.address.toHexString()
  let userId = event.params.user.toHexString()
  
  // Create redemption trade record
  let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let trade = new Trade(tradeId)
  trade.market = marketId
  trade.trader = userId
  trade.type = "REDEEM"
  trade.outcomeIndex = event.params.outcome
  trade.shares = event.params.shares
  trade.amount = event.params.payout
  trade.fee = BigInt.fromI32(0)
  trade.timestamp = event.block.timestamp
  trade.blockNumber = event.block.number
  trade.transactionHash = event.transaction.hash
  trade.price = BigInt.fromI32(0) // Price not relevant for redemptions
  trade.save()
  
  log.info("Redemption saved: {}", [tradeId])
}
