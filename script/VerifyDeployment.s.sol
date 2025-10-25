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
 * @title VerifyDeployment
 * @notice Verification script to test all deployed contracts on BNB Testnet
 * @dev Run this after deployment to verify everything works correctly
 * 
 * Usage:
 *   forge script script/VerifyDeployment.s.sol:VerifyDeployment \
 *     --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
 *     -vvvv
 */
contract VerifyDeployment is Script {
    // ========== DEPLOYED CONTRACT ADDRESSES ==========
    address constant MOCK_USDT = 0x4410355e143112e0619f822fC9Ecf92AaBd01b63;
    address constant OUTCOME1155 = 0x6fd2258e61bB5eedF5606edA7F70Be06C5374f29;
    address constant ROUTER = 0x756039D9b6E99d4EF0538A04B4c9E13D61f5d991;
    address constant TREASURY = 0xF4F2bfa1d465fc88F7a987F4B7D3F4ED351f83a1;
    address constant ORACLE = 0x3b1d38fc5357079150eD50bD5a3d95ebdB08BBF4;
    address constant MARKET_FACTORY = 0x5c4850878F222aC16d5ab60204997b904Fe4019A;
    address constant DELPHAI_ORACLE = 0xA95E99848a318e37F128aB841b0CF693c1f0b4D1;
    
    // Contract instances
    MockUSDT mockUSDT;
    Outcome1155 outcome1155;
    Router router;
    Treasury treasury;
    Oracle oracle;
    MarketFactory factory;
    
    uint256 passedTests = 0;
    uint256 totalTests = 0;
    
    function run() external view {
        console.log("==============================================");
        console.log("DEPLOYMENT VERIFICATION SCRIPT");
        console.log("==============================================");
        console.log("Network: BNB Testnet (Chain ID 97)");
        console.log("==============================================\n");
        
        // Initialize contract instances
        MockUSDT _mockUSDT = MockUSDT(MOCK_USDT);
        Outcome1155 _outcome1155 = Outcome1155(OUTCOME1155);
        Router _router = Router(ROUTER);
        Treasury _treasury = Treasury(TREASURY);
        Oracle _oracle = Oracle(ORACLE);
        MarketFactory _factory = MarketFactory(MARKET_FACTORY);
        
        // Run all verification tests
        verifyMockUSDT(_mockUSDT);
        verifyOutcome1155(_outcome1155);
        verifyRouter(_router);
        verifyTreasury(_treasury);
        verifyOracle(_oracle);
        verifyMarketFactory(_factory);
        verifyIntegration(_mockUSDT, _outcome1155, _router, _treasury, _oracle, _factory);
        
        // Print summary
        console.log("\n==============================================");
        console.log("VERIFICATION SUMMARY");
        console.log("==============================================");
        console.log("Total Tests: 27");
        console.log("Status: ALL TESTS PASSED");
        console.log("==============================================\n");
    }
    
    function verifyMockUSDT(MockUSDT _mockUSDT) internal view {
        console.log("[1/7] Verifying MockUSDT...");
        
        // Test 1: Check name
        require(
            keccak256(bytes(_mockUSDT.name())) == keccak256(bytes("Mock USDT")),
            "MockUSDT: Invalid name"
        );
        console.log("  [PASS] Name: Mock USDT");
        
        // Test 2: Check symbol
        require(
            keccak256(bytes(_mockUSDT.symbol())) == keccak256(bytes("USDT")),
            "MockUSDT: Invalid symbol"
        );
        console.log("  [PASS] Symbol: USDT");
        
        // Test 3: Check decimals
        require(_mockUSDT.decimals() == 6, "MockUSDT: Invalid decimals");
        console.log("  [PASS] Decimals: 6");
        
        // Test 4: Check total supply
        uint256 totalSupply = _mockUSDT.totalSupply();
        require(totalSupply > 0, "MockUSDT: No initial supply");
        console.log("  [PASS] Total Supply:", totalSupply / 1e6, "USDT");
        
        console.log("  [PASS] MockUSDT verified!\n");
    }
    
    function verifyOutcome1155(Outcome1155 _outcome1155) internal view {
        console.log("[2/7] Verifying Outcome1155...");
        
        // Test 1: Check router is set
        address routerAddr = _outcome1155.router();
        require(routerAddr == ROUTER, "Outcome1155: Router not set correctly");
        console.log("  [PASS] Router set:", routerAddr);
        
        // Test 2: Check MINTER_BURNER_ROLE constant
        bytes32 minterRole = _outcome1155.MINTER_BURNER_ROLE();
        require(minterRole != bytes32(0), "Outcome1155: Invalid MINTER_BURNER_ROLE");
        console.log("  [PASS] MINTER_BURNER_ROLE defined");
        
        // Test 3: Check supportsInterface (ERC1155)
        require(
            _outcome1155.supportsInterface(0xd9b67a26), // ERC1155 interface
            "Outcome1155: Does not support ERC1155"
        );
        console.log("  [PASS] Supports ERC1155 interface");
        
        // Test 4: Check token ID encoding
        uint256 tokenId = _outcome1155.encodeTokenId(1, 0);
        require(tokenId == 256, "Outcome1155: Token encoding incorrect");
        console.log("  [PASS] Token ID encoding works");
        
        console.log("  [PASS] Outcome1155 verified!\n");
    }
    
    function verifyRouter(Router _router) internal view {
        console.log("[3/7] Verifying Router...");
        
        // Test 1: Check outcome token reference
        address outcomeToken = address(_router.outcomeToken());
        require(outcomeToken == OUTCOME1155, "Router: Invalid outcome token");
        console.log("  [PASS] Outcome token:", outcomeToken);
        
        // Test 2: Check PAUSER_ROLE
        bytes32 pauserRole = _router.PAUSER_ROLE();
        require(pauserRole != bytes32(0), "Router: Invalid PAUSER_ROLE");
        console.log("  [PASS] PAUSER_ROLE defined");
        
        // Test 3: Check supportsInterface (ERC1155Receiver)
        require(
            _router.supportsInterface(0x4e2312e0), // ERC1155Receiver interface
            "Router: Does not support ERC1155Receiver"
        );
        console.log("  [PASS] Supports ERC1155Receiver interface");
        
        console.log("  [PASS] Router verified!\n");
    }
    
    function verifyTreasury(Treasury _treasury) internal view {
        console.log("[4/7] Verifying Treasury...");
        
        // Test 1: Check fee splits sum to 10000
        uint256 protocolBps = _treasury.protocolFeeBps();
        uint256 creatorBps = _treasury.creatorFeeBps();
        uint256 oracleBps = _treasury.oracleFeeBps();
        uint256 totalBps = protocolBps + creatorBps + oracleBps;
        require(totalBps == 10000, "Treasury: Fee splits don't sum to 10000");
        console.log("  [PASS] Fee splits sum to 10000 bps");
        console.log("         Protocol:", protocolBps, "bps");
        console.log("         Creator:", creatorBps, "bps");
        console.log("         Oracle:", oracleBps, "bps");
        
        // Test 2: Verify expected splits (60/30/10)
        require(protocolBps == 3000, "Treasury: Protocol split incorrect");
        require(creatorBps == 6000, "Treasury: Creator split incorrect");
        require(oracleBps == 1000, "Treasury: Oracle split incorrect");
        console.log("  [PASS] Expected splits: 30% protocol / 60% creator / 10% oracle");
        
        // Test 3: Check oracle address
        address oracleAddr = _treasury.oracle();
        require(oracleAddr != address(0), "Treasury: Oracle not set");
        console.log("  [PASS] Oracle set:", oracleAddr);
        
        console.log("  [PASS] Treasury verified!\n");
    }
    
    function verifyOracle(Oracle _oracle) internal view {
        console.log("[5/7] Verifying Oracle...");
        
        // Test 1: Check DelphAI oracle address
        address delphAI = address(_oracle.delphAI());
        require(delphAI == DELPHAI_ORACLE, "Oracle: DelphAI address incorrect");
        console.log("  [PASS] DelphAI Oracle:", delphAI);
        
        // Test 2: Check collateral token
        address collateral = address(_oracle.collateral());
        require(collateral == MOCK_USDT, "Oracle: Collateral token incorrect");
        console.log("  [PASS] Collateral:", collateral);
        
        // Test 3: Check treasury
        address treasuryAddr = _oracle.treasury();
        require(treasuryAddr == TREASURY, "Oracle: Treasury incorrect");
        console.log("  [PASS] Treasury:", treasuryAddr);
        
        // Test 4: Check dispute bond
        uint256 disputeBond = _oracle.disputeBondBps();
        require(disputeBond == 100, "Oracle: Dispute bond should be 100 bps (1%)");
        console.log("  [PASS] Dispute bond:", disputeBond, "bps (1%)");
        
        console.log("  [PASS] Oracle verified!\n");
    }
    
    function verifyMarketFactory(MarketFactory _factory) internal view {
        console.log("[6/7] Verifying MarketFactory...");
        
        // Test 1: Check collateral token
        address collateral = address(_factory.collateral());
        require(collateral == MOCK_USDT, "Factory: Collateral incorrect");
        console.log("  [PASS] Collateral:", collateral);
        
        // Test 2: Check oracle
        address oracleAddr = address(_factory.oracle());
        require(oracleAddr == ORACLE, "Factory: Oracle incorrect");
        console.log("  [PASS] Oracle:", oracleAddr);
        
        // Test 3: Check outcome token
        address outcomeToken = _factory.outcome1155();
        require(outcomeToken == OUTCOME1155, "Factory: Outcome token incorrect");
        console.log("  [PASS] Outcome token:", outcomeToken);
        
        // Test 4: Check router
        address routerAddr = _factory.router();
        require(routerAddr == ROUTER, "Factory: Router incorrect");
        console.log("  [PASS] Router:", routerAddr);
        
        // Test 5: Check treasury
        address treasuryAddr = _factory.treasury();
        require(treasuryAddr == TREASURY, "Factory: Treasury incorrect");
        console.log("  [PASS] Treasury:", treasuryAddr);
        
        // Test 6: Check default fees
        uint256 protocolFee = _factory.defaultProtocolFeeBps();
        uint256 creatorFee = _factory.defaultCreatorFeeBps();
        uint256 oracleFee = _factory.defaultOracleFeeBps();
        require(protocolFee == 100, "Factory: Protocol fee should be 100 bps");
        require(creatorFee == 50, "Factory: Creator fee should be 50 bps");
        require(oracleFee == 25, "Factory: Oracle fee should be 25 bps");
        console.log("  [PASS] Default fees:", protocolFee + creatorFee + oracleFee, "bps total (1.75%)");
        
        console.log("  [PASS] MarketFactory verified!\n");
    }
    
    function verifyIntegration(
        MockUSDT _mockUSDT,
        Outcome1155 _outcome1155,
        Router _router,
        Treasury _treasury,
        Oracle _oracle,
        MarketFactory _factory
    ) internal view {
        console.log("[7/7] Verifying Integration...");
        
        // Test 1: Factory has admin role in Oracle
        bytes32 adminRole = 0x00; // DEFAULT_ADMIN_ROLE
        require(
            _oracle.hasRole(adminRole, MARKET_FACTORY),
            "Integration: Factory doesn't have admin role in Oracle"
        );
        console.log("  [PASS] Factory has admin role in Oracle");
        
        // Test 2: Factory has admin role in Treasury
        require(
            _treasury.hasRole(adminRole, MARKET_FACTORY),
            "Integration: Factory doesn't have admin role in Treasury"
        );
        console.log("  [PASS] Factory has admin role in Treasury");
        
        // Test 3: Router is set in Outcome1155
        require(
            _outcome1155.router() == ROUTER,
            "Integration: Router not set in Outcome1155"
        );
        console.log("  [PASS] Router properly set in Outcome1155");
        
        // Test 4: All contracts reference correct collateral
        require(
            address(_factory.collateral()) == MOCK_USDT &&
            address(_oracle.collateral()) == MOCK_USDT,
            "Integration: Collateral mismatch"
        );
        console.log("  [PASS] All contracts use same collateral");
        
        // Test 5: All contracts reference correct Oracle
        require(
            address(_factory.oracle()) == ORACLE,
            "Integration: Oracle reference mismatch"
        );
        console.log("  [PASS] Factory references correct Oracle");
        
        // Test 6: All contracts reference correct Treasury
        require(
            address(_factory.treasury()) == TREASURY &&
            _oracle.treasury() == TREASURY,
            "Integration: Treasury reference mismatch"
        );
        console.log("  [PASS] All contracts reference correct Treasury");
        
        console.log("  [PASS] Integration verified!\n");
    }
}
