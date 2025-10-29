# Predik Documentation# 📚 Predik Seedify Documentation



**Last Updated:** October 29, 2025  **Last Updated:** October 25, 2025

**Status:** Production Ready (BNB Testnet)

## 🎯 Quick Navigation

---

### **Current Documentation** (Start Here)

## 📚 Documentation Index

| Document | Purpose | Updated |

### 🚀 Getting Started|----------|---------|---------|

| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | **🏗️ System architecture, contract interfaces, tech stack** | Oct 25, 2025 |

| Document | Description | Status || **[EXECUTION_PLAN.md](./EXECUTION_PLAN.md)** | **📋 Current roadmap and todo list** | Oct 25, 2025 |

|----------|-------------|--------|| **[DEPLOYMENT_RECORD.md](./DEPLOYMENT_RECORD.md)** | **🚀 Live deployment addresses and configuration** | Oct 25, 2025 |

| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Complete system architecture, technology stack, data flow | ✅ Current || **[MARKET_LIST.md](./MARKET_LIST.md)** | **🇦🇷 34 Argentine markets to create** | Oct 25, 2025 |

| **[DEPLOYMENT_OCT29.md](./DEPLOYMENT_OCT29.md)** | Latest deployment record with security fixes | ✅ Current || **[SUBGRAPH_DEPLOYMENT.md](./SUBGRAPH_DEPLOYMENT.md)** | **📊 The Graph subgraph v1.3 info** | Oct 25, 2025 |

| **[TRADING_GUIDE.md](./TRADING_GUIDE.md)** | How to interact with LMSR markets (buy/sell/redeem) | ✅ Current || **[TRADING_GUIDE.md](./TRADING_GUIDE.md)** | **📖 User guide for trading on the platform** | Oct 25, 2025 |



### 🔐 Security---



| Document | Description | Status |## 🏛️ Archive Documentation

|----------|-------------|--------|

| **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** | External security audit findings and fixes | ✅ Current |Historical documentation preserved for reference:



### 📋 Planning & Execution### **[archive/](./archive/)**

- **[audit/](./archive/audit/)** - Security audit reports from Oct 24

| Document | Description | Status |- **[deployment-history/](./archive/deployment-history/)** - Historical deployment process docs

|----------|-------------|--------|- **[legacy/](./archive/legacy/)** - Pre-migration docs (Myriad API, Polkamarkets SDK)

| **[EXECUTION_PLAN.md](./EXECUTION_PLAN.md)** | Hackathon timeline and phase breakdown | ✅ Updated Oct 29 |- **contracts.md** - Legacy contract overview

| **[MARKET_LIST.md](./MARKET_LIST.md)** | Argentine prediction markets to seed | ✅ Current |- **PROJECT_SPEC.md** - Original project specification



### 🗄️ Archive---



| Document | Description |## 📍 Current System Status

|----------|-------------|

| **[archive/audit/](./archive/audit/)** | Previous security audits (original with FALSE POSITIVE) |**As of October 25, 2025:**

| **[archive/deployment-history/](./archive/deployment-history/)** | Deployment records from Oct 24-25 |

| **[archive/legacy/](./archive/legacy/)** | Legacy documentation from Myriad/Polkamarkets integration |### **Blockchain Infrastructure**

- **Network:** BNB Smart Chain Testnet Chapel (Chain ID 97)

---- **MarketFactory v2:** `0xB8ddC4A144A16eF648d606Bc8041D67a4aDBe04f` (with metadata support)

- **The Graph Subgraph v1.3:** https://api.studio.thegraph.com/query/1704705/predik-seedify/1.3

## 🔄 Quick Reference- **Test Suite:** 170/170 tests passing ✅

- **Vercel Build:** Passing ✅

### Latest Deployment (October 29, 2025)

### **Smart Contracts**

**Network:** BNB Testnet (Chain ID 97)  - **LMSRMarket.sol** - Logarithmic Market Scoring Rule implementation

**Security Grade:** B+ (with all CRITICAL/HIGH fixes)- **MarketFactory.sol** - Market creation with metadata support

- **Oracle.sol** - Market resolution and outcome verification

**Contract Addresses:**- **Treasury.sol** - USDT liquidity management

```- **Outcome1155.sol** - ERC-1155 outcome token implementation

MarketFactory: 0x9Be256DDB94Cd1563738c9c77Fca3c62e7321A5E- **Router.sol** - Multi-market trading interface

MockUSDT:      0x065b8ADad86048edC320277e92C58a4EEB3Bf902- **MockUSDT.sol** - Testnet USDT implementation

Outcome1155:   0xB5c0e214F8D3f3f1DA4897418AC4C4458ee420c0

Router:        0x321F34Ac6404BE162bD79a8A1B4abDBbFC92e84a### **Frontend Stack**

Treasury:      0xc267B4ec9Ef5dDDaf79B850636b1a6dd787A2B8b- **Framework:** Next.js 14 with App Router

Oracle:        0x25C75C40c94B8C95A432805C18d47340FaC45737- **Styling:** Tailwind CSS + shadcn/ui

```- **Blockchain:** wagmi + viem

- **Wallet:** Privy (email + social login)

**First Market:**- **Gasless Transactions:** Biconomy Account Abstraction

```

Market ID: 0---

Address:   0xD4646283c2e5A686AdD3E74E920F3dfB906116E0

Question:  "Will Bitcoin reach $100,000 by end of 2025?"## 🔄 Recent Changes

```

### **October 25, 2025 - Metadata Upgrade & Build Fixes**

---- ✅ Deployed MarketFactory v2 with metadata support (title, description, category, imageUrl)

- ✅ Deployed The Graph Subgraph v1.3 with metadata indexing

## 🔑 Key Security Features- ✅ Fixed all Vercel TypeScript build errors

- ✅ Regenerated all 7 contract ABIs from deployed artifacts

This deployment includes comprehensive security hardening:- ✅ Created automated ABI generation script (`scripts/generate-abis.sh`)

- ✅ Updated contract query functions for new signatures

- ✅ **Role Bootstrap:** 7 role grants for cross-contract permissions- ✅ Applied `forge fmt` formatting to all Solidity files

- ✅ **Slippage Protection:** `maxCost`/`minPayout` on all trades- ⚠️ **Temporarily disabled trading UI** (uses old Polkamarkets SDK, needs rewrite)

- ✅ **Emergency Resolution:** 48H admin override if oracle fails

- ✅ **Emergency Withdrawal:** 7-day user withdrawal if market stuck### **Documentation Reorganization**

- ✅ **Router-Only Trading:** Direct market calls blocked (MEV protection)- Created archive structure for historical docs

- ✅ **Router Timelock:** 48H delay for router upgrades- Moved 7 legacy docs (Myriad, Polkamarkets, mobile, analytics) to `archive/legacy/`

- ✅ **Treasury Roles:** Separate FEE_REPORTER vs FEE_WITHDRAWER- Moved 3 audit docs to `archive/audit/`

- Moved 8 deployment history docs to `archive/deployment-history/`

---- Kept 6 current docs in main `Docs/` folder



## 📖 Reading Guide---



### For Developers## 🚀 Next Steps



1. Start with **ARCHITECTURE.md** to understand the system### **Immediate Priorities**

2. Review **DEPLOYMENT_OCT29.md** for deployment details1. **Create Argentine Markets** - Run `script/SeedArgentineMarkets.s.sol` to create 34 test markets

3. Use **TRADING_GUIDE.md** for contract interaction2. **Update Markets API** - Query The Graph instead of on-chain calls

4. Check **SECURITY_AUDIT.md** to understand security model3. **Display Metadata** - Show description, category, and imageUrl in UI

4. **Re-enable Trading UI** - Create new hooks for LMSRMarket contract

### For Auditors

### **Later Tasks**

1. Read **SECURITY_AUDIT.md** for all findings and fixes- Migrate to BNB Smart Chain Mainnet

2. Review **DEPLOYMENT_OCT29.md** for implementation verification- Implement market resolution with Oracle

3. Check contract source code in `contracts/` directory- Add leaderboard and user profiles

4. Review test suite in `test/` directory (130/170 passing)- Launch DelphAI integration



### For Product/Business---



1. Start with **EXECUTION_PLAN.md** for timeline and milestones## 📖 Documentation Guidelines

2. Review **MARKET_LIST.md** for content strategy

3. Check **ARCHITECTURE.md** sections on fee structure and UX### **When to Update Each Document:**



---- **ARCHITECTURE.md** - When adding/removing contracts, changing tech stack, or major system changes

- **EXECUTION_PLAN.md** - Daily/weekly roadmap updates, todo list management

## 🔄 Document Versioning- **DEPLOYMENT_RECORD.md** - Every contract deployment or configuration change

- **MARKET_LIST.md** - When adding new market ideas or categories

### Current (October 29, 2025)- **SUBGRAPH_DEPLOYMENT.md** - When updating subgraph schema or deploying new version

- All docs updated with latest deployment addresses- **TRADING_GUIDE.md** - When UI/UX changes affect user trading flow

- Security audit includes all CRITICAL/HIGH fixes

- Trading guide updated with slippage protection### **Creating New Documentation:**

- Execution plan reflects Phase 1.6 completion1. Add "Last Updated" header with date

2. Use clear markdown structure (H2 for sections, H3 for subsections)

### Archived3. Include code examples where relevant

- Oct 24-25 deployments moved to `archive/deployment-history/`4. Link to related documentation

- Original security audit (with FALSE POSITIVE) in `archive/audit/`5. Update this README with the new document

- Legacy Myriad/Polkamarkets docs in `archive/legacy/`

### **Archiving Documentation:**

---- Move outdated docs to appropriate `archive/` subfolder

- Add a note in this README about what was archived and why

## 📝 Contributing- Keep archive docs for historical reference (don't delete)



When updating documentation:---



1. **Update date** in document header## 🛠️ Useful Commands

2. **Mark status** (✅ Current, ⏳ In Progress, ❌ Deprecated)

3. **Archive old versions** to appropriate archive folder```bash

4. **Update this README** with changes# Run all tests

5. **Commit with clear message** (e.g., "docs: update deployment addresses for Oct 29")forge test



---# Generate ABIs from compiled contracts

./scripts/generate-abis.sh

## 🔗 External Resources

# Build frontend

- **BNB Testnet Explorer:** https://testnet.bscscan.com/npm run build

- **BNB Faucet:** https://testnet.bnbchain.org/faucet-smart

- **DelphAI Oracle:** https://delphai.com/# Deploy contracts to testnet

- **Biconomy Dashboard:** https://dashboard.biconomy.io/forge script script/DeployBNBTestnet.s.sol --rpc-url $BNB_TESTNET_RPC --broadcast

- **Privy Dashboard:** https://dashboard.privy.io/

# Deploy subgraph

---cd subgraph && graph deploy --studio predik-seedify

```

## 📧 Contact

---

For questions about the documentation:

- Check existing docs first## 📞 Support & Resources

- Review archived docs if looking for historical info

- Refer to contract code in `contracts/` for technical details- **The Graph Dashboard:** https://thegraph.com/studio/subgraph/predik-seedify

- **BNB Testnet Explorer:** https://testnet.bscscan.com

**Last Review:** October 29, 2025  - **Vercel Dashboard:** https://vercel.com/panzas-projects

**Next Review:** After hackathon submission- **GitHub Repository:** https://github.com/[your-username]/predik-seedify


---

**For questions or issues, check the [archive/deployment-history/](./archive/deployment-history/) folder for troubleshooting guides.**
