// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {MarketFactory} from "../contracts/MarketFactory.sol";
import {LMSRMarket} from "../contracts/LMSRMarket.sol";
import {Treasury} from "../contracts/Treasury.sol";
import {Oracle} from "../contracts/Oracle.sol";
import {Router} from "../contracts/Router.sol";
import {Outcome1155} from "../contracts/Outcome1155.sol";
import {MockUSDT} from "../contracts/MockUSDT.sol";

contract MarketFactoryTest is Test {
    MarketFactory public factory;
    Treasury public treasury;
    Oracle public oracle;
    Router public router;
    Outcome1155 public outcome1155;
    MockUSDT public usdt;

    address public admin = makeAddr("admin");
    address public creator = makeAddr("creator");
    address public user = makeAddr("user");
    address public delphAI = makeAddr("delphAI");

    uint256 public constant DEFAULT_B = 1000e18; // 1000 USDT (18 decimal normalized)
    uint16 public constant DEFAULT_PROTOCOL_FEE = 200; // 2%
    uint16 public constant DEFAULT_CREATOR_FEE = 100; // 1%
    uint16 public constant DEFAULT_ORACLE_FEE = 50; // 0.5%
    uint16 public constant ORACLE_FEE = 50; // 0.5%

    string[] public outcomes;

    event MarketCreated(
        uint256 indexed marketId,
        address indexed marketAddress,
        address indexed creator,
        string title,
        string[] outcomes,
        uint64 tradingEndsAt,
        uint256 liquidityParameter
    );

    event DefaultLiquidityParameterUpdated(uint256 newValue);
    event DefaultFeeUpdated(uint16 protocolBps, uint16 creatorBps, uint16 oracleBps);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy core contracts
        usdt = new MockUSDT();
        outcome1155 = new Outcome1155("https://api.predik.io/outcomes/", address(1)); // Dummy router for now
        
        // Deploy router
        router = new Router(address(outcome1155));
        
        // Update outcome1155 to use real router
        outcome1155.setRouter(address(router));
        
        // Deploy oracle first (Treasury needs it)
        oracle = new Oracle(address(usdt), address(1), delphAI, ORACLE_FEE); // Temp treasury address
        
        // Deploy treasury with correct oracle
        treasury = new Treasury(6000, 3000, 1000, address(oracle)); // 60/30/10 split
        
        // Update oracle's treasury address
        oracle.setTreasury(address(treasury));

        // Deploy factory
        factory = new MarketFactory(
            address(usdt),
            address(outcome1155),
            address(treasury),
            address(oracle),
            address(router),
            DEFAULT_B,
            DEFAULT_PROTOCOL_FEE,
            DEFAULT_CREATOR_FEE,
            DEFAULT_ORACLE_FEE
        );

        // Grant roles
        treasury.grantRole(treasury.MARKET_MANAGER_ROLE(), address(factory));
        oracle.grantRole(oracle.DEFAULT_ADMIN_ROLE(), address(factory));
        outcome1155.grantRole(outcome1155.DEFAULT_ADMIN_ROLE(), address(factory));
        outcome1155.grantRole(outcome1155.MINTER_BURNER_ROLE(), address(factory));
        router.grantRole(router.DEFAULT_ADMIN_ROLE(), address(factory));
        
        // Grant creator role to creator address
        factory.grantRole(factory.MARKET_CREATOR_ROLE(), creator);

        vm.stopPrank();

        // Setup outcomes
        outcomes.push("Yes");
        outcomes.push("No");

        // Fund creator
        vm.prank(admin);
        usdt.mint(creator, 100000e6);
    }

    // -------------------------------------------------------------------------
    // Constructor Tests
    // -------------------------------------------------------------------------

    function test_Constructor_Success() public view {
        assertEq(factory.collateral(), address(usdt));
        assertEq(factory.outcome1155(), address(outcome1155));
        assertEq(factory.treasury(), address(treasury));
        assertEq(factory.oracle(), address(oracle));
        assertEq(factory.defaultLiquidityParameter(), DEFAULT_B);
        assertEq(factory.defaultProtocolFeeBps(), DEFAULT_PROTOCOL_FEE);
        assertEq(factory.defaultCreatorFeeBps(), DEFAULT_CREATOR_FEE);
        assertEq(factory.nextMarketId(), 0);
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(factory.hasRole(factory.MARKET_CREATOR_ROLE(), admin));
    }

    function test_Constructor_RevertIf_ZeroAddressCollateral() public {
        vm.expectRevert(MarketFactory.MarketFactory_InvalidAddress.selector);
        new MarketFactory(
            address(0),
            address(outcome1155),
            address(treasury),
            address(oracle),
            address(router),
            DEFAULT_B,
            DEFAULT_PROTOCOL_FEE,
            DEFAULT_CREATOR_FEE,
            DEFAULT_ORACLE_FEE
        );
    }

    function test_Constructor_RevertIf_ZeroLiquidityParameter() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                MarketFactory.MarketFactory_LiquidityTooLow.selector,
                0,
                factory.MIN_LIQUIDITY_PARAMETER()
            )
        );
        new MarketFactory(
            address(usdt),
            address(outcome1155),
            address(treasury),
            address(oracle),
            address(router),
            0, // Invalid - below minimum
            DEFAULT_PROTOCOL_FEE,
            DEFAULT_CREATOR_FEE,
            DEFAULT_ORACLE_FEE
        );
    }

    function test_Constructor_RevertIf_InvalidFees() public {
        vm.expectRevert(MarketFactory.MarketFactory_InvalidFee.selector);
        new MarketFactory(
            address(usdt),
            address(outcome1155),
            address(treasury),
            address(oracle),
            address(router),
            DEFAULT_B,
            5000,
            5000, // Protocol + Creator = 10000
            1000  // Adding oracle makes sum > 10000
        );
    }

    // -------------------------------------------------------------------------
    // Market Creation Tests
    // -------------------------------------------------------------------------

    function test_CreateMarket_Success() public {
        uint256 initialLiquidity = 10000e6;
        uint64 tradingEndsAt = uint64(block.timestamp + 7 days);

        vm.startPrank(creator);
        usdt.approve(address(factory), initialLiquidity);

        (uint256 marketId, address marketAddress) = factory.createMarket(
            "Test Market", outcomes, tradingEndsAt, 0, // Use defaults
            0, // Use defaults
            0, // Use defaults
            0, // Use default oracle fee
            initialLiquidity,
            1  // DelphAI market ID (mock)
        );
        vm.stopPrank();

        // Verify market created
        assertEq(marketId, 0);
        assertTrue(marketAddress != address(0));
        assertEq(factory.nextMarketId(), 1);
        assertEq(factory.getMarket(0), marketAddress);
        assertEq(factory.getMarketId(marketAddress), 0);
        assertTrue(factory.marketExists(0));
        assertEq(factory.getMarketCount(), 1);

        // Verify market is registered
        assertTrue(treasury.isMarketRegistered(0));
        assertEq(treasury.getMarketCreator(0), creator);

        // Verify market was funded
        LMSRMarket market = LMSRMarket(marketAddress);
        assertEq(usdt.balanceOf(marketAddress), initialLiquidity);
    }

    function test_CreateMarket_WithCustomParameters() public {
        uint256 customB = 5000e18; // Use 18 decimal format (meets MIN_LIQUIDITY_PARAMETER)
        uint16 customProtocolFee = 300;
        uint16 customCreatorFee = 200;
        uint256 initialLiquidity = 20000e6;
        uint64 tradingEndsAt = uint64(block.timestamp + 14 days);

        vm.startPrank(creator);
        usdt.approve(address(factory), initialLiquidity);

        (uint256 marketId, address marketAddress) = factory.createMarket(
            "Custom Market", outcomes, tradingEndsAt, customB, customProtocolFee, customCreatorFee, 0, initialLiquidity, 2
        );
        vm.stopPrank();

        // Verify custom parameters were used
        LMSRMarket market = LMSRMarket(marketAddress);
        // liquidityB is stored as UD60x18, so customB (e.g. 5000e6) becomes customB * 1e18 in UD60x18
        assertEq(market.liquidityB().unwrap(), customB);
        // tradeFee combines protocol + creator + oracle fees
        // Note: passing 0 for oracle fee uses default (DEFAULT_ORACLE_FEE = 50 bps)
        uint256 expectedFee = ((uint256(customProtocolFee) + uint256(customCreatorFee) + uint256(DEFAULT_ORACLE_FEE)) * 1e18) / 10000;
        assertEq(market.tradeFee().unwrap(), expectedFee);
    }

    function test_CreateMarket_MultipleMarkets() public {
        uint256 initialLiquidity = 10000e6;
        uint64 tradingEndsAt = uint64(block.timestamp + 7 days);

        vm.startPrank(creator);
        usdt.approve(address(factory), initialLiquidity * 3);

        // Create 3 markets
        (uint256 id1, address addr1) =
            factory.createMarket("Market 1", outcomes, tradingEndsAt, 0, 0, 0, 0, initialLiquidity, 10);
        (uint256 id2, address addr2) =
            factory.createMarket("Market 2", outcomes, tradingEndsAt, 0, 0, 0, 0, initialLiquidity, 11);
        (uint256 id3, address addr3) =
            factory.createMarket("Market 3", outcomes, tradingEndsAt, 0, 0, 0, 0, initialLiquidity, 12);
        vm.stopPrank();

        // Verify IDs are sequential
        assertEq(id1, 0);
        assertEq(id2, 1);
        assertEq(id3, 2);

        // Verify all addresses are different
        assertTrue(addr1 != addr2);
        assertTrue(addr2 != addr3);
        assertTrue(addr1 != addr3);

        // Verify count
        assertEq(factory.getMarketCount(), 3);
    }

    function test_CreateMarket_RevertIf_Unauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        factory.createMarket("Test", outcomes, uint64(block.timestamp + 1 days), 0, 0, 0, 0, 1000e6, 20);
    }

    function test_CreateMarket_RevertIf_TooFewOutcomes() public {
        string[] memory singleOutcome = new string[](1);
        singleOutcome[0] = "Only One";

        vm.prank(admin);
        vm.expectRevert(MarketFactory.MarketFactory_InvalidOutcomeCount.selector);
        factory.createMarket("Test", singleOutcome, uint64(block.timestamp + 1 days), 0, 0, 0, 0, 1000e6, 21);
    }

    function test_CreateMarket_RevertIf_TradingEndsInPast() public {
        vm.prank(admin);
        vm.expectRevert(MarketFactory.MarketFactory_TradingEndsInPast.selector);
        factory.createMarket("Test", outcomes, uint64(block.timestamp - 1), 0, 0, 0, 0, 1000e6, 22);
    }

    function test_CreateMarket_RevertIf_ZeroLiquidity() public {
        vm.prank(admin);
        vm.expectRevert(MarketFactory.MarketFactory_InsufficientLiquidity.selector);
        factory.createMarket("Test", outcomes, uint64(block.timestamp + 1 days), 0, 0, 0, 0, 0, 23);
    }

    function test_CreateMarket_RevertIf_InvalidCustomFees() public {
        vm.startPrank(creator);
        usdt.approve(address(factory), 10000e6);

        vm.expectRevert(MarketFactory.MarketFactory_InvalidFee.selector);
        factory.createMarket("Test", outcomes, uint64(block.timestamp + 1 days), 0, 6000, 4000, 1000, // Sum > 10000
            10000e6, 24);
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // View Function Tests
    // -------------------------------------------------------------------------

    function test_GetMarket_Success() public {
        vm.startPrank(creator);
        usdt.approve(address(factory), 10000e6);
        (uint256 marketId, address marketAddress) =
            factory.createMarket("Test", outcomes, uint64(block.timestamp + 1 days), 0, 0, 0, 0, 10000e6, 30);
        vm.stopPrank();

        assertEq(factory.getMarket(marketId), marketAddress);
    }

    function test_GetMarket_RevertIf_NotFound() public {
        vm.expectRevert(MarketFactory.MarketFactory_MarketNotFound.selector);
        factory.getMarket(999);
    }

    function test_GetMarketId_Success() public {
        vm.startPrank(creator);
        usdt.approve(address(factory), 10000e6);
        (uint256 marketId, address marketAddress) =
            factory.createMarket("Test", outcomes, uint64(block.timestamp + 1 days), 0, 0, 0, 0, 10000e6, 31);
        vm.stopPrank();

        assertEq(factory.getMarketId(marketAddress), marketId);
    }

    function test_GetMarketId_RevertIf_NotFound() public {
        vm.expectRevert(MarketFactory.MarketFactory_MarketNotFound.selector);
        factory.getMarketId(makeAddr("nonexistent"));
    }

    function test_GetAllMarkets() public {
        vm.startPrank(creator);
        usdt.approve(address(factory), 30000e6);

        address[] memory created = new address[](3);
        for (uint256 i = 0; i < 3; i++) {
            (, address addr) =
                factory.createMarket("Test", outcomes, uint64(block.timestamp + 1 days), 0, 0, 0, 0, 10000e6, 40 + i);
            created[i] = addr;
        }
        vm.stopPrank();

        address[] memory all = factory.getAllMarkets();
        assertEq(all.length, 3);
        for (uint256 i = 0; i < 3; i++) {
            assertEq(all[i], created[i]);
        }
    }

    function test_GetMarkets_Pagination() public {
        vm.startPrank(creator);
        usdt.approve(address(factory), 50000e6);

        for (uint256 i = 0; i < 5; i++) {
            factory.createMarket("Test", outcomes, uint64(block.timestamp + 1 days), 0, 0, 0, 0, 10000e6, 50 + i);
        }
        vm.stopPrank();

        // Get first 2
        address[] memory page1 = factory.getMarkets(0, 2);
        assertEq(page1.length, 2);

        // Get next 2
        address[] memory page2 = factory.getMarkets(2, 2);
        assertEq(page2.length, 2);

        // Get last 1
        address[] memory page3 = factory.getMarkets(4, 2);
        assertEq(page3.length, 1);

        // Beyond end
        address[] memory page4 = factory.getMarkets(10, 2);
        assertEq(page4.length, 0);
    }

    // -------------------------------------------------------------------------
    // Admin Function Tests
    // -------------------------------------------------------------------------

    function test_SetDefaultLiquidityParameter_Success() public {
        uint256 newValue = 5000e18; // Use 18 decimal format

        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit DefaultLiquidityParameterUpdated(newValue);
        factory.setDefaultLiquidityParameter(newValue);

        assertEq(factory.defaultLiquidityParameter(), newValue);
    }

    function test_SetDefaultLiquidityParameter_RevertIf_Zero() public {
        vm.startPrank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(
                MarketFactory.MarketFactory_LiquidityTooLow.selector,
                0,
                factory.MIN_LIQUIDITY_PARAMETER()
            )
        );
        factory.setDefaultLiquidityParameter(0);
        vm.stopPrank();
    }

    function test_SetDefaultFees_Success() public {
        uint16 newProtocol = 300;
        uint16 newCreator = 150;
        uint16 newOracle = 50;

        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit DefaultFeeUpdated(newProtocol, newCreator, newOracle);
        factory.setDefaultFees(newProtocol, newCreator, newOracle);

        assertEq(factory.defaultProtocolFeeBps(), newProtocol);
        assertEq(factory.defaultCreatorFeeBps(), newCreator);
        assertEq(factory.defaultOracleFeeBps(), newOracle);
    }

    function test_SetDefaultFees_RevertIf_SumTooHigh() public {
        vm.prank(admin);
        vm.expectRevert(MarketFactory.MarketFactory_InvalidFee.selector);
        factory.setDefaultFees(6000, 4000, 1000); // Sum = 11000 > 10000
    }

    function test_SetCollateral_Success() public {
        address newCollateral = makeAddr("newCollateral");

        vm.prank(admin);
        factory.setCollateral(newCollateral);

        assertEq(factory.collateral(), newCollateral);
    }

    function test_SetTreasury_Success() public {
        address newTreasury = makeAddr("newTreasury");

        vm.prank(admin);
        factory.setTreasury(newTreasury);

        assertEq(factory.treasury(), newTreasury);
    }

    function test_SetOracle_Success() public {
        address newOracle = makeAddr("newOracle");

        vm.prank(admin);
        factory.setOracle(newOracle);

        assertEq(factory.oracle(), newOracle);
    }

    // -------------------------------------------------------------------------
    // Integration Tests
    // -------------------------------------------------------------------------

    function test_Integration_CreateAndTradeOnMarket() public {
        // Create market
        uint256 initialLiquidity = 10000e6;
        uint64 tradingEndsAt = uint64(block.timestamp + 7 days);

        vm.startPrank(creator);
        usdt.approve(address(factory), initialLiquidity);
        (, address marketAddress) =
            factory.createMarket("Test Market", outcomes, tradingEndsAt, 0, 0, 0, 0, initialLiquidity, 100);
        vm.stopPrank();

        // Grant roles for trading
        vm.startPrank(admin);
        outcome1155.grantRole(outcome1155.MINTER_BURNER_ROLE(), marketAddress);
        vm.stopPrank();

        // Fund user and trade
        vm.startPrank(admin);
        usdt.mint(user, 1000e6);
        vm.stopPrank();

        LMSRMarket market = LMSRMarket(marketAddress);

        vm.startPrank(user);
        usdt.approve(marketAddress, 1000e6);
        market.buy(0, 100e6); // Buy 100 shares of outcome 0
        vm.stopPrank();

        // Verify user has shares
        uint256 tokenId = outcome1155.encodeTokenId(0, 0);
        assertTrue(outcome1155.balanceOf(user, tokenId) > 0);
    }
}
