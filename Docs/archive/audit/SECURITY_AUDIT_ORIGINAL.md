# Predik-Seedify Smart Contract Security Audit

**Audit Date:** October 29, 2025  
**Audited By:** AI Security Analysis  
**Contracts Version:** Pre-Mainnet Deployment  
**Chain:** BNB Smart Chain (Mainnet - Chain ID 56)

---

## Executive Summary

This comprehensive security audit examines all smart contracts in the Predik prediction market platform. The audit identified **4 CRITICAL**, **4 HIGH**, **6 MEDIUM**, and **4 LOW** severity issues. While the codebase demonstrates strong engineering practices and proper use of security patterns, several economic and game-theoretic vulnerabilities require immediate attention before mainnet deployment.

### Overall Assessment

- **Code Quality:** B+ (Well-structured, good documentation)
- **Security Posture:** C+ (Critical issues must be fixed)
- **Readiness:** ⚠️ **NOT READY** for mainnet without fixes

---

## Table of Contents

1. [Scope](#scope)
2. [Critical Vulnerabilities](#critical-vulnerabilities)
3. [High Severity Issues](#high-severity-issues)
4. [Medium Severity Issues](#medium-severity-issues)
5. [Low Severity Issues](#low-severity-issues)
6. [Positive Findings](#positive-findings)
7. [Recommendations](#recommendations)
8. [Contract-by-Contract Analysis](#contract-by-contract-analysis)

---

## Scope

The following contracts were audited:

1. **MockUSDT.sol** - ERC20 test token with faucet
2. **Outcome1155.sol** - ERC1155 for outcome shares
3. **Treasury.sol** - Fee collection and distribution
4. **Router.sol** - Gasless trading aggregator
5. **Oracle.sol** - DelphAI resolution bridge
6. **MarketFactory.sol** - Market deployment factory
7. **LMSRMarket.sol** - Core LMSR AMM logic

---

## Critical Vulnerabilities

### 🔴 CRITICAL-1: Oracle Front-Running Attack

**Contract:** `Oracle.sol`, `LMSRMarket.sol`  
**Severity:** CRITICAL  
**Likelihood:** High  
**Impact:** Risk-free arbitrage, market manipulation

**Description:**

DelphAI oracle resolution data is publicly readable on-chain BEFORE trading ends. Attackers can:

1. Monitor DelphAI.getMarket() to see resolution outcome
2. Buy shares of winning outcome before `tradingEndsAt`
3. Call `requestResolve()` at `tradingEndsAt`
4. Market finalizes with known outcome
5. Redeem shares for guaranteed profit

**Vulnerable Code:**

```solidity
// Oracle.sol - Line ~110
function requestResolve(address market) external nonReentrant {
    Market memory delphMarket = delphAI.getMarket(delphAIMarketId);
    // DelphAI data is PUBLIC - anyone can read it!
    
    if (delphMarket.status != MarketStatus.Resolved) {
        revert Oracle_DelphAIMarketNotResolved(delphAIMarketId);
    }
    // Store outcome that was already public
}

// LMSRMarket.sol - Line ~480
function buy(...) {
    if (block.timestamp >= tradingEndsAt) { revert LMSR_TradingEnded(); }
    // Trading continues until tradingEndsAt
    // But DelphAI may resolve BEFORE this timestamp!
}
```

**Attack Scenario:**

```
Time T-1: DelphAI resolves market to outcome 2 (public on-chain)
Time T-1: Attacker reads DelphAI.getMarket(), sees outcome = 2
Time T-1: Attacker buys 10,000 shares of outcome 2 for 5,000 USDT
Time T:   tradingEndsAt reached
Time T:   Attacker calls requestResolve()
Time T+1: Market finalizes with outcome 2
Time T+1: Attacker redeems 10,000 shares for 10,000 USDT
Result:   5,000 USDT risk-free profit
```

**Recommendation:**

**Option A: Add Freeze Period (RECOMMENDED)**
```solidity
uint64 public constant RESOLUTION_FREEZE = 1 hours;

function buy(...) {
    require(block.timestamp < tradingEndsAt - RESOLUTION_FREEZE, "Market frozen for resolution");
}

function requestResolve() {
    require(block.timestamp >= tradingEndsAt, "Trading not ended");
    // Now safe - trading stopped 1 hour before resolution available
}
```

**Option B: Commit-Reveal Resolution**
```solidity
function commitResolution(bytes32 outcomeHash) external {
    // Commit hash of outcome
    resolutionCommit[market] = outcomeHash;
}

function revealResolution(uint8 outcome, bytes32 salt) external {
    require(block.timestamp >= tradingEndsAt);
    require(keccak256(abi.encode(outcome, salt)) == resolutionCommit[market]);
    // Reveal after trading ends
}
```

**Option C: Delayed Oracle Data**
- Ensure DelphAI resolution timestamp > tradingEndsAt + buffer
- Add validation in `createMarket()` to enforce this

---

### 🔴 CRITICAL-2: Centralized Dispute Resolution

**Contract:** `Oracle.sol`  
**Severity:** CRITICAL  
**Likelihood:** Medium (requires malicious admin)  
**Impact:** Theft of dispute bonds, loss of user trust

**Description:**

A single admin controls ALL dispute resolutions with no governance or checks. The admin can:

- Always rule in favor of AI to collect slashed dispute bonds
- Manipulate outcomes to favor specific traders
- Steal bonds from legitimate disputers

**Vulnerable Code:**

```solidity
// Oracle.sol - Line ~285
function resolveDispute(address market, uint8 finalOutcome, bool invalid)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)  // Single admin!
    nonReentrant
{
    bool aiWasCorrect = (finalOutcome == resolution.proposedOutcome);
    
    if (aiWasCorrect) {
        // Admin controls this decision!
        collateral.safeTransfer(treasury, resolution.disputeBond);
        emit DisputeBondSlashed(market, resolution.challenger, resolution.disputeBond);
    } else {
        collateral.safeTransfer(resolution.challenger, resolution.disputeBond);
    }
}
```

**Attack Scenario:**

```
1. Market resolves to outcome A with 75% confidence (disputable)
2. Alice disputes with 100 USDT bond, proposing outcome B
3. Admin (malicious) reviews dispute
4. Admin sees outcome B is actually correct
5. Admin rules in favor of AI (outcome A) anyway
6. Alice's 100 USDT bond slashed to treasury
7. Admin withdraws treasury fees later
8. Admin profits 100 USDT from false ruling
```

**Recommendation:**

**Implement Multi-Sig Governance:**

```solidity
// Add governance contract
address public governance; // Gnosis Safe with 3/5 multisig

function resolveDispute(...) external {
    require(msg.sender == governance, "Only governance");
    // Requires 3 out of 5 signers to agree
}
```

**Or Add Timelock:**

```solidity
mapping(address => DisputeResolution) public pendingResolutions;

struct DisputeResolution {
    uint8 outcome;
    bool invalid;
    uint256 executeAfter;
}

function proposeResolution(address market, uint8 outcome, bool invalid) external onlyAdmin {
    pendingResolutions[market] = DisputeResolution({
        outcome: outcome,
        invalid: invalid,
        executeAfter: block.timestamp + 48 hours
    });
}

function executeResolution(address market) external {
    DisputeResolution memory res = pendingResolutions[market];
    require(block.timestamp >= res.executeAfter, "Timelock active");
    // Execute with 48-hour community review
}
```

---

### 🔴 CRITICAL-3: Factory Admin Can Mint Infinite Shares

**Contract:** `Outcome1155.sol`, `MarketFactory.sol`  
**Severity:** CRITICAL  
**Likelihood:** Low (requires malicious/compromised admin)  
**Impact:** Complete system compromise, infinite share minting

**Description:**

The MarketFactory is granted `DEFAULT_ADMIN_ROLE` on Outcome1155, allowing it to grant `MINTER_BURNER_ROLE` to ANY address. A malicious factory admin could:

- Grant MINTER_BURNER_ROLE to their own address
- Mint infinite shares for any market
- Sell shares to drain market collateral
- Steal all funds from all markets

**Vulnerable Code:**

```solidity
// MarketFactory.sol - Line ~370
function createMarket(CreateMarketParams calldata params) external {
    // Deploy market...
    
    // ❌ CRITICAL: Factory grants itself ability to mint on Outcome1155
    Outcome1155(outcome1155).grantRole(
        Outcome1155(outcome1155).MINTER_BURNER_ROLE(), 
        marketAddress  // Only market should have this!
    );
    
    // But Factory has DEFAULT_ADMIN_ROLE on Outcome1155
    // So Factory can also grant MINTER_BURNER_ROLE to itself!
}

// Outcome1155.sol - Line ~30
constructor(string memory initialBaseUri, address initialRouter) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);  // msg.sender = Factory
    // Factory now controls all role grants
}
```

**Attack Scenario:**

```
1. Malicious admin controls Factory
2. Admin calls: Outcome1155.grantRole(MINTER_BURNER_ROLE, attacker_address)
3. Attacker calls: Outcome1155.mintOutcome(attacker, marketId=1, outcome=0, amount=1000000)
4. Attacker now has 1M shares for market 1, outcome 0
5. Attacker calls: LMSRMarket.sell() to dump shares
6. Market pays out collateral to attacker
7. Market drained, all users lose funds
8. Repeat for every market
```

**Recommendation:**

**Remove Factory Admin Role After Setup:**

```solidity
// Outcome1155.sol
constructor(string memory initialBaseUri, address initialRouter) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);  // Temporary
    _grantRole(MINTER_BURNER_ROLE, msg.sender);
    router = initialRouter;
}

function renounceFactoryAdmin() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    // Factory gives up admin powers after deployment
}

// MarketFactory.sol
function createMarket(...) external {
    // Create market...
    
    Outcome1155(outcome1155).grantRole(MINTER_BURNER_ROLE, marketAddress);
    
    // After all markets deployed, call renounceFactoryAdmin()
}
```

**Or Use Separate Admin:**

```solidity
// Deploy Outcome1155 with separate admin (multisig)
Outcome1155 outcome = new Outcome1155(baseUri, router);
outcome.grantRole(MARKET_MANAGER_ROLE, factory);  // Factory can only register markets
outcome.renounceRole(DEFAULT_ADMIN_ROLE);  // Factory gives up admin
outcome.grantRole(DEFAULT_ADMIN_ROLE, multisig);  // Transfer to governance
```

---

### 🔴 CRITICAL-4: DelphAI Single Point of Failure

**Contract:** `Oracle.sol`  
**Severity:** CRITICAL  
**Likelihood:** Medium (external dependency)  
**Impact:** All markets fail if DelphAI fails

**Description:**

The entire system has COMPLETE trust in DelphAI oracle with:

- No data validation
- No fallback mechanism  
- No governance override
- No multi-oracle support

If DelphAI:
- Returns incorrect data → Markets resolve wrong
- Reverts/goes offline → Markets stuck forever
- Gets compromised → Attacker controls all resolutions

**Vulnerable Code:**

```solidity
// Oracle.sol - Line ~110
function requestResolve(address market) external nonReentrant {
    // Direct external call with NO error handling
    Market memory delphMarket = delphAI.getMarket(delphAIMarketId);
    
    // ❌ No validation of data authenticity
    // ❌ No signature verification
    // ❌ No fallback if call fails
    
    resolution.proposedOutcome = uint8(delphMarket.outcomeIndex);
    resolution.confidence = delphMarket.resolutionConfidence;
}

// LMSRMarket.sol - Line ~735
address public immutable oracle;  // ❌ Cannot be changed!

function finalize(uint8 winning, bool invalid_) external {
    if (msg.sender != oracle) { revert LMSR_OnlyOracle(); }
    // If oracle breaks, market is PERMANENTLY stuck
}
```

**Recommendation:**

**Add Fallback Oracle Mechanism:**

```solidity
// Oracle.sol
address public primaryOracle;  // DelphAI
address public fallbackOracle;  // Chainlink or manual admin

uint256 public constant ORACLE_TIMEOUT = 7 days;

function requestResolve(address market) external {
    try delphAI.getMarket(delphAIMarketId) returns (Market memory m) {
        // Primary oracle succeeded
        resolution.proposedOutcome = uint8(m.outcomeIndex);
        resolution.usedFallback = false;
    } catch {
        // Primary failed, use fallback
        require(
            block.timestamp >= tradingEndsAt + ORACLE_TIMEOUT,
            "Wait for timeout before fallback"
        );
        resolution.usedFallback = true;
        // Admin can manually set outcome
    }
}
```

**Add Emergency Withdrawal:**

```solidity
// LMSRMarket.sol
uint256 public constant EMERGENCY_TIMEOUT = 30 days;

function emergencyWithdraw() external nonReentrant {
    require(state == MarketState.Resolving, "Must be resolving");
    require(
        block.timestamp >= tradingEndsAt + EMERGENCY_TIMEOUT,
        "Must wait 30 days"
    );
    
    // Pro-rata refund if oracle never responds
    state = MarketState.Finalized;
    invalid = true;
    
    // Set snapshot for pro-rata calculation
    uint256 totalShares = 0;
    for (uint8 i = 0; i < outcomeCount; i++) {
        totalShares += shares[i].unwrap();
    }
    totalSharesAtFinalization = totalShares;
    availableCollateralAtFinalization = _availableCollateral();
}
```

---

## High Severity Issues

### 🟠 HIGH-1: No Slippage Protection on Direct Market Calls

**Contract:** `LMSRMarket.sol`  
**Severity:** HIGH  
**Likelihood:** High  
**Impact:** User funds lost to sandwich attacks

**Description:**

The `Router` contract has slippage protection (`maxCost`, `minPayout` parameters), but users can bypass the Router and call `LMSRMarket.buy()` / `sell()` directly with NO slippage protection. This allows MEV bots to sandwich attack users.

**Vulnerable Code:**

```solidity
// LMSRMarket.sol - Line ~480
function buy(uint8 outcomeId, uint256 deltaSharesRaw) external nonReentrant {
    // ❌ NO slippage protection!
    (UD60x18 tradeCost, UD60x18 feeAmount, UD60x18 totalCost) = _quoteBuy(...);
    
    // User pays whatever the current price is
    collateral.safeTransferFrom(msg.sender, address(this), totalPaid);
}

// Router.sol - Line ~88 (HAS protection)
function buyWithPermit(..., uint256 maxCost, ...) external {
    (,, uint256 previewTotal) = market.previewBuy(outcome, shareDelta);
    if (previewTotal > maxCost) {
        revert Router_SlippageExceeded(maxCost, previewTotal);
    }
    // ✅ Router is safe
}
```

**Attack Scenario:**

```
1. Alice submits: LMSRMarket.buy(outcome=1, shares=100)
2. MEV bot sees tx in mempool
3. Bot front-runs: buy(outcome=1, shares=50) → price increases
4. Alice's tx executes at higher price (pays more than expected)
5. Bot back-runs: sell(outcome=1, shares=50) → price decreases
6. Bot profits from Alice's slippage
```

**Recommendation:**

**Option A: Add Deadline to Market Functions**

```solidity
function buy(
    uint8 outcomeId,
    uint256 deltaSharesRaw,
    uint256 maxCost,
    uint256 deadline
) external nonReentrant {
    require(block.timestamp <= deadline, "Transaction expired");
    
    (,, uint256 totalCost) = _quoteBuy(outcomeId, deltaShares);
    require(totalCost <= maxCost, "Slippage exceeded");
    
    // Execute trade
}
```

**Option B: Force Router Usage**

```solidity
bool public directTradingAllowed = false;

function buy(...) external {
    if (!directTradingAllowed) {
        require(msg.sender == router, "Must use Router for slippage protection");
    }
    // Only Router or admin-enabled direct trading
}
```

---

### 🟠 HIGH-2: Market Lock-up with No Emergency Exit

**Contract:** `LMSRMarket.sol`, `Oracle.sol`  
**Severity:** HIGH  
**Likelihood:** Medium  
**Impact:** Permanent fund lock-up

**Description:**

If the Oracle fails to finalize a market (bug, DOS, admin abandonment), users' funds are permanently locked with no recovery mechanism. Markets cannot be cancelled or force-finalized.

**Vulnerable Code:**

```solidity
// LMSRMarket.sol
function finalize(uint8 winning, bool invalid_) external nonReentrant {
    if (msg.sender != oracle) { revert LMSR_OnlyOracle(); }
    // ❌ ONLY oracle can finalize - no alternative!
}

function redeem(...) external {
    if (state != MarketState.Finalized) { revert LMSR_MarketNotFinalized(); }
    // ❌ Cannot redeem until finalized
}

// No emergency withdrawal function exists!
```

**Recommendation:**

Add emergency timeout mechanism (already provided in CRITICAL-4 fix above).

---

### 🟠 HIGH-3: Router Upgrade Risk

**Contract:** `Outcome1155.sol`  
**Severity:** HIGH  
**Likelihood:** Low (requires malicious admin)  
**Impact:** All shares stolen

**Description:**

The `router` address receives auto-approval from ALL users. Admin can instantly change the router to a malicious contract and steal all shares.

**Vulnerable Code:**

```solidity
// Outcome1155.sol - Line ~256
function isApprovedForAll(address account, address operator) public view override {
    if (operator == router) {
        return true;  // Auto-approve router for EVERYONE
    }
    return super.isApprovedForAll(account, operator);
}

function setRouter(address newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
    router = newRouter;  // ❌ Instant change, no timelock!
    emit RouterUpdated(newRouter);
}
```

**Attack Scenario:**

```
1. Admin calls setRouter(maliciousContract)
2. maliciousContract is now approved for ALL users
3. Attacker calls maliciousContract.stealAllShares()
4. maliciousContract transfers all shares to attacker
5. All users lose their positions
```

**Recommendation:**

**Add Timelock for Router Changes:**

```solidity
address public router;
address public pendingRouter;
uint256 public routerChangeTime;
uint256 public constant ROUTER_TIMELOCK = 48 hours;

function proposeRouterChange(address newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
    pendingRouter = newRouter;
    routerChangeTime = block.timestamp + ROUTER_TIMELOCK;
    emit RouterChangeProposed(newRouter, routerChangeTime);
}

function executeRouterChange() external {
    require(block.timestamp >= routerChangeTime, "Timelock active");
    require(pendingRouter != address(0), "No pending change");
    
    router = pendingRouter;
    pendingRouter = address(0);
    emit RouterUpdated(router);
}

function isApprovedForAll(address account, address operator) public view override {
    if (operator == router) {
        return true;
    }
    // Don't approve pending router until timelock passes
    return super.isApprovedForAll(account, operator);
}
```

---

### 🟠 HIGH-4: Fee Withdrawal Confusion

**Contract:** `LMSRMarket.sol`, `Treasury.sol`  
**Severity:** HIGH  
**Likelihood:** Medium  
**Impact:** Fee theft, loss of creator/oracle revenue

**Description:**

The Factory is granted `TREASURY_ROLE` on markets, allowing it to withdraw fees via `withdrawFees()`. But fees are also meant to be swept to Treasury via `sweepFeesToTreasury()` for proper distribution. This creates competing fee extraction paths.

**Vulnerable Code:**

```solidity
// LMSRMarket.sol - Line ~70
constructor(...) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);  // msg.sender = Factory
    _grantRole(TREASURY_ROLE, msg.sender);  // ❌ Factory can withdraw fees!
    treasury = treasury_;  // Different address than TREASURY_ROLE holder
}

function withdrawFees(address receiver, uint256 amount) 
    external 
    onlyRole(TREASURY_ROLE)  // Factory can call this
{
    feeReserve -= amount;
    collateral.safeTransfer(receiver, amount);
    // ❌ Fees go directly to receiver, bypassing Treasury split!
}

function sweepFeesToTreasury(uint256 amount) 
    external 
    onlyRole(DEFAULT_ADMIN_ROLE) 
{
    collateral.approve(treasury, amount);
    ITreasury(treasury).collect(marketId, address(collateral), amount);
    // ✅ Proper Treasury collection with protocol/creator/oracle split
}
```

**Attack Scenario:**

```
1. Market collects 1000 USDT in fees
2. Factory admin calls withdrawFees(adminAddress, 1000 USDT)
3. Fees go directly to admin, bypassing Treasury
4. Market creators get 0 USDT (expected 600 USDT)
5. Oracle gets 0 USDT (expected 100 USDT)
6. Protocol gets 1000 USDT (expected only 300 USDT)
```

**Recommendation:**

**Remove TREASURY_ROLE from Factory:**

```solidity
constructor(...) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    // ❌ Remove this line:
    // _grantRole(TREASURY_ROLE, msg.sender);
    
    // Grant TREASURY_ROLE to actual Treasury contract
    _grantRole(TREASURY_ROLE, treasury_);
}

// Only Treasury contract can withdraw (for internal accounting)
function withdrawFees(address receiver, uint256 amount) 
    external 
    onlyRole(TREASURY_ROLE)  // Only Treasury contract
{
    // Used by Treasury for its own operations only
}

// Admin must use sweepFeesToTreasury for proper distribution
```

---

## Medium Severity Issues

### 🟡 MED-1: Dispute Bond Manipulation via Wash Trading

**Contract:** `Oracle.sol`  
**Severity:** MEDIUM

Dispute bonds are calculated as 1% of market volume. Attacker can inflate volume via wash trading (buy and sell to self) to make disputes prohibitively expensive.

**Fix:** Cap dispute bond at absolute amount or use TVL instead of volume.

---

### 🟡 MED-2: Single Dispute Per Market

**Contract:** `Oracle.sol`  
**Severity:** MEDIUM

Only the first disputer can challenge a resolution. Multiple people cannot pool funds or show support for alternative outcomes.

**Fix:** Allow multiple disputes with cumulative bonding.

---

### 🟡 MED-3: Hardcoded Confidence Threshold

**Contract:** `Oracle.sol`  
**Severity:** MEDIUM

`MIN_CONFIDENCE_THRESHOLD = 80` is hardcoded. If DelphAI consistently returns >80% confidence, disputes become impossible.

**Fix:** Make threshold governance-adjustable.

---

### 🟡 MED-4: Low Minimum Liquidity Parameter

**Contract:** `MarketFactory.sol`, `LMSRMarket.sol`  
**Severity:** MEDIUM

`MIN_LIQUIDITY_PARAMETER = 100e18` allows markets with low liquidity (b=100), making prices highly volatile and easy to manipulate.

**Fix:** Increase minimum to 500e18 or 1000e18 for production.

---

### 🟡 MED-5: Unbounded getAllMarkets() Function

**Contract:** `MarketFactory.sol`  
**Severity:** MEDIUM

`getAllMarkets()` returns entire array, which could cause OOM as markets grow.

**Fix:** Remove `getAllMarkets()`, only use paginated `getMarkets(offset, limit)`.

---

### 🟡 MED-6: Markets Require Keeper for State Progression

**Contract:** `LMSRMarket.sol`  
**Severity:** MEDIUM

`requestResolve()` and `finalize()` are permissionless but require someone to call them. If no keeper calls these functions, markets never progress.

**Fix:** Add incentive mechanism (e.g., caller receives small fee).

---

## Low Severity Issues

### 🟢 LOW-1: Decimal Overflow Edge Case

**Contract:** `LMSRMarket.sol`  
**Severity:** LOW

If `collateralDecimals > 18`, `_toUD60x18()` will underflow. No known ERC20 uses >18 decimals, but add check for safety.

---

### 🟢 LOW-2: Fee Frontrunning

**Contract:** `LMSRMarket.sol`  
**Severity:** LOW

Admin can call `setFee()` and change fees instantly, affecting transactions in mempool.

**Fix:** Add timelock or make fee changes only apply to future blocks.

---

### 🟢 LOW-3: Timestamp Manipulation

**Contract:** All contracts  
**Severity:** LOW

Miners can manipulate `block.timestamp` by ±15 seconds. Minimal impact for prediction markets with hour/day resolution times.

---

### 🟢 LOW-4: Rounding Dust

**Contract:** `LMSRMarket.sol`, `Treasury.sol`  
**Severity:** LOW

Integer division in fee splits and pro-rata calculations can leave dust amounts in contracts.

**Fix:** Add admin function to sweep dust.

---

## Positive Findings

The audit also identified several **excellent security practices**:

✅ **Strong Reentrancy Protection**
- All external functions use `nonReentrant` modifier
- Proper CEI (Checks-Effects-Interactions) pattern
- State changes before external calls

✅ **Robust Access Control**
- Role-based permissions using OpenZeppelin AccessControl
- Clear separation of admin, pauser, creator, treasury roles
- No privilege escalation paths (except the issues noted)

✅ **Safe Math Operations**
- Solidity 0.8.30 built-in overflow protection
- PRBMath library for fixed-point arithmetic
- Exponential overflow checks via `uEXP_MAX_INPUT`

✅ **Well-Designed LMSR Algorithm**
- Standard logarithmic market scoring rule implementation
- Bounded outcome count (2-10 prevents gas issues)
- Proper cost function with invariant checks

✅ **Good Fee Accounting**
- `feeReserve` tracked separately from trading collateral
- Rounding handled correctly (dust goes to protocol)
- Treasury split logic is sound

✅ **Proper State Machine**
- Clear market lifecycle (Trading → Resolving → Finalized)
- State transitions properly guarded
- Cannot skip states or revert

✅ **Security Awareness**
- Team correctly removed `multicall()` delegatecall vulnerability
- Good use of try-catch for permit griefing prevention
- Comprehensive error messages

✅ **Code Quality**
- Well-structured, modular design
- Extensive comments and documentation
- Use of industry-standard libraries (OpenZeppelin, PRBMath)

---

## Recommendations

### Immediate Actions (Before Mainnet)

1. **Fix CRITICAL-1:** Add 1-hour freeze period before resolution
2. **Fix CRITICAL-2:** Implement 3/5 multisig for dispute resolution
3. **Fix CRITICAL-3:** Remove Factory admin role after deployment
4. **Fix CRITICAL-4:** Add emergency withdrawal after 30-day timeout
5. **Fix HIGH-1:** Add slippage parameters to buy/sell functions
6. **Fix HIGH-3:** Add 48-hour timelock for router changes
7. **Fix HIGH-4:** Remove TREASURY_ROLE from Factory

### Short-Term Improvements (Week 1)

1. Increase `MIN_LIQUIDITY_PARAMETER` to 500e18
2. Add multi-dispute support
3. Implement governance-adjustable confidence threshold
4. Add keeper incentives for requestResolve/finalize
5. Remove `getAllMarkets()` function

### Long-Term Enhancements (Post-Launch)

1. Integrate Chainlink as fallback oracle
2. Add flash loan protection (same-block detection)
3. Implement on-chain governance for parameters
4. Add circuit breakers for unusual trading activity
5. Develop formal verification for LMSR math
6. Consider upgradeability pattern for future improvements

---

## Contract-by-Contract Analysis

### MockUSDT.sol

**Purpose:** Test ERC20 token with faucet functionality

**Security Grade:** B

**Issues:**
- LOW: Faucet cooldown can be manipulated by miners (timestamp)
- NOTE: For MAINNET, use REAL USDT, not MockUSDT
- Owner can mint unlimited tokens (acceptable for test token)

**Positive:**
- Standard ERC20 implementation
- Simple, minimal attack surface
- Clear ownership model

**Recommendation for Mainnet:**
```solidity
// DO NOT use MockUSDT on mainnet
// Use real USDT: 0x55d398326f99059fF775485246999027B3197955 (BNB Chain)
// Or deploy new MockUSDT with:
// 1. Renounced ownership (no mint)
// 2. Fixed supply
// 3. Remove faucet
```

---

### Outcome1155.sol

**Purpose:** ERC1155 for outcome share tokens

**Security Grade:** B-

**Issues:**
- CRITICAL-3: Factory has admin role (can mint infinite shares)
- HIGH-3: Router upgrade risk (instant approval change)
- MED: String manipulation in URI could DOS with large input

**Positive:**
- Standard ERC1155 implementation
- Role-based minting (when properly configured)
- Auto-approval for router (enables gasless trading)

---

### Treasury.sol

**Purpose:** Fee collection and distribution

**Security Grade:** B+

**Issues:**
- Minor reentrancy ordering (collect() transfers before state update)
- No check that registered market is actually a contract

**Positive:**
- Excellent fee split logic with rounding handling
- Separate balances per market and token
- Proper role separation (protocol, creator, oracle)
- NonReentrant on all fund movements

---

### Router.sol

**Purpose:** Gasless trading aggregator

**Security Grade:** A-

**Issues:**
- Multicall removed (good!)
- Slippage protection only on Router, not Market

**Positive:**
- EIP-2612 permit support
- Try-catch for permit griefing prevention
- Slippage protection (maxCost, minPayout)
- Proper ERC1155 receiver implementation
- NonReentrant on all functions

---

### Oracle.sol

**Purpose:** DelphAI resolution bridge

**Security Grade:** C

**Issues:**
- CRITICAL-1: Oracle front-running
- CRITICAL-2: Centralized dispute resolution
- CRITICAL-4: Single point of failure
- MED-1: Wash trading to inflate dispute bonds
- MED-2: Single dispute limit
- MED-3: Hardcoded confidence threshold

**Positive:**
- Dispute mechanism (better than none)
- 24-hour dispute window
- Confidence-based disputing
- NonReentrant protection

---

### MarketFactory.sol

**Purpose:** Deploy LMSR markets

**Security Grade:** B

**Issues:**
- CRITICAL-3: Admin role on Outcome1155
- MED-4: Low minimum liquidity
- MED-5: Unbounded getAllMarkets()
- Markets can't be cancelled after creation

**Positive:**
- Clean factory pattern
- Proper market registration across all contracts
- Good validation of parameters
- Pagination support

---

### LMSRMarket.sol

**Purpose:** Core LMSR AMM logic

**Security Grade:** B-

**Issues:**
- CRITICAL-1: Can be front-run via oracle
- HIGH-1: No slippage protection
- HIGH-2: No emergency exit
- HIGH-4: Fee withdrawal confusion
- MED-6: Requires keeper

**Positive:**
- Excellent LMSR implementation
- PRBMath for safety
- Overflow protection on exp()
- Decimal normalization
- Proper state machine
- NonReentrant everywhere
- Fee reserve separation

---

## Testing Recommendations

Before mainnet deployment, implement the following test suite:

### Unit Tests (100% coverage required)

```solidity
// Test oracle front-running
function testOracleFrontRun() public {
    // 1. DelphAI resolves to outcome 2
    // 2. Attacker reads outcome
    // 3. Attacker buys outcome 2 before tradingEndsAt
    // 4. Attacker calls requestResolve()
    // 5. Verify attacker profits
}

// Test sandwich attack
function testSandwichAttack() public {
    // 1. User submits buy()
    // 2. Attacker front-runs with buy()
    // 3. User's buy executes at higher price
    // 4. Attacker back-runs with sell()
    // 5. Verify attacker profits
}

// Test admin dispute manipulation
function testMaliciousDisputeResolution() public {
    // 1. Create disputed market
    // 2. Admin rules incorrectly
    // 3. Verify bonds slashed wrongly
}

// Test emergency withdrawal
function testEmergencyWithdrawal() public {
    // 1. Market in Resolving state
    // 2. Wait 30 days
    // 3. Call emergencyWithdraw()
    // 4. Verify pro-rata refund works
}
```

### Integration Tests

- Test full market lifecycle with oracle
- Test Router gasless transactions with Biconomy
- Test Treasury fee distribution
- Test dispute flow end-to-end

### Stress Tests

- Create 1000 markets and test gas limits
- Test with maximum shares (type(uint256).max)
- Test with minimum liquidity (100e18)
- Test fee extraction race conditions

### Fuzzing (Foundry)

```bash
forge test --fuzz-runs 10000
```

Focus fuzzing on:
- LMSR cost function (random buy/sell sequences)
- Fee calculations (random amounts)
- Decimal conversions (random decimals)
- Token ID encoding (random market IDs)

---

## Deployment Checklist

Before deploying to BNB Mainnet:

### Pre-Deployment

- [ ] Fix all CRITICAL issues
- [ ] Fix all HIGH issues
- [ ] Consider MEDIUM issue fixes
- [ ] Run full test suite (100% coverage)
- [ ] Run fuzzing (10,000+ runs)
- [ ] Deploy to testnet and test for 1 week
- [ ] Get community review of fixes
- [ ] Prepare emergency response plan

### Deployment Day

- [ ] Deploy with 3/5 multisig as admin
- [ ] Verify all contracts on BscScan
- [ ] Test all functions on mainnet
- [ ] Start with small liquidity markets
- [ ] Monitor first 24 hours closely

### Post-Deployment

- [ ] Set up monitoring (Tenderly, Defender)
- [ ] Create bug bounty program
- [ ] Document all admin functions
- [ ] Create emergency response runbook
- [ ] Schedule regular audits (quarterly)

---

## Conclusion

The Predik smart contracts demonstrate **strong engineering fundamentals** with proper use of security patterns, role-based access control, and reentrancy protection. The LMSR implementation is mathematically sound and well-tested.

However, **CRITICAL economic and game-theoretic vulnerabilities** exist that MUST be fixed before mainnet deployment:

1. Oracle front-running enables risk-free arbitrage
2. Centralized dispute resolution creates trust issues
3. Admin privilege escalation could compromise entire system
4. Single oracle dependency creates system-wide failure risk

**VERDICT:** ⚠️ **NOT READY FOR MAINNET**

With the recommended fixes implemented, the contracts would be suitable for production deployment. The team has shown security awareness (removing delegatecall) and should be able to implement these fixes effectively.

**Estimated Fix Time:** 2-3 weeks for CRITICAL issues, 1 month for all HIGH issues.

---

**Audit Complete**  
**Next Steps:** Implement fixes, re-audit, deploy to testnet, community review, mainnet launch.

---

*This audit was conducted using automated analysis, manual code review, and sequential thinking processes. For production deployment, consider engaging a professional audit firm (OpenZeppelin, Trail of Bits, Consensys Diligence) for formal verification.*
