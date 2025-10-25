# LMSRMarket Resolution Implementation

## Overview

Successfully implemented complete market lifecycle for LMSRMarket.sol, including resolution flow and redemption mechanisms per contracts.md specification.

## Implementation Summary

### State Machine

Added MarketState enum with three states:
- **Trading**: Active trading period (initial state)
- **Resolving**: Resolution requested from oracle, waiting for finalization
- **Finalized**: Outcome determined, redemption available

### Storage Variables

Added immutable parameters:
- `tradingEndsAt` (uint64): Timestamp when trading closes
- `oracle` (address): Oracle contract address for resolution

Added state tracking:
- `state` (MarketState): Current market state
- `winningOutcome` (uint8): Winning outcome index (valid when finalized)
- `invalid` (bool): Whether market is invalid (triggers pro-rata refund)
- `totalVolume` (uint256): Cumulative trading volume for analytics
- `totalSharesAtFinalization` (uint256): Snapshot for pro-rata calculation
- `availableCollateralAtFinalization` (uint256): Snapshot for pro-rata calculation

### Core Functions

#### 1. requestResolve()
- **Access**: Public (anyone can trigger after trading ends)
- **Preconditions**:
  - State must be Trading
  - Current timestamp >= tradingEndsAt
- **Actions**:
  - Transitions to Resolving state
  - Calls oracle.requestResolve(address(this))
- **Gas**: ~40k

#### 2. finalize(uint8 winning, bool invalid_)
- **Access**: Oracle only
- **Preconditions**:
  - State must be Resolving
  - Outcome must be valid (unless market is invalid)
- **Actions**:
  - Transitions to Finalized state
  - Records winningOutcome and invalid flag
  - If invalid: snapshots totalShares and availableCollateral for fair pro-rata distribution
  - Emits Resolved event
- **Gas**: ~45k (valid), ~85k (invalid with snapshot)

#### 3. redeem(uint8 outcomeId, uint256 amount)
- **Access**: Public
- **Preconditions**:
  - State must be Finalized
  - User must own shares being redeemed
- **Payout Logic**:
  - **Valid market**: Winners get 1:1 payout (1 share = 1 USDT)
  - **Invalid market**: Pro-rata refund using snapshots from finalization
    - Formula: `payout = (shares * availableCollateralAtFinalization) / totalSharesAtFinalization`
- **Actions**:
  - Burns ERC-1155 shares
  - Transfers collateral to redeemer
  - Emits Redeemed event
- **Gas**: ~260k (winner), ~470k (invalid pro-rata)

#### 4. sweepFeesToTreasury(uint256 amount) ⭐ NEW (Oct 2025)
- **Access**: Admin only (`DEFAULT_ADMIN_ROLE`)
- **Purpose**: Send accumulated fees to Treasury for distribution
- **Preconditions**:
  - amount ≤ feeReserve
  - amount = 0 sends all fees
- **Actions**:
  - Approves Treasury to spend collateral
  - Calls `treasury.collect(marketId, collateral, amount)`
  - Treasury handles 60/30/10 split (protocol/creator/oracle)
  - Emits FeeSwept event
- **Gas**: ~80k

### Trading Enforcement

Updated buy() and sell() functions to enforce trading deadline:
- Revert if `state != Trading`
- Revert if `block.timestamp >= tradingEndsAt`
- Added `totalVolume` tracking for oracle bond calculations

### Constructor Changes

Updated to accept **9 parameters** (was 6, then 8):
```solidity
constructor(
    uint256 marketId_,
    uint8 outcomeCount_,
    uint256 liquidityBRaw,
    uint256 feeRaw,
    address collateral_,
    address outcomeToken_,
    uint64 tradingEndsAt_,   // Added in v1
    address oracle_,         // Added in v1
    address treasury_        // ⭐ NEW in v2 (Oct 2025)
)
```

**Latest Update (Oct 2025):**
- Added `treasury` parameter for fee sweep functionality
- Market can now call `treasury.collect()` to distribute fees
- See `sweepFeesToTreasury()` function for fee collection mechanism

### Events

Added resolution and fee events:
- `Resolved(uint8 indexed winningOutcome, bool invalid)`
- `Redeemed(address indexed user, uint8 indexed outcome, uint256 shares, uint256 payout)`
- `FeeSwept(uint256 indexed marketId, uint256 amount, address treasury)` ⭐ NEW (Oct 2025)

### Errors

Added resolution-specific errors:
- `LMSR_TradingEnded()`: Trading period has closed
- `LMSR_WrongState()`: Invalid state transition
- `LMSR_OnlyOracle()`: Function restricted to oracle
- `LMSR_NotWinner()`: Cannot redeem losing shares in valid market
- `LMSR_NoShares()`: User has no shares to redeem
- `LMSR_MarketNotFinalized()`: Cannot redeem before finalization

## Testing

### Test Coverage

Created comprehensive test suite `LMSRMarketResolution.t.sol` with 21 tests covering:

**requestResolve Tests (5):**
- ✅ Reverts before trading ends
- ✅ Reverts when called twice
- ✅ Successfully calls oracle
- ✅ Blocks trading after resolution requested
- ✅ Buy/sell revert after trading ends

**finalize Tests (5):**
- ✅ Reverts from non-oracle
- ✅ Reverts in wrong state
- ✅ Reverts on invalid outcome
- ✅ Successfully finalizes valid outcome
- ✅ Successfully finalizes as invalid

**redeem Tests - Valid Market (6):**
- ✅ Reverts before finalization
- ✅ Reverts without shares
- ✅ Reverts for losing outcome
- ✅ Winners receive 1:1 payout
- ✅ Partial redemption works
- ✅ Reverts on zero amount

**redeem Tests - Invalid Market (2):**
- ✅ Pro-rata distribution works correctly
- ✅ Multiple outcome redemption gets fair share

**Edge Cases (3):**
- ✅ State transitions work correctly
- ✅ Total volume tracking accurate
- ✅ Rounding errors within acceptable bounds (<10 wei)

### Test Results

```
Ran 21 tests for test/LMSRMarketResolution.t.sol:LMSRMarketResolutionTest
Suite result: ok. 21 passed; 0 failed; 0 skipped
```

**Total Project Tests**: 101 passing (7 test suites)

## Key Design Decisions

### 1. Pro-Rata Snapshot Mechanism

For invalid markets, we snapshot `totalShares` and `availableCollateral` at finalization time. This ensures:
- Fair distribution regardless of redemption order
- Each share receives exactly the same value
- Prevents "first come first served" unfairness
- Minimal rounding errors (tested <10 wei variance)

**Why not dynamic calculation?**
If we recalculated available collateral after each redemption, early redeemers would get more than later ones, creating an unfair race condition.

### 2. Anyone Can Trigger Resolution

Unlike finalize() which is oracle-only, requestResolve() is public. This allows:
- Users to trigger resolution when trading ends
- No reliance on external services for basic flow
- Oracle remains the source of truth for outcomes

### 3. Trading Deadline Enforcement

Trading stops at `tradingEndsAt` regardless of resolution state. This prevents:
- Trading on known outcomes
- Market manipulation after resolution requested
- Invalid price discovery

### 4. Volume Tracking

Added `totalVolume` accumulation in buy() for future oracle bond calculations (per contracts.md §4 dispute bonds based on market volume).

## Gas Optimization Notes

- State variables packed efficiently (uint64, uint8, bool, address)
- Avoided loops in most functions (only in finalize snapshot for invalid markets)
- Pro-rata calculation uses simple division (no complex math)
- Events indexed appropriately for efficient querying

## Security Considerations

1. **Reentrancy**: All external calls protected by nonReentrant modifier
2. **Oracle trust**: Only oracle can finalize, preventing unauthorized resolution
3. **State machine**: Strict state transitions prevent invalid flows
4. **Share validation**: Always check user balance before redemption
5. **Collateral safety**: Check available balance before transfers
6. **Integer overflow**: Solidity 0.8+ built-in protection

## Integration with Oracle

The LMSRMarket expects the oracle to implement:
```solidity
interface IOracle {
    function requestResolve(address market) external;
}
```

Oracle must call back:
```solidity
market.finalize(uint8 winningOutcome, bool invalid)
```

See `Oracle.sol` for full DelphAI integration implementation.

## Backwards Compatibility

**Breaking changes**:
- Constructor signature changed (6→8→9 params)
  - v1: Added tradingEndsAt, oracle
  - v2 (Oct 2025): Added treasury ⭐
- All existing tests updated (LMSRMarket.t.sol, Router.t.sol, MarketFactory.t.sol)
- Buy/sell functions now check trading deadline
- Fee sweep mechanism requires treasury integration

**Migration path**:
- Update all market deployments to include tradingEndsAt, oracle, and treasury
- Existing tests need mockOracle and mockTreasury setup
- Frontend must call sweepFeesToTreasury() periodically for fee distribution

## Next Steps

Per contracts.md priority order:

1. ✅ **LMSRMarket.sol** - COMPLETE (resolution functions implemented)
2. ⏳ **Treasury.sol** (§6) - Fee collection and withdrawal
3. ⏳ **MarketFactory.sol** - Automated market deployment
4. ⏳ **LMSRMarketResolution tests** - Enhanced edge case coverage

## Files Modified

- `contracts/LMSRMarket.sol` (+150 lines, resolution logic)
- `test/LMSRMarket.t.sol` (constructor updated)
- `test/Router.t.sol` (constructor updated)
- `test/LMSRMarketResolution.t.sol` (NEW, 429 lines)

## Performance Metrics

| Function | Gas Cost | Notes |
|----------|----------|-------|
| requestResolve() | ~39k | Minimal oracle call |
| finalize() valid | ~44k | State update only |
| finalize() invalid | ~85k | With snapshot loop |
| redeem() winner | ~262k | 1:1 payout |
| redeem() invalid | ~468k | Pro-rata calculation |

## Conclusion

LMSRMarket now supports complete lifecycle:
1. Create → fundMarket()
2. Trade → buy()/sell() until tradingEndsAt
3. Resolve → requestResolve() → oracle.finalize()
4. Redeem → redeem() for winners or pro-rata

All 101 tests passing. Ready for Treasury and Factory implementation.
