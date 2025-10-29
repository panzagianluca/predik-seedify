# Contract ABIs

This directory contains TypeScript-formatted ABIs for all deployed smart contracts.

## Available ABIs

### Core Contracts

- **MarketFactory.ts** - Factory contract for creating prediction markets
- **LMSRMarket.ts** - Individual LMSR market contract for trading
- **MockUSDT.ts** - Test USDT token for BNB Testnet

### Usage Example

```typescript
import { MARKET_FACTORY_ABI, LMSR_MARKET_ABI, MOCK_USDT_ABI } from '@/lib/abis'
import { useWriteContract, useReadContract } from 'wagmi'

// Reading from a contract
const { data: marketCount } = useReadContract({
  address: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as `0x${string}`,
  abi: MARKET_FACTORY_ABI,
  functionName: 'getMarketCount',
})

// Writing to a contract
const { writeContract } = useWriteContract()

const createMarket = () => {
  writeContract({
    address: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS as `0x${string}`,
    abi: MARKET_FACTORY_ABI,
    functionName: 'createMarket',
    args: [
      'Will Bitcoin reach $100k in 2025?', // question
      ['Yes', 'No'], // outcomes
      Math.floor(Date.now() / 1000) + 86400 * 30, // tradingEndsAt (30 days)
      BigInt(1000 * 10**6), // initialLiquidity (1000 USDT)
      100, // protocolFeeBps (1%)
      50, // creatorFeeBps (0.5%)
      25, // oracleFeeBps (0.25%)
      BigInt(1000 * 10**6), // liquidityParameter (1000 USDT)
      0, // delphAIMarketId
    ]
  })
}
```

## Contract Addresses (BNB Testnet)

All contract addresses are stored in `.env.local`:

- `NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x5c4850878F222aC16d5ab60204997b904Fe4019A`
- `NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x4410355e143112e0619f822fC9Ecf92AaBd01b63`
- `NEXT_PUBLIC_OUTCOME1155_ADDRESS=0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29`
- `NEXT_PUBLIC_ROUTER_ADDRESS=0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991`
- `NEXT_PUBLIC_TREASURY_ADDRESS=0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1`
- `NEXT_PUBLIC_ORACLE_ADDRESS=0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4`

## Key Functions

### MarketFactory

- `createMarket()` - Create a new prediction market
- `getMarket(marketId)` - Get market address by ID
- `getAllMarkets()` - Get all market addresses
- `getMarketCount()` - Get total number of markets

### LMSRMarket

- `buy(outcomeIndex, amount, maxCost)` - Buy outcome tokens
- `sell(outcomeIndex, amount, minPayout)` - Sell outcome tokens
- `addLiquidity(amount)` - Add liquidity to the market
- `removeLiquidity(shares)` - Remove liquidity from the market
- `claimWinnings()` - Claim winnings after market resolution
- `getPrice(outcomeIndex)` - Get current price for an outcome
- `getCost(outcomeIndex, amount)` - Calculate cost to buy tokens

### MockUSDT

- `approve(spender, amount)` - Approve contract to spend tokens
- `balanceOf(account)` - Get token balance
- `mint(to, amount)` - Mint test tokens (testnet only)
- `transfer(to, amount)` - Transfer tokens

## Events to Listen For

### MarketFactory Events

- `MarketCreated` - Emitted when a new market is created

### LMSRMarket Events

- `Trade` - Emitted when tokens are bought/sold
- `LiquidityAdded` - Emitted when liquidity is added
- `MarketResolved` - Emitted when market is resolved

## Type Safety

All ABIs are exported with `as const` for full TypeScript type inference when using with wagmi hooks.
