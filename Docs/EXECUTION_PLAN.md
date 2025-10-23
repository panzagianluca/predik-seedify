# Predik Seedify Execution Plan

## Overview
- **Objective:** Deliver a gasless, BNB-native prediction market with ERC-4337 smart accounts, AI-assisted resolution, and Spanish-first UX for the Seedify hackathon.
- **Timeline:** 14 days (Week 1 = Contracts & Infrastructure, Week 2 = Integration, Seeding, Demo).
- **Success Criteria:** Fully functioning gasless trading flow, 10 Argentine markets live on BNB Testnet, demo video, and submission package ready.

---

## Phase 0 — Access & Research Prerequisites (Day 0) ✅ COMPLETED

**Status:** ✅ **COMPLETED on October 23, 2025**

**Completed Items:**
- ✅ Neon Database created and connected (`neondb` on `ep-floral-recipe-adwqh01g`)
- ✅ Biconomy Super Transactions API configured (API Key: `mee_CTa...`, Project ID: `79933c68...`)
- ✅ Privy Social Login configured (App ID: `cmh3yqmdl...`, Secret stored)
- ✅ DelphAI Oracle address documented (`0xA95E99848a318e37F128aB841b0CF693c1f0b4D1`)
- ✅ Vercel Blob token added for avatar uploads
- ✅ All credentials added to `.env.local` and `.env.local.example`
- ✅ Database connection fixed to handle Vercel build (no env during build time)
- ✅ PostHog analytics removed (deferred for hackathon)
- ✅ Changes committed and pushed to GitHub

**Notes:**
- Using **Biconomy Super Transactions** (new gasless solution, not legacy paymaster/bundler)
- Privy callbacks configured for `predik.io` and `www.predik.io`
- DelphAI uses on-chain oracle contract (no API key needed, just contract interface)
- Neon connection string uses pooled connection for serverless compatibility

**Environment Variables Set:**
```bash
DATABASE_URL=postgresql://neondb_owner:***@ep-floral-recipe-adwqh01g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
NEXT_PUBLIC_BICONOMY_API_KEY=mee_CTaAqQnG8wDYN3aKoj4k7j
NEXT_PUBLIC_BICONOMY_PROJECT_ID=79933c68-c642-4658-8023-5e243cdeaef0
NEXT_PUBLIC_PRIVY_APP_ID=cmh3yqmdl00lpl50cilnn8cz5
PRIVY_APP_SECRET=vraLYzp63TYDSmmznbKs2jBuCV6gesWKuZPX1Tk1bTmasN5pZitDJdqwjjCBGC7WcL93mP22KVyWD1tsGYpz1wZ
NEXT_PUBLIC_DELPHAI_ORACLE_ADDRESS=0xA95E99848a318e37F128aB841b0CF693c1f0b4D1
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_8FTbCUou5AAh3mmO_baPRjwwd1NqZKEoI7YqEGowxZjonW4
```

**Next Steps:**
- ✅ Ready to proceed with Phase 1: Smart Contract Development
- ⚠️ Need to add Vercel environment variables before deploying (DATABASE_URL, PRIVY_APP_SECRET, etc.)

---

## Phase 1 — Smart Contract Foundation (Days 1‑3) 🔄 IN PROGRESS
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
