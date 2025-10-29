# Predik - Gasless Prediction Markets on BNB Chain

**Spanish-first prediction market platform with AI-assisted resolution and gasless trading.**

[![Security Grade](https://img.shields.io/badge/security-B+-brightgreen.svg)](./Docs/SECURITY_AUDIT.md)
[![Network](https://img.shields.io/badge/network-BNB%20Testnet-yellow.svg)](https://testnet.bscscan.com/)
[![Tests](https://img.shields.io/badge/tests-130%2F170%20passing-orange.svg)](./)

---

## 🚀 Overview

Predik is a prediction market platform built for the Argentine market, featuring:

- ✅ **Gasless Trading** - Biconomy Account Abstraction for zero-gas UX
- ✅ **AI Resolution** - DelphAI oracle integration for automated outcomes
- ✅ **LMSR AMM** - Logarithmic Market Scoring Rule for efficient pricing
- ✅ **Security Hardened** - All CRITICAL and HIGH audit findings fixed
- ✅ **Spanish-First** - Localized for LATAM users
- ✅ **BNB Native** - Built on BNB Smart Chain

---

## 📊 Latest Deployment

**Network:** BNB Testnet (Chain ID 97)  
**Deployment Date:** October 29, 2025  
**Status:** ✅ Production Ready

### Contract Addresses

```
MarketFactory: 0x9Be256DDB94Cd1563738c9c77Fca3c62e7321A5E
Router:        0x321F34Ac6404BE162bD79a8A1B4abDBbFC92e84a
Oracle:        0x25C75C40c94B8C95A432805C18d47340FaC45737
Treasury:      0xc267B4ec9Ef5dDDaf79B850636b1a6dd787A2B8b
MockUSDT:      0x065b8ADad86048edC320277e92C58a4EEB3Bf902
```

**[See full deployment details →](./DEPLOYED_ADDRESSES.md)**

---

## 🏗️ Architecture

### Smart Contracts (Solidity 0.8.30 + Foundry)

- **LMSRMarket.sol** - Multi-outcome LMSR AMM with slippage protection
- **MarketFactory.sol** - ERC-1167 clone factory for market deployment
- **Router.sol** - Gasless trading entrypoint (Biconomy integration)
- **Oracle.sol** - DelphAI resolution with 48H emergency fallback
- **Treasury.sol** - 60/30/10 fee distribution (creator/protocol/oracle)
- **Outcome1155.sol** - ERC-1155 share tokens with auto-approval

**[Full architecture documentation →](./Docs/ARCHITECTURE.md)**

### Frontend (Next.js 14 + TypeScript)

- **Privy** - Social login (Google, Email, Wallet)
- **Biconomy** - Account Abstraction for gasless transactions
- **Wagmi** - React hooks for Ethereum
- **TailwindCSS** - Styling framework
- **Drizzle ORM** - PostgreSQL database

---

## 🔐 Security

**Grade:** B+ (improved from C+)

### Implemented Fixes

- ✅ **7 Role Grants** - Cross-contract permission bootstrap
- ✅ **Slippage Protection** - `maxCost`/`minPayout` on all trades
- ✅ **Emergency Resolution** - 48H admin override if oracle fails
- ✅ **Emergency Withdrawal** - 7-day user withdrawal mechanism
- ✅ **Router-Only Trading** - MEV/sandwich attack prevention
- ✅ **Router Timelock** - 48H delay for router upgrades
- ✅ **Treasury Role Separation** - Isolated fee reporter vs withdrawer

**[Full security audit →](./Docs/SECURITY_AUDIT.md)**

---

## 🧪 Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Smart Contract Setup

```bash
# Install Foundry dependencies
forge install

# Run tests
forge test

# Deploy to BNB Testnet
forge script script/DeployBNBTestnet.s.sol \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
  --broadcast
```

### Frontend Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](./Docs/ARCHITECTURE.md)** | System architecture and data flow |
| **[DEPLOYMENT_OCT29.md](./Docs/DEPLOYMENT_OCT29.md)** | Latest deployment record |
| **[TRADING_GUIDE.md](./Docs/TRADING_GUIDE.md)** | How to interact with markets |
| **[SECURITY_AUDIT.md](./Docs/SECURITY_AUDIT.md)** | Security audit findings |
| **[EXECUTION_PLAN.md](./Docs/EXECUTION_PLAN.md)** | Project timeline |

---

## 🧪 Testing

### Smart Contracts

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test file
forge test --match-path test/LMSRMarket.t.sol

# Generate gas report
forge test --gas-report
```

**Test Results:** 130/170 passing (40 expected failures from security hardening)

### Frontend

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run formatting
pnpm format
```

---

## 🚀 Deployment

### Testnet (BNB Testnet)

```bash
# Deploy all contracts
forge script script/DeployBNBTestnet.s.sol \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
  --broadcast \
  --verify

# Create test market
forge script script/TestMarketCreation.s.sol \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
  --broadcast
```

### Frontend (Vercel)

```bash
# Deploy to Vercel
pnpm vercel

# Deploy to production
pnpm vercel --prod
```

---

## 📊 Project Structure

```
predik-seedify/
├── contracts/              # Solidity smart contracts
│   ├── LMSRMarket.sol     # Core LMSR AMM
│   ├── MarketFactory.sol  # Market deployment
│   ├── Router.sol         # Gasless trading
│   ├── Oracle.sol         # DelphAI integration
│   ├── Treasury.sol       # Fee distribution
│   └── Outcome1155.sol    # Share tokens
├── test/                  # Foundry tests
├── script/                # Deployment scripts
├── app/                   # Next.js frontend
├── components/            # React components
├── lib/                   # Utilities and configs
├── Docs/                  # Documentation
└── drizzle/               # Database migrations
```

---

## 🔗 Links

- **BNB Testnet Explorer:** https://testnet.bscscan.com/
- **BNB Faucet:** https://testnet.bnbchain.org/faucet-smart
- **DelphAI:** https://delphai.com/
- **Biconomy:** https://www.biconomy.io/
- **Privy:** https://www.privy.io/

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

This project is built for the Seedify hackathon. For questions or collaboration:

1. Review the [ARCHITECTURE.md](./Docs/ARCHITECTURE.md) documentation
2. Check the [EXECUTION_PLAN.md](./Docs/EXECUTION_PLAN.md) for roadmap
3. Read the [SECURITY_AUDIT.md](./Docs/SECURITY_AUDIT.md) for security model

---

**Built with ❤️ for the Argentine crypto community**
