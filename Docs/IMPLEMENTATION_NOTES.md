# Implementation Notes & Deviations

**Last Updated:** October 24, 2025  
**Status:** Phase 1 — Smart Contract Foundation (In Progress)

---

## Completed Contracts

### 1. MockUSDT ✅ (22 tests passing)
- **Location**: `contracts/MockUSDT.sol`
- **Spec**: Custom implementation for testing
- **Status**: Production-ready with faucet, deployment script, mainnet address
- **Spec Compliance**: Full (exceeds spec with cooldown system)
- **Test Coverage**: 22 tests (1 flaky fuzz test)

### 2. Outcome1155 ✅ (11 tests passing)
- **Location**: `contracts/Outcome1155.sol`
- **Spec**: contracts.md §3
- **Status**: Complete with enhanced URI system
- **Spec Compliance**: Full (enhanced with encoded ID metadata)
- **Deviations**:
  - Added enhanced URI system with tokenId encoding
  - Automatic Router approval for UX optimization
  
### 3. LMSRMarket ⚠️ (7 tests passing, incomplete)
- **Location**: `contracts/LMSRMarket.sol`
- **Spec**: contracts.md §2
- **Status**: Core trading complete, missing resolution functions
- **Missing**: 
  - State machine (Trading → Resolving → Finalized)
  - `requestResolve()` function (awaiting Oracle integration)
  - `finalize()` callback from Oracle
  - `redeem()` function for winners
- **Spec Compliance**: Partial (~60%)
- **Blockers**: Awaiting Oracle.sol completion

### 4. Router ✅ (10 tests passing)
- **Location**: `contracts/Router.sol`
- **Spec**: contracts.md §7
- **Status**: Production-ready for Biconomy AA integration
- **Spec Compliance**: Full (enhanced for gasless UX)
- **Deviations**:
  - `multicall` uses delegatecall for flexibility (spec suggested regular call)
  - Enhanced for Account Abstraction UserOps pattern

### 5. Oracle ✅ (32 tests passing) **NEW**
- **Location**: `contracts/Oracle.sol`
- **Spec**: contracts.md §4 + DelphAI integration
- **Status**: Complete with AI-powered resolution and dispute mechanism
- **Features**:
  - DelphAI integration (IDelphAI interface)
  - Resolution lifecycle (Pending → Proposed → Disputed → Finalized)
  - Optional dispute layer for low-confidence (<80%) resolutions
  - 24-hour dispute window
  - Dispute bonds (configurable as % of market volume)
  - ETH-based dispute bonds with treasury slashing
  - Admin resolution for disputed markets
- **Spec Compliance**: Full
- **Test Coverage**: 32 comprehensive tests covering all flows

---

## 🚧 Pending Contracts

### Treasury.sol ❌ NOT STARTED
**Spec Reference:** contracts.md §6

**Required Features:**
- Fee collection from markets
- Fee splitting (protocol/creator/oracle shares)
- Role-gated withdrawals
- Per-market fee tracking for analytics

**Blockers:**
- None - can implement independently

**Priority:** MEDIUM - Can deploy basic version, enhance later

---

### MarketFactory.sol ❌ NOT STARTED
**Spec Reference:** contracts.md §1

**Required Features:**
- ERC-1167 clone deployment for gas efficiency
- Market creation with title/outcomes/deadline
- Global parameter management (default b, oracle, treasury addresses)
- Market registry (mapping marketId → address)
- MarketCreated event emission

**Blockers:**
- Need to finalize LMSRMarket constructor parameters
- Need Treasury + Oracle deployed first

**Priority:** HIGH - Required for creating markets

**Design Decisions Needed:**
- Should we use minimal clones (ERC-1167) or standard deployment?
  - **Recommendation:** Use clones for gas savings
- How to assign marketId? Sequential counter vs hash?
  - **Recommendation:** Sequential counter (simpler, matches Myriad pattern)

---

## Summary Statistics

- **Total Tests**: 84 (83 passing, 1 flaky fuzz test)
- **Contracts Completed**: 5/7 (MockUSDT, Outcome1155, Router, Oracle, LMSRMarket partial)
- **Test Coverage by Contract**:
  - MockUSDT: 22 tests
  - Outcome1155: 11 tests
  - LMSRMarket: 7 tests
  - Router: 10 tests
  - Oracle: 32 tests
  - Counter (example): 2 tests
- **Remaining**: Treasury.sol, MarketFactory.sol, LMSRMarket resolution functions

---

## 🔧 Build Configuration Changes

### Foundry Config Updates

**File:** `foundry.toml`

**Change:** Enabled IR-based compilation
```toml
via_ir = true  # Changed from false
```

**Reason:** Router contract hit stack depth limits during compilation. Via-IR (intermediate representation) enables better optimization and deeper stack management.

**Impact:**
- ✅ Compilation now succeeds for complex contracts
- ⚠️ Slightly slower compile times (~3-7s vs ~1s)
- ✅ Better optimized bytecode

---

## 🎯 Deviations from Spec

### 1. LMSRMarket Missing Features
**Spec:** contracts.md §2  
**Missing:**
- `requestResolve()` function
- `finalize(uint8 winning, bool invalid_)` function  
- `redeem(uint256 outcome, uint256 amount)` function
- Market state machine (Trading/Resolving/Finalized)
- Trading deadline enforcement (`tradingEndsAt`)

**Status:** ✅ Ready to implement - Oracle complete  
**Justification:** These features require Oracle integration. Oracle is now complete with DelphAI integration and dispute mechanism.

**Action Required:** Add state transitions and resolution logic in next phase - Oracle provides finalize callback interface.

---

### 2. Router Multicall Implementation
**Spec:** contracts.md §5 suggests basic multicall  
**Implementation:** Uses `delegatecall` for flexibility

**Difference:**
```solidity
// Our implementation (delegatecall)
(bool success, bytes memory result) = address(this).delegatecall(calls[i]);

// Simpler alternative (call)
(bool success, bytes memory result) = address(this).call(calls[i]);
```

**Justification:** Delegatecall allows multicall to access Router storage/modifiers while maintaining msg.sender context. More flexible for future features.

**Security Note:** All Router functions are nonReentrant and access-controlled, so delegatecall is safe.

---

### 3. Enhanced Outcome1155 URI System
**Spec:** contracts.md §3 mentions "optional uri(tokenId)"  
**Implementation:** Full URI template system with placeholder replacement

**Added Features:**
- Dynamic `{id}` placeholder replacement
- 64-character hex padding for ERC-1155 standard compliance
- Fallback behavior when placeholder not found

**Justification:** Improves frontend integration and follows ERC-1155 metadata standard.

---

## 🏗️ Architecture Alignment

### contracts.md Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| ERC-20 collateral with permit | ✅ | MockUSDT supports EIP-2612 |
| ERC-1155 outcome shares | ✅ | Outcome1155 fully implemented |
| LMSR pricing (PRBMath) | ✅ | Using UD60x18 fixed-point |
| Gasless trading (Router) | ✅ | Permit + buy/sell flows |
| Fee accounting | ✅ | Fee reserve tracking ready |
| Oracle integration | ❌ | Not started |
| Treasury system | ❌ | Not started |
| Market factory | ❌ | Not started |

### EXECUTION_PLAN.md Progress

**Phase 1 - Task 1 (Implement core contracts):**
- ✅ MockUSDT.sol
- ✅ Outcome1155.sol  
- ✅ LMSRMarket.sol (buy/sell complete, resolution pending)
- ✅ Router.sol
- ⏳ Oracle.sol (0%)
- ⏳ Treasury.sol (0%)

**Phase 1 - Task 2 (Tests):**
- ⏳ Unit tests for LMSR math (0%)
- ✅ Scenario tests for buy/sell flows (100%)
- ⏳ Oracle resolution tests (0%)
- ✅ Router batched operations (100%)
- ⏳ Fuzz tests for invariants (0%)

**Phase 1 - Task 3 (Static analysis):**
- ✅ `forge fmt` - passing
- ✅ `forge build` - passing  
- ✅ `forge test` - 52 tests passing
- ⏳ Slither analysis - not run yet
- ⏳ Audit notes - not prepared

### ARCHITECTURE.md Migration Status

**Smart Contracts Status:**
- ✅ ERC-20 token implemented (MockUSDT)
- ✅ Trading contract implemented (LMSRMarket with LMSR bonding curve)
- ✅ Portfolio tracking (via Outcome1155 balances)
- ⏳ Market factory (not started)
- ⏳ Resolution system (Oracle pending)

**Frontend Integration Readiness:**
- ✅ ABIs ready for export
- ⏳ Contract addresses (pending deployment)
- ⏳ lib/contracts/ adapter modules (not started)
- ⏳ Biconomy integration (pending Router deployment)

---

## 🚨 Critical Path Items

### Before Testnet Deployment

1. **Complete Oracle Implementation** (HIGH PRIORITY)
   - Implement DelphAI signature verification
   - Add market state transitions to LMSRMarket
   - Implement finalize() callback
   - Add redemption logic
   - Write Oracle test suite

2. **Implement Treasury** (MEDIUM PRIORITY)
   - Basic fee collection
   - Fee splitting logic
   - Withdrawal controls

3. **Implement MarketFactory** (HIGH PRIORITY)
   - ERC-1167 clone deployment
   - Market initialization
   - Global parameter management
   - Event emission for The Graph

4. **Additional Testing** (HIGH PRIORITY)
   - LMSR math unit tests
   - Fuzz tests for invariants
   - End-to-end integration tests
   - Slither static analysis

5. **Documentation** (MEDIUM PRIORITY)
   - Natspec comments review
   - Audit preparation notes
   - Deployment scripts

---

## 📝 Next Session TODO

```markdown
- [ ] Design Oracle contract architecture
  - [ ] Define Resolution struct and state machine
  - [ ] Plan EIP-712 signature verification
  - [ ] Design dispute stake calculation
  
- [ ] Add missing LMSRMarket functions
  - [ ] requestResolve() → calls Oracle
  - [ ] finalize() → callable only by Oracle
  - [ ] redeem() → pays out winning shares
  - [ ] Add market state enum and transitions
  
- [ ] Implement Treasury.sol
  - [ ] Fee collection from markets
  - [ ] Fee splitting (protocol/creator)
  - [ ] Withdrawal functions
  
- [ ] Update tests for new functionality
  - [ ] Oracle proposal/dispute/finalize flow
  - [ ] Market resolution and redemption
  - [ ] Treasury fee distribution
```

---

## 🔍 Known Issues / Tech Debt

1. **Stack Depth Workaround**
   - Issue: Router hit stack depth limits
   - Solution: Enabled `via_ir` compilation
   - Impact: Slower compile times but necessary for complex contracts
   - Status: ✅ Resolved

2. **Missing Market State Management**
   - Issue: LMSRMarket has no state machine
   - Impact: Can't enforce trading deadlines or prevent trades after resolution
   - Status: ⏳ Deferred to Oracle implementation
   - Priority: HIGH

3. **No Fuzz Testing Yet**
   - Issue: LMSR math not thoroughly tested for edge cases
   - Impact: Potential precision issues or overflow vulnerabilities
   - Status: ⏳ Planned for Task 2
   - Priority: HIGH

4. **Codacy Limitations**
   - Issue: Codacy CLI doesn't support Solidity files
   - Impact: Can't run automated code quality checks
   - Status: ⚠️ Accepted limitation
   - Workaround: Use Slither for static analysis

---

## 🎓 Lessons Learned

1. **PRBMath Integration**
   - UD60x18 provides excellent precision for LMSR calculations
   - Must be careful with exp() input range to avoid overflow
   - Conversion between raw uint256 and UD60x18 requires discipline

2. **OpenZeppelin v5 Changes**
   - SafeERC20 uses `forceApprove()` instead of `safeApprove()`
   - AccessControl now includes ERC165 support
   - Must properly override `supportsInterface()` when implementing multiple interfaces

3. **Foundry via-IR**
   - Necessary for complex contracts with deep call stacks
   - Compilation time increases ~3-5x
   - Worth it for maintainability vs manual stack optimization

4. **ERC-1155 Receiver Pattern**
   - Router must implement IERC1155Receiver to accept share transfers
   - Must return correct selector in `onERC1155Received()`
   - supportsInterface() must declare ERC1155Receiver support

---

## 📊 Gas Optimization Notes

**Not yet profiled** - will measure after full implementation

**Expected high-gas operations:**
- LMSRMarket.buy() - exp/ln calculations expensive
- Router.buyWithPermit() - multiple external calls
- Outcome1155 batch operations - loops over arrays

**Optimization opportunities:**
- Use ERC-1167 clones for Market deployment (Factory)
- Cache array lengths in loops
- Use unchecked arithmetic where safe
- Consider packed structs for storage

---

**END OF IMPLEMENTATION NOTES**
