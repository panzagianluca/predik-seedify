# Subgraph Deployment Guide

## Overview
This guide covers deploying the Predik subgraph to The Graph Studio for BNB Testnet indexing.

## Prerequisites
- The Graph CLI installed (`npm install -g @graphprotocol/graph-cli`)
- The Graph Studio account
- Deploy key from The Graph Studio

## Deployment Steps

### 1. Create Subgraph on The Graph Studio

1. Go to [https://thegraph.com/studio/](https://thegraph.com/studio/)
2. Connect your wallet
3. Click "Create a Subgraph"
4. Name: `predik-bnb-testnet`
5. Subtitle: "Prediction markets on BNB Smart Chain Testnet"
6. Network: BSC Testnet (Chain ID 97)

### 2. Get Deploy Key

From your subgraph dashboard, copy the deploy key shown in the deployment instructions.

### 3. Authenticate

```bash
cd subgraph
graph auth --studio <YOUR_DEPLOY_KEY>
```

### 4. Deploy

```bash
npm run deploy
```

Or manually:
```bash
graph deploy --studio predik-bnb-testnet
```

### 5. Version Information

When prompted for version label, use semantic versioning:
- `v0.1.0` - Initial deployment
- `v0.2.0` - Added new features
- `v0.2.1` - Bug fixes

## Configuration Details

### Network: BNB Smart Chain Testnet
- Chain ID: 97
- RPC: https://data-seed-prebsc-1-s1.bnbchain.org:8545

### Contract Addresses
- MarketFactory: `0x5c48A81dBC7a657Be79bdc7A62d4eba673fD34D4`
- Starting Block: `44976400`

### Indexed Events
- **MarketFactory**: MarketCreated
- **LMSRMarket**: Buy, Sell, Resolved, MarketFinalized, Redeemed

## GraphQL Endpoint

After deployment, your subgraph will be available at:
```
https://api.studio.thegraph.com/query/<SUBGRAPH_ID>/predik-bnb-testnet/v0.1.0
```

## Example Queries

### Get All Markets
```graphql
{
  markets(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    title
    outcomes
    prices
    state
    totalVolume
    tradeCount
  }
}
```

### Get Market with Trades
```graphql
{
  market(id: "0x...") {
    id
    title
    outcomes
    prices
    trades(first: 20, orderBy: timestamp, orderDirection: desc) {
      id
      type
      trader {
        id
      }
      outcomeIndex
      shares
      amount
      price
      timestamp
    }
  }
}
```

### Get User Positions
```graphql
{
  user(id: "0x...") {
    id
    totalTrades
    totalVolume
    positions(where: { shares_gt: "0" }) {
      market {
        id
        title
      }
      outcomeIndex
      shares
      totalInvested
    }
  }
}
```

## Monitoring

### Check Sync Status
Visit your subgraph dashboard in The Graph Studio to monitor:
- Current synced block
- Indexing errors (if any)
- Query performance
- Total indexed entities

### Common Issues

**Subgraph Not Syncing**
- Check that the starting block is correct
- Verify contract addresses are accurate
- Ensure ABIs are up to date

**Missing Events**
- Verify events exist on-chain using block explorer
- Check event signatures match contract
- Ensure handler functions are implemented

**Type Errors**
- Run `npm run codegen` to regenerate types
- Check schema.graphql matches entity usage
- Verify AssemblyScript type compatibility

## Updating the Subgraph

To deploy a new version:

1. Make changes to `schema.graphql`, handlers, or `subgraph.yaml`
2. Regenerate types: `npm run codegen`
3. Build locally: `npm run build`
4. Deploy: `npm run deploy`
5. Increment version number when prompted

## Local Development

For local testing with Graph Node:

```bash
# Start local graph node (requires Docker)
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker
./setup.sh
docker-compose up

# Create and deploy local
graph create predik-bnb-testnet --node http://127.0.0.1:8020
graph deploy predik-bnb-testnet \
  --ipfs http://127.0.0.1:5001 \
  --node http://127.0.0.1:8020
```

## Resources

- [The Graph Docs](https://thegraph.com/docs/)
- [AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
- [Graph Studio](https://thegraph.com/studio/)
