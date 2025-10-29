# Deployed Contract Addresses - BNB MAINNET

**Network**: 🔴 BNB Smart Chain Mainnet (Chain ID: 56) **PRODUCTION**  
**Deployer**: `0x39B55885B52F9b522619C4fdd1025709B1Ae4Ad7`  
**Latest Deployment**: October 29, 2025 (Block 66347803)  
**Deployment Cost**: 0.00062059885 BNB (~$0.68 USD)

---

## 🚀 Latest MAINNET Deployment (October 29, 2025)

**Status**: 🔴 **LIVE - PRODUCTION MAINNET**

| Contract | Address | Explorer |
|----------|---------|----------|
| **USDPredik** ⭐ | `0x44aaD94643d6166e0874C48f4E67594d3710D276` | [View on BSCScan](https://bscscan.com/address/0x44aaD94643d6166e0874C48f4E67594d3710D276) |
| **Outcome1155** | `0x09204C71893545A1F3b0652C0dD02f3A5b315fb1` | [View on BSCScan](https://bscscan.com/address/0x09204C71893545A1F3b0652C0dD02f3A5b315fb1) |
| **Treasury** | `0xA45e616A68434b806890Fb5893850de76C6c49cB` | [View on BSCScan](https://bscscan.com/address/0xA45e616A68434b806890Fb5893850de76C6c49cB) |
| **Router** ⭐ | `0x0C42E14F80dB8De190DdA89320D9faEB39930F7A` | [View on BSCScan](https://bscscan.com/address/0x0C42E14F80dB8De190DdA89320D9faEB39930F7A) |
| **Oracle** | `0x403bcFE4771d974db166c463b97564E117906CF9` | [View on BSCScan](https://bscscan.com/address/0x403bcFE4771d974db166c463b97564E117906CF9) |
| **MarketFactory** | `0xeC5D8e1140A42F39C0B2122799AA0253B7e37593` | [View on BSCScan](https://bscscan.com/address/0xeC5D8e1140A42F39C0B2122799AA0253B7e37593) |

⭐ **Key Contracts:**
- **USDPredik**: Platform token (1M supply, 6 decimals, faucet enabled)
- **Router**: Biconomy entrypoint for gasless transactions

### Deployment Statistics

- **Block Number**: 66347803 (all contracts atomic)
- **Total Gas Used**: 12,411,977 gas
- **Gas Price**: 0.05 gwei (0.00000005 BNB)
- **Total Cost**: 0.00062059885 BNB ($0.68 USD)
- **Transactions**: All in broadcast/DeployBNBMainnet.s.sol/56/run-latest.json

---

## 🔐 Security Configuration (COMPLETE)

All 7 role grants configured successfully on mainnet:

- ✅ **Config 1/7**: Router set in Outcome1155
- ✅ **Config 2/7**: Factory granted DEFAULT_ADMIN_ROLE on Outcome1155
- ✅ **Config 3/7**: Factory granted DEFAULT_ADMIN_ROLE on Router
- ✅ **Config 4/7**: Factory granted DEFAULT_ADMIN_ROLE on Oracle
- ✅ **Config 5/7**: Factory granted MARKET_MANAGER_ROLE on Treasury
- ✅ **Config 6/7**: Factory granted FEE_REPORTER_ROLE on Treasury
- ✅ **Config 7/7**: Deployer granted FEE_WITHDRAWER_ROLE on Treasury

**Security Features:**
- ✅ **Emergency Resolution**: 48H admin override if DelphAI fails
- ✅ **Emergency Withdrawal**: 7-day user withdrawal if market stuck
- ✅ **Router-Only Trading**: Direct market calls blocked (sandwich protection)
- ✅ **48H Router Timelock**: Safe upgrade mechanism
- ✅ **Fee Separation**: FEE_REPORTER (Factory) vs FEE_WITHDRAWER (Admin)

**Security Grade**: **B+** (acceptable for mainnet)

---

## External Dependencies

| Service | Address | Notes |
|---------|---------|-------|
| **DelphAI Oracle** | `0xA95E99848a318e37F128aB841b0CF693c1f0b4D1` | AI oracle service (same as testnet) |

---

## Configuration

**USDPredik Token:**
- Name: USDPredik
- Symbol: USDp
- Decimals: 6
- Initial Supply: 1,000,000 tokens
- Faucet: 10,000 USDp per claim, 1-hour cooldown

**LMSR Parameters:**
- Default liquidity parameter (b): 1000 USDT

**Fee Structure:**
- Protocol fee: 1.00% (100 bps)
- Creator fee: 0.50% (50 bps)
- Oracle fee: 0.25% (25 bps)
- **Total trading fee**: 1.75%

**Treasury Fee Distribution:**
- Creator: 60% (6000 bps)
- Protocol: 30% (3000 bps)
- Oracle/LP: 10% (1000 bps)

**Oracle:**
- Dispute bond: 1% of market volume (100 bps)

---

## Frontend Environment Variables

Add these to your `.env.local` for **MAINNET**:

```bash
# BNB MAINNET Contract Addresses (October 29, 2025 Deployment)
NEXT_PUBLIC_CHAIN_ID=56
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x44aaD94643d6166e0874C48f4E67594d3710D276
NEXT_PUBLIC_OUTCOME1155_ADDRESS=0x09204C71893545A1F3b0652C0dD02f3A5b315fb1
NEXT_PUBLIC_ROUTER_ADDRESS=0x0C42E14F80dB8De190DdA89320D9faEB39930F7A
NEXT_PUBLIC_TREASURY_ADDRESS=0xA45e616A68434b806890Fb5893850de76C6c49cB
NEXT_PUBLIC_ORACLE_ADDRESS=0x403bcFE4771d974db166c463b97564E117906CF9
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0xeC5D8e1140A42F39C0B2122799AA0253B7e37593
NEXT_PUBLIC_DELPHAI_ORACLE_ADDRESS=0xA95E99848a318e37F128aB841b0CF693c1f0b4D1

# BNB Mainnet RPC
NEXT_PUBLIC_BNB_RPC=https://bsc-dataseed.binance.org/
```

---

## Next Steps

1. ✅ Deployment complete on MAINNET
2. ⏳ Verify contracts on BSCScan mainnet
3. ⏳ Configure Biconomy dashboard (Router: 0x0C42E14F80dB8De190DdA89320D9faEB39930F7A)
4. ⏳ Update frontend .env.local with mainnet addresses
5. ⏳ Mint USDPredik for market seeding
6. ⏳ Create initial 10 Argentine markets
7. ⏳ Test gasless trading end-to-end

---

## 📜 Legacy Testnet Deployment (Archived)

<details>
<summary>Click to view testnet deployment history (October 24-29, 2025)</summary>

**Network**: BNB Smart Chain Testnet (Chain ID: 97)  
**Status**: ✅ Complete (Superseded by mainnet)

### Testnet Contract Addresses (October 29, 2025)

| Contract | Address | Explorer |
|----------|---------|----------|
| **MockUSDT** | `0x065b8ADad86048edC320277e92C58a4EEB3Bf902` | [View on Testnet](https://testnet.bscscan.com/address/0x065b8ADad86048edC320277e92C58a4EEB3Bf902) |
| **Outcome1155** | `0xB5c0e214F8D3f3f1DA4897418AC4C4458ee420c0` | [View on Testnet](https://testnet.bscscan.com/address/0xB5c0e214F8D3f3f1DA4897418AC4C4458ee420c0) |
| **Router** | `0x321F34Ac6404BE162bD79a8A1B4abDBbFC92e84a` | [View on Testnet](https://testnet.bscscan.com/address/0x321F34Ac6404BE162bD79a8A1B4abDBbFC92e84a) |
| **Treasury** | `0xc267B4ec9Ef5dDDaf79B850636b1a6dd787A2B8b` | [View on Testnet](https://testnet.bscscan.com/address/0xc267B4ec9Ef5dDDaf79B850636b1a6dd787A2B8b) |
| **Oracle** | `0x25C75C40c94B8C95A432805C18d47340FaC45737` | [View on Testnet](https://testnet.bscscan.com/address/0x25C75C40c94B8C95A432805C18d47340FaC45737) |
| **MarketFactory** | `0x9Be256DDB94Cd1563738c9c77Fca3c62e7321A5E` | [View on Testnet](https://testnet.bscscan.com/address/0x9Be256DDB94Cd1563738c9c77Fca3c62e7321A5E) |

### First Test Market

| Market ID | Address | Question | Status |
|-----------|---------|----------|--------|
| 0 | `0xD4646283c2e5A686AdD3E74E920F3dfB906116E0` | "Will Bitcoin reach $100,000 by end of 2025?" | ✅ TESTED |

**Testing Results:**
- ✅ Market creation successful
- ✅ Trading tested (buy/sell shares)
- ✅ Prices calculated correctly (50/50 → 50.12/49.88)
- ✅ Fee mechanism working (~3 USDT round-trip)
- ✅ Gas costs: ~318K gas (~$0.17)

</details>
