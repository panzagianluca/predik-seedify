# Predik Subgraph

The Graph subgraph for indexing Predik prediction markets on BNB Testnet.

## Setup

1. Install dependencies:
```bash
cd subgraph
npm install
```

2. Generate types:
```bash
npm run codegen
```

3. Build the subgraph:
```bash
npm run build
```

## Deployment

### The Graph Studio (Recommended)

1. Go to https://thegraph.com/studio/
2. Create a new subgraph called "predik-bnb-testnet"
3. Get your deploy key
4. Authenticate:
```bash
graph auth --studio YOUR_DEPLOY_KEY
```

5. Deploy:
```bash
npm run deploy
```

### Local Graph Node (Testing)

1. Start local graph node (requires Docker)
2. Create subgraph:
```bash
npm run create-local
```

3. Deploy locally:
```bash
npm run deploy-local
```

## Querying

Once deployed, you can query the subgraph at:
- Studio: `https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/predik-bnb-testnet/version/latest`

### Example Queries

**Get all markets:**
```graphql
{
  markets(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    marketId
    title
    outcomes
    state
    totalVolume
    totalTrades
    prices
    creator {
      id
    }
  }
}
```

**Get user positions:**
```graphql
{
  user(id: "0x...") {
    positions {
      market {
        title
      }
      outcomeIndex
      shares
      totalInvested
      realizedProfit
    }
  }
}
```

**Get recent trades:**
```graphql
{
  trades(first: 20, orderBy: timestamp, orderDirection: desc) {
    type
    market {
      title
    }
    trader {
      id
    }
    shares
    amount
    price
    timestamp
  }
}
```

## Contract Addresses

- **MarketFactory**: `0x5c4850878F222aC16d5ab60204997b904Fe4019A`
- **Network**: BNB Testnet (Chain ID 97)
- **Start Block**: 44976400
