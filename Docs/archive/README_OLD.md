# 📚 Predik Seedify Documentation

**Last Updated:** October 25, 2025

## 🎯 Quick Navigation

### **Current Documentation** (Start Here)

| Document | Purpose | Updated |
|----------|---------|---------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | **🏗️ System architecture, contract interfaces, tech stack** | Oct 25, 2025 |
| **[EXECUTION_PLAN.md](./EXECUTION_PLAN.md)** | **📋 Current roadmap and todo list** | Oct 25, 2025 |
| **[DEPLOYMENT_RECORD.md](./DEPLOYMENT_RECORD.md)** | **🚀 Live deployment addresses and configuration** | Oct 25, 2025 |
| **[MARKET_LIST.md](./MARKET_LIST.md)** | **🇦🇷 34 Argentine markets to create** | Oct 25, 2025 |
| **[SUBGRAPH_DEPLOYMENT.md](./SUBGRAPH_DEPLOYMENT.md)** | **📊 The Graph subgraph v1.3 info** | Oct 25, 2025 |
| **[TRADING_GUIDE.md](./TRADING_GUIDE.md)** | **📖 User guide for trading on the platform** | Oct 25, 2025 |

---

## 🏛️ Archive Documentation

Historical documentation preserved for reference:

### **[archive/](./archive/)**
- **[audit/](./archive/audit/)** - Security audit reports from Oct 24
- **[deployment-history/](./archive/deployment-history/)** - Historical deployment process docs
- **[legacy/](./archive/legacy/)** - Pre-migration docs (Myriad API, Polkamarkets SDK)
- **contracts.md** - Legacy contract overview
- **PROJECT_SPEC.md** - Original project specification

---

## 📍 Current System Status

**As of October 25, 2025:**

### **Blockchain Infrastructure**
- **Network:** BNB Smart Chain Testnet Chapel (Chain ID 97)
- **MarketFactory v2:** `0xB8ddC4A144A16eF648d606Bc8041D67a4aDBe04f` (with metadata support)
- **The Graph Subgraph v1.3:** https://api.studio.thegraph.com/query/1704705/predik-seedify/1.3
- **Test Suite:** 170/170 tests passing ✅
- **Vercel Build:** Passing ✅

### **Smart Contracts**
- **LMSRMarket.sol** - Logarithmic Market Scoring Rule implementation
- **MarketFactory.sol** - Market creation with metadata support
- **Oracle.sol** - Market resolution and outcome verification
- **Treasury.sol** - USDT liquidity management
- **Outcome1155.sol** - ERC-1155 outcome token implementation
- **Router.sol** - Multi-market trading interface
- **MockUSDT.sol** - Testnet USDT implementation

### **Frontend Stack**
- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS + shadcn/ui
- **Blockchain:** wagmi + viem
- **Wallet:** Privy (email + social login)
- **Gasless Transactions:** Biconomy Account Abstraction

---

## 🔄 Recent Changes

### **October 25, 2025 - Metadata Upgrade & Build Fixes**
- ✅ Deployed MarketFactory v2 with metadata support (title, description, category, imageUrl)
- ✅ Deployed The Graph Subgraph v1.3 with metadata indexing
- ✅ Fixed all Vercel TypeScript build errors
- ✅ Regenerated all 7 contract ABIs from deployed artifacts
- ✅ Created automated ABI generation script (`scripts/generate-abis.sh`)
- ✅ Updated contract query functions for new signatures
- ✅ Applied `forge fmt` formatting to all Solidity files
- ⚠️ **Temporarily disabled trading UI** (uses old Polkamarkets SDK, needs rewrite)

### **Documentation Reorganization**
- Created archive structure for historical docs
- Moved 7 legacy docs (Myriad, Polkamarkets, mobile, analytics) to `archive/legacy/`
- Moved 3 audit docs to `archive/audit/`
- Moved 8 deployment history docs to `archive/deployment-history/`
- Kept 6 current docs in main `Docs/` folder

---

## 🚀 Next Steps

### **Immediate Priorities**
1. **Create Argentine Markets** - Run `script/SeedArgentineMarkets.s.sol` to create 34 test markets
2. **Update Markets API** - Query The Graph instead of on-chain calls
3. **Display Metadata** - Show description, category, and imageUrl in UI
4. **Re-enable Trading UI** - Create new hooks for LMSRMarket contract

### **Later Tasks**
- Migrate to BNB Smart Chain Mainnet
- Implement market resolution with Oracle
- Add leaderboard and user profiles
- Launch DelphAI integration

---

## 📖 Documentation Guidelines

### **When to Update Each Document:**

- **ARCHITECTURE.md** - When adding/removing contracts, changing tech stack, or major system changes
- **EXECUTION_PLAN.md** - Daily/weekly roadmap updates, todo list management
- **DEPLOYMENT_RECORD.md** - Every contract deployment or configuration change
- **MARKET_LIST.md** - When adding new market ideas or categories
- **SUBGRAPH_DEPLOYMENT.md** - When updating subgraph schema or deploying new version
- **TRADING_GUIDE.md** - When UI/UX changes affect user trading flow

### **Creating New Documentation:**
1. Add "Last Updated" header with date
2. Use clear markdown structure (H2 for sections, H3 for subsections)
3. Include code examples where relevant
4. Link to related documentation
5. Update this README with the new document

### **Archiving Documentation:**
- Move outdated docs to appropriate `archive/` subfolder
- Add a note in this README about what was archived and why
- Keep archive docs for historical reference (don't delete)

---

## 🛠️ Useful Commands

```bash
# Run all tests
forge test

# Generate ABIs from compiled contracts
./scripts/generate-abis.sh

# Build frontend
npm run build

# Deploy contracts to testnet
forge script script/DeployBNBTestnet.s.sol --rpc-url $BNB_TESTNET_RPC --broadcast

# Deploy subgraph
cd subgraph && graph deploy --studio predik-seedify
```

---

## 📞 Support & Resources

- **The Graph Dashboard:** https://thegraph.com/studio/subgraph/predik-seedify
- **BNB Testnet Explorer:** https://testnet.bscscan.com
- **Vercel Dashboard:** https://vercel.com/panzas-projects
- **GitHub Repository:** https://github.com/[your-username]/predik-seedify

---

**For questions or issues, check the [archive/deployment-history/](./archive/deployment-history/) folder for troubleshooting guides.**
