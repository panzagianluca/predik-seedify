# Predik Seedify Execution Plan

## Overview
- **Objective:** Deliver a gasless, BNB-native prediction market with ERC-4337 smart accounts, AI-assisted resolution, and Spanish-first UX for the Seedify hackathon.
- **Timeline:** 14 days (Week 1 = Contracts & Infrastructure, Week 2 = Integration, Seeding, Demo).
- **Success Criteria:** Fully functioning gasless trading flow, 10 Argentine markets live on BNB Testnet, demo video, and submission package ready.

---

## Phase 0 — Access & Research Prerequisites (Day 0)
- [ ] Confirm access to required dashboards: Biconomy, Privy, Delph AI, Vercel, Neon, BSCScan, The Graph.
  - [ ] Collect API keys, project IDs, and webhook URLs.
  - [ ] Document keys in secure vault and `.env` placeholders.
- [ ] Review PRBMath LMSR references & Delph AI documentation.
  - [ ] Bookmark equations, precision limits, and gas optimization notes.
- [ ] Set up Foundry toolchain locally (forge, cast, anvil) with BNB fork configuration.

### Phase 0 — Neon & Drizzle Setup (detailed)
- [ ] Create Neon project & database
  - [ ] Create a new Neon project (console.neon.tech) and note the region/project name
  - [ ] Create a dedicated database role/user and copy the full connection string
  - [ ] Confirm SSL requirements and connection parameters
- [ ] Configure Drizzle to use Neon
  - [ ] Add `NEON_DATABASE_URL` to local `.env` (example updated in `.env.local.example`)
  - [ ] Update `drizzle.config.ts` to read `NEON_DATABASE_URL` and set appropriate pool options
  - [ ] Run `npx drizzle-kit generate` and verify migrations folder
- [ ] Run initial DB migration locally
  - [ ] Run `npx drizzle-kit migrate:latest --schema ./drizzle` (or equivalent) against Neon using a local proxy or a temporary connection
  - [ ] Verify tables created (`users`, `markets`, `positions`, etc.)
- [ ] Vercel & Secrets
  - [ ] Add `NEON_DATABASE_URL` as a secret in Vercel for preview/prod
  - [ ] Add Biconomy/Privy/Delph secrets in Vercel
- [ ] Sanity checks
  - [ ] Connect to Neon via `psql` or Neon dashboard and run a simple SELECT query
  - [ ] Run a small Drizzle query from a Node REPL to ensure connection works

---

## Phase 1 — Smart Contract Foundation (Days 1‑3)
- [ ] Task 1: Implement core contracts in Foundry project (`contracts/`)
  - [ ] `MockUSDT.sol` (ERC‑20, 6 decimals, faucet, initial mint).
  - [ ] `Outcome1155.sol` (ERC‑1155 share tokens, URI, operator approvals).
  - [ ] `LMSRMarket.sol` (multi-outcome LMSR pricing using PRBMath; buy/sell, invariant checks, fees).
  - [ ] `Router.sol` (batched approve+trade, EIP‑712 structs for AA, treasury fee handling).
  - [ ] `Oracle.sol` (Delph AI integration, resolution lifecycle, dispute staking).
  - [ ] `Treasury.sol` (fee escrow, admin withdrawals, reporting events).
- [ ] Task 2: Write extensive Foundry tests (`test/`)
  - [ ] Unit tests for LMSR math (cost function, gradient, round-trip sanity).
  - [ ] Scenario tests for buy/sell flows with slippage, edge cases (zero liquidity, max shares).
  - [ ] Oracle resolution + dispute window tests.
  - [ ] Router batched operations + fee distribution tests.
  - [ ] Fuzz tests for LMSR invariants and reentrancy guards.
- [ ] Task 3: Static analysis & audit prep
  - [ ] Run `forge fmt`, `forge build`, `forge test -vvv`.
  - [ ] Execute `slither`/`foundry` security checks; document findings.
  - [ ] Prepare short audit notes (assumptions, trust boundaries).

---

## Phase 2 — Testnet Deployment & Services (Days 3‑5)
- [ ] Task 4: Deploy contracts to BNB Testnet
  - [ ] Write deployment scripts (`script/Deploy.s.sol`), parameterize LMSR `b` value (1000 USDT per market).
  - [ ] Deploy in correct order (MockUSDT → Outcome1155 → Treasury → LMSRMarket → Router → Oracle).
  - [ ] Record addresses, emit events, verify using `forge verify-contract` & BSCScan API.
- [ ] Task 5: Configure Biconomy
  - [ ] Create bundler + paymaster project for chain 97.
  - [ ] Allowlist Router + Outcome1155 contract methods.
  - [ ] Generate paymaster key, test sponsored UserOp via SDK script.
- [ ] Task 6: Configure Privy
  - [ ] Create app with Google + Email login only.
  - [ ] Set callback URLs (localhost, Vercel preview, production).
  - [ ] Generate App ID & secret, test login locally.
- [ ] Task 7: Configure Delph AI Oracle
  - [ ] Register webhook endpoint (Next.js API route).
  - [ ] Store API credentials, define market resolution schemas.
  - [ ] Dry-run resolution + dispute workflow using test market.

---

## Phase 3 — Frontend Provider Migration (Days 5‑7)
- [ ] Task 8: Replace Wagmi/RainbowKit with AA stack
  - [ ] Remove `lib/wagmi.ts`, Wagmi provider, RainbowKit components.
  - [ ] Implement `BiconomyProvider` and context (lazy smart account creation on first trade).
  - [ ] Wrap app with `PrivyProvider` + `BiconomyProvider` in `app/layout.tsx`.
- [ ] Task 9: Authentication & UI updates
  - [ ] Create `AccederButton.tsx` (Privy login, Spanish copy).
  - [ ] Update Navbar/Footer to reflect smart account state.
  - [ ] Add user menu showing smart account address & balance.
- [ ] Task 10: Build AA hooks & utilities
  - [ ] `useBiconomyAccount`, `useSendUserOp`, `useGaslessTrade` hooks.
  - [ ] Helper utilities for encoding router calls, estimating shares, formatting receipts.
  - [ ] Error boundaries + toast notifications for UserOp status.

---

## Phase 4 — Data Layer & API Migration (Days 7‑9)
- [ ] Task 11: Database updates (Drizzle)
  - [ ] Migrate `users` table to `smartAccountAddress`, `privyUserId`, `authMethod`.
  - [ ] Update seeders & Drizzle schema files; run migration.
  - [ ] Adjust profile API routes to new identifiers.
- [ ] Task 12: Replace Myriad API with on-chain data
  - [ ] Implement contract query modules (`lib/contracts/` adapters).
  - [ ] Update markets API route to fetch from LMSRMarket + The Graph cache.
  - [ ] Ensure caching strategy aligns with revalidation requirements.
- [ ] Task 13: Build The Graph subgraph
  - [ ] Define schema for MarketCreated, Trade, Resolution, Dispute events.
  - [ ] Write mapping handlers, deploy to Hosted Service (chain 97).
  - [ ] Update frontend queries to hit subgraph for market lists + positions.

---

## Phase 5 — Trading Experience & QA (Days 9‑11)
- [ ] Task 14: Refactor trading components
  - [ ] Update `TradingPanel.tsx` + `MobileTradingModal.tsx` to use gasless hooks.
  - [ ] Handle share estimation, price impact display, AA status states.
  - [ ] Ensure Spanish localization matches existing tone.
- [ ] Task 15: Portfolio & activity views
  - [ ] Update `PositionsList`, `TransactionsList`, `ActivityList` to pull from contracts/subgraph.
  - [ ] Add claim flow wired to Router/Oracle events.
- [ ] Task 16: QA suite
  - [ ] Run unit tests, integration tests, end-to-end sanity flows.
  - [ ] Manual QA: login, trade, dispute, resolution, claim, profile edits, notifications, comments.
  - [ ] Document bugs, triage critical fixes.

---

## Phase 6 — Market Seeding & Demo Prep (Days 11‑13)
- [ ] Task 17: Market deployment script
  - [ ] Author Foundry/Node script to seed 10 Argentine markets with `b × N` USDT liquidity.
  - [ ] Generate metadata (titles, descriptions, categories) in Spanish.
  - [ ] Run script on BNB Testnet, verify outcomes via subgraph/UI.
- [ ] Task 18: User journey polish
  - [ ] Ensure onboarding copy, tooltips, error messages are localized.
  - [ ] Add tutorial dialog updates for smart accounts & gasless messaging.
  - [ ] Confirm analytics events for AA-specific flows.
- [ ] Task 19: Demo collateral
  - [ ] Record 5‑minute Spanish walkthrough (login → trade → resolution → claim).
  - [ ] Update `README.md`, `ARCHITECTURE.md`, `EXECUTION_PLAN.md` with final addresses & screenshots.
  - [ ] Prepare Dorahacks submission copy (problem, solution, traction, roadmap).

---

## Phase 7 — Submission & Buffer (Days 13‑14)
- [ ] Task 20: Final review & buffer
  - [ ] Cross-check checklist: contracts verified, env vars set, gasless confirmed, markets live.
  - [ ] Conduct performance checks (UserOp latency, subgraph sync, UI SSR hydration).
  - [ ] Run Codacy analysis & linting; resolve blockers.
- [ ] Task 21: Submit to Seedify hackathon
  - [ ] Complete Dorahacks form, attach demo video, repo, live URL.
  - [ ] Announce in hackathon channels, prep for judge Q&A (tech + GTM narrative).
  - [ ] Confirm follow-up materials for investors/partners.

---

## Risk Mitigation & Contingency
- **LMSR Math Issues:** Maintain simpler CPMM fallback branch if PRBMath precision becomes problematic.
- **Biconomy Downtime:** Prepare manual relayer script to sponsor gas via fallback key.
- **Privy Limitations:** Keep Magic.link or Web3Auth credentials ready as backup social login.
- **Delph AI Delays:** Implement manual oracle override function with multisig for demo reliability.
- **Timeline Buffer:** Reserve final 24 hours for integration surprises and submission polish.
