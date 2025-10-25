# Deployed Contract Addresses - BNB Testnet

**Network**: BNB Smart Chain Testnet (Chain ID: 97)  
**Deployer**: `0x5e310BA9A20FFf37a8E8962789B7B459f511E7d2`  
**Deployment Date**: October 24, 2025

---

## Core Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| **MockUSDT** | `0x4410355e143112e0619f822fC9Ecf92AaBd01b63` | [View on BSCScan](https://testnet.bscscan.com/address/0x4410355e143112e0619f822fC9Ecf92AaBd01b63) |
| **Outcome1155** | `0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29` | [View on BSCScan](https://testnet.bscscan.com/address/0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29) |
| **Router** | `0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991` | [View on BSCScan](https://testnet.bscscan.com/address/0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991) |
| **Treasury** | `0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1` | [View on BSCScan](https://testnet.bscscan.com/address/0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1) |
| **Oracle** | `0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4` | [View on BSCScan](https://testnet.bscscan.com/address/0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4) |
| **MarketFactory** | `0xB8ddC4A144A16eF648d606Bc8041D67a4aDBe04f` | [View on BSCScan](https://testnet.bscscan.com/address/0xB8ddC4A144A16eF648d606Bc8041D67a4aDBe04f) ⚡ **WITH METADATA** |

### Previous MarketFactory (No Metadata)
| Contract | Address | Status |
|----------|---------|--------|
| **MarketFactory (OLD)** | `0x5c4850878F222aC16d5ab60204997b904Fe4019A` | ❌ Deprecated - Use new version above |

---

## External Dependencies

| Service | Address | Notes |
|---------|---------|-------|
| **DelphAI Oracle** | `0xA95E99848a318e37F128aB841b0CF693c1f0b4D1` | Pre-deployed oracle service |

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
✅ Router configured in Outcome1155  
✅ Factory granted admin roles in Oracle & Treasury  
✅ **All contracts verified on BSCScan**  
✅ Total gas used: ~11.3M gas (~0.028 BNB)

---

## Frontend Environment Variables

Add these to your `.env.local`:

```bash
# BNB Testnet Contract Addresses
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_MOCK_USDT_ADDRESS=0x4410355e143112e0619f822fC9Ecf92AaBd01b63
NEXT_PUBLIC_OUTCOME1155_ADDRESS=0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29
NEXT_PUBLIC_ROUTER_ADDRESS=0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991
NEXT_PUBLIC_TREASURY_ADDRESS=0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1
NEXT_PUBLIC_ORACLE_ADDRESS=0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4
NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0xB8ddC4A144A16eF648d606Bc8041D67a4aDBe04f
NEXT_PUBLIC_DELPHAI_ORACLE_ADDRESS=0xA95E99848a318e37F128aB841b0CF693c1f0b4D1
```

---

## Next Steps

1. ✅ Deployment complete
2. ✅ Contracts verified on BSCScan
3. ⏳ Export ABIs to `lib/abis/`
4. ⏳ Update frontend with contract addresses
5. ⏳ Test market creation
6. ⏳ Configure Biconomy paymaster for gasless transactions
