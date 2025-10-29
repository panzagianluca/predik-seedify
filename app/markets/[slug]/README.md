# Market Detail Page

## Route Structure
- **Path**: `/markets/[slug]`
- **Dynamic Route**: Uses market slug for SEO-friendly URLs
- **Example**: `/markets/bitcoin-price-2024`

## Layout Overview

### Container
- Uses `max-w-7xl mx-auto px-4` - same as navbar for perfect alignment
- NO extra padding - elements align with navbar edges
- Responsive grid layout

### Structure

```
┌─────────────────────────────────────────────────────────┐
│  MARKET HEADER                                          │
│  - Banner Image (optional)                              │
│  - Title + Image                                        │
│  - Badges (State, Verified, Category)                   │
│  - Metadata (Close date, Traders, Volume)               │
└─────────────────────────────────────────────────────────┘

┌────────────────────────────┬────────────────────────────┐
│  LEFT COLUMN (70%)         │  RIGHT COLUMN (30% Sticky) │
│                            │                            │
│  ┌──────────────────────┐  │  ┌──────────────────────┐  │
│  │  PROBABILITY CHART   │  │  │  TRADING PANEL       │  │
│  │  - Timeframe picker  │  │  │  - Buy/Sell          │  │
│  │  - Interactive chart │  │  │  - Outcome select    │  │
│  └──────────────────────┘  │  │  - Amount input      │  │
│                            │  │  - Execute trade     │  │
│  ┌──────────────────────┐  │  └──────────────────────┘  │
│  │  TABS                │  │                            │
│  │  • Acerca de         │  │  ┌──────────────────────┐  │
│  │  • Comentarios       │  │  │  MARKET STATS        │  │
│  │  • Holders           │  │  │  - Liquidity         │  │
│  │  • Actividad         │  │  │  - Volume            │  │
│  └──────────────────────┘  │  │  - Traders           │  │
│                            │  │  - Fees              │  │
│                            │  │  - Current Outcomes  │  │
│                            │  └──────────────────────┘  │
│                            │                            │
│                            │  ┌──────────────────────┐  │
│                            │  │  RELATED MARKETS     │  │
│                            │  │  (if available)      │  │
│                            │  └──────────────────────┘  │
└────────────────────────────┴────────────────────────────┘
```

## Components Used

### ✅ Reusable Components
1. **ProbabilityChart** (`/components/market/ProbabilityChart.tsx`)
   - Shows price trends over time
   - Timeframe selector: 24h, 7d, 30d, all
   - Animated tooltips
   - Pulsing dots at current values

2. **TradingPanel** (`/components/market/TradingPanel.tsx`)
   - Buy/Sell functionality
   - Real-time calculations
   - User position display
   - Trade execution

3. **MarketCard** (`/components/market/MarketCard.tsx`)
   - Used for related markets
   - Compact market preview

### 📋 Tabs Structure

#### 1. **Acerca de (About)**
- Full market description
- Resolution source with external link
- Market details (created, expires, token, fee)

#### 2. **Comentarios (Comments)**
- Placeholder for infinite scroll comments
- Shows comment count from API
- **TODO**: Implement lazy loading

#### 3. **Holders**
- Top 20 holders per outcome
- **TODO**: Fetch on-chain data
  - Option 1: Event logs from blockchain
  - Option 2: Subgraph/indexer
  - Option 3: Check if Myriad API provides this

#### 4. **Actividad (Activity)**
- Recent market trades/transactions
- **TODO**: Implement infinite scroll with lazy loading

## Features

### ✅ Implemented
- [x] Dynamic route with slug
- [x] Market data fetching
- [x] Responsive 2-column layout
- [x] Probability chart with timeframes
- [x] Trading panel integration
- [x] Market stats display
- [x] Related markets (if available)
- [x] State badges (open/closed/resolved)
- [x] Verified badge
- [x] Banner and image display
- [x] Time remaining calculator

### 🚧 TODO
- [ ] Infinite scroll for comments
- [ ] Infinite scroll for activity
- [ ] Holders data (on-chain)
- [ ] Social sharing functionality
- [ ] Like/favorite functionality
- [ ] Vote up/down functionality
- [ ] SEO meta tags
- [ ] Breadcrumbs navigation

## Data Flow

```typescript
1. Load market by slug: fetchMarket(slug)
2. Display market data in components
3. Pass to TradingPanel: market, address, isConnected
4. Pass to Chart: outcomes with price_charts
5. On trade complete: reload market data
```

## Responsive Behavior

**Desktop (≥1024px)**
- 70/30 split
- Right column sticky

**Tablet (768-1023px)**
- 70/30 split
- Reduced spacing

**Mobile (<768px)**
- Single column stack
- Trading panel first
- Chart below
- Tabs at bottom

## State Indicators

- **Open**: Green badge with clock icon
- **Closed**: Orange badge with X icon
- **Resolved**: Blue badge with check icon
- **Verified**: Purple badge with check icon

## Notes on Holders Feature

### Potential Implementation Approaches:

1. **Blockchain Event Logs**
   - Listen to `Buy`, `Sell`, `Transfer` events
   - Track all addresses that interacted
   - Query shares for each address
   - **Pros**: Most accurate, real-time
   - **Cons**: Requires indexing service

2. **Subgraph/Indexer**
   - Use The Graph or similar
   - Pre-indexed on-chain data
   - **Pros**: Fast queries, historical data
   - **Cons**: Need to set up subgraph

3. **Myriad API**
   - Check if API provides holders data
   - **Pros**: Easiest if available
   - **Cons**: May not exist

4. **Manual Contract Queries**
   - Get all historical transactions
   - Extract unique addresses
   - Query shares for each
   - **Pros**: No external service needed
   - **Cons**: Slow, expensive

**Recommendation**: Start with checking Myriad API, then consider subgraph for production.

## Performance Considerations

- Lazy load images
- Dynamic imports for heavy components
- Infinite scroll for lists (prevents large initial loads)
- Cache market data (30s revalidation)
- Sticky sidebar only on desktop

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation
- Focus states
- Screen reader support
