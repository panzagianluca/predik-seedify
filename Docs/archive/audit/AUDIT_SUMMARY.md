# Smart Contract Audit - Executive Summary

**Date:** October 24, 2025  
**Status:** 🔴 **5 CRITICAL ISSUES FOUND - DO NOT DEPLOY**

---

## 🚨 Critical Issues (Fix Before Deployment)

### 1. 🔴 USDT Trading Will Fail - Decimal Normalization Not Used
**Contract:** LMSRMarket.sol  
**Impact:** All trades with 6-decimal tokens (USDT) will fail or produce wrong amounts

**Problem:**
- Helper functions `_toUD60x18()` and `_fromUD60x18()` exist but are NEVER called
- Contract treats USDT (6 decimals) as if it has 18 decimals
- 1 USDT (1e6) will be treated as 0.000001 shares

**Fix:** Use normalization functions in buy(), sell(), and all preview functions

---

### 2. 🔴 Double Fee Splitting
**Contracts:** MarketFactory, LMSRMarket, Treasury  
**Impact:** Fees are charged twice, oracle fees are missing from calculation

**Problem:**
- MarketFactory calculates fee as (protocol + creator) BPS - excludes oracle
- LMSRMarket charges this fee on trades
- Treasury splits fees again into 3 parts (protocol/creator/oracle)
- Result: Confusing math, oracle fee missing from MarketFactory

**Fix:** Let Treasury handle all fee splitting, OR fix MarketFactory to include oracle

---

### 3. 🔴 Wrong Market ID Sent to Oracle
**Contracts:** MarketFactory, Oracle  
**Impact:** Resolution will fetch wrong DelphAI market, apply wrong outcome

**Problem:**
- Three ID systems: Our internal IDs, DelphAI IDs, Oracle mappings
- MarketFactory passes OUR ID to Oracle.registerMarket()
- Oracle expects DelphAI market ID
- When resolution is requested, wrong DelphAI market is queried

**Fix:** Create DelphAI market first in factory, pass DelphAI's ID to Oracle

---

### 4. 🔴 Router Multicall Allows Arbitrary Code Execution
**Contract:** Router.sol  
**Impact:** Attacker can gain admin access via delegatecall

**Problem:**
```solidity
function multicall(bytes[] calldata calls) external {
    for (uint256 i = 0; i < calls.length; i++) {
        address(this).delegatecall(calls[i]);  // DANGEROUS!
    }
}
```
- Delegatecall executes in Router's context
- Can call admin functions, transfer ownership, etc.

**Fix:** Remove multicall entirely OR use call() instead of delegatecall()

---

### 5. 🔴 Liquidity Parameter Expects 100 Trillion USDT
**Contract:** MarketFactory.sol  
**Impact:** No one can create markets

**Problem:**
```solidity
uint256 public constant MIN_LIQUIDITY_PARAMETER = 100e18; // 100 USDT minimum
```
- This is 100 * 10^18 = 100,000,000,000,000,000,000
- For USDT (6 decimals): 1 USDT = 1e6
- So MIN = 100e18 / 1e6 = 100 trillion USDT

**Fix:** Clarify that liquidity parameter is in UD60x18 (dimensionless), separate from collateral amount

---

## ⚠️ High Severity Issues

### 6. 🟠 Reentrancy Guard Bypass Possible
**Contract:** Router.sol  
**Impact:** Security vulnerability if multicall is kept

External functions have `nonReentrant` but internal implementations don't. Delegatecall multicall can bypass guards.

**Fix:** Add guards to internal functions OR remove multicall

---

### 7. 🟠 Documentation Severely Outdated
**Files:** LMSR_RESOLUTION_IMPLEMENTATION.md, ARCHITECTURE.md  
**Impact:** Integration errors, confusion

- Docs say LMSRMarket constructor has 8 params, actually has 9
- Missing documentation for several implemented functions
- Still references removed Myriad/Polkamarkets dependencies

**Fix:** Update all docs to match actual code

---

## 📊 Audit Statistics

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 5 | Must fix |
| 🟠 HIGH | 2 | Strongly recommended |
| 🟡 MEDIUM | 3 | Recommended |
| 🔵 LOW | 2 | Optional |
| 📄 DOCS | 3 | Optional |

---

## ✅ What's Good

Despite the critical issues, the architecture is **fundamentally sound**:

✅ Good separation of concerns (Market/Oracle/Treasury/Factory)  
✅ Comprehensive test coverage (100+ tests)  
✅ Security-conscious design (AccessControl, ReentrancyGuard, SafeERC20)  
✅ Well-documented intentions  
✅ PRBMath for safe fixed-point arithmetic

**The issues are implementation bugs, not design flaws.**

---

## 🛠️ Fix Priority

### Must Do (Before Any Deployment):
1. ✅ Fix decimal normalization in LMSRMarket
2. ✅ Fix fee splitting (choose one approach)
3. ✅ Fix Oracle market ID handling
4. ✅ Remove or fix Router multicall
5. ✅ Fix liquidity parameter validation

### Should Do (Before Production):
6. ⚠️ Fix reentrancy guard placement
7. ⚠️ Update all documentation

### Nice to Have:
- Add permit failure events
- Add Treasury oracle update event
- Lower MockUSDT faucet amount

---

## 🧪 Testing Needed After Fixes

1. **Decimal handling tests** - Verify 6-decimal USDT works correctly
2. **Fee splitting tests** - Verify single, correct fee application
3. **Oracle integration tests** - End-to-end resolution flow
4. **Security tests** - Verify multicall cannot exploit admin functions

---

## 📋 Full Report

See `CONTRACT_AUDIT_REPORT.md` for detailed analysis, code examples, and fix recommendations for each issue.

---

## 🚦 Deployment Readiness: 🔴 NOT READY

**Recommendation:** Fix critical issues 1-5 before any deployment, even to testnet.

**Estimated Fix Time:**
- Critical fixes: 4-6 hours
- High severity fixes: 2-3 hours
- Testing: 3-4 hours
- **Total: ~10-12 hours** to production-ready state

---

**Questions?** Review the full audit report for detailed explanations and fix recommendations.
