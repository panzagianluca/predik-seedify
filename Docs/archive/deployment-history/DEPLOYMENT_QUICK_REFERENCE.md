# BNB Testnet Deployment - Quick Reference

**Date:** October 24, 2025  
**Status:** ✅ Ready to Deploy  
**Prerequisites:** 170/170 tests passing, all critical fixes complete

---

## 🚀 Quick Deploy (5 Steps)

### 1. Get Testnet BNB
```bash
# Visit faucet and get ~0.5 BNB for gas
# https://testnet.bnbchain.org/faucet-smart
```

### 2. Set Environment Variables
```bash
# Create .env file (DO NOT COMMIT)
cat > .env << 'EOF'
DEPLOYER_PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here
EOF
```

### 3. Run Deployment
```bash
forge script script/DeployBNBTestnet.s.sol:DeployBNBTestnet \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
  --broadcast \
  --verify \
  -vvvv
```

### 4. Export ABIs
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

### 5. Update Frontend Config
```bash
# Add to .env.local:
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_MOCKUSDT_ADDRESS=<from deployment output>
NEXT_PUBLIC_OUTCOME1155_ADDRESS=<from deployment output>
NEXT_PUBLIC_ROUTER_ADDRESS=<from deployment output>
NEXT_PUBLIC_ORACLE_ADDRESS=<from deployment output>
NEXT_PUBLIC_TREASURY_ADDRESS=<from deployment output>
NEXT_PUBLIC_FACTORY_ADDRESS=<from deployment output>
NEXT_PUBLIC_DELPHAI_ORACLE_ADDRESS=0xA95E99848a318e37F128aB841b0CF693c1f0b4D1
```

---

## 📋 Deployment Configuration

### Contract Parameters

| Contract | Parameter | Value | Notes |
|----------|-----------|-------|-------|
| **MarketFactory** | Default Liquidity | 1000 USDT | LMSR 'b' parameter (UD60x18) |
| | Protocol Fee | 1.0% (100 bps) | Goes to protocol treasury |
| | Creator Fee | 0.5% (50 bps) | Goes to market creator |
| | Oracle Fee | 0.25% (25 bps) | Goes to oracle (DelphAI) |
| | **Total Fee** | **1.75%** | Sum of all fees |
| **Treasury** | Creator Split | 60% | From collected fees |
| | Protocol Split | 30% | From collected fees |
| | LP Split | 10% | From collected fees |
| **Oracle** | Dispute Bond | 1% of volume | USDT-based bonds |
| | DelphAI Address | 0xA95E...b4D1 | Already deployed |
| **MockUSDT** | Initial Supply | 1M USDT | For testing |
| | Decimals | 6 | Standard USDT |

### Deployment Order
1. MockUSDT (no dependencies)
2. Outcome1155 (no dependencies)
3. Treasury (no dependencies)
4. Router (depends on: Outcome1155, MockUSDT)
5. Oracle (depends on: MockUSDT, Treasury, DelphAI)
6. MarketFactory (depends on: all above)

### Post-Deployment Configuration
- ✅ Set Router in Outcome1155 (enables gasless trading)
- ✅ Grant MARKET_REGISTRAR_ROLE to Factory in Oracle
- ✅ Grant MARKET_REGISTRAR_ROLE to Factory in Treasury

---

## 🔍 Verification Commands

After deployment, verify each contract on BSCScan:

```bash
# Set your API key
export BSCSCAN_API_KEY=your_api_key_here

# Verify MockUSDT
forge verify-contract <MOCKUSDT_ADDRESS> \
  contracts/MockUSDT.sol:MockUSDT \
  --chain-id 97 \
  --etherscan-api-key $BSCSCAN_API_KEY

# Verify Outcome1155
forge verify-contract <OUTCOME1155_ADDRESS> \
  contracts/Outcome1155.sol:Outcome1155 \
  --chain-id 97 \
  --constructor-args $(cast abi-encode "constructor(string)" "https://predik.ar/api/tokens/{id}.json") \
  --etherscan-api-key $BSCSCAN_API_KEY

# Verify Treasury
forge verify-contract <TREASURY_ADDRESS> \
  contracts/Treasury.sol:Treasury \
  --chain-id 97 \
  --constructor-args $(cast abi-encode "constructor(uint16,uint16,uint16,address)" 6000 3000 1000 0xA95E99848a318e37F128aB841b0CF693c1f0b4D1) \
  --etherscan-api-key $BSCSCAN_API_KEY

# Verify Router
forge verify-contract <ROUTER_ADDRESS> \
  contracts/Router.sol:Router \
  --chain-id 97 \
  --constructor-args $(cast abi-encode "constructor(address,address)" <OUTCOME1155_ADDRESS> <MOCKUSDT_ADDRESS>) \
  --etherscan-api-key $BSCSCAN_API_KEY

# Verify Oracle
forge verify-contract <ORACLE_ADDRESS> \
  contracts/Oracle.sol:Oracle \
  --chain-id 97 \
  --constructor-args $(cast abi-encode "constructor(address,address,address,uint16)" <MOCKUSDT_ADDRESS> 0xA95E99848a318e37F128aB841b0CF693c1f0b4D1 <TREASURY_ADDRESS> 100) \
  --etherscan-api-key $BSCSCAN_API_KEY

# Verify MarketFactory
forge verify-contract <FACTORY_ADDRESS> \
  contracts/MarketFactory.sol:MarketFactory \
  --chain-id 97 \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address,address,uint256,uint16,uint16,uint16)" <MOCKUSDT_ADDRESS> <ORACLE_ADDRESS> <OUTCOME1155_ADDRESS> <ROUTER_ADDRESS> <TREASURY_ADDRESS> 1000000000000000000000 100 50 25) \
  --etherscan-api-key $BSCSCAN_API_KEY
```

---

## 🧪 Post-Deployment Testing

### 1. Create Test Market
```typescript
// Using frontend or ethers.js
const tx = await factory.createMarket(
  "¿Milei gana las elecciones 2025?",  // title
  ["Sí", "No"],                         // outcomes
  Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  0,  // use default liquidity
  0,  // use default protocol fee
  0,  // use default creator fee
  0,  // use default oracle fee
  ethers.parseUnits("100", 6),  // 100 USDT initial liquidity
  12345  // DelphAI market ID (create in DelphAI first!)
);
```

### 2. Test Trading Flow
```bash
# 1. Get USDT from faucet
cast send <MOCKUSDT_ADDRESS> "faucet()" --rpc-url <RPC> --private-key <KEY>

# 2. Approve Router
cast send <MOCKUSDT_ADDRESS> "approve(address,uint256)" <ROUTER_ADDRESS> 1000000000 --rpc-url <RPC> --private-key <KEY>

# 3. Buy shares (via frontend or direct call)
# This should work through Router.buyWithPermit() for gasless UX
```

### 3. Test Oracle Resolution
```bash
# 1. Request resolution
cast send <MARKET_ADDRESS> "requestResolve()" --rpc-url <RPC> --private-key <KEY>

# 2. Oracle should call DelphAI and get outcome
# 3. Finalize market (Oracle role required)
cast send <MARKET_ADDRESS> "finalize(uint8,bool)" 0 false --rpc-url <RPC> --private-key <ORACLE_KEY>

# 4. Redeem winning shares
cast send <MARKET_ADDRESS> "redeem(uint8,uint256)" 0 <SHARES> --rpc-url <RPC> --private-key <KEY>
```

---

## 📊 Expected Gas Costs

| Operation | Estimated Gas | Cost @ 3 gwei |
|-----------|---------------|---------------|
| Deploy MockUSDT | ~800k | ~0.0024 BNB |
| Deploy Outcome1155 | ~2.5M | ~0.0075 BNB |
| Deploy Treasury | ~1.2M | ~0.0036 BNB |
| Deploy Router | ~1.5M | ~0.0045 BNB |
| Deploy Oracle | ~2M | ~0.006 BNB |
| Deploy MarketFactory | ~3M | ~0.009 BNB |
| **Total Deployment** | **~11M** | **~0.033 BNB** |
| Post-config (3 txs) | ~300k | ~0.0009 BNB |
| **Grand Total** | **~11.3M** | **~0.034 BNB** |

**Recommended:** Have **0.5 BNB** in deployer wallet for safety margin.

---

## 🚨 Troubleshooting

### Deployment Fails: Out of Gas
```bash
# Increase gas limit in foundry.toml
[rpc_endpoints]
bnb_testnet = "https://data-seed-prebsc-1-s1.binance.org:8545/"

[etherscan]
bnb_testnet = { key = "${BSCSCAN_API_KEY}", chain = 97, url = "https://api-testnet.bscscan.com/api" }

# Or deploy contracts individually
forge create contracts/MockUSDT.sol:MockUSDT --rpc-url <RPC> --private-key <KEY>
```

### Verification Fails
```bash
# Wait a few minutes after deployment
# BSCScan needs time to index the contract

# Try manual verification on BSCScan
# Go to contract address > Verify & Publish
# Upload flattened source: forge flatten contracts/MockUSDT.sol
```

### RPC Issues
```bash
# Alternative BNB Testnet RPCs:
# https://bsc-testnet.publicnode.com
# https://bsc-testnet-rpc.publicnode.com
# https://data-seed-prebsc-2-s1.binance.org:8545/
```

---

## 📦 Deliverables Checklist

After deployment, ensure you have:

- [ ] All 7 contract addresses recorded
- [ ] All contracts verified on BSCScan (green checkmark)
- [ ] ABIs exported to `lib/abis/`
- [ ] Deployment summary in `deployments/bnb-testnet.json`
- [ ] Frontend `.env.local` updated with addresses
- [ ] At least 1 test market created
- [ ] Tested buy/sell flow successfully
- [ ] Biconomy paymaster configured (if using gasless)
- [ ] Documentation updated with deployment info

---

## 🔗 Useful Links

- **BNB Testnet Explorer:** https://testnet.bscscan.com/
- **BNB Faucet:** https://testnet.bnbchain.org/faucet-smart
- **DelphAI Oracle:** https://testnet.bscscan.com/address/0xA95E99848a318e37F128aB841b0CF693c1f0b4D1
- **Biconomy Dashboard:** https://dashboard.biconomy.io/
- **Foundry Book:** https://book.getfoundry.sh/
- **BSCScan API Docs:** https://docs.bscscan.com/

---

**Last Updated:** October 24, 2025  
**Next Step:** Run deployment script with funded deployer wallet
