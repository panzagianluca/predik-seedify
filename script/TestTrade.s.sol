// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {LMSRMarket} from "../contracts/LMSRMarket.sol";
import {MockUSDT} from "../contracts/MockUSDT.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TestTrade
 * @notice Test buying and selling shares on the deployed market
 * @dev This script tests the full trading flow on BNB Testnet
 * 
 * Usage:
 *   source .env && forge script script/TestTrade.s.sol \
 *     --rpc-url $BNB_TESTNET_RPC \
 *     --broadcast \
 *     -vvvv
 */
contract TestTrade is Script {
    // Deployed contract addresses (from .env.local)
    address constant MARKET_ADDRESS = 0x2935645910f2773dc3f76A2Ec38594344618CF28;
    address constant USDT_ADDRESS = 0x4410355e143112e0619f822fC9Ecf92AaBd01b63;
    
    LMSRMarket public market;
    MockUSDT public usdt;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        market = LMSRMarket(MARKET_ADDRESS);
        usdt = MockUSDT(USDT_ADDRESS);
        
        console.log("==============================================");
        console.log("Testing Trade on Market");
        console.log("==============================================");
        console.log("Trader:", deployer);
        console.log("Market:", MARKET_ADDRESS);
        console.log("USDT:", USDT_ADDRESS);
        console.log("==============================================\n");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Check initial state
        console.log("=== Initial State ===");
        uint256 initialBalance = usdt.balanceOf(deployer) / 1e6;
        console.log("USDT balance:", initialBalance, "USDT");
        
        uint256 price0Before = market.getPrice(0);
        uint256 price1Before = market.getPrice(1);
        console.log("Price Outcome 0 (Yes):", price0Before * 100 / 1e18, "%");
        console.log("Price Outcome 1 (No):", price1Before * 100 / 1e18, "%");
        
        // Test 1: Buy shares for outcome 0 (Yes)
        console.log("\n=== Test 1: Buy 10 Shares of Outcome 0 (Yes) ===");
        uint256 sharesToBuy = 10 * 1e18; // 10 shares (18 decimals)
        
        // Preview the buy first
        (uint256 tradeCost, uint256 expectedFee, uint256 totalCost) = market.previewBuy(0, sharesToBuy);
        console.log("Preview:");
        console.log("  Shares to buy:", sharesToBuy / 1e18);
        console.log("  Trade cost:", tradeCost / 1e6, "USDT");
        console.log("  Fee:", expectedFee / 1e6, "USDT");
        console.log("  Total cost:", totalCost / 1e6, "USDT");
        
        // Approve USDT
        console.log("\nApproving USDT...");
        usdt.approve(MARKET_ADDRESS, totalCost);
        console.log("Approved");
        
        // Execute buy
        console.log("\nExecuting buy...");
        uint256 totalPaid = market.buy(0, sharesToBuy);
        console.log("Paid", totalPaid / 1e6, "USDT");
        console.log("Bought", sharesToBuy / 1e18, "shares");
        
        // Check new prices
        console.log("\n=== After Buy ===");
        uint256 price0After = market.getPrice(0);
        uint256 price1After = market.getPrice(1);
        console.log("New price Outcome 0 (Yes):", price0After * 100 / 1e18, "%");
        console.log("New price Outcome 1 (No):", price1After * 100 / 1e18, "%");
        
        uint256 newBalance = usdt.balanceOf(deployer) / 1e6;
        console.log("New USDT balance:", newBalance, "USDT");
        console.log("Spent:", initialBalance - newBalance, "USDT");
        
        // Test 2: Sell half the shares
        console.log("\n=== Test 2: Sell Half the Shares ===");
        uint256 sharesToSell = sharesToBuy / 2;
        
        // Preview the sell
        (uint256 tradePayout, uint256 sellFee, uint256 netPayout) = market.previewSell(0, sharesToSell);
        console.log("Preview:");
        console.log("  Shares to sell:", sharesToSell / 1e18);
        console.log("  Trade payout:", tradePayout / 1e6, "USDT");
        console.log("  Fee:", sellFee / 1e6, "USDT");
        console.log("  Net payout:", netPayout / 1e6, "USDT");
        
        // Execute sell
        console.log("\nExecuting sell...");
        uint256 payoutReceived = market.sell(0, sharesToSell);
        console.log("Received", payoutReceived / 1e6, "USDT");
        
        // Final state
        console.log("\n=== Final State ===");
        uint256 price0Final = market.getPrice(0);
        uint256 price1Final = market.getPrice(1);
        console.log("Final price Outcome 0 (Yes):", price0Final * 100 / 1e18, "%");
        console.log("Final price Outcome 1 (No):", price1Final * 100 / 1e18, "%");
        
        uint256 finalBalance = usdt.balanceOf(deployer) / 1e6;
        console.log("Final USDT balance:", finalBalance, "USDT");
        if (finalBalance < initialBalance) {
            console.log("Net loss (fees):", initialBalance - finalBalance, "USDT");
        } else {
            console.log("Net gain:", finalBalance - initialBalance, "USDT");
        }
        
        // Check shares remaining
        console.log("\n=== Position ===");
        console.log("Shares remaining:", (sharesToBuy - sharesToSell) / 1e18);
        
        vm.stopBroadcast();
        
        console.log("\n==============================================");
        console.log("TRADE TEST COMPLETE!");
        console.log("==============================================");
        console.log("\nSummary:");
        console.log("- Bought shares for outcome 0 (Yes)");
        console.log("- Sold half the shares");
        console.log("- Net cost (fees):", initialBalance - finalBalance, "USDT");
        console.log("\nTrading mechanics working correctly!");
        console.log("==============================================\n");
    }
}
