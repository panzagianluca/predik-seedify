# Predik - Prediction Market Application

**Project Overview**: A decentralized prediction market application built on the Celo blockchain, leveraging Myriad and Polkamarkets protocols for on-chain market creation and trading.

**Last Updated**: October 4, 2025

---

## 🎯 Core Concept

Predik is a full-stack TypeScript prediction market platform where users can:
- Browse and discover prediction markets
- Place predictions using on-chain transactions
- Track portfolio performance
- Claim winnings from resolved markets

All prediction markets are deployed on-chain via the Polkamarkets protocol, while market metadata and analytics are fetched from the Myriad API.

---

## 🏗️ Technical Stack

### Frontend Framework
- **Next.js 15** (App Router with React Server Components)
- **React 19** (latest stable)
- **TypeScript** (strict mode)
- **npm** (package manager)

### Blockchain & Web3
- **Blockchain**: Celo (testnet initially, mainnet for production)
- **Web3 Library**: Wagmi + Viem
- **Wallet Connection**: Reown AppKit (formerly Web3Modal) / WalletConnect
  - Supports: Valora, MiniPay, MetaMask, and other WalletConnect-compatible wallets
- **Protocol SDKs**:
  - `polkamarkets-js` - Smart contract interactions (buy/sell shares, claim winnings)
  - Myriad API - Market data, analytics, pricing

-### Database & ORM
- **Database**: PostgreSQL (hosted on Neon — serverless Postgres)
- **ORM**: Drizzle ORM
  - Fast, type-safe, minimal overhead
  - Better performance than Prisma for this use case

### Backend Architecture
- **API Layer**: Next.js Route Handlers (`app/api/**/route.ts`)
- **No Server Actions** (for now) - using traditional API routes for better separation of concerns

### UI & Styling
- **Component Library**: Shadcn UI (base components)
- **Animations**: Animate UI Primitives
  - Installation: `npx shadcn@latest add @animate-ui/primitives-texts-sliding-number`
  - Additional animated components to be added incrementally
- **Styling**: TailwindCSS

### State Management
- **Zustand** - Lightweight global state (wallet state, user preferences, UI state)

### Deployment
- **Hosting**: Vercel
- **Database**: Neon Postgres (serverless, Drizzle)
- **Environment**: Edge-compatible where possible

---

## 🎨 Design System

### Color Palette

```css
/* Primary/Accent */
--electric-purple: #A855F7;

/* Neutrals */
--slate-black: #1C1917;
--soft-white: #F9FAFB;

/* Usage */
Primary Action Buttons: Electric Purple
Background: Slate Black (dark mode) / Soft White (light mode)
Text: Contrast-adjusted based on background
```

### Typography
- System font stack (TailwindCSS defaults)
- Responsive scaling with Tailwind's typography utilities

### Component Philosophy
- Shadcn base components for consistency
- Animate UI for micro-interactions (numbers, state changes, transitions)
- Custom components built on top of Shadcn primitives

---

## 📡 Integration Architecture

### Myriad API Integration
**Base URLs**:
- Staging: `https://api-v1.staging.myriadprotocol.com/`
- Production: `https://api-v1.myriadprotocol.com/`

**Key Endpoints**:
- `GET /markets` - Fetch all markets (with filters: state, token, network_id)
- `GET /markets/:slug` - Fetch single market with full details

**Network ID** (Celo):
- Testnet: `11142220` (Celo Sepolia)
- Mainnet: TBD (Coming soon per API docs)

### Polkamarkets SDK Integration

**Contract Addresses** (Celo Testnet):
- PredictionMarket: `0x289E3908ECDc3c8CcceC5b6801E758549846Ab19`
- PredictionMarketQuerier: `0x49c86faa48facCBaC75920Bb0d5Dd955F8678e15`

**Token** (Celo Testnet):
- USDT: `0xf74B14ecbAdC9fBb283Fb3c8ae11E186856eae6f`

**Key SDK Functions**:
```typescript
// Initialize
const polkamarkets = new polkamarketsjs.Application({
  web3Provider,
  web3EventsProvider,
  web3PrivateKey // optional for wallet bypass
});

// Contract instances
const pm = polkamarkets.getPredictionMarketV3PlusContract({
  contractAddress: '0x289E...',
  querierContractAddress: '0x49c8...'
});

const erc20 = polkamarkets.getERC20Contract({
  contractAddress: '0xf74B...' // USDT
});

// Core Operations
await pm.buy({ marketId, outcomeId, value, minOutcomeSharesToBuy });
await pm.sell({ marketId, outcomeId, value, maxOutcomeSharesToSell });
await pm.claimWinnings({ marketId, wrapped });
await pm.getPortfolio({ user: address });
await pm.getMarketPrices({ marketId });
```

---

## 📁 Project Structure

```
predik/
├── app/                          # Next.js App Router
│   ├── (routes)/                 # Route groups
│   │   ├── page.tsx              # Home/Market listing
│   │   ├── market/[slug]/        # Individual market page
│   │   └── portfolio/            # User portfolio
│   ├── api/                      # API Route Handlers
│   │   ├── markets/route.ts      # Proxy to Myriad API
│   │   └── user/portfolio/route.ts
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Shadcn base components
│   ├── animated/                 # Animate UI components
│   ├── market/                   # Market-specific components
│   └── wallet/                   # Wallet connection components
├── lib/                          # Utilities & configurations
│   ├── polkamarkets/             # SDK wrapper/helpers
│   ├── myriad/                   # API client
│   ├── db/                       # Drizzle schema & migrations
│   ├── wagmi.ts                  # Wagmi configuration
│   └── utils.ts                  # Shared utilities
├── hooks/                        # Custom React hooks
│   ├── useMarkets.ts
│   ├── usePortfolio.ts
│   └── usePolkamarkets.ts
├── stores/                       # Zustand stores
│   ├── walletStore.ts
│   └── uiStore.ts
├── types/                        # TypeScript type definitions
│   ├── market.ts
│   ├── polkamarkets.ts
│   └── api.ts
├── public/                       # Static assets
├── Docs/                         # Documentation
│   ├── Myriad-API.md
│   └── Polkamarkets-SDK.md
├── drizzle/                      # Database migrations
├── .env.local                    # Environment variables
├── drizzle.config.ts             # Drizzle configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

## 🔐 Environment Variables

```bash
# Blockchain
NEXT_PUBLIC_CHAIN_ID=44787                    # Celo Alfajores testnet
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=        # From Reown/WalletConnect

# Smart Contracts (Celo Testnet)
NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS=0x289E3908ECDc3c8CcceC5b6801E758549846Ab19
NEXT_PUBLIC_PREDICTION_MARKET_QUERIER=0x49c86faa48facCBaC75920Bb0d5Dd955F8678e15
NEXT_PUBLIC_USDT_TOKEN_ADDRESS=0xf74B14ecbAdC9fBb283Fb3c8ae11E186856eae6f

# Myriad API
NEXT_PUBLIC_MYRIAD_API_URL=https://api-v1.staging.myriadprotocol.com
NEXT_PUBLIC_MYRIAD_NETWORK_ID=11142220       # Celo testnet

# Database (Neon Postgres — Drizzle)
NEON_DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🚀 Development Workflow

### Initial Setup
```bash
# Install dependencies
npm install

# Initialize Shadcn
npx shadcn@latest init

# Add base components
npx shadcn@latest add button card input label

# Add animated components (as needed)
npx shadcn@latest add @animate-ui/primitives-texts-sliding-number

# Initialize Drizzle
npx drizzle-kit generate
npx drizzle-kit migrate

# Start development server
npm run dev
```

### Key Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 📦 Core Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.x",
    
    "wagmi": "^2.x",
    "viem": "^2.x",
    "@reown/appkit": "^1.x",
    "@reown/appkit-adapter-wagmi": "^1.x",
    
    "polkamarkets-js": "latest",
    
    "drizzle-orm": "^0.33.0",
    "drizzle-kit": "^0.24.0",
    "postgres": "^3.4.0",
    
    "zustand": "^4.x",
    
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    
    "lucide-react": "latest",
    "date-fns": "^3.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^19.x",
    "eslint": "^8.x",
    "eslint-config-next": "^15.x"
  }
}
```

---

## 🎯 Core Features (Planned)

### Phase 1: MVP
- [ ] Market Discovery (browse, filter by state/topic)
- [ ] Market Details (outcomes, prices, volume, liquidity)
- [ ] Wallet Connection (Reown AppKit w/ Celo support)
- [ ] Buy/Sell Shares (via Polkamarkets SDK)
- [ ] Portfolio View (user positions, claim status)
- [ ] Claim Winnings (resolved markets)

### Phase 2: Enhanced UX
- [ ] Real-time price updates
- [ ] Market search & filtering
- [ ] Transaction history
- [ ] Notifications (position updates, market resolutions)

### Phase 3: Advanced Features
- [ ] Propose custom markets; page where users can submit a market and then other users can vote them
- [ ] Social features (comments, likes - if implementing backend for this)

---

## 🔄 Data Flow

### Market Browsing
1. **Client** requests markets from Next.js API route
2. **API Route** fetches from Myriad API (with caching)
3. **Client** renders market cards with Shadcn components
4. **Client** displays real-time prices via Polkamarkets SDK

### Placing a Prediction
1. **User** connects wallet via Reown AppKit
2. **Client** checks ERC20 allowance (`erc20.isApproved()`)
3. **Client** requests approval if needed (`erc20.approve()`)
4. **Client** calculates shares (`pm.calcBuyAmount()`)
5. **Client** executes buy (`pm.buy()`)
6. **Client** updates UI optimistically, confirms on-chain

### Portfolio & Claims
1. **Client** fetches user positions (`pm.getPortfolio()`)
2. **Client** displays claimable markets
3. **User** claims winnings (`pm.claimWinnings()`)
4. **Client** updates portfolio state

---

## 🧪 Testing Strategy

- **Unit Tests**: Utility functions, data transformations
- **Integration Tests**: API routes, SDK wrapper functions
- **E2E Tests**: Critical user flows (connect wallet → buy shares → claim)
- **Wallet Testing**: Test with Valora, MiniPay, MetaMask on Celo testnet

---

## 🚢 Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migrations run on Neon
- [ ] Smart contract addresses verified (mainnet vs testnet)
- [ ] Wallet Connect project ID configured
- [ ] API rate limits considered (caching strategy)
- [ ] Error boundaries implemented
- [ ] Analytics setup (optional)
- [ ] SEO meta tags configured

---

## 📚 Reference Documentation

- **Myriad API**: `/Docs/Myriad-API.md`
- **Polkamarkets SDK**: `/Docs/Polkamarkets-SDK.md`
- **Wagmi Docs**: https://wagmi.sh
- **Viem Docs**: https://viem.sh
- **Reown AppKit**: https://docs.reown.com/appkit
- **Drizzle ORM**: https://orm.drizzle.team
- **Shadcn UI**: https://ui.shadcn.com
- **Animate UI**: https://animate-ui.com

---

## 🤝 Development Principles

1. **Type Safety First**: Leverage TypeScript strictly, no `any` types
2. **Component Reusability**: Build with composition in mind
3. **Performance**: Use RSC where possible, minimize client-side JS
4. **Accessibility**: Follow WCAG guidelines with Shadcn's a11y defaults
5. **Error Handling**: Graceful degradation, clear user feedback
6. **Responsive Design**: Mobile-first approach
7. **Code Organization**: Clear separation of concerns (UI, logic, data)

---

## 🐛 Known Considerations

- **Celo Mainnet**: Polkamarkets contracts "Coming soon" per docs - start with testnet
- **Rate Limiting**: Myriad API may have limits - implement caching strategy
- **Gas Optimization**: Consider batching transactions where possible
- **Wallet Compatibility**: Test thoroughly with Celo-native wallets (Valora, MiniPay)
- **Token Approvals**: Infinite approval vs. per-transaction (security vs. UX trade-off)

---

## 📝 Notes

- This spec serves as the single source of truth for the project
- Update this document as decisions are made and architecture evolves
- Reference this when implementing new features or onboarding contributors
- Keep `/Docs` folder for external documentation (API specs, SDK guides)

---

**Next Steps**: 
1. Initialize Next.js 15 project
2. Setup Drizzle with Neon Postgres
3. Configure Wagmi + Reown AppKit for Celo
4. Implement market browsing (Myriad API integration)
5. Build wallet connection flow
6. Implement buy/sell functionality (Polkamarkets SDK)

---

## 🎨 UI Component & Animation Standards

### Mandatory Component Usage
**ALL UI components MUST use Shadcn UI and Animate UI libraries unless explicitly stated otherwise.**

- **Base Components**: Always use Shadcn UI components as the foundation
- **Animated Components**: Always use Animate UI primitives for enhanced interactions
- **Installation Pattern**: `npx shadcn@latest add @animate-ui/[component-path]`

### Animation & Transition Requirements

**Default Transition Configuration**:
```typescript
transition={{ duration: 0.5, ease: "easeInOut" }}
```

**Implementation Rules**:
1. **ALWAYS apply transitions** to interactive components (tabs, modals, drawers, accordions, etc.)
2. **ALWAYS use available effects** from Animate UI (highlight, auto-height, sliding numbers, etc.)
3. **If a component lacks animation support**: 
   - Stop implementation
   - Ask user which Animate UI primitive to install
   - Install the appropriate component before proceeding
4. **Never ship static components** when animated alternatives exist

### Design System Consistency

**Component Reusability Standards**:
- **Reuse existing components** wherever possible
- **Create variants** instead of new components
- **Maintain consistent styling** across all UI elements
- **Use the same transitions** throughout the application
- **Follow established patterns** for similar interactions

**Style Consistency Checklist**:
- ✅ Same spacing scale (Tailwind defaults)
- ✅ Same color palette (Electric Purple primary)
- ✅ Same border radius values
- ✅ Same transition timings (0.5s easeInOut default)
- ✅ Same animation patterns for similar actions
- ✅ Same hover/focus states
- ✅ Same loading indicators
- ✅ Same error/success feedback patterns

**Design Goals**:
- **Cohesive**: All components feel part of the same system
- **Predictable**: Similar actions have similar visual feedback
- **Polished**: Smooth transitions create premium feel
- **Performant**: Animations enhance UX without sacrificing speed

**Component Development Workflow**:
1. Check if similar component exists → Reuse/extend it
2. Choose appropriate Shadcn + Animate UI combination
3. Apply default transition settings
4. Match existing design tokens (colors, spacing, typography)
5. Test transition smoothness and timing
6. Ensure consistency with other components

**Prohibited Actions**:
- ❌ Using plain HTML elements when Shadcn components exist
- ❌ Skipping animations on interactive components
- ❌ Creating custom components without checking existing ones
- ❌ Using different transition timings without justification
- ❌ Inconsistent styling between similar components
- ❌ Shipping static tabs, modals, or other animated-capable components

---

**Version**: 1.1  
**Last Updated**: October 4, 2025
