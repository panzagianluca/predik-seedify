// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDT} from "../contracts/MockUSDT.sol";
import {Outcome1155} from "../contracts/Outcome1155.sol";
import {Treasury} from "../contracts/Treasury.sol";
import {Router} from "../contracts/Router.sol";
import {Oracle} from "../contracts/Oracle.sol";
import {MarketFactory} from "../contracts/MarketFactory.sol";

/**
 * @title DeployBNBMainnet
 * @notice Deployment script for BNB Mainnet (Chain ID 56)
 * @dev Deploys all 7 contracts in correct order with proper configuration
 *      USDPredik is deployed as platform currency for Predik prediction markets
 *
 * CRITICAL: This is a MAINNET deployment for Biconomy gasless transactions
 *           Biconomy ONLY supports mainnet networks, not testnets
 *
 * Usage:
 *   forge script script/DeployBNBMainnet.s.sol:DeployBNBMainnet \
 *     --rpc-url https://bsc-dataseed.binance.org/ \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Environment Variables Required:
 *   - DEPLOYER_PRIVATE_KEY: Private key of deployer wallet (must have ~0.05 BNB for gas)
 *   - BSCSCAN_API_KEY: API key for contract verification on BSCScan
 */
contract DeployBNBMainnet is Script {
    // ========== DEPLOYMENT CONFIGURATION ==========

    // DelphAI Oracle (works on both mainnet and testnet)
    address constant DELPHAI_ORACLE = 0xA95E99848a318e37F128aB841b0CF693c1f0b4D1;

    // Default LMSR Parameter (liquidity depth)
    uint256 constant DEFAULT_LIQUIDITY_PARAMETER = 1000 * 10 ** 18; // 1000 USDp (dimensionless UD60x18)

    // Default Fee Configuration (basis points, 100 bps = 1%)
    uint16 constant DEFAULT_PROTOCOL_FEE_BPS = 100; // 1.0% protocol fee
    uint16 constant DEFAULT_CREATOR_FEE_BPS = 50; // 0.5% creator fee
    uint16 constant DEFAULT_ORACLE_FEE_BPS = 25; // 0.25% oracle fee
    // Total: 1.75% fee on trades

    // Treasury Fee Split (basis points, must sum to 10000)
    uint16 constant CREATOR_SPLIT_BPS = 6000; // 60% to creator
    uint16 constant PROTOCOL_SPLIT_BPS = 3000; // 30% to protocol
    uint16 constant LP_SPLIT_BPS = 1000; // 10% to liquidity providers

    // Initial USDPredik Supply
    uint256 constant INITIAL_USDP_SUPPLY = 1_000_000 * 10 ** 6; // 1M USDp (6 decimals)

    // ========== DEPLOYED CONTRACTS ==========

    MockUSDT public mockUSDT; // USDPredik token (variable name kept for compatibility)
    Outcome1155 public outcome1155;
    Treasury public treasury;
    Router public router;
    Oracle public oracle;
    MarketFactory public factory;

    // ========== DEPLOYMENT SCRIPT ==========

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("BNB MAINNET DEPLOYMENT SCRIPT");
        console.log("==============================================");
        console.log("WARNING: This is a MAINNET deployment!");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        require(block.chainid == 56, "MUST be BNB Mainnet (Chain 56)");
        console.log("DelphAI Oracle:", DELPHAI_ORACLE);
        console.log("==============================================");

        vm.startBroadcast(deployerPrivateKey);

        // =====================================================================
        // Step 1: Deploy USDPredik (platform currency)
        // =====================================================================
        console.log("\n[1/6] Deploying USDPredik...");
        mockUSDT = new MockUSDT(); // Contract is named MockUSDT but token is "USDPredik"
        console.log("  USDPredik deployed at:", address(mockUSDT));
        console.log("  Token name:", "USDPredik");
        console.log("  Token symbol:", "USDp");
        console.log("  Initial supply:", mockUSDT.balanceOf(deployer) / 1e6, "USDp");

        // =====================================================================
        // Step 2: Deploy Outcome1155 with deployer as temporary router
        // =====================================================================
        console.log("\n[2/6] Deploying Outcome1155...");
        outcome1155 = new Outcome1155(
            "https://api.predik.app/metadata/outcomes/{id}.json",
            deployer // Temporary - will be updated to actual router
        );
        console.log("  Outcome1155 deployed at:", address(outcome1155));

        // =====================================================================
        // Step 3: Deploy Router (for gasless Biconomy transactions)
        // =====================================================================
        console.log("\n[3/6] Deploying Router...");
        router = new Router(address(outcome1155));
        console.log("  Router deployed at:", address(router));
        console.log("  IMPORTANT: Configure this address in Biconomy dashboard");

        // =====================================================================
        // Step 4: Deploy Treasury
        // =====================================================================
        console.log("\n[4/6] Deploying Treasury...");
        treasury = new Treasury(
            PROTOCOL_SPLIT_BPS, // 3000 (30%) protocol fee split
            CREATOR_SPLIT_BPS, // 6000 (60%) creator fee split
            LP_SPLIT_BPS, // 1000 (10%) oracle/LP fee split
            deployer // Temporary oracle (will grant role to actual Oracle later)
        );
        console.log("  Treasury deployed at:", address(treasury));
        console.log("  Fee splits: 60% creator / 30% protocol / 10% oracle");

        // =====================================================================
        // Step 5: Deploy Oracle
        // =====================================================================
        console.log("\n[5/6] Deploying Oracle...");
        oracle = new Oracle(
            DELPHAI_ORACLE, // DelphAI oracle address
            address(mockUSDT), // USDPredik for dispute bonds
            address(treasury), // Treasury for slashed bonds
            100 // 1% dispute bond (100 bps)
        );
        console.log("  Oracle deployed at:", address(oracle));
        console.log("  Dispute bond: 1% of market volume (in USDp)");
        console.log("  Connected to DelphAI:", DELPHAI_ORACLE);

        // =====================================================================
        // Step 6: Deploy MarketFactory
        // =====================================================================
        console.log("\n[6/6] Deploying MarketFactory...");
        factory = new MarketFactory(
            address(mockUSDT), // USDPredik as collateral
            address(outcome1155), // ERC-1155 shares
            address(treasury), // Treasury for fee collection
            address(oracle), // Oracle contract
            address(router), // Router for gasless trading
            DEFAULT_LIQUIDITY_PARAMETER, // Default LMSR 'b' parameter
            DEFAULT_PROTOCOL_FEE_BPS, // Default protocol fee
            DEFAULT_CREATOR_FEE_BPS, // Default creator fee
            DEFAULT_ORACLE_FEE_BPS // Default oracle fee
        );
        console.log("  MarketFactory deployed at:", address(factory));
        console.log("  Default fees: 1.0% protocol + 0.5% creator + 0.25% oracle = 1.75% total");

        // =====================================================================
        // POST-DEPLOYMENT CONFIGURATION (Security fixes from Oct 29 audit)
        // =====================================================================
        console.log("\n==============================================");
        console.log("POST-DEPLOYMENT CONFIGURATION");
        console.log("==============================================");

        bytes32 adminRole = 0x00; // DEFAULT_ADMIN_ROLE

        // Grant Router approval for ERC-1155 operations (enables gasless trading)
        console.log("\n[Config 1/7] Setting Router in Outcome1155...");
        outcome1155.setRouter(address(router));
        console.log("  [OK] Router approved for all ERC-1155 transfers");

        // Grant MarketFactory permission to grant MINTER_BURNER_ROLE on Outcome1155
        console.log("\n[Config 2/7] Granting admin role to Factory in Outcome1155...");
        outcome1155.grantRole(adminRole, address(factory));
        console.log("  [OK] Factory can now grant roles to new markets on Outcome1155");

        // Grant MarketFactory permission to register markets with Router
        console.log("\n[Config 3/7] Granting admin role to Factory in Router...");
        router.grantRole(adminRole, address(factory));
        console.log("  [OK] Factory can now register markets with Router");

        // Grant MarketFactory permission to register markets with Oracle
        console.log("\n[Config 4/7] Granting admin role to Factory in Oracle...");
        oracle.grantRole(adminRole, address(factory));
        console.log("  [OK] Factory can now register markets with Oracle");

        // Grant MarketFactory permission to register markets with Treasury
        console.log("\n[Config 5/7] Granting MARKET_MANAGER_ROLE to Factory in Treasury...");
        bytes32 marketManagerRole = treasury.MARKET_MANAGER_ROLE();
        treasury.grantRole(marketManagerRole, address(factory));
        console.log("  [OK] Factory can now register markets with Treasury");

        // SECURITY FIX: Grant FEE_REPORTER_ROLE to Factory (not full admin)
        console.log("\n[Config 6/7] Granting FEE_REPORTER_ROLE to Factory in Treasury...");
        bytes32 feeReporterRole = treasury.FEE_REPORTER_ROLE();
        treasury.grantRole(feeReporterRole, address(factory));
        console.log("  [OK] Factory can report fees to Treasury (but NOT withdraw)");

        // SECURITY FIX: Grant FEE_WITHDRAWER_ROLE to deployer (protocol multisig)
        console.log("\n[Config 7/7] Granting FEE_WITHDRAWER_ROLE to deployer...");
        bytes32 feeWithdrawerRole = treasury.FEE_WITHDRAWER_ROLE();
        treasury.grantRole(feeWithdrawerRole, deployer);
        console.log("  [OK] Deployer can withdraw protocol/creator/oracle fees from Treasury");

        console.log("\n==============================================");
        console.log("SECURITY NOTE");
        console.log("==============================================");
        console.log("Factory retains admin role for hackathon simplicity");
        console.log("For production: Factory should renounce admin after market creation");
        console.log("Security grade: B+ (acceptable for hackathon mainnet demo)");

        vm.stopBroadcast();

        // =====================================================================
        // DEPLOYMENT SUMMARY
        // =====================================================================
        console.log("\n==============================================");
        console.log("MAINNET DEPLOYMENT COMPLETE!");
        console.log("==============================================");
        console.log("\nContract Addresses (BNB Mainnet Chain 56):");
        console.log("-------------------------------------------");
        console.log("USDPredik:      ", address(mockUSDT));
        console.log("Outcome1155:    ", address(outcome1155));
        console.log("Treasury:       ", address(treasury));
        console.log("Router:         ", address(router));
        console.log("Oracle:         ", address(oracle));
        console.log("MarketFactory:  ", address(factory));
        console.log("\nExternal Dependencies:");
        console.log("----------------------");
        console.log("DelphAI Oracle: ", DELPHAI_ORACLE);
        console.log("\nNext Steps:");
        console.log("-----------");
        console.log("1. Verify contracts on BSCScan mainnet");
        console.log("2. Configure Biconomy for Router address (Chain 56)");
        console.log("3. Update frontend .env with mainnet addresses");
        console.log("4. Mint USDPredik for market seeding (use faucet or admin mint)");
        console.log("5. Create initial Argentine markets from MARKET_LIST.md");
        console.log("6. Test gasless trading end-to-end");
        console.log("\nVerification Commands:");
        console.log("----------------------");
        console.log(
            "forge verify-contract",
            address(mockUSDT),
            "contracts/MockUSDT.sol:MockUSDT --chain-id 56 --etherscan-api-key $BSCSCAN_API_KEY"
        );
        console.log(
            "forge verify-contract",
            address(outcome1155),
            "contracts/Outcome1155.sol:Outcome1155 --chain-id 56 --etherscan-api-key $BSCSCAN_API_KEY --constructor-args $(cast abi-encode \"constructor(string,address)\" \"https://api.predik.app/metadata/outcomes/{id}.json\" %s)",
            deployer
        );
        console.log(
            "forge verify-contract",
            address(treasury),
            "contracts/Treasury.sol:Treasury --chain-id 56 --etherscan-api-key $BSCSCAN_API_KEY"
        );
        console.log(
            "forge verify-contract",
            address(router),
            "contracts/Router.sol:Router --chain-id 56 --etherscan-api-key $BSCSCAN_API_KEY"
        );
        console.log(
            "forge verify-contract",
            address(oracle),
            "contracts/Oracle.sol:Oracle --chain-id 56 --etherscan-api-key $BSCSCAN_API_KEY"
        );
        console.log(
            "forge verify-contract",
            address(factory),
            "contracts/MarketFactory.sol:MarketFactory --chain-id 56 --etherscan-api-key $BSCSCAN_API_KEY"
        );
        console.log("\nBiconomy Configuration:");
        console.log("-----------------------");
        console.log("Network: BNB Mainnet (Chain 56)");
        console.log("Router Address:", address(router));
        console.log("Collateral Token:", address(mockUSDT), "(USDPredik)");
        console.log("Methods to whitelist:");
        console.log("  - buyWithPermit(address,uint8,uint256,uint256,uint256,uint8,bytes32,bytes32)");
        console.log("  - sellAndTransfer(address,uint8,uint256,uint256,address)");
        console.log("  - claim(address,address)");
        console.log("\nIMPORTANT: Fund Router paymaster in Biconomy dashboard");
        console.log("==============================================\n");
    }
}
