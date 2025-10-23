# UI Test Page

**URL**: http://localhost:3000/uitest

## Purpose
This page is designed to test and verify all core integrations before building the full application.

## Features Tested

### 1. Wallet Connection
- ✅ Connect wallet via Wagmi
- ✅ Display wallet address
- ✅ Show connected network (Celo Sepolia)
- ✅ Disconnect functionality
- ✅ Multiple connector support (Injected, WalletConnect)

### 2. Myriad API Integration
- ✅ Fetch markets from Celo Sepolia (network_id: 11142220)
- ✅ Display market data (title, liquidity, volume, outcomes)
- ✅ Show market state (open/closed/resolved)
- ✅ Display outcome prices
- ✅ Error handling

### 3. Configuration Display
- ✅ Environment variables verification
- ✅ Contract addresses
- ✅ API endpoints
- ✅ Network IDs

## What to Test

1. **Wallet Connection**
   - Click "Connect Injected" to connect MetaMask/browser wallet
   - Click "Connect WalletConnect" to use WalletConnect (Valora, MiniPay, etc.)
   - Verify your address appears
   - Verify network shows "Celo Alfajores" (testnet)

2. **Market Data**
   - Page should automatically load markets from Myriad API
   - If markets exist on Celo Sepolia, they will display in cards
   - Each market shows: title, liquidity, volume, outcomes with percentages

3. **Network Switching**
   - Try switching networks in your wallet
   - The "Network" field should update automatically

## Expected Behavior

- **No Markets**: If Celo Sepolia has no markets yet, you'll see "No markets found"
- **API Error**: If there's an API issue, error message will display
- **Loading State**: Spinner appears while fetching data

## Next Steps

Once testing is complete, we'll:
1. Build the main market browsing page
2. Create market detail pages
3. Implement buy/sell functionality with Polkamarkets SDK
4. Add portfolio/positions tracking
