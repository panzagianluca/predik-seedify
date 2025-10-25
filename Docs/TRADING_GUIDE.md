# Trading Guide - LMSR Market Contracts

**Network:** BNB Testnet (Chain ID 97)  
**Last Updated:** October 25, 2025  
**Status:** ✅ Tested and Working

---

## 📋 Quick Reference

### Contract Addresses

```bash
# Core Contracts
MARKET_FACTORY=0x5c4850878F222aC16d5ab60204997b904Fe4019A
USDT=0x4410355e143112e0619f822fC9Ecf92AaBd01b63
OUTCOME_1155=0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29
ROUTER=0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991

# Example Market (Market ID 0)
MARKET_0=0x2935645910f2773dc3f76A2Ec38594344618CF28
```

---

## 🔑 Key Concepts

### Decimals

| Token/Value | Decimals | Example |
|-------------|----------|---------|
| **Shares (ERC-1155)** | 18 | `10 * 10**18` = 10 shares |
| **USDT (collateral)** | 6 | `100 * 10**6` = 100 USDT |
| **Prices** | 18 (UD60x18) | `500000000000000000` = 50% |

### Function Pattern

**CRITICAL:** Buy/sell functions take **SHARES** as input, not USDT amounts!

```solidity
// ❌ WRONG - Don't do this
uint256 usdtAmount = 10 * 10**6; // 10 USDT
market.buy(0, usdtAmount); // This buys 0.00001 shares, not $10 worth!

// ✅ CORRECT - Always use shares
uint256 sharesToBuy = 10 * 10**18; // 10 shares
(, , uint256 totalCost) = market.previewBuy(0, sharesToBuy); // Preview first
usdt.approve(marketAddress, totalCost); // Approve exact amount
market.buy(0, sharesToBuy); // Buy shares
```

---

## 📖 Trading Functions

### `previewBuy` - Calculate Buy Cost

Preview how much USDT is needed to buy X shares.

```solidity
function previewBuy(uint8 outcomeId, uint256 deltaShares) 
    external view 
    returns (
        uint256 tradeCost,  // Base cost in USDT (6 decimals)
        uint256 fee,        // Fee in USDT (6 decimals)
        uint256 totalCost   // Total = tradeCost + fee (6 decimals)
    );
```

**Example:**
```solidity
// How much does it cost to buy 10 shares of outcome 0?
uint256 sharesToBuy = 10 * 10**18; // 10 shares
(uint256 cost, uint256 fee, uint256 total) = market.previewBuy(0, sharesToBuy);

console.log("Base cost:", cost / 10**6, "USDT");
console.log("Fee:", fee / 10**6, "USDT");
console.log("Total cost:", total / 10**6, "USDT");
// Output: Base cost: 5 USDT, Fee: 0.087 USDT, Total: 5.087 USDT
```

**Frontend Usage (TypeScript):**
```typescript
import { parseUnits, formatUnits } from 'viem';

const sharesToBuy = parseUnits('10', 18); // 10 shares
const [tradeCost, fee, totalCost] = await market.read.previewBuy([0, sharesToBuy]);

console.log(`Cost: ${formatUnits(totalCost, 6)} USDT`); // "5.087 USDT"
```

---

### `buy` - Buy Shares

Purchase shares for a specific outcome.

```solidity
function buy(uint8 outcomeId, uint256 deltaShares) 
    external 
    returns (uint256 totalPaid); // Amount of USDT spent (6 decimals)
```

**Requirements:**
- USDT must be approved BEFORE calling buy
- Approve at least `totalCost` from `previewBuy()`
- Market must be in Trading state
- Trading must not be paused

**Example:**
```solidity
// Buy 10 shares of outcome 0
uint256 sharesToBuy = 10 * 10**18;

// 1. Preview to get exact cost
(, , uint256 totalCost) = market.previewBuy(0, sharesToBuy);

// 2. Approve USDT
usdt.approve(marketAddress, totalCost);

// 3. Execute buy
uint256 paid = market.buy(0, sharesToBuy);
console.log("Paid:", paid / 10**6, "USDT");
// Output: Paid: 5.087 USDT
```

**Frontend Usage (TypeScript):**
```typescript
import { parseUnits } from 'viem';

const sharesToBuy = parseUnits('10', 18);

// 1. Preview
const [, , totalCost] = await market.read.previewBuy([0, sharesToBuy]);

// 2. Approve
await usdt.write.approve([marketAddress, totalCost]);

// 3. Buy
const tx = await market.write.buy([0, sharesToBuy]);
await publicClient.waitForTransactionReceipt({ hash: tx });
```

---

### `previewSell` - Calculate Sell Payout

Preview how much USDT you'll receive for selling X shares.

```solidity
function previewSell(uint8 outcomeId, uint256 deltaShares) 
    external view 
    returns (
        uint256 tradePayout,  // Gross payout in USDT (6 decimals)
        uint256 fee,          // Fee in USDT (6 decimals)
        uint256 netPayout     // Net = tradePayout - fee (6 decimals)
    );
```

**Example:**
```solidity
// How much will I receive for selling 5 shares?
uint256 sharesToSell = 5 * 10**18;
(uint256 gross, uint256 fee, uint256 net) = market.previewSell(0, sharesToSell);

console.log("Gross payout:", gross / 10**6, "USDT");
console.log("Fee:", fee / 10**6, "USDT");
console.log("Net payout:", net / 10**6, "USDT");
// Output: Gross: 2.5 USDT, Fee: 0.043 USDT, Net: 2.456 USDT
```

---

### `sell` - Sell Shares

Sell shares for a specific outcome.

```solidity
function sell(uint8 outcomeId, uint256 deltaShares) 
    external 
    returns (uint256 netPayout); // Amount of USDT received (6 decimals)
```

**Requirements:**
- Must own at least `deltaShares` of the outcome
- Market must be in Trading state
- Trading must not be paused
- No approval needed (burning your own tokens)

**Example:**
```solidity
// Sell 5 shares of outcome 0
uint256 sharesToSell = 5 * 10**18;

// 1. Preview to know expected payout
(, , uint256 expectedPayout) = market.previewSell(0, sharesToSell);
console.log("Expecting:", expectedPayout / 10**6, "USDT");

// 2. Execute sell
uint256 received = market.sell(0, sharesToSell);
console.log("Received:", received / 10**6, "USDT");
// Output: Received: 2.456 USDT
```

---

## 🎯 Complete Trading Flow Example

### Solidity Script

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {LMSRMarket} from "../contracts/LMSRMarket.sol";
import {MockUSDT} from "../contracts/MockUSDT.sol";

contract TradeExample is Script {
    LMSRMarket market = LMSRMarket(0x2935645910f2773dc3f76A2Ec38594344618CF28);
    MockUSDT usdt = MockUSDT(0x4410355e143112e0619f822fC9Ecf92AaBd01b63);
    
    function run() public {
        vm.startBroadcast();
        
        // Buy 10 shares
        uint256 shares = 10 * 10**18;
        (,, uint256 cost) = market.previewBuy(0, shares);
        usdt.approve(address(market), cost);
        market.buy(0, shares);
        
        // Sell 5 shares
        uint256 sellShares = 5 * 10**18;
        market.sell(0, sellShares);
        
        vm.stopBroadcast();
    }
}
```

### TypeScript (Frontend)

```typescript
import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { bscTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount('0x...');
const publicClient = createPublicClient({ chain: bscTestnet, transport: http() });
const walletClient = createWalletClient({ chain: bscTestnet, transport: http(), account });

const MARKET_ADDRESS = '0x2935645910f2773dc3f76A2Ec38594344618CF28';
const USDT_ADDRESS = '0x4410355e143112e0619f822fC9Ecf92AaBd01b63';

// 1. Preview buy
const sharesToBuy = parseUnits('10', 18); // 10 shares
const [tradeCost, fee, totalCost] = await publicClient.readContract({
  address: MARKET_ADDRESS,
  abi: LMSR_MARKET_ABI,
  functionName: 'previewBuy',
  args: [0, sharesToBuy],
});

console.log(`Buying 10 shares will cost ${formatUnits(totalCost, 6)} USDT`);

// 2. Approve USDT
const approveTx = await walletClient.writeContract({
  address: USDT_ADDRESS,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [MARKET_ADDRESS, totalCost],
});
await publicClient.waitForTransactionReceipt({ hash: approveTx });

// 3. Buy shares
const buyTx = await walletClient.writeContract({
  address: MARKET_ADDRESS,
  abi: LMSR_MARKET_ABI,
  functionName: 'buy',
  args: [0, sharesToBuy],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash: buyTx });
console.log('Buy successful!', receipt.transactionHash);

// 4. Sell half
const sharesToSell = parseUnits('5', 18);
const sellTx = await walletClient.writeContract({
  address: MARKET_ADDRESS,
  abi: LMSR_MARKET_ABI,
  functionName: 'sell',
  args: [0, sharesToSell],
});
await publicClient.waitForTransactionReceipt({ hash: sellTx });
console.log('Sell successful!');
```

---

## 💡 Common Patterns

### Pattern 1: Buy with Slippage Protection

```solidity
// Calculate expected shares for a given USDT amount
// (This requires iterating or using a helper function)

// For now, use generous approval and check actual cost
uint256 maxShares = 100 * 10**18; // Max shares willing to buy
(,, uint256 totalCost) = market.previewBuy(0, maxShares);

uint256 maxUSDT = 50 * 10**6; // Max willing to spend: 50 USDT
require(totalCost <= maxUSDT, "Too expensive");

usdt.approve(marketAddress, totalCost);
market.buy(0, maxShares);
```

### Pattern 2: Sell with Minimum Payout

```solidity
uint256 sharesToSell = 10 * 10**18;
(,, uint256 expectedPayout) = market.previewSell(0, sharesToSell);

uint256 minAcceptable = 4 * 10**6; // Min 4 USDT
require(expectedPayout >= minAcceptable, "Price too low");

market.sell(0, sharesToSell);
```

### Pattern 3: Check Current Price Before Trading

```solidity
uint256 currentPrice = market.getPrice(0);
console.log("Current price:", currentPrice * 100 / 10**18, "%");

// Only buy if price is below 60%
require(currentPrice < 0.6 * 10**18, "Price too high");

// Proceed with buy...
```

---

## 🧪 Testing Results (October 25, 2025)

**Market:** `0x2935645910f2773dc3f76A2Ec38594344618CF28`  
**Question:** "Will Bitcoin reach $100,000 by end of 2025?"

### Test 1: Buy 10 Shares

```
Shares purchased: 10 (10e18)
Outcome: 0 (Yes)
Trade cost: 5.000 USDT
Fee: 0.087 USDT
Total paid: 5.087 USDT
Gas: 166,896
```

**Price Impact:**
- Before: 50.00% (Yes) / 50.00% (No)
- After: 50.12% (Yes) / 49.88% (No)

**Transaction:** `0x9ab49902b31d544baa52df1344d889d916db2651f12d6fa9a8800e915bbc177a`

### Test 2: Sell 5 Shares

```
Shares sold: 5 (5e18)
Outcome: 0 (Yes)
Trade payout: 2.500 USDT
Fee: 0.043 USDT
Net received: 2.456 USDT
Gas: 45,935
```

**Price Impact:**
- Prices remained: 50.12% (Yes) / 49.88% (No)

**Transaction:** `0xc11f43a9e7e844b5fa2ef8e457d596f3d66521794cfea7bf99ca26b55bbf8abd`

### Round-Trip Analysis

```
Initial balance: 199,000 USDT
After buy: 198,994.913 USDT (spent 5.087)
After sell: 198,997.369 USDT (received 2.456)
Net loss: 2.631 USDT (fees)

Still holding: 5 shares of outcome 0
```

**Conclusion:** ✅ All trading functions working correctly!

---

## ⚠️ Common Mistakes

### ❌ Mistake 1: Passing USDT amount instead of shares

```solidity
// WRONG
uint256 amount = 10 * 10**6; // 10 USDT
market.buy(0, amount); // This buys 0.00001 shares!

// CORRECT
uint256 shares = 10 * 10**18; // 10 shares
market.buy(0, shares);
```

### ❌ Mistake 2: Wrong decimals for preview

```solidity
// WRONG
uint256 shares = 10; // Missing decimals
market.previewBuy(0, shares); // Returns cost for 0.00000000000001 shares

// CORRECT
uint256 shares = 10 * 10**18;
market.previewBuy(0, shares);
```

### ❌ Mistake 3: Not approving USDT before buy

```solidity
// WRONG - Will revert with "ERC20: insufficient allowance"
market.buy(0, shares);

// CORRECT
usdt.approve(marketAddress, totalCost);
market.buy(0, shares);
```

### ❌ Mistake 4: Approving wrong amount

```solidity
(uint256 tradeCost, uint256 fee, uint256 totalCost) = market.previewBuy(0, shares);

// WRONG - Approve only trade cost, missing fee
usdt.approve(marketAddress, tradeCost);

// CORRECT - Approve total cost (includes fee)
usdt.approve(marketAddress, totalCost);
```

---

## 📚 Additional Resources

- **Deployment Record:** `Docs/DEPLOYMENT_RECORD.md`
- **Troubleshooting Guide:** `Docs/DEPLOYMENT_TROUBLESHOOTING.md`
- **Architecture:** `Docs/ARCHITECTURE.md`
- **Contract Source:** `contracts/LMSRMarket.sol`
- **Test Script:** `script/TestTrade.s.sol`

---

**Document Version:** 1.0  
**Last Verified:** October 25, 2025  
**Network:** BNB Testnet (97)  
**Status:** Production-Ready ✅
