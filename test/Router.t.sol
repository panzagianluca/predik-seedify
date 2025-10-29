// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/MockUSDT.sol";
import "../contracts/Outcome1155.sol";
import "../contracts/LMSRMarket.sol";
import "../contracts/Router.sol";

contract RouterTest is Test {
    MockUSDT internal usdt;
    Outcome1155 internal outcomeToken;
    Router internal router;
    LMSRMarket internal market;

    address internal trader;
    address internal admin;
    address internal mockOracle;
    address internal mockTreasury;

    uint256 internal constant MARKET_ID = 1;
    uint8 internal constant OUTCOME_COUNT = 3;
    uint256 internal constant LIQUIDITY_B = 1e18;
    uint256 internal constant FEE = 1e16; // 1%
    uint256 internal constant INITIAL_FUNDING = 1_000_000 * 1e18;
    uint8 internal constant TARGET_OUTCOME = 0;
    uint256 internal constant SHARE_DELTA = 1e18;

    function setUp() public {
        trader = makeAddr("trader");
        admin = makeAddr("admin");
        mockOracle = makeAddr("mockOracle");
        mockTreasury = makeAddr("mockTreasury");

        usdt = new MockUSDT();
        outcomeToken = new Outcome1155("https://api.predik.io/outcomes/{id}.json", address(this));

        router = new Router(address(outcomeToken));

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

        // Grant roles
        outcomeToken.grantRole(outcomeToken.MINTER_BURNER_ROLE(), address(market));
        outcomeToken.grantRole(outcomeToken.MINTER_BURNER_ROLE(), address(router));

        // Register market in router
        router.registerMarket(MARKET_ID, address(market));

        // Fund market
        usdt.mint(address(this), INITIAL_FUNDING);
        usdt.approve(address(market), INITIAL_FUNDING);
        market.fundMarket(INITIAL_FUNDING);
    }

    function testBuyWithPermitWithoutPermit() public {
        (,, uint256 totalCost) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);

        // Mint and approve router
        usdt.mint(trader, totalCost);
        vm.prank(trader);
        usdt.approve(address(router), totalCost);

        // Execute buy without permit (permitDeadline = 0)
        vm.prank(trader);
        uint256 paid = router.buyWithPermit(
            MARKET_ID,
            TARGET_OUTCOME,
            SHARE_DELTA,
            totalCost,
            0, // permitDeadline = 0 skips permit
            0,
            bytes32(0),
            bytes32(0)
        );

        assertEq(paid, totalCost, "paid should match preview");

        uint256 tokenId = outcomeToken.encodeTokenId(MARKET_ID, TARGET_OUTCOME);
        assertEq(outcomeToken.balanceOf(trader, tokenId), SHARE_DELTA, "trader should receive shares");
    }

    function testBuyWithPermitSlippageProtection() public {
        (,, uint256 totalCost) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);

        usdt.mint(trader, totalCost);
        vm.prank(trader);
        usdt.approve(address(router), totalCost);

        uint256 maxCost = totalCost - 1; // Set max below actual cost

        vm.expectRevert(abi.encodeWithSelector(Router.Router_SlippageExceeded.selector, maxCost, totalCost));
        vm.prank(trader);
        router.buyWithPermit(MARKET_ID, TARGET_OUTCOME, SHARE_DELTA, maxCost, 0, 0, bytes32(0), bytes32(0));
    }

    function testSellAndTransferToRecipient() public {
        // First buy shares
        (,, uint256 buyCost) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);
        usdt.mint(trader, buyCost);
        vm.prank(trader);
        usdt.approve(address(router), buyCost);

        vm.prank(trader);
        router.buyWithPermit(MARKET_ID, TARGET_OUTCOME, SHARE_DELTA, buyCost, 0, 0, bytes32(0), bytes32(0));

        // Now sell shares to a different recipient
        address recipient = makeAddr("recipient");
        (,, uint256 netPayout) = market.previewSell(TARGET_OUTCOME, SHARE_DELTA);

        uint256 tokenId = outcomeToken.encodeTokenId(MARKET_ID, TARGET_OUTCOME);
        vm.prank(trader);
        outcomeToken.setApprovalForAll(address(router), true);

        vm.prank(trader);
        uint256 received = router.sellAndTransfer(MARKET_ID, TARGET_OUTCOME, SHARE_DELTA, netPayout, recipient);

        assertEq(received, netPayout, "received should match preview");
        assertEq(usdt.balanceOf(recipient), netPayout, "recipient should receive payout");
        assertEq(outcomeToken.balanceOf(trader, tokenId), 0, "trader shares should be burned");
    }

    function testSellAndTransferSlippageProtection() public {
        // First buy shares
        (,, uint256 buyCost) = market.previewBuy(TARGET_OUTCOME, SHARE_DELTA);
        usdt.mint(trader, buyCost);
        vm.prank(trader);
        usdt.approve(address(router), buyCost);

        vm.prank(trader);
        router.buyWithPermit(MARKET_ID, TARGET_OUTCOME, SHARE_DELTA, buyCost, 0, 0, bytes32(0), bytes32(0));

        // Set min payout above actual
        (,, uint256 netPayout) = market.previewSell(TARGET_OUTCOME, SHARE_DELTA);
        uint256 minPayout = netPayout + 1;

        uint256 tokenId = outcomeToken.encodeTokenId(MARKET_ID, TARGET_OUTCOME);
        vm.prank(trader);
        outcomeToken.setApprovalForAll(address(router), true);

        vm.expectRevert(abi.encodeWithSelector(Router.Router_SlippageExceeded.selector, minPayout, netPayout));
        vm.prank(trader);
        router.sellAndTransfer(MARKET_ID, TARGET_OUTCOME, SHARE_DELTA, minPayout, trader);
    }

    function testPausedRouterBlocksTrades() public {
        router.setPaused(true);

        vm.expectRevert(Router.Router_Paused.selector);
        vm.prank(trader);
        router.buyWithPermit(MARKET_ID, TARGET_OUTCOME, SHARE_DELTA, 1e18, 0, 0, bytes32(0), bytes32(0));

        vm.expectRevert(Router.Router_Paused.selector);
        vm.prank(trader);
        router.sellAndTransfer(MARKET_ID, TARGET_OUTCOME, SHARE_DELTA, 0, trader);
    }

    function testUnregisteredMarketReverts() public {
        uint256 fakeMarketId = 999;

        usdt.mint(trader, 1e18);
        vm.prank(trader);
        usdt.approve(address(router), 1e18);

        vm.expectRevert(abi.encodeWithSelector(Router.Router_MarketNotRegistered.selector, fakeMarketId));
        vm.prank(trader);
        router.buyWithPermit(fakeMarketId, TARGET_OUTCOME, SHARE_DELTA, 1e18, 0, 0, bytes32(0), bytes32(0));
    }

    function testIsMarketRegistered() public {
        assertTrue(router.isMarketRegistered(MARKET_ID), "market should be registered");
        assertFalse(router.isMarketRegistered(999), "fake market should not be registered");
    }

    function testGetMarket() public {
        assertEq(router.getMarket(MARKET_ID), address(market), "should return market address");
        assertEq(router.getMarket(999), address(0), "unregistered market should return zero address");
    }

    function testRegisterMarketOnlyAdmin() public {
        address stranger = makeAddr("stranger");
        address newMarket = makeAddr("newMarket");

        vm.expectRevert();
        vm.prank(stranger);
        router.registerMarket(2, newMarket);

        // Admin can register
        router.registerMarket(2, newMarket);
        assertEq(router.getMarket(2), newMarket, "market should be registered");
    }

    function testSetPausedOnlyPauser() public {
        address stranger = makeAddr("stranger");

        vm.expectRevert();
        vm.prank(stranger);
        router.setPaused(true);

        // Pauser role can pause
        router.setPaused(true);
        assertTrue(router.paused(), "router should be paused");
    }
}
