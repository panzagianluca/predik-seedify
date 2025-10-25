# BNB Testnet Deployment Record

**Network:** BNB Smart Chain Testnet (Chain ID 97)  
**RPC:** https://data-seed-prebsc-1-s1.binance.org:8545/  
**Explorer:** https://testnet.bscscan.com/  
**Deployment Date:** October 24-25, 2025

---

## 📋 Deployed Contracts

### Core System Contracts

| Contract | Address | Verified | Deployment Block |
|----------|---------|----------|------------------|
| **MarketFactory** | `0x5c4850878F222aC16d5ab60204997b904Fe4019A` | ✅ Yes | 70061363 |
| **MockUSDT** | `0x4410355e143112e0619f822fC9Ecf92AaBd01b63` | ✅ Yes | 70061363 |
| **Outcome1155** | `0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29` | ✅ Yes | 70061363 |
| **Router** | `0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991` | ✅ Yes | 70061363 |
| **Treasury** | `0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1` | ✅ Yes | 70061363 |
| **Oracle** | `0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4` | ✅ Yes | 70061363 |

### Market Instances

| Market ID | Address | Question | Creator |
|-----------|---------|----------|---------|
| 0 | `0x2935645910f2773dc3f76A2Ec38594344618CF28` | "Will Bitcoin reach $100,000 by end of 2025?" | `0x5e310BA9A20FFf37a8E8962789B7B459f511E7d2` |

---

## 🔐 Access Control Configuration

### Initial Deployment Permissions

All contracts were deployed with the following admin roles granted during deployment:

**Deployer Address:** `0x5e310BA9A20FFf37a8E8962789B7B459f511E7d2`

**MarketFactory Admin Roles (from deployment script):**
- ✅ `Treasury` - DEFAULT_ADMIN_ROLE granted to MarketFactory
- ✅ `Oracle` - DEFAULT_ADMIN_ROLE granted to MarketFactory

**Post-Deployment Permission Fixes:**

Two critical permissions were missing from the initial deployment and had to be granted manually:

#### Fix #1: Outcome1155 Admin Role Grant

**Transaction:** `0xa439c556b6b2237d085621ac47f3b5c7a32e274a9c935d88855fe3a21acc85be`  
**Block:** 70062203  
**Gas Used:** 50,875  
**Action:** Granted DEFAULT_ADMIN_ROLE to MarketFactory on Outcome1155  

```bash
cast send 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29 \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
```

**Event Emitted:**
```solidity
RoleGranted(
  role: 0x0000000000000000000000000000000000000000000000000000000000000000,
  account: 0x5c4850878F222aC16d5ab60204997b904Fe4019A,
  sender: 0x5e310BA9A20FFf37a8E8962789B7B459f511E7d2
)
```

#### Fix #2: Router Admin Role Grant

**Transaction:** `0x6300c3c40e4e12c231a7c68e78dabcb0acb877eb745d9d15e5541ea5ef64835b`  
**Block:** 70062257  
**Gas Used:** 50,862  
**Action:** Granted DEFAULT_ADMIN_ROLE to MarketFactory on Router

```bash
cast send 0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991 \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
```

**Event Emitted:**
```solidity
RoleGranted(
  role: 0x0000000000000000000000000000000000000000000000000000000000000000,
  account: 0x5c4850878F222aC16d5ab60204997b904Fe4019A,
  sender: 0x5e310BA9A20FFf37a8E8962789B7B459f511E7d2
)
```

### Current Permission State

**MarketFactory has DEFAULT_ADMIN_ROLE on:**
- ✅ Outcome1155 (required to grant MINTER_BURNER_ROLE to markets)
- ✅ Router (required to register markets)
- ✅ Treasury (required to register markets)
- ✅ Oracle (required to register markets)

**Verification Commands:**
```bash
# Check Outcome1155
cast call 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29 \
  "hasRole(bytes32,address)(bool)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: true ✅

# Check Router
cast call 0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991 \
  "hasRole(bytes32,address)(bool)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: true ✅

# Check Treasury
cast call 0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1 \
  "hasRole(bytes32,address)(bool)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: true ✅

# Check Oracle
cast call 0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4 \
  "hasRole(bytes32,address)(bool)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: true ✅
```

---

## 🧪 Market Creation Test

### Test Market Details

**Script:** `script/TestMarketCreation.s.sol`  
**Execution:** October 25, 2025

**Market Parameters:**
- **Question:** "Will Bitcoin reach $100,000 by end of 2025?"
- **Outcomes:** ["Yes", "No"]
- **Trading Ends:** 30 days from creation (Unix timestamp: 1763985115)
- **Initial Liquidity:** 1,000 USDT (1000 × 10^6)
- **Liquidity Parameter:** 0 (use default: 1000 × 10^18)
- **Fees:** Default (0, 0, 0 → 1% protocol, 0.5% creator, 0.25% oracle)

### Test Transactions

| Step | Transaction Hash | Gas Used | Block | Status |
|------|-----------------|----------|-------|--------|
| 1. Mint USDT | `0x37a62dc33586c0459dfcbf635e6da68c7bf80e6a1c0b147180fd50fe4b80df44` | 36,080 | 70062644 | ✅ Success |
| 2. Approve USDT | `0x631ff01f251d33cb568cf3dccf45451b271e7e846a27df66206a3983ea2a1a33` | 46,283 | 70062644 | ✅ Success |
| 3. Create Market | `0x79bea2dfa6d83bf44ac969f943956ed451a626161d5255c9e2b3cf6fa824589d` | 2,843,804 | 70062644 | ✅ Success |

**Total Gas Cost:** 0.000292617 BNB (~$0.16 at current prices)

### On-Chain Verification

**Market ID:** 0  
**Market Address:** `0x2935645910f2773dc3f76A2Ec38594344618CF28`  
**BSCScan Link:** https://testnet.bscscan.com/address/0x2935645910f2773dc3f76A2Ec38594344618CF28

**Verification Queries:**
```bash
# Get market count
cast call 0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  "getMarketCount()(uint256)" \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: 1 ✅

# Get all markets
cast call 0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  "getAllMarkets()(address[])" \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: [0x2935645910f2773dc3f76A2Ec38594344618CF28] ✅

# Get outcome count
cast call 0x2935645910f2773dc3f76A2Ec38594344618CF28 \
  "outcomeCount()(uint256)" \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: 2 ✅

# Get price for outcome 0 (Yes)
cast call 0x2935645910f2773dc3f76A2Ec38594344618CF28 \
  "getPrice(uint8)(uint256)" 0 \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: 501249997395839843 (50.12% after trades) ✅

# Get price for outcome 1 (No)
cast call 0x2935645910f2773dc3f76A2Ec38594344618CF28 \
  "getPrice(uint8)(uint256)" 1 \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Returns: 498750002604160156 (49.88% after trades) ✅
```

**Results:**
- ✅ Market successfully created
- ✅ Market registered in factory
- ✅ 2 outcomes configured
- ✅ Initial prices were 50/50 (equal probability)
- ✅ **Trading successfully executed** (prices now 50.12/49.88)
- ✅ Market address matches expected pattern
- ✅ All contract calls execute successfully

---

## 🔄 Trading Test Results

### Test Trades Executed (October 25, 2025)

**Script:** `script/TestTrade.s.sol`  
**Market:** `0x2935645910f2773dc3f76A2Ec38594344618CF28`

#### Trade 1: Buy Shares

**Parameters:**
- Shares purchased: 10 (10 × 10^18)
- Outcome: 0 (Yes)
- Trade cost: 5 USDT
- Fees: 0.087 USDT
- Total paid: 5.087 USDT

**Transaction:** `0x9ab49902b31d544baa52df1344d889d916db2651f12d6fa9a8800e915bbc177a`  
**Block:** 70064430  
**Gas Used:** 166,896  
**Status:** ✅ Success

**Price Impact:**
- Before: 50.00% (Yes) / 50.00% (No)
- After: 50.12% (Yes) / 49.88% (No)

#### Trade 2: Sell Shares

**Parameters:**
- Shares sold: 5 (5 × 10^18)
- Outcome: 0 (Yes)
- Trade payout: 2.5 USDT
- Fees: 0.043 USDT
- Net received: 2.456 USDT

**Transaction:** `0xc11f43a9e7e844b5fa2ef8e457d596f3d66521794cfea7bf99ca26b55bbf8abd`  
**Block:** 70064430  
**Gas Used:** 45,935  
**Status:** ✅ Success

**Final State:**
- Price: 50.12% (Yes) / 49.88% (No)
- Shares remaining: 5
- Net cost (round-trip): ~3 USDT in fees

### Key Learnings from Trading Test

**1. Function Signatures**
- ✅ `buy(uint8 outcomeId, uint256 deltaShares)` - Takes SHARES as input, not USDT amount
- ✅ `sell(uint8 outcomeId, uint256 deltaShares)` - Takes SHARES as input, not USDT amount
- ✅ `previewBuy(uint8, uint256)` - Returns (tradeCost, fee, totalCost) all in USDT (6 decimals)
- ✅ `previewSell(uint8, uint256)` - Returns (tradePayout, fee, netPayout) all in USDT (6 decimals)

**2. Decimals Handling**
- Shares: Always 18 decimals (UD60x18 dimensionless)
- USDT: 6 decimals (collateral token)
- Conversion handled internally by contract

**3. Script Adjustments Required**

**Before (Incorrect):**
```solidity
uint256 buyAmount = 10 * 1e6; // 10 USDT
market.buy(0, buyAmount, minShares); // ❌ Wrong - takes shares, not USDT
```

**After (Correct):**
```solidity
uint256 sharesToBuy = 10 * 1e18; // 10 shares
market.buy(0, sharesToBuy); // ✅ Correct - pass shares directly
```

**4. Preview Pattern**
```solidity
// Always preview before trading
(uint256 tradeCost, uint256 fee, uint256 totalCost) = market.previewBuy(outcomeId, sharesToBuy);
usdt.approve(marketAddress, totalCost); // Approve exact amount needed
uint256 paid = market.buy(outcomeId, sharesToBuy); // Execute trade
```

### Gas Costs Analysis

| Operation | Gas Used | Cost (at 1 gwei) | Notes |
|-----------|----------|-----------------|-------|
| Approve USDT | 105,590 | 0.000105 BNB | Standard ERC20 approval |
| Buy Shares | 166,896 | 0.000167 BNB | LMSR calculation + ERC1155 mint |
| Sell Shares | 45,935 | 0.000046 BNB | LMSR calculation + ERC1155 burn |
| **Total** | **318,421** | **~0.00032 BNB (~$0.17)** | Full round-trip trade |

**Notes:**
- Sell is cheaper than buy (no approval needed on sell)
- Gas costs are reasonable for testnet
- With Biconomy paymaster, users won't pay any gas ✨

---

## 📝 Configuration Files

### Environment Variables (.env.local)

```bash
# BNB Testnet Configuration
NEXT_PUBLIC_CHAIN_ID=97
BNB_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/

# Deployed Contracts (October 25, 2025)
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x5c4850878F222aC16d5ab60204997b904Fe4019A
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x4410355e143112e0619f822fC9Ecf92AaBd01b63
NEXT_PUBLIC_OUTCOME_1155_ADDRESS=0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29
NEXT_PUBLIC_ROUTER_ADDRESS=0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991
NEXT_PUBLIC_TREASURY_ADDRESS=0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1
NEXT_PUBLIC_ORACLE_ADDRESS=0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4

# DelphAI Oracle (Live on BNB Testnet)
NEXT_PUBLIC_DELPHAI_ADDRESS=0xA95E99848a318e37F128aB841b0CF693c1f0b4D1

# Deployer (for testing only - DO NOT USE IN PRODUCTION)
DEPLOYER_ADDRESS=0x5e310BA9A20FFf37a8E8962789B7B459f511E7d2
# DEPLOYER_PRIVATE_KEY=*** (stored in .env, not .env.local)
```

### ABIs Exported

**Location:** `lib/abis/`

**Files:**
- ✅ `MarketFactory.ts` - Factory contract ABI
- ✅ `LMSRMarket.ts` - Market instance ABI
- ✅ `MockUSDT.ts` - Test USDT ABI
- ✅ `index.ts` - Barrel export
- ✅ `README.md` - Usage documentation

**Usage Example:**
```typescript
import { MARKET_FACTORY_ABI, LMSR_MARKET_ABI } from '@/lib/abis';

// Get all markets
const markets = await readContract({
  address: '0x5c4850878F222aC16d5ab60204997b904Fe4019A',
  abi: MARKET_FACTORY_ABI,
  functionName: 'getAllMarkets',
});

// Get market prices
const price = await readContract({
  address: '0x2935645910f2773dc3f76A2Ec38594344618CF28',
  abi: LMSR_MARKET_ABI,
  functionName: 'getPrice',
  args: [0], // Outcome 0
});
```

---

## 🚨 Issues Encountered & Resolutions

### Issue #1: Market Creation Failed with Misleading Error

**Error Message:** `MarketFactory_InsufficientLiquidity()`

**Initial Attempts:**
- Tried liquidity: 1,000 USDT → Failed
- Tried liquidity: 5,000 USDT → Failed
- Tried liquidity: 100,000 USDT → Failed
- Tried liquidity: 150,000 USDT → Failed

**Root Cause:** Error was misleading. Actual issue was `AccessControlUnauthorizedAccount` buried in the transaction trace.

**Diagnosis:**
```bash
# Full trace revealed the real error
forge script script/TestMarketCreation.s.sol --broadcast 2>&1 | grep -E "Revert|Error"

# Output:
AccessControlUnauthorizedAccount(0x5c4850878F222aC16d5ab60204997b904Fe4019A, 0x0000000000000000000000000000000000000000000000000000000000000000)
```

**Resolution:** MarketFactory was missing DEFAULT_ADMIN_ROLE on Outcome1155 and Router. Granted manually (see transactions above).

**Lesson Learned:** Always check full error trace, not just the high-level revert message.

---

### Issue #2: Deployment Script Incomplete

**Problem:** Original deployment script granted admin roles to MarketFactory on Oracle and Treasury, but forgot Outcome1155 and Router.

**Impact:** Market creation failed until permissions were manually granted.

**Fix Applied:**
```solidity
// Added to script/DeployBNBTestnet.s.sol
outcome1155.grantRole(adminRole, address(factory));
router.grantRole(adminRole, address(factory));
```

**Prevention:** Created post-deployment checklist and permission verification script.

---

## ✅ Deployment Checklist

**Pre-Deployment:**
- [x] All tests passing locally (170/170 tests)
- [x] Deployment script reviewed
- [x] Environment variables configured
- [x] Sufficient testnet BNB for deployment (~0.3 BNB)

**Deployment:**
- [x] Contracts deployed to BNB Testnet
- [x] All contracts verified on BSCScan
- [x] Deployment addresses recorded

**Post-Deployment (CRITICAL):**
- [x] Verified all permissions granted to MarketFactory:
  - [x] Outcome1155: DEFAULT_ADMIN_ROLE
  - [x] Router: DEFAULT_ADMIN_ROLE
  - [x] Treasury: DEFAULT_ADMIN_ROLE
  - [x] Oracle: DEFAULT_ADMIN_ROLE
- [x] Tested market creation
- [x] Verified market data on-chain
- [x] Exported ABIs to frontend
- [x] Updated environment variables
- [x] Documented deployment process

**Frontend Integration:**
- [x] ABIs exported to `lib/abis/`
- [x] Contract addresses in `.env.local`
- [ ] Update wagmi config with new addresses
- [ ] Test frontend connection to contracts
- [ ] Verify market display works

---

## 📊 Gas Usage Analysis

### Deployment Costs

| Contract | Deployment Gas | Est. Cost (at 0.1 gwei) |
|----------|---------------|------------------------|
| MockUSDT | ~800K | ~0.0008 BNB |
| Outcome1155 | ~1.2M | ~0.0012 BNB |
| Treasury | ~1.5M | ~0.0015 BNB |
| Router | ~1.8M | ~0.0018 BNB |
| Oracle | ~2.1M | ~0.0021 BNB |
| MarketFactory | ~3.0M | ~0.0030 BNB |
| **Total** | **~10.4M** | **~0.0104 BNB (~$5.72)** |

### Operation Costs

| Operation | Gas Used | Est. Cost (at 0.1 gwei) |
|-----------|----------|------------------------|
| Grant Role | ~50K | ~0.00005 BNB (~$0.03) |
| Create Market | ~2.8M | ~0.0028 BNB (~$1.54) |
| Buy Shares | TBD | TBD |
| Sell Shares | TBD | TBD |
| Resolve Market | TBD | TBD |
| Claim Winnings | TBD | TBD |

**Total Deployment + Setup Cost:** ~0.011 BNB (~$6.05)

---

## 🔗 Useful Links

**Block Explorer:**
- BSCScan Testnet: https://testnet.bscscan.com/

**Contract Links:**
- MarketFactory: https://testnet.bscscan.com/address/0x5c4850878F222aC16d5ab60204997b904Fe4019A
- First Market: https://testnet.bscscan.com/address/0x2935645910f2773dc3f76A2Ec38594344618CF28

**Testnet Resources:**
- BNB Faucet: https://testnet.bnbchain.org/faucet-smart
- RPC Endpoint: https://data-seed-prebsc-1-s1.binance.org:8545/
- Chain ID: 97

**Documentation:**
- Deployment Troubleshooting: `Docs/DEPLOYMENT_TROUBLESHOOTING.md`
- Architecture: `Docs/ARCHITECTURE.md`
- Execution Plan: `Docs/EXECUTION_PLAN.md`

---

## 🎯 Next Steps

**Immediate (Week 1):**
1. [ ] Configure Biconomy paymaster for gasless transactions
2. [ ] Integrate Privy social login
3. [ ] Migrate frontend from Wagmi to Biconomy AA
4. [ ] Test full market creation from frontend

**Short-term (Week 2):**
5. [ ] Create 10 Argentine test markets
6. [ ] Test trading flow (buy/sell shares)
7. [ ] Test resolution flow with Oracle
8. [ ] Test claiming winnings

**Medium-term (Week 3-4):**
9. [ ] Deploy to BNB Mainnet (after thorough testing)
10. [ ] Implement The Graph subgraph for event indexing
11. [ ] Launch beta with Argentine community
12. [ ] Gather user feedback and iterate

---

**Deployment Record Version:** 1.0  
**Last Updated:** October 25, 2025  
**Network:** BNB Smart Chain Testnet (97)  
**Status:** Fully Operational ✅
