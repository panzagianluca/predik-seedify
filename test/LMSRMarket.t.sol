// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/MockUSDT.sol";
import "../contracts/Outcome1155.sol";
import "../contracts/LMSRMarket.sol";

contract LMSRMarketTest is Test {
    MockUSDT internal usdt;
    Outcome1155 internal outcomeToken;
    LMSRMarket internal market;

    address internal trader;
    address internal router;
    address internal mockOracle;
    address internal mockTreasury;

    uint256 internal constant MARKET_ID = 1;
    uint8 internal constant OUTCOME_COUNT = 3;
    uint256 internal constant LIQUIDITY_B = 1e18; // b = 1.0
    uint256 internal constant FEE = 1e16; // 1%
    uint256 internal constant INITIAL_FUNDING = 1_000_000 * 1e18;
    uint8 internal constant TARGET_OUTCOME = 0;
    uint256 internal constant SHARE_DELTA = 1e18; // 1 share in UD60x18 scaling

    function setUp() public {
        trader = makeAddr("trader");
        router = makeAddr("router");
        mockOracle = makeAddr("mockOracle");
        mockTreasury = makeAddr("mockTreasury");

        usdt = new MockUSDT();
        outcomeToken = new Outcome1155("https://api.predik.io/outcomes/{id}.json", router);

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

    function testPreviewBuyMatchesExecution() public {
        (uint256 costRaw, uint256 feeRaw, uint256 totalRaw) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);
        assertGt(costRaw, 0, "cost should be positive");
        assertEq(totalRaw, costRaw + feeRaw, "total must include fee");

        _mintAndApprove(trader, totalRaw);

        vm.prank(trader);
        uint256 paid = market.buy(TARGET_OUTCOME, SHARE_DELTA);
        assertEq(paid, totalRaw, "buy should charge preview price");

        uint256 tokenId = outcomeToken.encodeTokenId(MARKET_ID, TARGET_OUTCOME);
        assertEq(outcomeToken.balanceOf(trader, tokenId), SHARE_DELTA, "shares should mint to trader");
        assertEq(market.outstandingShares(TARGET_OUTCOME), SHARE_DELTA, "outstanding shares updated");
        assertEq(market.feeReserve(), feeRaw, "fee reserve should accrue fee");
    }

    function testSellReturnsNetPayout() public {
        (, uint256 buyFeeRaw, uint256 buyTotal) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);
        _mintAndApprove(trader, buyTotal);

        vm.prank(trader);
        market.buy(TARGET_OUTCOME, SHARE_DELTA);
        uint256 accruedFees = market.feeReserve();
        assertEq(accruedFees, buyFeeRaw, "fee reserve should track buy fee");

        (uint256 grossRaw, uint256 feeRaw, uint256 netRaw) = market.previewSell(TARGET_OUTCOME, SHARE_DELTA);
        assertGt(grossRaw, 0, "gross payout must be positive");
        assertEq(grossRaw, netRaw + feeRaw, "net + fee equals gross");

        vm.prank(trader);
        uint256 netReceived = market.sell(TARGET_OUTCOME, SHARE_DELTA);
        assertEq(netReceived, netRaw, "sell should return preview net amount");

        uint256 tokenId = outcomeToken.encodeTokenId(MARKET_ID, TARGET_OUTCOME);
        assertEq(outcomeToken.balanceOf(trader, tokenId), 0, "shares should burn on sell");
        assertEq(market.outstandingShares(TARGET_OUTCOME), 0, "outstanding shares reset");
        assertEq(usdt.balanceOf(trader), netRaw, "trader should receive net payout");

        uint256 expectedFees = accruedFees + feeRaw;
        assertEq(market.feeReserve(), expectedFees, "fee reserve should include both fees");
    }

    function testSellMoreThanOwnedReverts() public {
        (,, uint256 buyTotal) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);
        _mintAndApprove(trader, buyTotal);

        vm.prank(trader);
        market.buy(TARGET_OUTCOME, SHARE_DELTA);

        uint256 excess = SHARE_DELTA + 1;
        vm.expectRevert(abi.encodeWithSelector(LMSRMarket.LMSR_InsufficientUserShares.selector, SHARE_DELTA, excess));
        vm.prank(trader);
        market.sell(TARGET_OUTCOME, excess);
    }

    function testPreviewSellInsufficientSharesReverts() public {
        vm.expectRevert(abi.encodeWithSelector(LMSRMarket.LMSR_InsufficientMarketShares.selector, 0, SHARE_DELTA));
        market.previewSell(TARGET_OUTCOME, SHARE_DELTA);
    }

    function testTradingPausedBlocksBuysAndSells() public {
        market.pauseTrading(true);

        vm.expectRevert(LMSRMarket.LMSR_TradingPaused.selector);
        market.buy(TARGET_OUTCOME, SHARE_DELTA);

        market.pauseTrading(false);

        (,, uint256 buyTotal) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);
        _mintAndApprove(trader, buyTotal);
        vm.prank(trader);
        market.buy(TARGET_OUTCOME, SHARE_DELTA);

        market.pauseTrading(true);
        vm.expectRevert(LMSRMarket.LMSR_TradingPaused.selector);
        vm.prank(trader);
        market.sell(TARGET_OUTCOME, SHARE_DELTA);
    }

    function testWithdrawFeesTransfersToTreasury() public {
        (,, uint256 buyTotal) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);
        _mintAndApprove(trader, buyTotal);
        vm.prank(trader);
        market.buy(TARGET_OUTCOME, SHARE_DELTA);

        uint256 feeReserveBefore = market.feeReserve();
        assertGt(feeReserveBefore, 0, "fees should exist after trade");

        address treasury = makeAddr("treasury");
        market.grantRole(market.TREASURY_ROLE(), treasury);

        vm.prank(treasury);
        market.withdrawFees(treasury, feeReserveBefore);
        assertEq(usdt.balanceOf(treasury), feeReserveBefore, "treasury should receive fees");
        assertEq(market.feeReserve(), 0, "fee reserve cleared");
    }

    function testFundMarketRequiresAdmin() public {
        address stranger = makeAddr("stranger");
        usdt.mint(stranger, 1e18);
        vm.prank(stranger);
        usdt.approve(address(market), 1e18);

        vm.expectRevert();
        vm.prank(stranger);
        market.fundMarket(1e18);
    }

    function _mintAndApprove(address user, uint256 amount) internal {
        usdt.mint(user, amount);
        vm.prank(user);
        usdt.approve(address(market), amount);
    }
}
