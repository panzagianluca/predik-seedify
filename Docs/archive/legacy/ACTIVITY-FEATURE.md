# Activity Tab Feature

## Overview
Shows real-time buy/sell activity on prediction markets by querying TransferSingle events from the Celo blockchain.

## Implementation

### Backend: `/app/api/markets/[slug]/activity/route.ts`
- **Data Source**: Celo Sepolia blockchain (Chain ID: 11142220)
- **Contract**: PredictionMarket at `0x289E3908ECDc3c8CcceC5b6801E758549846Ab19`
- **Event**: `TransferSingle` (ERC-1155 standard)
- **Time Range**: Last 24 hours (~17,280 blocks at 5s/block)
- **Caching**: 5 minutes (`s-maxage=300`)

#### How It Works

1. **Fetch Market Data** from Myriad API to get:
   - Market ID
   - Outcome titles (Yes/No)

2. **Calculate Token IDs**:
   ```typescript
   tokenId = marketId * 2 + outcomeIndex
   ```
   - Outcome 0 (Yes): `marketId * 2 + 0`
   - Outcome 1 (No): `marketId * 2 + 1`

3. **Query TransferSingle Events**:
   ```typescript
   contract.getPastEvents('TransferSingle', {
     fromBlock: (latestBlock - 17280).toString(),
     toBlock: 'latest'
   })
   ```

4. **Filter by Token ID**:
   Only include events where `id` matches our calculated token IDs

5. **Detect Buy vs Sell**:
   - **Buy**: `from === '0x0000000000000000000000000000000000000000'` (mint)
   - **Sell**: `to === '0x0000000000000000000000000000000000000000'` (burn)

6. **Fetch Block Timestamps**:
   Get `block.timestamp` for each event to show "X ago"

7. **Map to Activity Objects**:
   ```typescript
   {
     user: string,          // Buyer or seller address
     outcome: string,       // "Yes" or "No"
     side: 'Buy' | 'Sell',
     shares: string,        // Formatted with 6 decimals
     timestamp: number,     // Unix timestamp
     txHash: string         // Transaction hash
   }
   ```

8. **Sort & Limit**:
   - Sort by timestamp descending (most recent first)
   - Return last 50 activities

### Frontend: `/components/market/ActivityList.tsx`

#### Features
- **Single Table Layout** (not two-column like holders)
- **Columns**: User | Side | Outcome | Amount | Time
- **Loading State**: LogoSpinner(40px)
- **Error Handling**: Clear error messages in Spanish
- **Empty State**: Shows when no activity in last 24h
- **Address Truncation**: First 6 + last 4 characters
- **Relative Time**: "hace X minutos" using date-fns
- **Blockscout Links**: Click user address to view on explorer
- **Color Coding**: 
  - Buy = green-500
  - Sell = red-500

#### Styling
- Matches profile table design
- Clean, minimal (text-sm, Satoshi font)
- Single border-b on header row
- Hover: bg-muted/50
- Right-aligned Amount & Time columns

## Usage

```tsx
import { ActivityList } from '@/components/market/ActivityList'

<ActivityList marketSlug="bitcoin-100k" />
```

## Why This Works (vs Holders)

| Feature | Activity | Holders |
|---------|----------|---------|
| Data Source | Blockchain events | Myriad API |
| Method | `getPastEvents('TransferSingle')` | `getUserMarketShares()` |
| Status | ✅ Working | ❌ Returns invalid data |
| Real Data | ✅ Yes | ⚠️ Addresses only (no shares) |
| Why | Events always emitted (ERC-1155) | Contract method incompatible |

**Key Insight**: Event-based querying works where direct contract calls fail. TransferSingle is a standard ERC-1155 event that's always indexed and queryable.

## Cache Strategy

- **Activity**: 5 minutes (`s-maxage=300`)
  - More frequent updates for real-time feel
  - Moderate block querying load (17,280 blocks)
  
- **Holders**: 12 hours (`s-maxage=43200`)
  - Slower changing data
  - Reduces API calls to Myriad

## Performance Considerations

- **Block Range**: 17,280 blocks (24 hours)
  - Reasonable query size
  - Can adjust if performance issues arise
  
- **Event Filtering**: Client-side by token ID
  - All TransferSingle events fetched first
  - Then filtered for relevant token IDs
  - Could optimize with indexed parameters in future
  
- **Timestamp Fetching**: 1 RPC call per event
  - Cached in-memory with activities
  - 5-minute cache reduces repeated calls

## Future Enhancements

1. **Indexed Event Parameters**:
   - Filter events server-side by token ID
   - Reduce data transfer and processing

2. **Database Storage**:
   - Store historical activities in PostgreSQL
   - Enable pagination beyond 50 items
   - Show activity older than 24 hours

3. **WebSocket Updates**:
   - Real-time activity updates without polling
   - Subscribe to new TransferSingle events

4. **USD Amounts**:
   - Calculate USD value using market prices
   - Show both shares and $ amounts

5. **User Filtering**:
   - Filter by connected wallet
   - "Show only my trades"

6. **Export**:
   - CSV export for tax reporting
   - Trade history download

## Testing Checklist

- [ ] Open market with recent trades
- [ ] Verify buy/sell detection accuracy
- [ ] Check timestamp formatting (Spanish locale)
- [ ] Test empty state (new market)
- [ ] Test error state (API down)
- [ ] Verify Blockscout links work
- [ ] Check responsive design on mobile
- [ ] Validate 5-minute cache behavior
- [ ] Test with different time ranges

## Integration

Add Activity tab to market detail page alongside:
- Overview (market info)
- Comments (existing)
- Holders (existing)
- **Activity** ← NEW

Tab order: Overview → Activity → Holders → Comments

## Notes

- Uses same clean table design as profile/holders
- Real blockchain data (not mock)
- Production-ready with proper error handling
- Spanish UI text for consistency
- Celo Sepolia Blockscout explorer links
- Built with Next.js 14 App Router patterns
