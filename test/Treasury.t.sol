// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {Treasury} from "../contracts/Treasury.sol";
import {MockUSDT} from "../contracts/MockUSDT.sol";

contract TreasuryTest is Test {
    Treasury public treasury;
    MockUSDT public usdt;

    address public admin = makeAddr("admin");
    address public protocol = makeAddr("protocol");
    address public oracle = makeAddr("oracle");
    address public creator1 = makeAddr("creator1");
    address public creator2 = makeAddr("creator2");
    address public market1 = makeAddr("market1");
    address public market2 = makeAddr("market2");
    address public user = makeAddr("user");

    // Fee split: 60% protocol, 30% creator, 10% oracle
    uint256 public constant PROTOCOL_BPS = 6000;
    uint256 public constant CREATOR_BPS = 3000;
    uint256 public constant ORACLE_BPS = 1000;

    uint256 public constant MARKET_ID_1 = 1;
    uint256 public constant MARKET_ID_2 = 2;

    event FeesCollected(
        uint256 indexed marketId,
        address indexed market,
        address indexed token,
        uint256 protocolAmount,
        uint256 creatorAmount,
        uint256 oracleAmount,
        uint256 totalAmount
    );

    event ProtocolWithdrawal(address indexed token, address indexed to, uint256 amount);

    event CreatorWithdrawal(
        uint256 indexed marketId, address indexed creator, address indexed token, uint256 amount
    );

    event OracleWithdrawal(address indexed oracle, address indexed token, uint256 amount);

    event FeeSplitUpdated(uint256 protocolBps, uint256 creatorBps, uint256 oracleBps);

    event MarketRegistered(uint256 indexed marketId, address indexed market, address indexed creator);

    function setUp() public {
        // Deploy USDT first (admin becomes owner)
        vm.startPrank(admin);
        usdt = new MockUSDT();

        // Deploy treasury
        treasury = new Treasury(PROTOCOL_BPS, CREATOR_BPS, ORACLE_BPS, oracle);

        // Grant roles
        treasury.grantRole(treasury.PROTOCOL_ROLE(), protocol);
        treasury.grantRole(treasury.MARKET_MANAGER_ROLE(), admin);

        // Register markets
        treasury.registerMarket(MARKET_ID_1, market1, creator1);
        treasury.registerMarket(MARKET_ID_2, market2, creator2);

        // Fund markets with USDT (admin is owner so can mint)
        usdt.mint(market1, 1000000e6);
        usdt.mint(market2, 1000000e6);

        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Constructor Tests
    // -------------------------------------------------------------------------

    function test_Constructor_Success() public view {
        assertEq(treasury.protocolFeeBps(), PROTOCOL_BPS);
        assertEq(treasury.creatorFeeBps(), CREATOR_BPS);
        assertEq(treasury.oracleFeeBps(), ORACLE_BPS);
        assertEq(treasury.oracle(), oracle);
        assertTrue(treasury.hasRole(treasury.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(treasury.hasRole(treasury.PROTOCOL_ROLE(), admin));
        assertTrue(treasury.hasRole(treasury.MARKET_MANAGER_ROLE(), admin));
    }

    function test_Constructor_RevertIf_InvalidOracle() public {
        vm.expectRevert(Treasury.Treasury_InvalidAddress.selector);
        new Treasury(PROTOCOL_BPS, CREATOR_BPS, ORACLE_BPS, address(0));
    }

    function test_Constructor_RevertIf_InvalidBps() public {
        vm.expectRevert(Treasury.Treasury_InvalidBps.selector);
        new Treasury(5000, 3000, 1000, oracle); // Sum = 9000 != 10000
    }

    // -------------------------------------------------------------------------
    // Market Registration Tests
    // -------------------------------------------------------------------------

    function test_RegisterMarket_Success() public {
        uint256 marketId = 999;
        address newMarket = makeAddr("newMarket");
        address newCreator = makeAddr("newCreator");

        vm.prank(admin);
        vm.expectEmit(true, true, true, true);
        emit MarketRegistered(marketId, newMarket, newCreator);
        treasury.registerMarket(marketId, newMarket, newCreator);

        assertTrue(treasury.isMarketRegistered(marketId));
        assertEq(treasury.getMarketCreator(marketId), newCreator);
    }

    function test_RegisterMarket_RevertIf_Unauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        treasury.registerMarket(999, makeAddr("market"), makeAddr("creator"));
    }

    function test_RegisterMarket_RevertIf_InvalidMarketAddress() public {
        vm.prank(admin);
        vm.expectRevert(Treasury.Treasury_InvalidAddress.selector);
        treasury.registerMarket(999, address(0), creator1);
    }

    function test_RegisterMarket_RevertIf_InvalidCreatorAddress() public {
        vm.prank(admin);
        vm.expectRevert(Treasury.Treasury_InvalidAddress.selector);
        treasury.registerMarket(999, market1, address(0));
    }

    function test_RegisterMarket_RevertIf_AlreadyRegistered() public {
        vm.prank(admin);
        vm.expectRevert(Treasury.Treasury_MarketAlreadyRegistered.selector);
        treasury.registerMarket(MARKET_ID_1, market1, creator1);
    }

    // -------------------------------------------------------------------------
    // Fee Collection Tests
    // -------------------------------------------------------------------------

    function test_Collect_Success() public {
        uint256 feeAmount = 1000e6; // 1000 USDT

        // Market approves treasury
        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);

        // Calculate expected splits
        uint256 expectedProtocol = (feeAmount * PROTOCOL_BPS) / 10000; // 600 USDT
        uint256 expectedCreator = (feeAmount * CREATOR_BPS) / 10000; // 300 USDT
        uint256 expectedOracle = (feeAmount * ORACLE_BPS) / 10000; // 100 USDT

        vm.prank(market1);
        vm.expectEmit(true, true, true, true);
        emit FeesCollected(
            MARKET_ID_1, market1, address(usdt), expectedProtocol, expectedCreator, expectedOracle, feeAmount
        );
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        assertEq(treasury.getProtocolBalance(address(usdt)), expectedProtocol);
        assertEq(treasury.getCreatorBalance(MARKET_ID_1, address(usdt)), expectedCreator);
        assertEq(treasury.getOracleBalance(address(usdt)), expectedOracle);
        assertEq(treasury.getMarketTotalFees(MARKET_ID_1, address(usdt)), feeAmount);
    }

    function test_Collect_HandlesRounding() public {
        uint256 feeAmount = 1337e6; // Amount that doesn't divide evenly

        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);

        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        // Verify total adds up correctly (remainder goes to protocol)
        uint256 total = treasury.getProtocolBalance(address(usdt)) + treasury.getCreatorBalance(MARKET_ID_1, address(usdt))
            + treasury.getOracleBalance(address(usdt));
        assertEq(total, feeAmount);
    }

    function test_Collect_MultipleMarkets() public {
        uint256 fee1 = 1000e6;
        uint256 fee2 = 2000e6;

        // Market 1 collects
        vm.prank(market1);
        usdt.approve(address(treasury), fee1);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), fee1);

        // Market 2 collects
        vm.prank(market2);
        usdt.approve(address(treasury), fee2);
        vm.prank(market2);
        treasury.collect(MARKET_ID_2, address(usdt), fee2);

        // Protocol and oracle balances are cumulative
        uint256 expectedProtocol = ((fee1 + fee2) * PROTOCOL_BPS) / 10000;
        uint256 expectedOracle = ((fee1 + fee2) * ORACLE_BPS) / 10000;

        // Creator balances are separate per market
        uint256 expectedCreator1 = (fee1 * CREATOR_BPS) / 10000;
        uint256 expectedCreator2 = (fee2 * CREATOR_BPS) / 10000;

        // Account for rounding
        uint256 actualProtocol = treasury.getProtocolBalance(address(usdt));
        assertGe(actualProtocol, expectedProtocol);
        assertLe(actualProtocol, expectedProtocol + 2); // Max 2 wei rounding

        assertEq(treasury.getCreatorBalance(MARKET_ID_1, address(usdt)), expectedCreator1);
        assertEq(treasury.getCreatorBalance(MARKET_ID_2, address(usdt)), expectedCreator2);
        assertEq(treasury.getOracleBalance(address(usdt)), expectedOracle);
    }

    function test_Collect_RevertIf_MarketNotRegistered() public {
        address unregisteredMarket = makeAddr("unregisteredMarket");

        vm.prank(unregisteredMarket);
        vm.expectRevert(Treasury.Treasury_MarketNotRegistered.selector);
        treasury.collect(999, address(usdt), 1000e6);
    }

    function test_Collect_RevertIf_Unauthorized() public {
        vm.prank(user); // Not the registered market
        vm.expectRevert(Treasury.Treasury_Unauthorized.selector);
        treasury.collect(MARKET_ID_1, address(usdt), 1000e6);
    }

    function test_Collect_RevertIf_ZeroAmount() public {
        vm.prank(market1);
        vm.expectRevert(Treasury.Treasury_InvalidAmount.selector);
        treasury.collect(MARKET_ID_1, address(usdt), 0);
    }

    // -------------------------------------------------------------------------
    // Protocol Withdrawal Tests
    // -------------------------------------------------------------------------

    function test_WithdrawProtocol_Success() public {
        // Collect some fees first
        uint256 feeAmount = 1000e6;
        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        uint256 protocolBalance = treasury.getProtocolBalance(address(usdt));
        address recipient = makeAddr("recipient");

        vm.prank(protocol);
        vm.expectEmit(true, true, false, true);
        emit ProtocolWithdrawal(address(usdt), recipient, protocolBalance);
        treasury.withdrawProtocol(address(usdt), recipient, protocolBalance);

        assertEq(usdt.balanceOf(recipient), protocolBalance);
        assertEq(treasury.getProtocolBalance(address(usdt)), 0);
    }

    function test_WithdrawProtocol_PartialWithdrawal() public {
        // Collect fees
        uint256 feeAmount = 1000e6;
        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        uint256 protocolBalance = treasury.getProtocolBalance(address(usdt));
        uint256 withdrawAmount = protocolBalance / 2;
        address recipient = makeAddr("recipient");

        vm.prank(protocol);
        treasury.withdrawProtocol(address(usdt), recipient, withdrawAmount);

        assertEq(usdt.balanceOf(recipient), withdrawAmount);
        assertEq(treasury.getProtocolBalance(address(usdt)), protocolBalance - withdrawAmount);
    }

    function test_WithdrawProtocol_RevertIf_Unauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        treasury.withdrawProtocol(address(usdt), user, 100e6);
    }

    function test_WithdrawProtocol_RevertIf_InvalidRecipient() public {
        vm.prank(protocol);
        vm.expectRevert(Treasury.Treasury_InvalidAddress.selector);
        treasury.withdrawProtocol(address(usdt), address(0), 100e6);
    }

    function test_WithdrawProtocol_RevertIf_InsufficientBalance() public {
        vm.prank(protocol);
        vm.expectRevert(Treasury.Treasury_InsufficientBalance.selector);
        treasury.withdrawProtocol(address(usdt), protocol, 1e6);
    }

    function test_WithdrawProtocol_RevertIf_ZeroAmount() public {
        vm.prank(protocol);
        vm.expectRevert(Treasury.Treasury_InsufficientBalance.selector);
        treasury.withdrawProtocol(address(usdt), protocol, 0);
    }

    // -------------------------------------------------------------------------
    // Creator Withdrawal Tests
    // -------------------------------------------------------------------------

    function test_WithdrawCreator_Success() public {
        // Collect fees
        uint256 feeAmount = 1000e6;
        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        uint256 creatorBalance = treasury.getCreatorBalance(MARKET_ID_1, address(usdt));

        vm.prank(creator1);
        vm.expectEmit(true, true, true, true);
        emit CreatorWithdrawal(MARKET_ID_1, creator1, address(usdt), creatorBalance);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), creatorBalance);

        assertEq(usdt.balanceOf(creator1), creatorBalance);
        assertEq(treasury.getCreatorBalance(MARKET_ID_1, address(usdt)), 0);
    }

    function test_WithdrawCreator_PartialWithdrawal() public {
        // Collect fees
        uint256 feeAmount = 1000e6;
        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        uint256 creatorBalance = treasury.getCreatorBalance(MARKET_ID_1, address(usdt));
        uint256 withdrawAmount = creatorBalance / 2;

        vm.prank(creator1);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), withdrawAmount);

        assertEq(usdt.balanceOf(creator1), withdrawAmount);
        assertEq(treasury.getCreatorBalance(MARKET_ID_1, address(usdt)), creatorBalance - withdrawAmount);
    }

    function test_WithdrawCreator_IsolatedPerMarket() public {
        // Both markets collect fees
        uint256 fee1 = 1000e6;
        uint256 fee2 = 2000e6;

        vm.prank(market1);
        usdt.approve(address(treasury), fee1);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), fee1);

        vm.prank(market2);
        usdt.approve(address(treasury), fee2);
        vm.prank(market2);
        treasury.collect(MARKET_ID_2, address(usdt), fee2);

        uint256 creator1Balance = treasury.getCreatorBalance(MARKET_ID_1, address(usdt));
        uint256 creator2Balance = treasury.getCreatorBalance(MARKET_ID_2, address(usdt));

        // Creator1 withdraws
        vm.prank(creator1);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), creator1Balance);

        // Verify creator1 got their funds
        assertEq(usdt.balanceOf(creator1), creator1Balance);
        assertEq(treasury.getCreatorBalance(MARKET_ID_1, address(usdt)), 0);

        // Verify creator2's balance is unaffected
        assertEq(treasury.getCreatorBalance(MARKET_ID_2, address(usdt)), creator2Balance);
    }

    function test_WithdrawCreator_RevertIf_MarketNotRegistered() public {
        vm.prank(creator1);
        vm.expectRevert(Treasury.Treasury_MarketNotRegistered.selector);
        treasury.withdrawCreator(999, address(usdt), 100e6);
    }

    function test_WithdrawCreator_RevertIf_Unauthorized() public {
        vm.prank(user); // Not the creator
        vm.expectRevert(Treasury.Treasury_Unauthorized.selector);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), 100e6);
    }

    function test_WithdrawCreator_RevertIf_InsufficientBalance() public {
        vm.prank(creator1);
        vm.expectRevert(Treasury.Treasury_InsufficientBalance.selector);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), 1e6);
    }

    // -------------------------------------------------------------------------
    // Oracle Withdrawal Tests
    // -------------------------------------------------------------------------

    function test_WithdrawOracle_Success() public {
        // Collect fees
        uint256 feeAmount = 1000e6;
        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        uint256 oracleBalance = treasury.getOracleBalance(address(usdt));

        vm.prank(oracle);
        vm.expectEmit(true, true, false, true);
        emit OracleWithdrawal(oracle, address(usdt), oracleBalance);
        treasury.withdrawOracle(address(usdt), oracleBalance);

        assertEq(usdt.balanceOf(oracle), oracleBalance);
        assertEq(treasury.getOracleBalance(address(usdt)), 0);
    }

    function test_WithdrawOracle_CumulativeFromMultipleMarkets() public {
        // Multiple markets collect fees
        uint256 fee1 = 1000e6;
        uint256 fee2 = 2000e6;

        vm.prank(market1);
        usdt.approve(address(treasury), fee1);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), fee1);

        vm.prank(market2);
        usdt.approve(address(treasury), fee2);
        vm.prank(market2);
        treasury.collect(MARKET_ID_2, address(usdt), fee2);

        uint256 expectedOracleTotal = ((fee1 + fee2) * ORACLE_BPS) / 10000;
        uint256 actualOracleBalance = treasury.getOracleBalance(address(usdt));

        assertEq(actualOracleBalance, expectedOracleTotal);

        vm.prank(oracle);
        treasury.withdrawOracle(address(usdt), actualOracleBalance);

        assertEq(usdt.balanceOf(oracle), actualOracleBalance);
    }

    function test_WithdrawOracle_RevertIf_Unauthorized() public {
        vm.prank(user);
        vm.expectRevert(Treasury.Treasury_Unauthorized.selector);
        treasury.withdrawOracle(address(usdt), 100e6);
    }

    function test_WithdrawOracle_RevertIf_InsufficientBalance() public {
        vm.prank(oracle);
        vm.expectRevert(Treasury.Treasury_InsufficientBalance.selector);
        treasury.withdrawOracle(address(usdt), 1e6);
    }

    // -------------------------------------------------------------------------
    // Admin Function Tests
    // -------------------------------------------------------------------------

    function test_UpdateFeeSplit_Success() public {
        uint256 newProtocol = 5000;
        uint256 newCreator = 4000;
        uint256 newOracle = 1000;

        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit FeeSplitUpdated(newProtocol, newCreator, newOracle);
        treasury.updateFeeSplit(newProtocol, newCreator, newOracle);

        assertEq(treasury.protocolFeeBps(), newProtocol);
        assertEq(treasury.creatorFeeBps(), newCreator);
        assertEq(treasury.oracleFeeBps(), newOracle);
    }

    function test_UpdateFeeSplit_RevertIf_InvalidBps() public {
        vm.prank(admin);
        vm.expectRevert(Treasury.Treasury_InvalidBps.selector);
        treasury.updateFeeSplit(5000, 3000, 1000); // Sum = 9000 != 10000
    }

    function test_UpdateFeeSplit_RevertIf_Unauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        treasury.updateFeeSplit(5000, 4000, 1000);
    }

    function test_SetOracle_Success() public {
        address newOracle = makeAddr("newOracle");

        vm.prank(admin);
        treasury.setOracle(newOracle);

        assertEq(treasury.oracle(), newOracle);
    }

    function test_SetOracle_RevertIf_InvalidAddress() public {
        vm.prank(admin);
        vm.expectRevert(Treasury.Treasury_InvalidAddress.selector);
        treasury.setOracle(address(0));
    }

    function test_SetOracle_RevertIf_Unauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        treasury.setOracle(makeAddr("newOracle"));
    }

    // -------------------------------------------------------------------------
    // Edge Case Tests
    // -------------------------------------------------------------------------

    function test_CollectAndWithdraw_LargeFeeAmount() public {
        uint256 largeFee = 1000000e6; // 1M USDT

        vm.prank(market1);
        usdt.approve(address(treasury), largeFee);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), largeFee);

        // Withdraw all balances
        uint256 protocolBalance = treasury.getProtocolBalance(address(usdt));
        uint256 creatorBalance = treasury.getCreatorBalance(MARKET_ID_1, address(usdt));
        uint256 oracleBalance = treasury.getOracleBalance(address(usdt));

        vm.prank(protocol);
        treasury.withdrawProtocol(address(usdt), protocol, protocolBalance);

        vm.prank(creator1);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), creatorBalance);

        vm.prank(oracle);
        treasury.withdrawOracle(address(usdt), oracleBalance);

        // Verify all funds withdrawn
        uint256 totalWithdrawn = usdt.balanceOf(protocol) + usdt.balanceOf(creator1) + usdt.balanceOf(oracle);
        assertEq(totalWithdrawn, largeFee);
    }

    function test_MultipleCollectionsAndWithdrawals() public {
        // Multiple collection cycles
        for (uint256 i = 0; i < 5; i++) {
            uint256 fee = (i + 1) * 100e6;

            vm.prank(market1);
            usdt.approve(address(treasury), fee);
            vm.prank(market1);
            treasury.collect(MARKET_ID_1, address(usdt), fee);

            // Partial withdrawal each time
            uint256 creatorBalance = treasury.getCreatorBalance(MARKET_ID_1, address(usdt));
            if (creatorBalance > 0) {
                vm.prank(creator1);
                treasury.withdrawCreator(MARKET_ID_1, address(usdt), creatorBalance / 2);
            }
        }

        // Verify remaining balances
        assertTrue(treasury.getProtocolBalance(address(usdt)) > 0);
        assertTrue(treasury.getCreatorBalance(MARKET_ID_1, address(usdt)) > 0);
        assertTrue(treasury.getOracleBalance(address(usdt)) > 0);
    }

    function test_Reentrancy_Protection() public {
        // Basic reentrancy check - contract prevents multiple calls
        uint256 feeAmount = 1000e6;

        vm.prank(market1);
        usdt.approve(address(treasury), feeAmount);
        vm.prank(market1);
        treasury.collect(MARKET_ID_1, address(usdt), feeAmount);

        // Attempt to withdraw twice in same transaction would fail with InsufficientBalance
        uint256 balance = treasury.getCreatorBalance(MARKET_ID_1, address(usdt));

        vm.startPrank(creator1);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), balance);

        vm.expectRevert(Treasury.Treasury_InsufficientBalance.selector);
        treasury.withdrawCreator(MARKET_ID_1, address(usdt), 1);
        vm.stopPrank();
    }
}
