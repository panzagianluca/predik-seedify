// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/MockUSDT.sol";
import "../contracts/Outcome1155.sol";
import "../contracts/LMSRMarket.sol";

contract LMSRMarketResolutionTest is Test {
    MockUSDT internal usdt;
    Outcome1155 internal outcomeToken;
    LMSRMarket internal market;

    address internal trader1;
    address internal trader2;
    address internal router;
    address internal mockOracle;
    address internal mockTreasury;

    uint256 internal constant MARKET_ID = 1;
    uint8 internal constant OUTCOME_COUNT = 3;
    uint256 internal constant LIQUIDITY_B = 1e18;
    uint256 internal constant FEE = 1e16; // 1%
    uint256 internal constant INITIAL_FUNDING = 1_000_000 * 1e18;
    uint256 internal constant SHARE_DELTA = 10e18; // 10 shares

    function setUp() public {
        trader1 = makeAddr("trader1");
        trader2 = makeAddr("trader2");
        router = makeAddr("router");
        mockOracle = makeAddr("mockOracle");
        mockTreasury = makeAddr("mockTreasury");

        usdt = new MockUSDT();
        outcomeToken = new Outcome1155("https://api.predik.io/outcomes/{id}.json", router);

        // Market expires in 7 days
        uint64 tradingEndsAt = uint64(block.timestamp + 7 days);
        market = new LMSRMarket(
            MARKET_ID,
            OUTCOME_COUNT,
            LIQUIDITY_B,
            FEE,
            address(usdt),
            address(outcomeToken),
            tradingEndsAt,
            mockOracle,
            mockTreasury
        );

        outcomeToken.grantRole(outcomeToken.MINTER_BURNER_ROLE(), address(market));

        usdt.mint(address(this), INITIAL_FUNDING);
        usdt.approve(address(market), INITIAL_FUNDING);
        market.fundMarket(INITIAL_FUNDING);
    }

    function _mockOracleCall() internal {
        vm.mockCall(
            mockOracle,
            abi.encodeWithSignature("requestResolve(address)", address(market)),
            abi.encode()
        );
    }

    function _buyShares(address trader, uint8 outcomeId, uint256 amount) internal {
        (,, uint256 totalCost) = market.previewBuy(outcomeId, amount);
        usdt.mint(trader, totalCost);
        vm.prank(trader);
        usdt.approve(address(market), totalCost);
        vm.prank(trader);
        market.buy(outcomeId, amount);
    }

    // -------------------------------------------------------------------------
    // requestResolve Tests
    // -------------------------------------------------------------------------

    function testRequestResolveRevertsBeforeTradingEnds() public {
        // Try to request resolution before trading ends
        vm.expectRevert(LMSRMarket.LMSR_TradingNotEndedYet.selector);
        market.requestResolve();
    }

    function testRequestResolveRevertsWhenNotTrading() public {
        // Fast forward past trading end
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();

        // Request resolution (succeeds first time)
        market.requestResolve();

        // Try to request again (should revert)
        vm.expectRevert(LMSRMarket.LMSR_WrongState.selector);
        market.requestResolve();
    }

    function testRequestResolve() public {
        // Fast forward past trading end
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();

        // Expect oracle call
        vm.expectCall(mockOracle, abi.encodeWithSignature("requestResolve(address)", address(market)));

        market.requestResolve();
    }

    function testBuyRevertsAfterTradingEnds() public {
        // Fast forward past trading end
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();

        uint256 amount = 1e18;
        (,, uint256 totalCost) = market.previewBuy(0, amount);
        usdt.mint(trader1, totalCost);
        vm.startPrank(trader1);
        usdt.approve(address(market), totalCost);

        vm.expectRevert(LMSRMarket.LMSR_TradingEnded.selector);
        market.buy(0, amount);
        vm.stopPrank();
    }

    function testSellRevertsAfterTradingEnds() public {
        // Buy some shares first
        _buyShares(trader1, 0, SHARE_DELTA);

        // Fast forward past trading end
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();

        vm.prank(trader1);
        vm.expectRevert(LMSRMarket.LMSR_TradingEnded.selector);
        market.sell(0, SHARE_DELTA);
    }

    function testBuyRevertsAfterResolutionRequested() public {
        // Fast forward and request resolution
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        
        market.requestResolve();

        uint256 amount = 1e18;
        (,, uint256 totalCost) = market.previewBuy(0, amount);
        usdt.mint(trader1, totalCost);
        vm.startPrank(trader1);
        usdt.approve(address(market), totalCost);

        vm.expectRevert(LMSRMarket.LMSR_WrongState.selector);
        market.buy(0, amount);
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // finalize Tests
    // -------------------------------------------------------------------------

    function testFinalizeRevertsNonOracle() public {
        // Fast forward and request resolution
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();

        // Try to finalize from non-oracle address
        vm.prank(trader1);
        vm.expectRevert(LMSRMarket.LMSR_OnlyOracle.selector);
        market.finalize(0, false);
    }

    function testFinalizeRevertsWrongState() public {
        // Try to finalize before requesting resolution
        vm.prank(mockOracle);
        vm.expectRevert(LMSRMarket.LMSR_WrongState.selector);
        market.finalize(0, false);
    }

    function testFinalizeRevertsInvalidOutcome() public {
        // Fast forward and request resolution
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();

        // Try to finalize with invalid outcome
        vm.prank(mockOracle);
        vm.expectRevert(abi.encodeWithSelector(LMSRMarket.LMSR_InvalidOutcome.selector, OUTCOME_COUNT));
        market.finalize(OUTCOME_COUNT, false);
    }

    function testFinalizeValidOutcome() public {
        // Fast forward and request resolution
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();

        // Expect Resolved event
        vm.expectEmit(true, false, false, true);
        emit LMSRMarket.Resolved(1, false);

        // Finalize with outcome 1
        vm.prank(mockOracle);
        market.finalize(1, false);
    }

    function testFinalizeAsInvalid() public {
        // Fast forward and request resolution
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();

        // Expect Resolved event
        vm.expectEmit(true, false, false, true);
        emit LMSRMarket.Resolved(0, true);

        // Finalize as invalid (outcome doesn't matter when invalid=true)
        vm.prank(mockOracle);
        market.finalize(0, true);
    }

    // -------------------------------------------------------------------------
    // redeem Tests - Valid Market
    // -------------------------------------------------------------------------

    function testRedeemRevertsNotFinalized() public {
        _buyShares(trader1, 0, SHARE_DELTA);

        vm.prank(trader1);
        vm.expectRevert(LMSRMarket.LMSR_MarketNotFinalized.selector);
        market.redeem(0, SHARE_DELTA);
    }

    function testRedeemRevertsNoShares() public {
        // Fast forward, request, and finalize
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();
        vm.prank(mockOracle);
        market.finalize(0, false);

        // Try to redeem without shares
        vm.prank(trader1);
        vm.expectRevert(LMSRMarket.LMSR_NoShares.selector);
        market.redeem(0, 1e18);
    }

    function testRedeemRevertsNotWinner() public {
        // Trader1 buys outcome 0
        _buyShares(trader1, 0, SHARE_DELTA);

        // Fast forward, request, and finalize with outcome 1 as winner
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();
        vm.prank(mockOracle);
        market.finalize(1, false);

        // Trader1 tries to redeem losing shares
        vm.prank(trader1);
        vm.expectRevert(LMSRMarket.LMSR_NotWinner.selector);
        market.redeem(0, SHARE_DELTA);
    }

    function testRedeemWinningShares() public {
        // Trader1 buys outcome 0
        _buyShares(trader1, 0, SHARE_DELTA);

        uint256 balanceBefore = usdt.balanceOf(trader1);

        // Fast forward, request, and finalize with outcome 0 as winner
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();
        vm.prank(mockOracle);
        market.finalize(0, false);

        // Expect Redeemed event
        vm.expectEmit(true, true, false, true);
        emit LMSRMarket.Redeemed(trader1, 0, SHARE_DELTA, SHARE_DELTA);

        // Trader1 redeems winning shares (1:1 payout)
        vm.prank(trader1);
        uint256 payout = market.redeem(0, SHARE_DELTA);

        assertEq(payout, SHARE_DELTA, "Payout should be 1:1 for winners");
        assertEq(usdt.balanceOf(trader1), balanceBefore + SHARE_DELTA, "Trader should receive payout");

        // Verify shares burned
        uint256 tokenId = outcomeToken.encodeTokenId(MARKET_ID, 0);
        assertEq(outcomeToken.balanceOf(trader1, tokenId), 0, "Shares should be burned");
    }

    function testRedeemPartialShares() public {
        // Trader1 buys outcome 0
        _buyShares(trader1, 0, SHARE_DELTA);

        // Fast forward, request, and finalize with outcome 0 as winner
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();
        vm.prank(mockOracle);
        market.finalize(0, false);

        // Redeem half the shares
        uint256 halfShares = SHARE_DELTA / 2;
        vm.prank(trader1);
        uint256 payout = market.redeem(0, halfShares);

        assertEq(payout, halfShares, "Payout should be 1:1 for half shares");

        // Verify remaining shares
        uint256 tokenId = outcomeToken.encodeTokenId(MARKET_ID, 0);
        assertEq(outcomeToken.balanceOf(trader1, tokenId), halfShares, "Half shares should remain");
    }

    // -------------------------------------------------------------------------
    // redeem Tests - Invalid Market
    // -------------------------------------------------------------------------

    function testRedeemInvalidMarketProRata() public {
        // Multiple traders buy different outcomes
        _buyShares(trader1, 0, 10e18); // 10 shares outcome 0
        _buyShares(trader2, 1, 5e18);  // 5 shares outcome 1

        uint256 trader1Balance = usdt.balanceOf(trader1);
        uint256 trader2Balance = usdt.balanceOf(trader2);

        // Fast forward, request, and finalize as invalid
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();
        vm.prank(mockOracle);
        market.finalize(0, true); // Invalid market

        // Calculate expected payouts
        uint256 totalShares = market.outstandingShares(0) + market.outstandingShares(1) + market.outstandingShares(2);
        uint256 availableCollateral = market.availableCollateral();

        // Trader1 redeems
        vm.prank(trader1);
        uint256 payout1 = market.redeem(0, 10e18);
        uint256 expectedPayout1 = (10e18 * availableCollateral) / totalShares;
        assertEq(payout1, expectedPayout1, "Trader1 should get pro-rata refund");

        // Trader2 redeems
        vm.prank(trader2);
        uint256 payout2 = market.redeem(1, 5e18);
        uint256 expectedPayout2 = (5e18 * availableCollateral) / totalShares;
        assertEq(payout2, expectedPayout2, "Trader2 should get pro-rata refund");

        assertGt(usdt.balanceOf(trader1), trader1Balance, "Trader1 should receive refund");
        assertGt(usdt.balanceOf(trader2), trader2Balance, "Trader2 should receive refund");
    }

    function testRedeemInvalidMarketAllOutcomes() public {
        // Buy shares in all outcomes
        _buyShares(trader1, 0, 5e18);
        _buyShares(trader1, 1, 3e18);
        _buyShares(trader1, 2, 2e18);

        // Fast forward, request, and finalize as invalid
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();
        vm.prank(mockOracle);
        market.finalize(0, true);

        uint256 totalShares = market.outstandingShares(0) + market.outstandingShares(1) + market.outstandingShares(2);
        uint256 availableCollateral = market.availableCollateral();

        uint256 balanceBefore = usdt.balanceOf(trader1);

        // Redeem all outcomes
        vm.startPrank(trader1);
        market.redeem(0, 5e18);
        market.redeem(1, 3e18);
        market.redeem(2, 2e18);
        vm.stopPrank();

        uint256 balanceAfter = usdt.balanceOf(trader1);
        uint256 expectedTotal = (10e18 * availableCollateral) / totalShares;

        // Allow for 10 wei rounding error due to integer division across multiple redemptions
        assertApproxEqAbs(balanceAfter - balanceBefore, expectedTotal, 10, "Should receive pro-rata for all shares");
    }

    // -------------------------------------------------------------------------
    // Edge Cases
    // -------------------------------------------------------------------------

    function testRedeemRevertsZeroAmount() public {
        _buyShares(trader1, 0, SHARE_DELTA);

        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();
        vm.prank(mockOracle);
        market.finalize(0, false);

        vm.prank(trader1);
        vm.expectRevert(LMSRMarket.LMSR_InvalidAmount.selector);
        market.redeem(0, 0);
    }

    function testStateTransitions() public {
        // Initial state should be Trading (implicitly tested via buys)
        _buyShares(trader1, 0, SHARE_DELTA);

        // Transition to Resolving
        vm.warp(block.timestamp + 8 days);
        _mockOracleCall();
        market.requestResolve();

        // Transition to Finalized
        vm.prank(mockOracle);
        market.finalize(0, false);

        // Verify can redeem in Finalized state
        vm.prank(trader1);
        market.redeem(0, SHARE_DELTA);
    }

    function testTotalVolumeTracking() public {
        (,, uint256 cost1) = market.previewBuy(0, 5e18);
        _buyShares(trader1, 0, 5e18);
        assertEq(market.totalVolume(), cost1, "Total volume should track first buy");

        (,, uint256 cost2) = market.previewBuy(1, 3e18);
        _buyShares(trader2, 1, 3e18);
        assertEq(market.totalVolume(), cost1 + cost2, "Total volume should accumulate");
    }
}
