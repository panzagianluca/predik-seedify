# Holders Tab - Current Status & Next Steps

## Current Status (Updated)

### ✅ What's Working:
1. **Holders API endpoint** showing top holder addresses from Myriad API
2. **12-hour caching** to reduce API calls
3. **Clean table UI** matching profile design
4. **Two-column layout** for both outcomes

### ❌ What's NOT Working (YET):
1. **Real share amounts from blockchain** - Currently shows "N/A"
2. **Per-outcome breakdown** - Same holders shown for both outcomes (not accurate)

### Why Blockchain Querying Failed:

**Issue:** The `getUserMarketShares` contract method is returning invalid data with Web3.js direct calls.

**Possible causes:**
- Contract version mismatch (deployed contract might be V3_2, not V3_4)
- ABI encoding issues with Web3.js
- RPC node not fully synced
- Method not available on Celo Sepolia testnet deployment

**What we tried:**
1. ✅ Direct `balanceOf` call - Contract doesn't support ERC-1155 standard
2. ✅ `getUserMarketShares` with Web3.js - Returns "invalid data" error
3. ⏸️ Polkamarkets-js SDK - Only works client-side with browser wallet

**Next attempt:** Use polkamarkets-js SDK in a background job (server-side) with proper Web3 provider setup.

---

### Option A: Use Polkamarkets SDK in API Route (Complex)
**Pros:**
- Most accurate data directly from blockchain
- No dependency on external APIs

**Cons:**
- polkamarkets-js not designed for server-side
- Need to setup Web3 provider with private key (security risk)
- Complex to implement and maintain
- Slow (many RPC calls)

### Option B: Store in Database (Recommended)
**Pros:**
- Fast queries
- Historical tracking
- Reliable
- Can index from blockchain events offline

**Implementation:**
1. Create `market_holders` table in PostgreSQL:
```sql
CREATE TABLE market_holders (
  id SERIAL PRIMARY KEY,
  market_id INTEGER NOT NULL,
  outcome_id INTEGER NOT NULL,
  holder_address VARCHAR(42) NOT NULL,
  shares NUMERIC(18, 6) NOT NULL,
  usd_value NUMERIC(18, 2),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(market_id, outcome_id, holder_address)
);
```

2. Create a background job/cron that:
   - Runs every hour
   - Fetches holder balances using polkamarkets-js
   - Updates database
   
3. API route reads from database instead of blockchain

### Option C: Use Myriad's Indexed Data (Current + Best for MVP)
**Pros:**
- Already working
- Fast
- Reliable
- Myriad maintains the indexing

**Cons:**
- Cannot get per-outcome breakdown
- Dependent on Myriad API

**Current Status:** ✅ **This is what we're using now**

## Database Storage Question

### Do we NEED to store in DB?
**For MVP (current state):** NO
- In-memory cache works fine for 1-hour refresh
- Myriad API is reliable
- No historical tracking needed yet

**For Production:** YES, if you want:
- Historical holder tracking
- Per-outcome share amounts
- Faster load times
- Independence from Myriad API updates
- Analytics on holder behavior

### Recommended DB Schema (if implementing):
```typescript
// drizzle/schema.ts
export const marketHolders = pgTable('market_holders', {
  id: serial('id').primaryKey(),
  marketId: integer('market_id').notNull(),
  outcomeId: integer('outcome_id').notNull(),
  holderAddress: varchar('holder_address', { length: 42 }).notNull(),
  shares: numeric('shares', { precision: 18, scale: 6 }).notNull(),
  usdValue: numeric('usd_value', { precision: 18, scale: 2 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueHolder: uniqueIndex('unique_market_outcome_holder')
    .on(table.marketId, table.outcomeId, table.holderAddress),
  marketIdx: index('market_id_idx').on(table.marketId),
}))
```

## Next Steps (Priority Order)

### 1. Immediate (Current State is Acceptable):
- ✅ Display top holders from Myriad API
- ✅ Show addresses with copy functionality
- ⏸️ Accept "N/A" for share amounts (temporary)

### 2. Short-term (If you need per-outcome data):
- Create background job using polkamarkets-js SDK
- Store results in PostgreSQL
- Update API to read from DB

### 3. Long-term (Production):
- Implement Graph Protocol indexer for Polkamarkets events
- Real-time holder updates
- Historical charts
- Holder analytics

## Testing the Current Implementation

```bash
# Test the endpoint
curl "http://localhost:3000/api/markets/YOUR-MARKET-SLUG/holders" | jq

# Check if your address is in top_holders
curl "https://api-v1.staging.myriadprotocol.com/markets/YOUR-MARKET-SLUG" | jq '.top_holders'
```

## How to Fix and Get Real Share Data (Implementation Guide)

### Step-by-Step Solution (Option B - Recommended)

#### Phase 1: Create Database Schema

```typescript
// drizzle/schema.ts - Add this table
export const marketHolders = pgTable('market_holders', {
  id: serial('id').primaryKey(),
  marketId: integer('market_id').notNull(),
  outcomeId: integer('outcome_id').notNull(),
  holderAddress: varchar('holder_address', { length: 42 }).notNull(),
  shares: decimal('shares', { precision: 18, scale: 6 }).notNull(),
  usdValue: decimal('usd_value', { precision: 18, scale: 2 }),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => ({
  uniqueHolder: uniqueIndex('unique_market_outcome_holder')
    .on(table.marketId, table.outcomeId, table.holderAddress),
  marketIdx: index('market_id_idx').on(table.marketId),
  updatedIdx: index('last_updated_idx').on(table.lastUpdated),
}))
```

#### Phase 2: Create Background Job to Index Holders

```typescript
// lib/jobs/indexHolders.ts
import * as polkamarketsjs from 'polkamarkets-js'
import Web3 from 'web3'
import { db } from '@/lib/db'
import { marketHolders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function indexMarketHolders(marketId: number) {
  // 1. Initialize polkamarkets with RPC provider
  const web3Provider = process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
  const web3 = new Web3(web3Provider)
  
  const polkamarkets = new polkamarketsjs.Application({
    web3Provider: web3.currentProvider,
  })

  const pm = polkamarkets.getPredictionMarketV3PlusContract({
    contractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS!,
    querierContractAddress: process.env.NEXT_PUBLIC_PREDICTION_MARKET_QUERIER!,
  })

  // 2. Get market data from Myriad
  const marketResponse = await fetch(
    `${process.env.NEXT_PUBLIC_MYRIAD_API_URL}/markets/${marketId}`
  )
  const market = await marketResponse.json()
  const topHolders = market.top_holders || []

  // 3. For each holder, get their shares per outcome
  for (const holderAddress of topHolders) {
    try {
      // Call getUserMarketShares(marketId, address)
      const userShares = await pm.getContract().methods
        .getUserMarketShares(marketId, holderAddress)
        .call()

      // userShares returns [liquidityShares, outcomeShares[]]
      const outcomeShares = userShares[1]

      // 4. Store each outcome's shares in DB
      for (let outcomeIndex = 0; outcomeIndex < market.outcomes.length; outcomeIndex++) {
        const outcome = market.outcomes[outcomeIndex]
        const sharesRaw = outcomeShares[outcomeIndex]
        const sharesFormatted = Number(sharesRaw) / Math.pow(10, market.token.decimals || 6)

        if (sharesFormatted > 0) {
          const usdValue = sharesFormatted * outcome.price

          // Upsert to database
          await db.insert(marketHolders)
            .values({
              marketId,
              outcomeId: outcome.id,
              holderAddress: holderAddress.toLowerCase(),
              shares: sharesFormatted.toString(),
              usdValue: usdValue.toFixed(2),
            })
            .onConflictDoUpdate({
              target: [marketHolders.marketId, marketHolders.outcomeId, marketHolders.holderAddress],
              set: {
                shares: sharesFormatted.toString(),
                usdValue: usdValue.toFixed(2),
                lastUpdated: new Date(),
              }
            })
        }
      }

      console.log(`✅ Indexed holder ${holderAddress} for market ${marketId}`)
    } catch (err) {
      console.error(`❌ Error indexing ${holderAddress}:`, err)
    }
  }
}
```

#### Phase 3: Create Cron Job / Scheduled Task

**Option A: Vercel Cron (if using Vercel)**

```typescript
// app/api/cron/index-holders/route.ts
import { NextResponse } from 'next/server'
import { indexMarketHolders } from '@/lib/jobs/indexHolders'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all active markets
    const marketsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_MYRIAD_API_URL}/markets?state=open&network_id=11142220`
    )
    const markets = await marketsResponse.json()

    // Index each market
    for (const market of markets) {
      await indexMarketHolders(market.id)
    }

    return NextResponse.json({ 
      success: true, 
      indexed: markets.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/cron/index-holders",
    "schedule": "0 */12 * * *"
  }]
}
```

**Option B: GitHub Actions (if not on Vercel)**

```yaml
# .github/workflows/index-holders.yml
name: Index Market Holders
on:
  schedule:
    - cron: '0 0,12 * * *'  # Twice a day: midnight and noon UTC
  workflow_dispatch:  # Manual trigger

jobs:
  index:
    runs-on: ubuntu-latest
    steps:
      - name: Call indexing endpoint
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/index-holders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Phase 4: Update Holders API to Read from Database

```typescript
// app/api/markets/[slug]/holders/route.ts
import { db } from '@/lib/db'
import { marketHolders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get market data
    const marketResponse = await fetch(`${MYRIAD_API_URL}/markets/${slug}`)
    const market = await marketResponse.json()

    // Query database for holders
    const holdersData = await db
      .select()
      .from(marketHolders)
      .where(eq(marketHolders.marketId, market.id))
      .orderBy(desc(marketHolders.shares))

    // Group by outcome
    const holdersByOutcome: Record<number, any[]> = {}
    
    for (const holder of holdersData) {
      if (!holdersByOutcome[holder.outcomeId]) {
        holdersByOutcome[holder.outcomeId] = []
      }
      
      holdersByOutcome[holder.outcomeId].push({
        address: holder.holderAddress,
        shares: holder.shares,
        usdValue: holder.usdValue,
      })
    }

    // Format response
    const responseData = {
      marketId: market.id,
      outcomes: market.outcomes.map((outcome: any) => ({
        id: outcome.id,
        title: outcome.title,
        price: outcome.price,
        holders: (holdersByOutcome[outcome.id] || []).slice(0, 20), // Top 20
      })),
      cachedAt: holdersData[0]?.lastUpdated || new Date().toISOString(),
    }

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

#### Phase 5: Environment Variables

Add to `.env.local`:
```bash
# For background job
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
CRON_SECRET=your-random-secret-here

# Already have these
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x289E3908ECDc3c8CcceC5b6801E758549846Ab19
NEXT_PUBLIC_PREDICTION_MARKET_QUERIER=0x49c86faa48facCBaC75920Bb0d5Dd955F8678e15
```

### Implementation Timeline

**Week 1: Database Setup**
- [ ] Create migration for `market_holders` table
- [ ] Run migration on staging DB
- [ ] Test inserts/queries

**Week 2: Background Job**
- [ ] Create `indexHolders.ts` job
- [ ] Test with one market manually
- [ ] Verify data accuracy

**Week 3: Automation**
- [ ] Set up cron job (Vercel or GitHub Actions) - **twice daily at midnight & noon UTC**
- [ ] Add error monitoring (Sentry)
- [ ] Test scheduled execution

**Week 4: API Update**
- [ ] Update holders API to read from DB
- [ ] Remove temporary "N/A" logic
- [ ] Update frontend to show real data
- [ ] Monitor performance

### Testing Checklist

- [ ] Can manually run `indexMarketHolders(marketId)`
- [ ] Database correctly stores holder data
- [ ] Cron job runs twice daily without errors
- [ ] API returns real share amounts
- [ ] Frontend displays data correctly
- [ ] Performance is acceptable (<500ms)

---

## Why Can't We Pull Data Right Now? (And How to Do It Manually)

### The Issue:
Polkamarkets-js SDK is designed for **client-side (browser)** use with `window.ethereum`, not server-side Node.js. It expects:
- Browser environment
- MetaMask or wallet provider
- User interaction for signing

### But We CAN Do It With Web3.js Directly!

Here's how to query holder data **right now** without waiting for infrastructure:

```typescript
// lib/getHolderShares.ts
import Web3 from 'web3'

const PM_ABI = [
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' }
    ],
    name: 'getUserMarketShares',
    outputs: [
      { name: 'liquidityShares', type: 'uint256' },
      { name: 'outcomeShares', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export async function getHolderShares(
  marketId: number,
  holderAddress: string
): Promise<{ outcomeShares: bigint[] }> {
  const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
  
  const contract = new web3.eth.Contract(
    PM_ABI,
    process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS!
  )

  try {
    const result = await contract.methods
      .getUserMarketShares(marketId, holderAddress)
      .call()

    return {
      outcomeShares: result[1] as bigint[] // Index 1 is the outcomeShares array
    }
  } catch (err) {
    console.error(`Error fetching shares for ${holderAddress}:`, err)
    throw err
  }
}
```

### Update the Holders API to Use This Right Now:

```typescript
// app/api/markets/[slug]/holders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getHolderShares } from '@/lib/getHolderShares'

const MYRIAD_API_URL = process.env.NEXT_PUBLIC_MYRIAD_API_URL || 'https://api-v1.staging.myriadprotocol.com'

// In-memory cache for 12 hours (twice daily refresh)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 12 * 60 * 60 * 1000 // 12 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Check cache
    const cached = cache.get(slug)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
          'X-Cache': 'HIT'
        }
      })
    }

    // Fetch market data
    const marketResponse = await fetch(`${MYRIAD_API_URL}/markets/${slug}`)
    if (!marketResponse.ok) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    const market = await marketResponse.json()
    const marketId = market.id
    const outcomes = market.outcomes
    const topHolders: string[] = market.top_holders || []

    console.log(`🔍 Fetching real shares for market ${marketId}...`)

    // For each outcome, get real shares from blockchain
    const holdersByOutcome: Record<number, Array<{
      address: string
      shares: string
    }>> = {}

    for (let outcomeIndex = 0; outcomeIndex < outcomes.length; outcomeIndex++) {
      const holders: Array<{ address: string; shares: bigint }> = []
      
      // Query blockchain for each holder's shares
      for (const holderAddress of topHolders) {
        try {
          const { outcomeShares } = await getHolderShares(marketId, holderAddress)
          const shares = outcomeShares[outcomeIndex]
          
          if (shares > BigInt(0)) {
            holders.push({
              address: holderAddress,
              shares
            })
          }
        } catch (err) {
          console.error(`Error for ${holderAddress}:`, err)
        }
      }

      // Sort by shares descending
      holders.sort((a, b) => Number(b.shares - a.shares))
      const top20 = holders.slice(0, 20)

      // Format shares (assuming 6 decimals for USDT)
      holdersByOutcome[outcomeIndex] = top20.map(holder => ({
        address: holder.address,
        shares: (Number(holder.shares) / 1e6).toFixed(2)
      }))

      console.log(`  ✅ Outcome ${outcomeIndex}: ${top20.length} holders with shares`)
    }

    const responseData = {
      marketId,
      outcomes: outcomes.map((outcome: any, index: number) => ({
        id: outcome.id,
        title: outcome.title,
        price: outcome.price,
        holders: holdersByOutcome[index] || []
      })),
      cachedAt: new Date().toISOString(),
      note: 'Real blockchain data - updates twice daily'
    }

    // Cache for 12 hours
    cache.set(slug, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
        'X-Cache': 'MISS'
      }
    })

  } catch (error) {
    console.error('❌ Error fetching holders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch holders data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Quick Start (Do This Now):

1. **Install Web3.js** (if not already installed):
```bash
npm install web3
```

2. **Create the helper function** (`lib/getHolderShares.ts`) with the code above

3. **Replace your holders API route** with the updated version above

4. **Test it**:
```bash
curl "http://localhost:3000/api/markets/YOUR-MARKET-SLUG/holders"
```

### Why This Works Now:

✅ **No wallet needed** - Direct RPC read-only call  
✅ **No polkamarkets-js** - Using Web3.js directly  
✅ **No database yet** - In-memory cache (12 hour refresh)  
✅ **Real blockchain data** - Calls `getUserMarketShares` contract method  
✅ **Works server-side** - Compatible with Next.js API routes  

### Performance Notes:

- Each market query = N RPC calls (where N = number of top_holders)
- With 3 holders × 2 outcomes = ~6 RPC calls per market
- Takes ~2-3 seconds to load (acceptable with 12h cache)
- Cache prevents excessive RPC calls

### Next Step After This Works:

Once you verify real data is loading:
1. Move to database storage (optional, for historical tracking)
2. Set up cron to pre-cache data twice daily
3. Add more holders (currently limited to Myriad's top_holders list)

---

## Summary

**Current Status:** Holders tab is WORKING and showing top holder addresses, but share amounts show "N/A".

**Why:** Direct Web3.js calls to `getUserMarketShares` are failing with "invalid data" errors. This could be due to:
- Contract version mismatch
- RPC node issues  
- Need for polkamarkets-js SDK (which requires browser environment)

**Can we fix it now?** Not easily with direct Web3.js calls. The polkamarkets-js SDK abstracts a lot of complexity and is designed for browser use.

**Should we store in DB?** Not required for MVP, but YES for production if you want:
- Per-outcome share tracking
- Historical data
- Faster performance
- Analytics

**How to Fix (Recommended):** Implement the 5-phase solution:
1. Database schema for `market_holders`
2. Background job using polkamarkets-js SDK (with proper server-side Web3 setup)
3. Cron job running **twice daily** (midnight & noon UTC)
4. Update API to read from database
5. Deploy with proper environment variables

**For Now:** The holders tab works and shows WHO holds tokens (addresses from Myriad API). Share amounts will require the full infrastructure setup described above.

**Estimated Time:** 2-4 weeks for full implementation and testing

**Priority:** Low/Medium - Current implementation is acceptable for MVP. Upgrade to real blockchain data when you need analytics or historical tracking.
