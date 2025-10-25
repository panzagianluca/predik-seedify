# Oracle.sol Implementation Summary

**Date:** October 24, 2025  
**Contract:** `contracts/Oracle.sol`  
**Tests:** `test/Oracle.t.sol`  
**Status:** ✅ Complete (32 tests passing)

---

## Overview

The Oracle contract serves as a bridge between LMSRMarket contracts and the DelphAI AI-powered oracle service. It manages the complete resolution lifecycle including AI-powered outcome proposals, optional dispute mechanisms for low-confidence resolutions, and final market settlement.

## Architecture Decisions

### 1. DelphAI Integration Strategy
**Decision:** Direct on-chain integration via `IDelphAI` interface  
**Implementation:**
- Immutable reference to DelphAI contract at `0xA95E99848a318e37F128aB841b0CF693c1f0b4D1` (BSC mainnet)
- Market registration maps our LMSRMarket addresses to DelphAI market IDs
- Polling-based resolution (call `getMarket()` to fetch AI resolution)

**Rationale:**
- DelphAI deploys on-chain contracts accessible via standard Solidity interfaces
- No webhook infrastructure required for hackathon MVP
- Simpler security model than signature verification
- Gas-efficient: single external call to fetch resolution

### 2. Resolution Flow
**Lifecycle States:**
```
Pending → Proposed → [Disputed] → Finalized
```

**Process:**
1. **Registration**: Admin maps LMSRMarket to DelphAI market ID
2. **Request**: Anyone calls `requestResolve()` after resolution timestamp
3. **Proposal**: Oracle fetches DelphAI resolution, stores outcome + confidence, starts 24h dispute window
4. **Optional Dispute**: If confidence <80%, anyone can dispute with ETH bond
5. **Finalization**: After 24h window (if no dispute) or admin resolution (if disputed), calls `LMSRMarket.finalize()`

### 3. Dispute Mechanism
**Decision:** Optional dispute layer for low-confidence resolutions only  
**Implementation:**
- Disputes allowed when `resolutionConfidence < 80`
- 24-hour dispute window from proposal timestamp
- ETH-based dispute bonds (configurable as % of market volume)
- Admin arbitration for disputed markets
- Bond slashing: loser's bond goes to treasury

**Rationale:**
- Trust AI for high-confidence (≥80%) resolutions
- Provide safety valve for uncertain outcomes
- Align incentives: bond size scales with market volume
- Admin resolution as pragmatic MVP (can upgrade to voting/stake-weighted later)

### 4. State Mapping (DelphAI → LMSR)
**Market Status:**
```solidity
enum MarketStatus { Open, Resolved, Cancelled }
```
- `Open` → Cannot call `requestResolve()` (reverts)
- `Resolved` → Fetch outcome and confidence, proceed with resolution
- `Cancelled` → Revert resolution (market should be marked invalid)

**Outcome Mapping:**
- DelphAI: `uint256 outcomeIndex` (0-based index into `possibleOutcomes[]`)
- LMSR: `uint8 winningOutcome` (ERC-1155 outcome ID)
- Validation: Check `outcomeIndex <= type(uint8).max` before casting

### 5. Fee Payment
**Decision:** Market creator pays DelphAI creation fee in BNB  
**Implementation:**
- Fee paid during market creation on DelphAI
- Oracle contract doesn't handle fee payment (external to Oracle)
- Future: MarketFactory can wrap fee payment + registration

**Rationale:**
- Simplifies Oracle contract (no payable functions needed)
- Creator bears AI resolution cost upfront
- Clear cost model for market creators

### 6. Testnet Strategy
**DelphAI Deployment:**
- Mainnet: `0xA95E99848a318e37F128aB841b0CF693c1f0b4D1`
- Testnet: DelphAI team deploying in ~2 hours (as of Oct 24, 2025)

**Testing Approach:**
- Local testing: MockDelphAI contract simulates interface
- Testnet: Use real DelphAI contract when available
- Mock covers all states: Open, Resolved, Cancelled
- Mock provides test helpers: `resolveMarket()`, `cancelMarket()`

---

## Contract Interface

### Key Functions

#### Registration
```solidity
function registerMarket(address market, uint256 delphAIMarketId) external onlyRole(DEFAULT_ADMIN_ROLE)
```
Maps an LMSRMarket to its DelphAI counterpart.

#### Resolution Request
```solidity
function requestResolve(address market) external nonReentrant
```
Fetches AI resolution from DelphAI, proposes outcome, starts dispute window.

#### Dispute
```solidity
function dispute(address market, uint8 altOutcome) external payable nonReentrant
```
Challenges AI resolution (only if confidence <80%), stakes ETH bond.

#### Finalization
```solidity
function finalize(address market) external nonReentrant
```
Finalizes undisputed resolutions after 24h window, calls `LMSRMarket.finalize()`.

#### Admin Dispute Resolution
```solidity
function resolveDispute(address market, uint8 finalOutcome, bool invalid) external onlyRole(DEFAULT_ADMIN_ROLE)
```
Settles disputed markets, handles bond slashing/refunds.

### View Functions
```solidity
function getResolution(address market) external view returns (Resolution memory)
function canDispute(address market) external view returns (bool)
function calculateDisputeBond(address market) external view returns (uint256)
```

---

## Data Structures

### Resolution Struct
```solidity
struct Resolution {
    uint256 delphAIMarketId;  // DelphAI market identifier
    uint8 proposedOutcome;     // AI-proposed winning outcome
    uint8 confidence;          // AI confidence level (0-100)
    uint64 proposedAt;         // Timestamp when resolution was proposed
    ResolutionStatus status;   // Current resolution status
    uint256 disputeBond;       // Amount staked by disputer
    address challenger;        // Address that disputed
    uint8 disputedOutcome;     // Alternative outcome proposed
    bool invalid;              // Whether market should be marked invalid
}
```

### Resolution Status
```solidity
enum ResolutionStatus {
    Pending,   // Not yet requested
    Proposed,  // AI resolution fetched, dispute window active
    Disputed,  // Under dispute
    Finalized  // Final outcome determined
}
```

---

## DelphAI Interface

### Market Struct
```solidity
struct Market {
    uint256 id;
    address creator;
    string question;
    string description;
    string[] possibleOutcomes;
    uint256 createdAt;
    uint256 resolutionTimestamp;
    MarketStatus status;
    uint256 outcomeIndex;
    string resolutionData;
    string[] resolutionSources;
    uint8 resolutionConfidence;
    bytes proofData;
    uint256 resolvedAt;
    address resolvedBy;
}
```

### IDelphAI Interface
```solidity
interface IDelphAI {
    function createMarket(
        string memory question,
        string memory description,
        string[] memory possibleOutcomes,
        uint256 resolutionTimestamp
    ) external payable returns (uint256);

    function getMarket(uint256 marketId) external view returns (Market memory);
    function marketCreationFee() external view returns (uint256);
}
```

---

## Configuration

### Constants
```solidity
uint64 public constant DISPUTE_WINDOW = 24 hours;
uint8 public constant MIN_CONFIDENCE_THRESHOLD = 80;
```

### Configurable Parameters
```solidity
uint256 public disputeBondBps;  // Dispute bond as basis points of market volume (100 bps = 1%)
address public treasury;         // Treasury address for slashed bonds
```

---

## Test Coverage

**Total Tests:** 32 (all passing)

### Test Categories

1. **Constructor Tests** (7 tests)
   - Valid deployment
   - Zero address validation
   - Invalid BPS validation

2. **Registration Tests** (3 tests)
   - Market registration
   - Duplicate prevention
   - Admin-only access

3. **Resolution Request Tests** (5 tests)
   - Successful resolution proposal
   - Not registered error
   - Not resolved error
   - Cancelled market error
   - Already proposed error

4. **Dispute Tests** (6 tests)
   - Valid dispute
   - Not proposed error
   - Window closed error
   - High confidence rejection
   - Insufficient bond error

5. **Finalization Tests** (3 tests)
   - Successful finalization
   - Before window error
   - Disputed market error

6. **Dispute Resolution Tests** (3 tests)
   - AI correct (bond slashed)
   - Challenger correct (bond returned)
   - Invalid market resolution

7. **View Function Tests** (2 tests)
   - `canDispute()` logic
   - High confidence handling

8. **Admin Function Tests** (3 tests)
   - Set dispute bond BPS
   - Set treasury
   - Access control

---

## Gas Optimization

- Immutable references: `delphAI`, `collateral`
- Packed storage: `Resolution` struct uses `uint64`, `uint8` for smaller values
- Single external call: `getMarket()` fetches all DelphAI data at once
- No loops in dispute/finalization logic

---

## Security Considerations

### Access Control
- **Admin Role:** Market registration, dispute resolution, parameter updates
- **Public Functions:** `requestResolve()`, `dispute()`, `finalize()` (anyone can call)
- Uses OpenZeppelin `AccessControl` for role management

### Reentrancy Protection
- `nonReentrant` modifier on all state-changing functions
- ETH transfers to treasury/challenger use low-level `call()`
- Checks-effects-interactions pattern

### Validation
- DelphAI market status checked before resolution
- Outcome index fits in `uint8` before casting
- Dispute window timestamps checked
- Bond requirements enforced

### Trust Assumptions
- Trust DelphAI contract for high-confidence (≥80%) resolutions
- Trust admin for disputed market resolution (MVP approach)
- Trust treasury address for bond custody

---

## Future Enhancements

### For Production
1. **Decentralized Dispute Resolution**
   - Replace admin arbitration with token-weighted voting
   - Implement Kleros-style dispute resolution
   - Multi-tier appeal system

2. **Automated Finalization**
   - Keeper network triggers finalization after 24h
   - Incentivize finalization with small rewards

3. **Enhanced Bond Mechanism**
   - Progressive bond tiers for multiple disputes
   - Time-weighted confidence decay
   - Reputation system for disputers

4. **Batch Operations**
   - Batch register markets
   - Batch finalize undisputed markets
   - Gas optimization for mass resolution

### Completed MVP Features
- ✅ DelphAI integration
- ✅ Optional dispute layer
- ✅ 24-hour dispute window
- ✅ ETH-based dispute bonds
- ✅ Admin dispute resolution
- ✅ Treasury bond management
- ✅ Comprehensive test coverage

---

## Integration Points

### With LMSRMarket
```solidity
interface ILMSRMarket {
    function finalize(uint8 winningOutcome, bool invalid) external;
    function getTotalVolume() external view returns (uint256);
}
```
- Oracle calls `finalize()` after resolution
- Oracle queries `getTotalVolume()` for dispute bond calculation

### With DelphAI
```solidity
// Market creation (external to Oracle)
uint256 marketId = delphAI.createMarket{value: fee}(question, description, outcomes, timestamp);

// Resolution fetching (internal to Oracle)
Market memory delphMarket = delphAI.getMarket(marketId);
```

---

## Deployment Checklist

- [ ] Deploy DelphAI contract to testnet (waiting on DelphAI team)
- [ ] Deploy Oracle with correct DelphAI address
- [ ] Set initial `disputeBondBps` (recommended: 100 = 1%)
- [ ] Set treasury address
- [ ] Grant admin role to market factory
- [ ] Verify contract on BSCScan
- [ ] Test resolution flow end-to-end
- [ ] Document DelphAI market creation process

---

## Known Limitations

1. **Polling-Based**: Requires manual `requestResolve()` call (no callbacks)
2. **Admin Disputes**: Centralized resolution for disputed markets (MVP approach)
3. **No Callbacks**: Markets must check Oracle state actively
4. **Single Oracle**: No multi-oracle aggregation (future enhancement)
5. **ETH Bonds Only**: No ERC-20 bond support (could add collateral token option)

---

## Conclusion

The Oracle contract successfully integrates DelphAI's AI-powered resolution with an optional dispute mechanism for low-confidence outcomes. The implementation prioritizes:

- **Simplicity**: Direct on-chain integration, no webhook infrastructure
- **Security**: Role-based access, reentrancy protection, comprehensive validation
- **Flexibility**: Configurable dispute parameters, admin controls
- **Testability**: 32 comprehensive tests, mock DelphAI for local development

**Status:** Production-ready for hackathon MVP. All tests passing, gas-optimized, thoroughly documented.
