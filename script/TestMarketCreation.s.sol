// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../contracts/MarketFactory.sol";
import "../contracts/MockUSDT.sol";

contract TestMarketCreation is Script {
    // Deployed contract addresses
    address constant MARKET_FACTORY = 0x5c4850878F222aC16d5ab60204997b904Fe4019A;
    address constant MOCK_USDT = 0x4410355e143112e0619f822fC9Ecf92AaBd01b63;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Testing Market Creation ===");
        console.log("Deployer:", deployer);
        console.log("MarketFactory:", MARKET_FACTORY);
        console.log("MockUSDT:", MOCK_USDT);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MarketFactory factory = MarketFactory(MARKET_FACTORY);
        MockUSDT usdt = MockUSDT(MOCK_USDT);
        
        // Step 1: Check USDT balance
        uint256 balance = usdt.balanceOf(deployer);
        console.log("Current USDT balance:", balance / 1e6, "USDT");
        
        // Step 2: Mint some USDT if needed (testnet only)
        uint256 requiredAmount = 200000 * 1e6; // 200,000 USDT (be very safe)
        if (balance < requiredAmount) {
            console.log("Minting", (requiredAmount - balance) / 1e6, "USDT...");
            usdt.mint(deployer, requiredAmount - balance);
            balance = usdt.balanceOf(deployer);
            console.log("New balance:", balance / 1e6, "USDT");
        }
        
        // Step 3: Approve MarketFactory to spend USDT
        console.log("\nApproving MarketFactory to spend USDT...");
        usdt.approve(MARKET_FACTORY, type(uint256).max);
        console.log("Approval complete");
        
        // Step 4: Create a test market
        console.log("\n=== Creating Test Market ===");
        
        string memory question = "Will Bitcoin reach $100,000 by end of 2025?";
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";
        
        uint64 tradingEndsAt = uint64(block.timestamp + 30 days);
        uint256 liquidityParameter = 0; // Use default (1000e18)
        uint256 initialLiquidity = 1000 * 1e6; // 1000 USDT
        uint16 protocolFeeBps = 0; // Use default
        uint16 creatorFeeBps = 0;   // Use default
        uint16 oracleFeeBps = 0;    // Use default
        uint256 delphAIMarketId = 0;
        
        console.log("Question:", question);
        console.log("Outcomes: Yes, No");
        console.log("Initial Liquidity:", initialLiquidity / 1e6, "USDT");
        console.log("Trading ends:", tradingEndsAt);
        console.log("");
        
        (uint256 marketId, address marketAddress) = factory.createMarket(
            question,
            outcomes,
            tradingEndsAt,
            liquidityParameter,   // 4th: LMSR b parameter
            protocolFeeBps,       // 5th: protocol fee
            creatorFeeBps,        // 6th: creator fee
            oracleFeeBps,         // 7th: oracle fee
            initialLiquidity,     // 8th: initial collateral amount
            delphAIMarketId       // 9th: DelphAI market ID
        );
        
        console.log("=== Market Created Successfully! ===");
        console.log("Market ID:", marketId);
        console.log("Market Address:", marketAddress);
        console.log("BSCScan:", string.concat("https://testnet.bscscan.com/address/", vm.toString(marketAddress)));
        console.log("");
        
        // Step 5: Verify market details
        console.log("=== Verifying Market ===");
        
        LMSRMarket market = LMSRMarket(marketAddress);
        console.log("Market ID (on-chain):", market.marketId());
        console.log("Outcome count:", market.outcomeCount());
        console.log("Trading ends at:", market.tradingEndsAt());
        console.log("State:", uint256(market.state())); // 0 = Trading
        console.log("");
        
        // Step 6: Check prices
        console.log("=== Initial Prices ===");
        uint256 price0 = market.getPrice(0);
        uint256 price1 = market.getPrice(1);
        console.log("Outcome 0 (Yes) price:", price0 / 1e16, "%");
        console.log("Outcome 1 (No) price:", price1 / 1e16, "%");
        console.log("");
        
        // Step 7: Get market count
        uint256 totalMarkets = factory.getMarketCount();
        console.log("Total markets created:", totalMarkets);
        
        vm.stopBroadcast();
        
        console.log("\n=== Test Complete ===");
    }
}
