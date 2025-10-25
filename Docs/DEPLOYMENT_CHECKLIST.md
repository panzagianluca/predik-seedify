# BNB Testnet Deployment Checklist

**Status:** 🚀 Ready to Deploy  
**Date Created:** October 24, 2025  
**Phase:** Phase 2 - Testnet Deployment  
**Prerequisites:** ✅ Phase 1 Complete (170/170 tests passing)

---

## Pre-Deployment Verification

### Contract Readiness
- [x] All 7 contracts implemented and tested
- [x] 170/170 tests passing (0 failures, 0 skipped)
- [x] All critical fixes completed (8/8 MUST DO items)
- [x] Security guards implemented (ReentrancyGuard, SafeERC20, AccessControl)
- [x] Code formatted with `forge fmt`
- [x] All contracts build successfully with `forge build`

### External Dependencies
- [x] **DelphAI Oracle:** ✅ LIVE at `0xA95E99848a318e37F128aB841b0CF693c1f0b4D1` (BSC Testnet Chain ID 97)
- [x] **Biconomy:** Configured with API Key `mee_CTa...` and Project ID `79933c68...`
- [x] **Privy:** Configured with App ID `cmh3yqmdl...` and Secret
- [x] **BNB Testnet RPC:** `https://data-seed-prebsc-1-s1.binance.org:8545/`
- [x] **BNB Testnet Chain ID:** `97`

### Environment Setup
- [ ] Get testnet BNB from faucet: https://testnet.bnbchain.org/faucet-smart
- [ ] Create deployer wallet with sufficient BNB (~0.5 BNB for deployment gas)
- [ ] Set `DEPLOYER_PRIVATE_KEY` in `.env` (DO NOT COMMIT)
- [ ] Set `BSCSCAN_API_KEY` in `.env` for contract verification

---

## Deployment Steps

### Step 1: Prepare Deployment Script
- [ ] Create `script/DeployBNBTestnet.s.sol`
- [ ] Set deployment parameters:
  - [ ] LMSR `b` parameter: `1000 * 10^6` (1000 USDT)
  - [ ] DelphAI Oracle address: `0xA95E99848a318e37F128aB841b0CF693c1f0b4D1`
  - [ ] Treasury fee split: 60% creator, 30% protocol, 10% LP
  - [ ] Initial USDT supply: `1000000 * 10^6` (1M USDT for testing)
- [ ] Add deployment order logic:
  1. MockUSDT
  2. Outcome1155
  3. Treasury
  4. Router
  5. Oracle
  6. MarketFactory
  7. Initial LMSRMarket (optional test market)

### Step 2: Deploy Contracts
- [ ] Run deployment script:
  ```bash
  forge script script/DeployBNBTestnet.s.sol:DeployBNBTestnet \
    --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
    --broadcast \
    --verify \
    -vvvv
  ```
- [ ] Record deployment transaction hashes
- [ ] Wait for confirmations (minimum 3 blocks)
- [ ] Verify all contracts deployed successfully

### Step 3: Record Contract Addresses
Create `deployments/bnb-testnet.json`:
```json
{
  "chainId": 97,
  "network": "bnb-testnet",
  "deployedAt": "2025-10-24T00:00:00Z",
  "deployer": "0x...",
  "contracts": {
    "MockUSDT": {
      "address": "0x...",
      "txHash": "0x...",
      "blockNumber": 0
    },
    "Outcome1155": {
      "address": "0x...",
      "txHash": "0x...",
      "blockNumber": 0
    },
    "Treasury": {
      "address": "0x...",
      "txHash": "0x...",
      "blockNumber": 0
    },
    "Router": {
      "address": "0x...",
      "txHash": "0x...",
      "blockNumber": 0
    },
    "Oracle": {
      "address": "0x...",
      "txHash": "0x...",
      "blockNumber": 0,
      "config": {
        "delphAI": "0xA95E99848a318e37F128aB841b0CF693c1f0b4D1"
      }
    },
    "MarketFactory": {
      "address": "0x...",
      "txHash": "0x...",
      "blockNumber": 0
    }
  }
}
```

### Step 4: Verify Contracts on BSCScan
- [ ] Verify MockUSDT:
  ```bash
  forge verify-contract <ADDRESS> contracts/MockUSDT.sol:MockUSDT \
    --chain-id 97 \
    --etherscan-api-key $BSCSCAN_API_KEY
  ```
- [ ] Verify Outcome1155
- [ ] Verify Treasury
- [ ] Verify Router
- [ ] Verify Oracle (include DelphAI constructor arg)
- [ ] Verify MarketFactory
- [ ] Confirm all contracts show green checkmark on BSCScan

### Step 5: Export ABIs
- [ ] Copy ABIs to frontend:
  ```bash
  mkdir -p lib/abis
  forge inspect MockUSDT abi > lib/abis/MockUSDT.json
  forge inspect Outcome1155 abi > lib/abis/Outcome1155.json
  forge inspect LMSRMarket abi > lib/abis/LMSRMarket.json
  forge inspect Router abi > lib/abis/Router.json
  forge inspect Oracle abi > lib/abis/Oracle.json
  forge inspect Treasury abi > lib/abis/Treasury.json
  forge inspect MarketFactory abi > lib/abis/MarketFactory.json
  ```
- [ ] Commit ABIs to repository

---

## Post-Deployment Configuration

### Configure Biconomy Paymaster
- [ ] Log in to Biconomy Dashboard: https://dashboard.biconomy.io/
- [ ] Navigate to Paymaster Policies
- [ ] Add BNB Testnet (Chain ID 97)
- [ ] Whitelist contract methods:
  - [ ] Router.buySharesWithPermit
  - [ ] Router.sellSharesWithPermit
  - [ ] Router.batchTrade
  - [ ] Outcome1155.setApprovalForAll
  - [ ] MockUSDT.approve
- [ ] Set gas limits (estimate: 500k per UserOp)
- [ ] Fund paymaster with testnet BNB (~1 BNB for testing)
- [ ] Test sponsored transaction flow

### Test DelphAI Integration
- [ ] Create test market via MarketFactory
- [ ] Submit resolution request to Oracle
- [ ] Verify Oracle calls DelphAI at `0xA95E...b4D1`
- [ ] Check DelphAI response format
- [ ] Test dispute flow with USDT bonds
- [ ] Verify finalization and payout logic

### Initialize Test Data
- [ ] Mint test USDT to deployer wallet
- [ ] Create 3-5 test markets with different configurations:
  - [ ] Binary market (2 outcomes)
  - [ ] Multi-choice market (3-5 outcomes)
  - [ ] High liquidity market (b = 5000 USDT)
  - [ ] Low liquidity market (b = 500 USDT)
- [ ] Add initial liquidity to each market
- [ ] Test buy/sell flows on each market

---

## Functional Testing

### Basic Trading Flow
- [ ] Connect wallet to BNB Testnet
- [ ] Get USDT from MockUSDT faucet
- [ ] Approve Router to spend USDT
- [ ] Buy shares in test market
- [ ] Verify shares minted to wallet
- [ ] Check price impact and slippage
- [ ] Sell shares back to market
- [ ] Verify USDT returned correctly

### Gasless Flow (Biconomy)
- [ ] Log in with Privy (Google or Email)
- [ ] Create smart account on first trade
- [ ] Buy shares using gasless transaction
- [ ] Verify UserOp sponsored by paymaster
- [ ] Check transaction on BSCScan (no gas paid by user)
- [ ] Sell shares using gasless transaction
- [ ] Confirm smooth UX (no wallet popups for gas)

### Oracle Resolution Flow
- [ ] Create market with future resolution date
- [ ] Wait for resolution time
- [ ] Call `requestResolve()` on market
- [ ] Verify Oracle receives request
- [ ] Check DelphAI response (may take 1-5 minutes)
- [ ] Call `finalize()` with winning outcome
- [ ] Verify market state = FINALIZED
- [ ] Redeem winning shares
- [ ] Verify USDT payout correct

### Dispute Flow
- [ ] Create market and resolve with outcome A
- [ ] Dispute resolution within dispute window
- [ ] Approve USDT for dispute bond (1% of total volume)
- [ ] Submit dispute with alternative outcome B
- [ ] Verify bond locked in Oracle
- [ ] Wait for dispute resolution (DelphAI or admin)
- [ ] If dispute valid: bond returned + slashed challenger bond
- [ ] If dispute invalid: bond slashed to treasury

### Fee Distribution
- [ ] Complete several trades on a market
- [ ] Check accumulated fees in Treasury
- [ ] Verify fee split: 60% creator, 30% protocol, 10% LP
- [ ] Test withdrawal as market creator
- [ ] Test withdrawal as protocol admin
- [ ] Verify USDT balances updated correctly

---

## Frontend Integration

### Update Wagmi Config
- [ ] Add BNB Testnet to chains array:
  ```typescript
  import { bscTestnet } from 'wagmi/chains'
  
  export const config = createConfig({
    chains: [bscTestnet],
    // ... rest of config
  })
  ```
- [ ] Update contract addresses in config
- [ ] Test connection to BNB Testnet RPC

### Update Environment Variables
- [ ] Add to `.env.local`:
  ```bash
  NEXT_PUBLIC_CHAIN_ID=97
  NEXT_PUBLIC_MOCKUSDT_ADDRESS=0x...
  NEXT_PUBLIC_OUTCOME1155_ADDRESS=0x...
  NEXT_PUBLIC_ROUTER_ADDRESS=0x...
  NEXT_PUBLIC_ORACLE_ADDRESS=0x...
  NEXT_PUBLIC_TREASURY_ADDRESS=0x...
  NEXT_PUBLIC_FACTORY_ADDRESS=0x...
  NEXT_PUBLIC_DELPHAI_ORACLE_ADDRESS=0xA95E99848a318e37F128aB841b0CF693c1f0b4D1
  ```
- [ ] Update `.env.local.example` with new variables
- [ ] Add to Vercel environment variables

### Test Contract Interactions
- [ ] Test `useReadContract` hooks with deployed contracts
- [ ] Test `useWriteContract` for buy/sell flows
- [ ] Test `useSimulateContract` for transaction previews
- [ ] Verify events are emitted correctly
- [ ] Check error handling for reverted transactions

---

## Documentation Updates

### Update Docs
- [ ] Update `ARCHITECTURE.md` with deployed addresses
- [ ] Update `IMPLEMENTATION_NOTES.md` with deployment details
- [ ] Update `README.md` with testnet links
- [ ] Update `EXECUTION_PLAN.md` to mark Phase 2 complete

### Create Deployment Summary
Document the following:
- [ ] All contract addresses
- [ ] Deployer address
- [ ] Total deployment gas cost
- [ ] BSCScan verification links
- [ ] Initial configuration parameters
- [ ] Test market addresses
- [ ] Any deployment issues encountered

---

## Success Criteria

### ✅ Deployment Complete When:
- [ ] All 7 contracts deployed to BNB Testnet
- [ ] All contracts verified on BSCScan
- [ ] ABIs exported to `lib/abis/`
- [ ] Biconomy paymaster configured and funded
- [ ] DelphAI integration tested successfully
- [ ] At least 3 test markets created
- [ ] Basic trading flow tested (buy + sell)
- [ ] Gasless flow tested (Biconomy + Privy)
- [ ] Oracle resolution tested (DelphAI response)
- [ ] Fee distribution tested (Treasury splits)
- [ ] Frontend connects to testnet contracts
- [ ] Documentation updated with addresses

### 🎯 Ready for Phase 3 When:
- [ ] All success criteria above met
- [ ] No critical bugs in trading flow
- [ ] Gasless UX working smoothly
- [ ] DelphAI resolution reliable
- [ ] Team confident in testnet stability

---

## Rollback Plan

### If Deployment Fails:
1. **Check Error Logs:**
   - Review `forge` output for specific error
   - Check BSCScan for failed transactions
   - Verify deployer has sufficient BNB

2. **Common Issues:**
   - **Out of Gas:** Increase gas limit in script
   - **Constructor Args Wrong:** Fix DelphAI address or other params
   - **Nonce Too High:** Reset deployer account
   - **RPC Timeout:** Switch to alternative BNB Testnet RPC

3. **Redeploy Strategy:**
   - Fix identified issue
   - Increment deployment script version
   - Deploy to new addresses
   - Update `deployments/bnb-testnet.json`

4. **If Critical Bug Found:**
   - Stop all frontend integrations
   - Document bug in GitHub issue
   - Fix contract code
   - Re-run all 170 tests
   - Deploy new version with incremented version number

---

## Next Steps After Deployment

1. **Phase 3:** Frontend Provider Migration
   - Replace Wagmi/RainbowKit with Biconomy AA stack
   - Implement Privy authentication
   - Build gasless trading hooks

2. **Phase 4:** Data Layer & API Migration
   - Deploy The Graph subgraph for BNB Testnet
   - Update markets API to query contracts
   - Migrate database to smart account model

3. **Phase 5:** Trading Experience & QA
   - Refactor trading components
   - Full QA suite across all flows
   - Bug fixes and polish

4. **Phase 6:** Market Seeding & Demo
   - Deploy 10 Argentine markets
   - Record demo video
   - Prepare Dorahacks submission

---

## Resources

### BNB Testnet
- **Chain ID:** 97
- **RPC:** https://data-seed-prebsc-1-s1.binance.org:8545/
- **Faucet:** https://testnet.bnbchain.org/faucet-smart
- **Explorer:** https://testnet.bscscan.com/

### External Services
- **DelphAI:** 0xA95E99848a318e37F128aB841b0CF693c1f0b4D1 (LIVE)
- **Biconomy:** https://dashboard.biconomy.io/
- **Privy:** https://dashboard.privy.io/
- **The Graph:** https://thegraph.com/

### Documentation
- [Foundry Deployment](https://book.getfoundry.sh/reference/forge/forge-script)
- [BSCScan Verification](https://docs.bscscan.com/verifying-contracts/hardhat-verification-plugin)
- [Biconomy Super Transactions](https://docs.biconomy.io/)
- [Privy Auth](https://docs.privy.io/)
- [DelphAI Docs](https://docs.delph.ai/) (if available)

---

**Last Updated:** October 24, 2025  
**Status:** Ready for deployment (170/170 tests passing, DelphAI live)  
**Next Action:** Prepare deployment script and fund deployer wallet
