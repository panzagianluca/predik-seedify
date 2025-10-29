# Deployed Contract Addresses - BNB Testnet

**Network**: BNB Smart Chain Testnet (Chain ID: 97)  
**Deployer**: `0x5e310BA9A20FFf37a8E8962789B7B459f511E7d2`  
**Latest Deployment**: October 29, 2025 (with security fixes)

---

## 🚀 Latest Deployment (October 29, 2025)

**Status**: ✅ ACTIVE - Production Ready with Security Hardening

| Contract | Address | Explorer |
|----------|---------|----------|
| **MockUSDT** | `0x065b8ADad86048edC320277e92C58a4EEB3Bf902` | [View on BSCScan](https://testnet.bscscan.com/address/0x065b8ADad86048edC320277e92C58a4EEB3Bf902) |
| **Outcome1155** | `0xB5c0e214F8D3f3f1DA4897418AC4C4458ee420c0` | [View on BSCScan](https://testnet.bscscan.com/address/0xB5c0e214F8D3f3f1DA4897418AC4C4458ee420c0) |
| **Router** | `0x321F34Ac6404BE162bD79a8A1B4abDBbFC92e84a` | [View on BSCScan](https://testnet.bscscan.com/address/0x321F34Ac6404BE162bD79a8A1B4abDBbFC92e84a) |
| **Treasury** | `0xc267B4ec9Ef5dDDaf79B850636b1a6dd787A2B8b` | [View on BSCScan](https://testnet.bscscan.com/address/0xc267B4ec9Ef5dDDaf79B850636b1a6dd787A2B8b) |
| **Oracle** | `0x25C75C40c94B8C95A432805C18d47340FaC45737` | [View on BSCScan](https://testnet.bscscan.com/address/0x25C75C40c94B8C95A432805C18d47340FaC45737) |
| **MarketFactory** | `0x9Be256DDB94Cd1563738c9c77Fca3c62e7321A5E` | [View on BSCScan](https://testnet.bscscan.com/address/0x9Be256DDB94Cd1563738c9c77Fca3c62e7321A5E) |

### First Test Market Created

| Market ID | Address | Question | Status |
|-----------|---------|----------|--------|
| 0 | `0xD4646283c2e5A686AdD3E74E920F3dfB906116E0` | "Will Bitcoin reach $100,000 by end of 2025?" | ✅ ACTIVE |

**BSCScan**: https://testnet.bscscan.com/address/0xD4646283c2e5A686AdD3E74E920F3dfB906116E0

---

## 🔐 Security Features (New in Oct 29 Deployment)

This deployment includes all CRITICAL and HIGH security fixes:

- ✅ **7 Role Grants**: Factory has proper permissions across all contracts
- ✅ **Slippage Protection**: `maxCost`/`minPayout` parameters on buy/sell
- ✅ **Emergency Resolution**: 48H admin override if DelphAI fails
- ✅ **Emergency Withdrawal**: 7-day user withdrawal if market stuck
- ✅ **Router-Only Trading**: Direct market calls blocked (sandwich protection)
- ✅ **48H Router Timelock**: Safe upgrade mechanism for router changes
- ✅ **Treasury Role Separation**: FEE_REPORTER vs FEE_WITHDRAWER roles

**Security Grade**: B+ (improved from C+)

---

## External Dependencies

| Service | Address | Notes |
|---------|---------|-------|
| **DelphAI Oracle** | `0xA95E99848a318e37F128aB841b0CF693c1f0b4D1` | Pre-deployed oracle service (LIVE) |

---

## Configuration

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

## Deployment Summary

✅ All 6 contracts deployed successfully  
✅ All 7 role grants executed successfully  
✅ Router configured in Outcome1155  
✅ Factory granted admin roles in Oracle, Treasury, Router, Outcome1155  
✅ **All contracts verified on BSCScan**  
✅ First test market created and verified  
✅ Total gas used: ~16.2M gas (~0.016 BNB)

---

## Frontend Environment Variables

Add these to your `.env.local`:

```bash
# BNB Testnet Contract Addresses (October 29, 2025 Deployment)
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x065b8ADad86048edC320277e92C58a4EEB3Bf902
NEXT_PUBLIC_OUTCOME1155_ADDRESS=0xB5c0e214F8D3f3f1DA4897418AC4C4458ee420c0
NEXT_PUBLIC_ROUTER_ADDRESS=0x321F34Ac6404BE162bD79a8A1B4abDBbFC92e84a
NEXT_PUBLIC_TREASURY_ADDRESS=0xc267B4ec9Ef5dDDaf79B850636b1a6dd787A2B8b
NEXT_PUBLIC_ORACLE_ADDRESS=0x25C75C40c94B8C95A432805C18d47340FaC45737
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x9Be256DDB94Cd1563738c9c77Fca3c62e7321A5E
NEXT_PUBLIC_DELPHAI_ORACLE_ADDRESS=0xA95E99848a318e37F128aB841b0CF693c1f0b4D1
```

---

## Previous Deployments

See `Docs/archive/deployment-history/` for details on previous deployments:
- October 24, 2025: Initial deployment (deprecated - missing role grants)
- October 25, 2025: Second deployment with metadata support (deprecated)

---

## Next Steps

1. ✅ Deployment complete with security fixes
2. ✅ Contracts verified on BSCScan
3. ✅ First market created and tested
4. ✅ All role grants verified
5. ⏳ Export ABIs to `lib/abis/`
6. ⏳ Update frontend with new contract addresses
7. ⏳ Test gasless trading with Biconomy
8. ⏳ Seed 10 Argentine markets for demo
