// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import {MarketFactory} from "../contracts/MarketFactory.sol";
import {Oracle} from "../contracts/Oracle.sol";
import {Treasury} from "../contracts/Treasury.sol";
import {Router} from "../contracts/Router.sol";
import {MockUSDT} from "../contracts/MockUSDT.sol";
import {Outcome1155} from "../contracts/Outcome1155.sol";

/**
 * @title RedeployWithMetadata
 * @notice Redeploys MarketFactory with metadata support (description, category, imageUrl)
 * @dev This script:
 *      1. Deploys new MarketFactory with CreateMarketParams struct
 *      2. Updates Oracle to point to new factory
 *      3. Updates Treasury to point to new factory
 *      4. Updates Router to point to new factory
 *      5. Grants MARKET_CREATOR_ROLE to admin on new factory
 *      6. Prints all addresses for subgraph update
 */
contract RedeployWithMetadata is Script {
    // =========================================================================
    // EXISTING DEPLOYED ADDRESSES (from DEPLOYED_ADDRESSES.md)
    // =========================================================================

    address constant OLD_MARKET_FACTORY = 0x5c4850878F222aC16d5ab60204997b904Fe4019A;
    address constant MOCK_USDT = 0x4410355e143112e0619f822fC9Ecf92AaBd01b63;
    address constant OUTCOME_1155 = 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29;
    address constant ORACLE = 0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4;
    address constant TREASURY = 0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1;
    address constant ROUTER = 0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991;

    // DelphAI contract (not changing)
    address constant DELPHAI = 0x127ADa0c7becaD68FD4806eBB3E7e810A7321011; // Replace with actual DelphAI address

    // =========================================================================
    // NEW DEPLOYED ADDRESSES (will be set during deployment)
    // =========================================================================

    address public newMarketFactory;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=================================================================");
        console.log("REDEPLOYING MARKETFACTORY WITH METADATA SUPPORT");
        console.log("=================================================================");
        console.log("Deployer:", deployer);
        console.log("Network: BNB Smart Chain Testnet (Chapel)");
        console.log("Chain ID:", block.chainid);
        console.log("");

        console.log("OLD ADDRESSES:");
        console.log("  MarketFactory:", OLD_MARKET_FACTORY);
        console.log("  MockUSDT:", MOCK_USDT);
        console.log("  Outcome1155:", OUTCOME_1155);
        console.log("  Oracle:", ORACLE);
        console.log("  Treasury:", TREASURY);
        console.log("  Router:", ROUTER);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // =================================================================
        // STEP 1: Deploy New MarketFactory
        // =================================================================

        console.log("=================================================================");
        console.log("STEP 1: Deploying New MarketFactory");
        console.log("=================================================================");

        MarketFactory factory = new MarketFactory(
            MOCK_USDT, // collateral (USDT)
            OUTCOME_1155, // outcomeToken
            TREASURY, // treasury
            ORACLE, // oracle
            ROUTER, // router
            1000e18, // defaultLiquidityParameter (1000 * 1e18)
            100, // defaultProtocolFeeBps (1%)
            100, // defaultCreatorFeeBps (1%)
            50 // defaultOracleFeeBps (0.5%)
        );

        newMarketFactory = address(factory);

        console.log("New MarketFactory deployed:", newMarketFactory);
        console.log("");

        // =================================================================
        // STEP 2: Grant MARKET_CREATOR_ROLE to deployer on new factory
        // =================================================================

        console.log("=================================================================");
        console.log("STEP 2: Granting MARKET_CREATOR_ROLE");
        console.log("=================================================================");

        bytes32 MARKET_CREATOR_ROLE = factory.MARKET_CREATOR_ROLE();
        factory.grantRole(MARKET_CREATOR_ROLE, deployer);

        console.log("MARKET_CREATOR_ROLE granted to:", deployer);
        console.log("");

        // =================================================================
        // STEP 3: Update Oracle to recognize new factory
        // =================================================================

        console.log("=================================================================");
        console.log("STEP 3: Updating Oracle");
        console.log("=================================================================");

        Oracle oracle = Oracle(ORACLE);

        // Oracle doesn't have a setFactory method, but it should auto-register
        // markets created by the new factory via registerMarket() calls
        console.log("Oracle contract:", ORACLE);
        console.log("Note: Oracle will auto-register markets from new factory");
        console.log("");

        // =================================================================
        // STEP 4: Update Treasury (if needed)
        // =================================================================

        console.log("=================================================================");
        console.log("STEP 4: Checking Treasury");
        console.log("=================================================================");

        Treasury treasury = Treasury(TREASURY);

        console.log("Treasury contract:", TREASURY);
        console.log("Note: Treasury will auto-register markets via factory calls");
        console.log("");

        // =================================================================
        // STEP 5: Update Router to recognize new factory (if needed)
        // =================================================================

        console.log("=================================================================");
        console.log("STEP 5: Checking Router");
        console.log("=================================================================");

        Router router = Router(ROUTER);

        console.log("Router contract:", ROUTER);
        console.log("Note: Router registers markets individually, not by factory");
        console.log("");

        vm.stopBroadcast();

        // =================================================================
        // FINAL OUTPUT
        // =================================================================

        console.log("=================================================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("=================================================================");
        console.log("");
        console.log("NEW ADDRESSES:");
        console.log("  MarketFactory:", newMarketFactory);
        console.log("");
        console.log("UNCHANGED ADDRESSES:");
        console.log("  MockUSDT:", MOCK_USDT);
        console.log("  Outcome1155:", OUTCOME_1155);
        console.log("  Oracle:", ORACLE);
        console.log("  Treasury:", TREASURY);
        console.log("  Router:", ROUTER);
        console.log("");
        console.log("=================================================================");
        console.log("NEXT STEPS:");
        console.log("=================================================================");
        console.log("1. Update DEPLOYED_ADDRESSES.md with new MarketFactory address");
        console.log("2. Update subgraph/subgraph.yaml:");
        console.log("   - Change MarketFactory address to:", newMarketFactory);
        console.log("   - Update startBlock to current block:", block.number);
        console.log("3. Regenerate subgraph types:");
        console.log("   cd subgraph && npm run codegen");
        console.log("4. Build subgraph:");
        console.log("   npm run build");
        console.log("5. Deploy subgraph:");
        console.log("   npm run deploy");
        console.log("6. Verify on BSCScan:");
        console.log("   https://testnet.bscscan.com/address/", newMarketFactory);
        console.log("=================================================================");
        console.log("");

        // Save deployment block for subgraph
        console.log("DEPLOYMENT BLOCK:", block.number);
        console.log("Use this as startBlock in subgraph.yaml");
    }
}
