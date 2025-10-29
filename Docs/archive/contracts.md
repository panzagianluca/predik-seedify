Minimal contract set & what each must include
1) MarketFactory.sol (single)

Purpose: create/track markets, set global params, point to oracle/treasury.

Storage

address collateral (BEP-20, e.g., USDT)

address outcomeToken (ERC-1155)

address treasury (FeeRouter)

address oracleAdapter

uint256 defaultB (LMSR liquidity param)

mapping(uint256 => address) marketById; uint256 nextId

Functions (must-have)

createMarket(string title, string[] outcomes, uint64 tradingEndsAt, uint256 b, FeeParams) → deploy LMSRMarket (clone), init, emit MarketCreated.

setOracleAdapter(address) / setTreasury(address) / setDefaultB(uint256) (role-gated).

getMarket(uint256 id) returns (address)

Events: MarketCreated(id, market, title, outcomes[], tradingEndsAt, b).

Notes

Use ERC-1167 clones for speed/gas.

Optional creatorBond (spam prevention) refundable on finalize.

2) LMSRMarket.sol (one per market from factory)

Purpose: pricing, trading, resolution, redemption.

Storage (core)

int256[] q; // net outcome quantities (N)

uint256 b; // liquidity param

State { Trading, Resolving, Finalized }

uint8 winningOutcome; bool invalid;

uint64 tradingEndsAt;

uint256 totalVolume;

FeeParams { uint16 protocolBps; uint16 creatorBps; address creator; }

address collateral; address outcome1155; address treasury; address oracle;

Math

LMSR cost: C(q)= b * ln(Σ exp(q_i / b))

Price: p_i = exp(q_i/b) / Σ exp(q_j/b)

Use PRBMath or equivalent fixed-point exp/ln with guards.

Functions (must-have)

buy(uint256 outcome, uint256 dq, uint256 maxCost)

transfers collateral in, Δ=cost(q+Δ)-cost(q), fee to treasury, mint ERC-1155 to user.

sell(uint256 outcome, uint256 dq, uint256 minPayout)

burn shares, pay out C(q)-C(q-Δ) minus fee.

quoteBuy(uint256 outcome, uint256 dq) / quoteSell(...)

pure/view pricing for UI.

requestResolve() → only after tradingEndsAt, calls oracle.propose(marketId, data).

finalize(uint8 winning, bool invalid_) → onlyOracleAdapter.

redeem(uint256 outcome, uint256 amount) → burn 1155, pay winners (or pro-rata if invalid).

Admin safety: pause/unpause, caps: maxDqPerTrade, slippage checks.

Events

Trade(buyer, outcome, dq, cost, fee)

Resolved(winningOutcome, invalid)

Redeemed(user, outcome, shares, payout)

Security

ReentrancyGuard, Pausable, AccessControl.

Numeric guards on q, b, dq to avoid overflow/underflow.

Reject trades if block.timestamp > tradingEndsAt or state ≠ Trading.

3) Outcome1155.sol (single shared)

Purpose: fungible outcome shares per market/outcome.

Must-have

mint(to, marketId, outcomeId, amount) / burn(from, ...) authorized only by market contracts.

ID scheme: tokenId = (marketId << 8) | outcomeId

Optional uri(tokenId) with off-chain metadata (IPFS).

4) OracleAdapterDelph.sol

Purpose: on-chain bridge for DelphAI; handles proposal, disputes, finalization.

Storage

struct Resolution { uint8 proposedOutcome; uint64 proposedAt; Status status; uint256 bond; }

mapping(uint256 => Resolution) resolutions; // by marketId

uint64 disputeWindow = 24h;

uint256 minDisputeBondBps (e.g., 50–500 bps of market volume)

address delphSigner (EOA or contract allowed to propose)

Functions (must-have)

propose(uint256 marketId, uint8 outcome, uint256 confidence, string evidenceURI)

onlyDelphSigner (or EIP-712 signature check); emits Proposed.

dispute(uint256 marketId, uint8 altOutcome, string reasonURI) payable / stake in collateral; emits Disputed.

finalize(uint256 marketId)

If no dispute after window → call LMSRMarket.finalize(...).

If disputed → choose rule (simple: founder/manual; advanced: vote/stake-weighted; hackathon: founder multisig). Emits Finalized.

Slashing: loser (AI or disputant) bond → treasury.

Events

Proposed(marketId, outcome, confidence, evidenceURI)

Disputed(marketId, challenger, altOutcome, stake)

Finalized(marketId, outcome, invalid)

5) Router.sol (gasless UX helper)

Purpose: batch user actions for AA; single call target for Biconomy UserOps.

Must-have (all nonReentrant)

buyWithPermit(uint256 marketId, uint256 outcome, uint256 amount, uint256 dqMin, Permit params)

Executes permit on collateral (EIP-2612 if available) then LMSRMarket.buy.

sellAndTransfer(uint256 marketId, uint256 outcome, uint256 dq, uint256 minPayout, address to)

multicall(bytes[] calls) for future composition.

Optional session-key gating (allow certain function selectors).

With ERC-4337, you don’t need ERC-2771. Keeping a Router is still great for one-click, fee-predictable flows and to encode business rules.

6) FeeRouter/Treasury.sol

Purpose: centralize fee accounting & withdrawals.

Must-have

collect(address token, uint256 amount) (from markets)

Split: protocolBps, creatorBps, maybe oracleBps.

withdraw(address to, uint256 amount) (role-gated).

Track per-market fee stats for analytics.

What changes because of Biconomy AA (gasless)

No forwarder required if you exclusively use ERC-4337 Smart Accounts.

Router becomes your single “to” for meta/batch ops; your dApp sends UserOps to Biconomy with paymaster sponsorship.

Make sure collateral token supports permit (EIP-2612). If not, add an allowance-less pattern (e.g., pull by Router only, or pre-approve once via a sponsored UserOp).

UX guarantees to enforce on-chain

Slippage: maxCost on buy / minPayout on sell.

Trading window guard.

Per-trade maxDq cap to keep LMSR math stable.

DelphAI integration (on-chain contract side)

Treat Delph as attester with delphSigner (rotate-able).

Require EIP-712 signature on propose() OR call-by-EOA you whitelist.

Store evidenceURI & confidence for auditability.

Provide 24h dispute with stake (keep it simple for hackathon).

Expose getResolution(marketId) for UI.

Events (indexing-ready)

Emit these everywhere (names stable):

MarketCreated(id, market, title, outcomes[], endsAt, b)

Trade(marketId, trader, outcome, dq, cost, fee, isBuy)

ResolutionProposed(marketId, outcome, confidence, evidenceURI)

ResolutionDisputed(marketId, challenger, altOutcome, stake)

MarketFinalized(marketId, outcome, invalid)

Redeemed(marketId, user, outcome, shares, payout)

FeesCollected(marketId, protocol, creator, amount)

These cover The Graph needs for listings, charts, holders, and activity.