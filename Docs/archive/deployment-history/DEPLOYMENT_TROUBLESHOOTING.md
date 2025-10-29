# BNB Testnet Deployment - Troubleshooting Guide

**Last Updated:** October 25, 2025  
**Status:** ✅ All issues resolved, market creation successful

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Lessons Learned](#critical-lessons-learned)
3. [Permission Issues Deep Dive](#permission-issues-deep-dive)
4. [Error Diagnosis Techniques](#error-diagnosis-techniques)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Verification & Testing](#verification--testing)
7. [Future Deployment Checklist](#future-deployment-checklist)

---

## 🎯 Executive Summary

### What Happened

**Initial Problem:** Market creation consistently failed with `MarketFactory_InsufficientLiquidity()` error, even with very high liquidity amounts (1K, 5K, 100K, 150K USDT).

**Root Cause:** The error was misleading. The actual issue was **missing access control permissions** on two contracts:
- MarketFactory did NOT have `DEFAULT_ADMIN_ROLE` on `Outcome1155`
- MarketFactory did NOT have `DEFAULT_ADMIN_ROLE` on `Router`

**Resolution:** Manually granted the missing admin roles via `cast send` commands. Market creation then succeeded immediately.

**Time to Diagnose:** ~2 hours (initial attempts with liquidity adjustments, then systematic permission checking)

**Key Insight:** Always check the FULL error trace, not just the revert message. Solidity error bubbling can hide the real cause.

---

## 🔥 Critical Lessons Learned

### Lesson 1: Error Messages Can Lie

**What We Thought:**
- Error: `MarketFactory_InsufficientLiquidity()`
- Assumption: Liquidity parameter is too low
- Action: Increased liquidity from 1K → 5K → 100K → 150K USDT

**What Was Actually Wrong:**
- Real error: `AccessControlUnauthorizedAccount(0x5c48...19A, 0x0000...000)`
- Real issue: MarketFactory missing admin roles on Outcome1155 and Router
- Misleading revert: LMSR validation probably reverted first, but the real blocker was permission

**Lesson:** 
```bash
# DON'T just look at the top-level error
forge script ... --broadcast

# DO look at the full trace with grep
forge script ... --broadcast 2>&1 | grep -E "Revert|Error|AccessControl"
```

---

### Lesson 2: Deployment Scripts Are Never "Done"

**The Gap:**
Our deployment script (`script/DeployBNBTestnet.s.sol`) granted admin roles to MarketFactory on:
- ✅ Oracle (correctly granted)
- ✅ Treasury (correctly granted)
- ❌ Outcome1155 (MISSING - caused first failure)
- ❌ Router (MISSING - caused second failure)

**Why This Happened:**
- We added Outcome1155 and Router later in development
- Deployment script wasn't updated to grant roles on new contracts
- No checklist or validation to catch missing permissions

**The Fix:**
```solidity
// ADD to script/DeployBNBTestnet.s.sol (after line ~80)
bytes32 adminRole = 0x0000000000000000000000000000000000000000000000000000000000000000;

// Grant MarketFactory admin on Outcome1155 (NEW)
outcome1155.grantRole(adminRole, address(factory));
console.log("✅ Granted admin role on Outcome1155 to factory");

// Grant MarketFactory admin on Router (NEW)
router.grantRole(adminRole, address(factory));
console.log("✅ Granted admin role on Router to factory");

// Existing grants (already in script)
oracle.grantRole(adminRole, address(factory));
treasury.grantRole(adminRole, address(factory));
```

**Lesson:** Every time you add a new contract that MarketFactory interacts with, update the deployment script with required permissions.

---

### Lesson 3: Market Creation Flow Has Hidden Dependencies

**The Execution Path:**
When `MarketFactory.createMarket()` is called, it performs these steps:

```solidity
function createMarket(...) external returns (uint256 marketId, address marketAddress) {
    // 1. Deploy new LMSRMarket (no permissions needed)
    marketAddress = address(new LMSRMarket(...));
    
    // 2. Register with Treasury (requires MarketFactory to have admin role on Treasury)
    Treasury(treasury).registerMarket(marketAddress);
    
    // 3. Grant MINTER_BURNER_ROLE to new market (requires MarketFactory to have admin on Outcome1155)
    // ❌ FAILED HERE initially - MarketFactory lacked admin role
    Outcome1155(outcome1155).grantRole(MINTER_BURNER_ROLE, marketAddress);
    
    // 4. Register with Router (requires MarketFactory to have admin role on Router)
    // ❌ FAILED HERE after fix #1 - MarketFactory lacked admin role
    Router(router).registerMarket(marketAddress);
    
    // 5. Register with Oracle (requires MarketFactory to have admin role on Oracle)
    Oracle(oracle).registerMarket(marketAddress, delphAIMarketId);
    
    // 6. Fund the market with initial liquidity
    LMSRMarket(marketAddress).fundMarket(msg.sender, initialLiquidity);
    
    return (marketId, marketAddress);
}
```

**What We Learned:**
- Each step has implicit permission requirements
- If ANY step fails, the entire transaction reverts
- Error from step 3 can bubble up as a different error
- You must trace through EACH contract call to verify permissions

---

### Lesson 4: Systematic Debugging Wins

**Our Approach (What Worked):**

1. **Reproduce the error** with minimal test case
2. **Capture full trace** with `grep -E "Revert|Error"`
3. **Identify actual error** in trace (not just revert message)
4. **List all dependencies** (Treasury, Oracle, Router, Outcome1155)
5. **Check permissions systematically** on EACH contract
6. **Fix one by one** and retest after each fix

**Anti-Pattern (What Didn't Work):**
- Guessing at parameters (liquidity amounts)
- Trying random values hoping something works
- Trusting high-level error messages
- Not checking permissions before deployment

---

## 🔍 Permission Issues Deep Dive

### The Access Control Pattern

All contracts use OpenZeppelin's `AccessControl`:

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Outcome1155 is AccessControl {
    bytes32 public constant MINTER_BURNER_ROLE = keccak256("MINTER_BURNER_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00...00; // Inherited from AccessControl
    
    function grantRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        super.grantRole(role, account);
    }
    
    // Only accounts with MINTER_BURNER_ROLE can mint/burn
    function mint(address to, uint256 id, uint256 amount) external onlyRole(MINTER_BURNER_ROLE) {
        _mint(to, id, amount, "");
    }
}
```

**Key Concept:** To grant a role, you need the "admin role" of that role. By default, `DEFAULT_ADMIN_ROLE` is the admin of all roles.

### Permission Requirements Matrix

| Contract | Role Needed | Who Needs It | Why |
|----------|-------------|--------------|-----|
| **Outcome1155** | `DEFAULT_ADMIN_ROLE` | MarketFactory | To grant `MINTER_BURNER_ROLE` to new markets |
| **Router** | `DEFAULT_ADMIN_ROLE` | MarketFactory | To call `registerMarket()` (has `onlyRole` modifier) |
| **Treasury** | `DEFAULT_ADMIN_ROLE` | MarketFactory | To call `registerMarket()` (has `onlyRole` modifier) |
| **Oracle** | `DEFAULT_ADMIN_ROLE` | MarketFactory | To call `registerMarket()` (has `onlyRole` modifier) |

### How to Check Permissions On-Chain

```bash
# 1. Define the role (DEFAULT_ADMIN_ROLE is always 0x00...00)
ADMIN_ROLE="0x0000000000000000000000000000000000000000000000000000000000000000"

# 2. Check if MarketFactory has admin role on Outcome1155
cast call 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29 \
  "hasRole(bytes32,address)(bool)" \
  $ADMIN_ROLE \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/

# Expected output:
# true  ✅ (has permission)
# false ❌ (missing permission)

# 3. Repeat for Router, Treasury, Oracle
cast call <ROUTER_ADDRESS> "hasRole(bytes32,address)(bool)" $ADMIN_ROLE <FACTORY_ADDRESS> --rpc-url <RPC>
cast call <TREASURY_ADDRESS> "hasRole(bytes32,address)(bool)" $ADMIN_ROLE <FACTORY_ADDRESS> --rpc-url <RPC>
cast call <ORACLE_ADDRESS> "hasRole(bytes32,address)(bool)" $ADMIN_ROLE <FACTORY_ADDRESS> --rpc-url <RPC>
```

### How to Grant Permissions

```bash
# Grant DEFAULT_ADMIN_ROLE to MarketFactory on Outcome1155
cast send 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29 \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/

# Verify the grant
cast call 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29 \
  "hasRole(bytes32,address)(bool)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
# Should return: true
```

---

## 🛠️ Error Diagnosis Techniques

### Technique 1: Full Trace Analysis

**Bad Practice:**
```bash
forge script script/TestMarketCreation.s.sol --broadcast
# Only see high-level error: MarketFactory_InsufficientLiquidity()
```

**Good Practice:**
```bash
# Capture ALL output and filter for errors
forge script script/TestMarketCreation.s.sol --broadcast 2>&1 | grep -E "Revert|Error|AccessControl"

# Look for:
# - AccessControlUnauthorizedAccount (permission issue)
# - Custom errors (MarketFactory_*, Router_*, etc.)
# - Require failures
# - Address in error (who's missing permission?)
```

### Technique 2: Isolate Each Step

When a complex transaction fails, test each step individually:

```bash
# 1. Can we deploy a market? (test constructor)
cast send <FACTORY_ADDRESS> "deployMarketOnly(...)" --private-key <KEY>

# 2. Can we register with Treasury?
cast send <TREASURY_ADDRESS> "registerMarket(address)" <MARKET_ADDRESS> --private-key <KEY>

# 3. Can MarketFactory grant roles on Outcome1155?
cast send <OUTCOME_1155_ADDRESS> "grantRole(bytes32,address)" <ROLE> <MARKET_ADDRESS> --from <FACTORY_ADDRESS>
# If this fails → permission issue

# 4. Can we register with Router?
cast send <ROUTER_ADDRESS> "registerMarket(address)" <MARKET_ADDRESS> --private-key <KEY>

# 5. Can we register with Oracle?
cast send <ORACLE_ADDRESS> "registerMarket(address,uint256)" <MARKET_ADDRESS> <DELPHAI_ID> --private-key <KEY>
```

### Technique 3: Event Inspection

Successful operations emit events. Use them to confirm each step:

```bash
# Get transaction receipt
cast receipt <TX_HASH> --rpc-url <RPC>

# Look for emitted events:
# - RoleGranted (from AccessControl)
# - MarketRegistered (from Treasury, Router, Oracle)
# - MarketCreated (from MarketFactory)
# - Transfer (from ERC20/ERC1155)

# If an expected event is missing → that step failed
```

### Technique 4: Use Tenderly/BSCScan Trace

For complex failures, use block explorers:

1. Submit transaction on-chain (even if it reverts)
2. Go to BSCScan Testnet: https://testnet.bscscan.com/
3. Find transaction by hash
4. Click "State" or "Trace" tab
5. Expand call tree to see exactly where it reverted

**Example:**
```
✅ MarketFactory.createMarket()
  ✅ LMSRMarket.constructor()
  ✅ Treasury.registerMarket()
  ❌ Outcome1155.grantRole() ← REVERTED HERE
      Error: AccessControlUnauthorizedAccount(0x5c48...19A, 0x000...000)
```

---

## 📝 Post-Deployment Configuration

### What to Do IMMEDIATELY After Deployment

**Step 1: Record All Addresses**
```bash
# Save to .env.local
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x5c4850878F222aC16d5ab60204997b904Fe4019A
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x4410355e143112e0619f822fC9Ecf92AaBd01b63
NEXT_PUBLIC_OUTCOME_1155_ADDRESS=0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29
NEXT_PUBLIC_ROUTER_ADDRESS=0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991
NEXT_PUBLIC_TREASURY_ADDRESS=0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1
NEXT_PUBLIC_ORACLE_ADDRESS=0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4
```

**Step 2: Verify Permissions**

Run this script to verify ALL permissions:

```bash
#!/bin/bash
# verify-permissions.sh

ADMIN_ROLE="0x0000000000000000000000000000000000000000000000000000000000000000"
FACTORY="0x5c4850878F222aC16d5ab60204997b904Fe4019A"
RPC="https://data-seed-prebsc-1-s1.binance.org:8545/"

echo "🔍 Checking MarketFactory permissions..."

# Check Outcome1155
OUTCOME_1155="0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29"
HAS_ROLE=$(cast call $OUTCOME_1155 "hasRole(bytes32,address)(bool)" $ADMIN_ROLE $FACTORY --rpc-url $RPC)
if [ "$HAS_ROLE" = "true" ]; then
    echo "✅ Outcome1155: Factory has admin role"
else
    echo "❌ Outcome1155: Factory MISSING admin role"
fi

# Check Router
ROUTER="0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991"
HAS_ROLE=$(cast call $ROUTER "hasRole(bytes32,address)(bool)" $ADMIN_ROLE $FACTORY --rpc-url $RPC)
if [ "$HAS_ROLE" = "true" ]; then
    echo "✅ Router: Factory has admin role"
else
    echo "❌ Router: Factory MISSING admin role"
fi

# Check Treasury
TREASURY="0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1"
HAS_ROLE=$(cast call $TREASURY "hasRole(bytes32,address)(bool)" $ADMIN_ROLE $FACTORY --rpc-url $RPC)
if [ "$HAS_ROLE" = "true" ]; then
    echo "✅ Treasury: Factory has admin role"
else
    echo "❌ Treasury: Factory MISSING admin role"
fi

# Check Oracle
ORACLE="0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4"
HAS_ROLE=$(cast call $ORACLE "hasRole(bytes32,address)(bool)" $ADMIN_ROLE $FACTORY --rpc-url $RPC)
if [ "$HAS_ROLE" = "true" ]; then
    echo "✅ Oracle: Factory has admin role"
else
    echo "❌ Oracle: Factory MISSING admin role"
fi

echo "✅ Permission check complete"
```

**Step 3: Grant Missing Permissions (if any)**

```bash
# If Step 2 found missing permissions, grant them:
source .env

# Outcome1155
cast send 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29 \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url $BNB_TESTNET_RPC

# Router
cast send 0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991 \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url $BNB_TESTNET_RPC

# Treasury (if needed)
cast send 0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1 \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url $BNB_TESTNET_RPC

# Oracle (if needed)
cast send 0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4 \
  "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  0x5c4850878F222aC16d5ab60204997b904Fe4019A \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url $BNB_TESTNET_RPC
```

**Step 4: Test Market Creation**

```bash
# Run the test script
source .env && forge script script/TestMarketCreation.s.sol --rpc-url $BNB_TESTNET_RPC --broadcast

# Expected output:
# ✅ Market created successfully
# ✅ Market ID: 0
# ✅ Market address: 0x...
# ✅ Initial prices: 50% / 50%
# ✅ Total markets: 1
```

---

## ✅ Verification & Testing

### On-Chain Verification Checklist

After deployment AND permission grants, verify:

**1. All Contracts Deployed**
```bash
# Check each address exists and has code
cast code 0x5c4850878F222aC16d5ab60204997b904Fe4019A --rpc-url <RPC>
# Output should be bytecode (long hex string), not "0x"
```

**2. All Contracts Verified on BSCScan**
- Visit: https://testnet.bscscan.com/address/<ADDRESS>
- Should see green checkmark ✅ "Contract Source Code Verified"
- Should be able to read/write contract functions

**3. All Permissions Granted**
```bash
# Run verify-permissions.sh (from Step 2 above)
# All checks should be ✅
```

**4. Market Creation Works**
```bash
# Create first test market
forge script script/TestMarketCreation.s.sol --broadcast --rpc-url <RPC>

# Verify:
# - Transaction succeeds (no revert)
# - Market ID 0 created
# - Market contract deployed
# - Initial prices are 50/50
# - Total markets count = 1
```

**5. Market Data Readable**
```bash
# Get market count
cast call <FACTORY_ADDRESS> "getMarketCount()(uint256)" --rpc-url <RPC>
# Should return: 1

# Get all markets
cast call <FACTORY_ADDRESS> "getAllMarkets()(address[])" --rpc-url <RPC>
# Should return: [0x2935645910f2773dc3f76A2Ec38594344618CF28]

# Get market details
cast call <MARKET_ADDRESS> "outcomeCount()(uint256)" --rpc-url <RPC>
# Should return: 2

# Get prices
cast call <MARKET_ADDRESS> "getPrice(uint8)(uint256)" 0 --rpc-url <RPC>
# Should return: 500000000000000000 (0.5 = 50%)
```

---

## 📋 Future Deployment Checklist

Use this checklist for ALL future deployments (mainnet, other testnets, etc.):

### Pre-Deployment
- [ ] All tests passing locally (`forge test`)
- [ ] Gas optimizations reviewed
- [ ] Security audit complete (if mainnet)
- [ ] Deployment script updated with latest contracts
- [ ] Environment variables set (private key, RPC URL)
- [ ] Sufficient testnet/mainnet tokens for deployment

### Deployment
- [ ] Run deployment script: `forge script script/Deploy.s.sol --broadcast --verify`
- [ ] Record ALL deployed addresses
- [ ] Verify all contracts on block explorer
- [ ] Save deployment transaction hashes

### Post-Deployment (CRITICAL - Don't Skip!)
- [ ] **Run permission verification script** (`verify-permissions.sh`)
- [ ] Grant missing admin roles to MarketFactory on:
  - [ ] Outcome1155
  - [ ] Router
  - [ ] Treasury
  - [ ] Oracle
- [ ] Re-run verification script (all should be ✅)
- [ ] Test market creation with `TestMarketCreation.s.sol`
- [ ] Verify market data is readable on-chain
- [ ] Update `.env.local` with contract addresses
- [ ] Export ABIs to `lib/abis/` directory
- [ ] Update documentation with deployment info
- [ ] Commit changes to git
- [ ] Tag release: `git tag v1.0.0-testnet`

### Mainnet-Specific
- [ ] Multi-sig setup for admin operations
- [ ] Timelock for upgrades (if applicable)
- [ ] Circuit breakers / pause functionality tested
- [ ] Bug bounty program announced
- [ ] Monitoring & alerting configured
- [ ] Incident response plan documented

---

## 🚨 Common Errors & Solutions

### Error 1: `MarketFactory_InsufficientLiquidity()`

**Symptoms:**
- Market creation fails with this error
- Even with very high liquidity amounts

**Diagnosis:**
```bash
# Check full error trace
forge script ... --broadcast 2>&1 | grep -E "Revert|Error|AccessControl"

# Look for:
AccessControlUnauthorizedAccount(0x..., 0x...)
```

**Solution:**
- This is likely a PERMISSIONS issue, not liquidity
- Check MarketFactory has admin role on all contracts
- See "Permission Issues Deep Dive" section above

---

### Error 2: `AccessControlUnauthorizedAccount(account, role)`

**Symptoms:**
- Specific account lacks a specific role
- Transaction reverts during permission check

**Diagnosis:**
```bash
# Check who has what role
cast call <CONTRACT_ADDRESS> "hasRole(bytes32,address)(bool)" <ROLE> <ACCOUNT> --rpc-url <RPC>
```

**Solution:**
```bash
# Grant the role
cast send <CONTRACT_ADDRESS> "grantRole(bytes32,address)" <ROLE> <ACCOUNT> --private-key <ADMIN_KEY> --rpc-url <RPC>
```

---

### Error 3: `execution reverted: 0x`

**Symptoms:**
- Generic revert with no error message
- Usually means require() failed or function doesn't exist

**Diagnosis:**
```bash
# Check contract has the function
cast abi <CONTRACT_ADDRESS> --rpc-url <RPC>

# Try calling with correct signature
cast call <CONTRACT_ADDRESS> "functionName(type1,type2)(returnType)" <ARG1> <ARG2> --rpc-url <RPC>
```

**Common Causes:**
- Wrong function signature (e.g., `uint256` vs `uint8`)
- Wrong number of arguments
- Function doesn't exist (wrong ABI)

---

### Error 4: Market Creation Succeeds But Can't Query Data

**Symptoms:**
- `createMarket()` transaction succeeds
- But calling market getters fails with revert

**Diagnosis:**
```bash
# Check if market contract was actually deployed
cast code <MARKET_ADDRESS> --rpc-url <RPC>
# Should return bytecode, not "0x"

# Check factory has the market registered
cast call <FACTORY_ADDRESS> "getMarket(uint256)" <MARKET_ID> --rpc-url <RPC>
```

**Solution:**
- Market might be deployed but not registered in factory
- Check factory's `markets` mapping
- Check `marketAddresses` array

---

## 🎓 Key Takeaways

### What We Learned

1. **Deployment ≠ Configuration**: Deploying contracts is 50% of the work. Post-deployment permission setup is just as critical.

2. **Error Messages Lie**: High-level revert messages don't always reflect the root cause. Always check full traces.

3. **Systematic > Random**: Debugging by systematically checking each dependency is faster than guessing.

4. **Checklists Save Time**: A post-deployment checklist prevents 90% of issues.

5. **Test Incrementally**: Don't deploy everything and hope it works. Test each step individually.

### Best Practices Going Forward

**1. Update Deployment Script with Every New Contract**
```solidity
// When you add a new contract to the system:
// 1. Deploy it
// 2. Grant MarketFactory admin role
// 3. Add to documentation
// 4. Update verification script
```

**2. Always Run Verification Script After Deployment**
```bash
# Make this part of your workflow:
./scripts/deploy.sh
./scripts/verify-permissions.sh  # ← Don't skip!
./scripts/test-market-creation.sh
```

**3. Document Every Permission Requirement**
```solidity
// In contract comments:
/// @notice MarketFactory must have DEFAULT_ADMIN_ROLE to call this function
/// @dev Grants MINTER_BURNER_ROLE to newly created markets
function registerMarket(address market) external onlyRole(DEFAULT_ADMIN_ROLE) { ... }
```

**4. Use Deterministic Deployment (Optional)**
```solidity
// Consider CREATE2 for deterministic addresses
// Makes testing easier across deployments
```

---

## 📞 Support & Resources

### If You Get Stuck

1. **Check This Document First** - Most issues are covered here
2. **Check Full Error Trace** - `grep -E "Revert|Error"`
3. **Verify Permissions** - Run `verify-permissions.sh`
4. **Check Foundry Docs** - https://book.getfoundry.sh/
5. **Check OpenZeppelin Docs** - https://docs.openzeppelin.com/
6. **Ask in Discord** - Foundry, OpenZeppelin, or BNB Chain communities

### Useful Commands Reference

```bash
# Deploy contracts
forge script script/Deploy.s.sol --rpc-url <RPC> --broadcast --verify

# Check permissions
cast call <CONTRACT> "hasRole(bytes32,address)(bool)" <ROLE> <ACCOUNT> --rpc-url <RPC>

# Grant permission
cast send <CONTRACT> "grantRole(bytes32,address)" <ROLE> <ACCOUNT> --private-key <KEY> --rpc-url <RPC>

# Test market creation
forge script script/TestMarketCreation.s.sol --rpc-url <RPC> --broadcast

# Get full trace
forge script <SCRIPT> --broadcast 2>&1 | grep -E "Revert|Error|AccessControl"

# Check contract code
cast code <ADDRESS> --rpc-url <RPC>

# Get transaction receipt
cast receipt <TX_HASH> --rpc-url <RPC>
```

---

## 🎉 Success Metrics

**You'll know deployment is complete when:**

✅ All 6 contracts deployed and verified  
✅ All permissions granted (verification script shows all ✅)  
✅ Test market creation succeeds  
✅ Market data is queryable on-chain  
✅ Prices are 50/50 for initial market  
✅ Frontend can connect and display markets  

**Deployment Time Breakdown:**
- Initial deployment: ~5 minutes
- Contract verification: ~10 minutes
- Permission setup: ~5 minutes (if using script)
- Testing: ~10 minutes
- **Total: ~30 minutes** (with checklist)

vs. **~2+ hours** (without checklist, debugging permission issues)

---

**Document Version:** 1.0  
**Last Verified:** October 25, 2025  
**Network:** BNB Testnet (Chain ID 97)  
**Status:** All Issues Resolved ✅
