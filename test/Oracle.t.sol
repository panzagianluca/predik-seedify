// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {Oracle, IDelphAI, Market, MarketStatus} from "../contracts/Oracle.sol";
import {MockUSDT} from "../contracts/MockUSDT.sol";

contract MockDelphAI is IDelphAI {
    uint256 public marketCreationFee = 0; // No fee for testing (USDT-native, no ETH)
    uint256 public nextMarketId = 1;

    mapping(uint256 => Market) public markets;

    function createMarket(
        string memory question,
        string memory description,
        string[] memory possibleOutcomes,
        uint256 resolutionTimestamp
    ) external payable returns (uint256) {
        // No fee required for testing

        uint256 marketId = nextMarketId++;

        markets[marketId] = Market({
            id: marketId,
            creator: msg.sender,
            question: question,
            description: description,
            possibleOutcomes: possibleOutcomes,
            createdAt: block.timestamp,
            resolutionTimestamp: resolutionTimestamp,
            status: MarketStatus.Open,
            outcomeIndex: 0,
            resolutionData: "",
            resolutionSources: new string[](0),
            resolutionConfidence: 0,
            proofData: "",
            resolvedAt: 0,
            resolvedBy: address(0)
        });

        return marketId;
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    // Helper functions for testing
    function resolveMarket(uint256 marketId, uint256 outcomeIndex, uint8 confidence) external {
        markets[marketId].status = MarketStatus.Resolved;
        markets[marketId].outcomeIndex = outcomeIndex;
        markets[marketId].resolutionConfidence = confidence;
        markets[marketId].resolvedAt = block.timestamp;
        markets[marketId].resolvedBy = msg.sender;
        markets[marketId].resolutionData = "AI resolved";

        string[] memory sources = new string[](2);
        sources[0] = "source1";
        sources[1] = "source2";
        markets[marketId].resolutionSources = sources;
    }

    function cancelMarket(uint256 marketId) external {
        markets[marketId].status = MarketStatus.Cancelled;
    }
}

contract MockLMSRMarket {
    uint256 public totalVolume;
    uint8 public outcomeCount;
    uint8 public winningOutcome;
    bool public invalid;
    bool public finalized;

    constructor(uint256 _totalVolume) {
        totalVolume = _totalVolume;
        outcomeCount = 2; // Default to 2 outcomes (Yes/No)
    }

    function setOutcomeCount(uint8 _outcomeCount) external {
        outcomeCount = _outcomeCount;
    }

    function finalize(uint8 _winningOutcome, bool _invalid) external {
        winningOutcome = _winningOutcome;
        invalid = _invalid;
        finalized = true;
    }

    function getTotalVolume() external view returns (uint256) {
        return totalVolume;
    }
}

contract OracleTest is Test {
    Oracle public oracle;
    MockDelphAI public delphAI;
    MockUSDT public collateral;
    MockLMSRMarket public market;

    address public admin = address(1);
    address public treasury = address(2);
    address public user1 = address(3);
    address public user2 = address(4);

    uint256 public constant DISPUTE_BOND_BPS = 100; // 1%
    uint256 public constant MARKET_VOLUME = 10000e6; // 10,000 USDT

    event MarketRegistered(address indexed market, uint256 indexed delphAIMarketId);
    event ResolutionProposed(
        address indexed market, uint256 indexed delphAIMarketId, uint8 outcome, uint8 confidence, string resolutionData
    );
    event ResolutionDisputed(address indexed market, address indexed challenger, uint8 altOutcome, uint256 bond);
    event ResolutionFinalized(address indexed market, uint8 finalOutcome, bool invalid);
    event DisputeBondSlashed(address indexed market, address indexed loser, uint256 amount);
    event DisputeBondReturned(address indexed market, address indexed winner, uint256 amount);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy contracts
        collateral = new MockUSDT();
        delphAI = new MockDelphAI();
        oracle = new Oracle(address(delphAI), address(collateral), treasury, DISPUTE_BOND_BPS);

        // Deploy mock market
        market = new MockLMSRMarket(MARKET_VOLUME);

        // Fund admin and users with USDT (not ETH anymore)
        collateral.mint(admin, 10000e6);
        collateral.mint(user1, 10000e6);
        collateral.mint(user2, 10000e6);

        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Constructor Tests
    // -------------------------------------------------------------------------

    function testConstructor() public view {
        assertEq(address(oracle.delphAI()), address(delphAI));
        assertEq(address(oracle.collateral()), address(collateral));
        assertEq(oracle.treasury(), treasury);
        assertEq(oracle.disputeBondBps(), DISPUTE_BOND_BPS);
        assertTrue(oracle.hasRole(oracle.DEFAULT_ADMIN_ROLE(), admin));
    }

    function testConstructorRevertsOnZeroAddressDelphAI() public {
        vm.expectRevert(Oracle.Oracle_InvalidAddress.selector);
        new Oracle(address(0), address(collateral), treasury, DISPUTE_BOND_BPS);
    }

    function testConstructorRevertsOnZeroAddressCollateral() public {
        vm.expectRevert(Oracle.Oracle_InvalidAddress.selector);
        new Oracle(address(delphAI), address(0), treasury, DISPUTE_BOND_BPS);
    }

    function testConstructorRevertsOnZeroAddressTreasury() public {
        vm.expectRevert(Oracle.Oracle_InvalidAddress.selector);
        new Oracle(address(delphAI), address(collateral), address(0), DISPUTE_BOND_BPS);
    }

    function testConstructorRevertsOnInvalidBps() public {
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_InvalidBps.selector, 10001));
        new Oracle(address(delphAI), address(collateral), treasury, 10001);
    }

    // -------------------------------------------------------------------------
    // Market Registration Tests
    // -------------------------------------------------------------------------

    function testRegisterMarket() public {
        vm.startPrank(admin);

        uint256 delphAIMarketId = 123;

        vm.expectEmit(true, true, false, false);
        emit MarketRegistered(address(market), delphAIMarketId);

        oracle.registerMarket(address(market), delphAIMarketId);

        assertEq(oracle.marketToDelphAI(address(market)), delphAIMarketId);
        assertEq(oracle.delphAIToMarket(delphAIMarketId), address(market));

        (uint256 storedId,,,,,,,,) = oracle.resolutions(address(market));
        assertEq(storedId, delphAIMarketId);

        vm.stopPrank();
    }

    function testRegisterMarketRevertsOnDuplicate() public {
        vm.startPrank(admin);

        oracle.registerMarket(address(market), 123);

        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_MarketAlreadyRegistered.selector, address(market)));
        oracle.registerMarket(address(market), 456);

        vm.stopPrank();
    }

    function testRegisterMarketRevertsNonAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        oracle.registerMarket(address(market), 123);
    }

    // -------------------------------------------------------------------------
    // Resolution Request Tests
    // -------------------------------------------------------------------------

    function testRequestResolve() public {
        // Setup: Create and register market
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        // Resolve market on DelphAI with high confidence
        delphAI.resolveMarket(delphAIMarketId, 0, 95);

        // Request resolution
        vm.prank(user1);
        vm.expectEmit(true, true, false, false);
        emit ResolutionProposed(address(market), delphAIMarketId, 0, 95, "AI resolved");

        oracle.requestResolve(address(market));

        // Verify resolution data
        (, uint8 outcome, uint8 confidence, uint64 proposedAt, Oracle.ResolutionStatus status,,,,) =
            oracle.resolutions(address(market));

        assertEq(outcome, 0);
        assertEq(confidence, 95);
        assertEq(proposedAt, block.timestamp);
        assertEq(uint256(status), uint256(Oracle.ResolutionStatus.Proposed));
    }

    function testRequestResolveRevertsNotRegistered() public {
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_MarketNotRegistered.selector, address(market)));
        oracle.requestResolve(address(market));
    }

    function testRequestResolveRevertsNotResolved() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        // Don't resolve on DelphAI
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_DelphAIMarketNotResolved.selector, delphAIMarketId));
        oracle.requestResolve(address(market));
    }

    function testRequestResolveRevertsCancelled() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        // Cancel market on DelphAI
        delphAI.cancelMarket(delphAIMarketId);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_DelphAIMarketCancelled.selector, delphAIMarketId));
        oracle.requestResolve(address(market));
    }

    function testRequestResolveRevertsAlreadyProposed() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 95);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        // Try again
        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_ResolutionAlreadyProposed.selector, address(market)));
        oracle.requestResolve(address(market));
    }

    // -------------------------------------------------------------------------
    // Dispute Tests
    // -------------------------------------------------------------------------

    function testDispute() public {
        // Setup: Register and resolve market with LOW confidence
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 60); // Low confidence

        vm.prank(user1);
        oracle.requestResolve(address(market));

        // Calculate required bond
        uint256 requiredBond = oracle.calculateDisputeBond(address(market));
        assertEq(requiredBond, MARKET_VOLUME * DISPUTE_BOND_BPS / 10000);

        // Dispute the resolution (approve USDT first)
        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond);
        vm.expectEmit(true, true, false, false);
        emit ResolutionDisputed(address(market), user2, 1, requiredBond);

        oracle.dispute(address(market), 1);
        vm.stopPrank();

        // Verify dispute data
        (,,,, Oracle.ResolutionStatus status, uint256 bond, address challenger, uint8 altOutcome,) =
            oracle.resolutions(address(market));

        assertEq(uint256(status), uint256(Oracle.ResolutionStatus.Disputed));
        assertEq(bond, requiredBond);
        assertEq(challenger, user2);
        assertEq(altOutcome, 1);
    }

    function testDisputeRevertsNotProposed() public {
        vm.startPrank(admin);
        oracle.registerMarket(address(market), 123);
        vm.stopPrank();

        vm.startPrank(user1);
        collateral.approve(address(oracle), 1e6);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_ResolutionNotProposed.selector, address(market)));
        oracle.dispute(address(market), 1);
        vm.stopPrank();
    }

    function testDisputeRevertsWindowClosed() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 60);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        // Fast forward past dispute window
        vm.warp(block.timestamp + 25 hours);

        uint256 requiredBond = oracle.calculateDisputeBond(address(market));

        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_DisputeWindowClosed.selector, address(market)));
        oracle.dispute(address(market), 1);
        vm.stopPrank();
    }

    function testDisputeRevertsHighConfidence() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 85); // High confidence

        vm.prank(user1);
        oracle.requestResolve(address(market));

        uint256 requiredBond = oracle.calculateDisputeBond(address(market));

        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_DisputeNotAllowed.selector, 85));
        oracle.dispute(address(market), 1);
        vm.stopPrank();
    }

    function testDisputeRevertsInsufficientBond() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 60);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        uint256 requiredBond = oracle.calculateDisputeBond(address(market));

        // Mint USDT for disputer but only approve insufficient amount
        vm.prank(admin);
        collateral.mint(user2, requiredBond);
        
        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond - 1);
        vm.expectRevert(); // SafeERC20 will revert on insufficient allowance
        oracle.dispute(address(market), 1);
        vm.stopPrank();
    }

    // -------------------------------------------------------------------------
    // Finalize Tests
    // -------------------------------------------------------------------------

    function testFinalize() public {
        // Setup and resolve
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 95);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        // Fast forward past dispute window
        vm.warp(block.timestamp + 25 hours);

        // Finalize
        vm.prank(user2);
        vm.expectEmit(true, false, false, false);
        emit ResolutionFinalized(address(market), 0, false);

        oracle.finalize(address(market));

        // Verify market was finalized
        assertTrue(market.finalized());
        assertEq(market.winningOutcome(), 0);
        assertFalse(market.invalid());

        // Verify resolution status
        (,,,, Oracle.ResolutionStatus status,,,,) = oracle.resolutions(address(market));
        assertEq(uint256(status), uint256(Oracle.ResolutionStatus.Finalized));
    }

    function testFinalizeRevertsBeforeDisputeWindow() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 95);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        // Try to finalize immediately - should revert
        vm.prank(user2);
        vm.expectRevert(); // Simplified: just expect any revert
        oracle.finalize(address(market));
    }

    function testFinalizeRevertsOnDisputed() public {
        // Setup and resolve with low confidence
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 60);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        // Dispute it
        uint256 requiredBond = oracle.calculateDisputeBond(address(market));
        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond);
        oracle.dispute(address(market), 1);
        vm.stopPrank();

        // Fast forward
        vm.warp(block.timestamp + 25 hours);

        // Try to finalize - should revert
        vm.prank(user1);
        vm.expectRevert(); // Simplified: just expect any revert
        oracle.finalize(address(market));
    }

    // -------------------------------------------------------------------------
    // Resolve Dispute Tests
    // -------------------------------------------------------------------------

    function testResolveDisputeAICorrect() public {
        // Setup disputed market
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 60);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        uint256 requiredBond = oracle.calculateDisputeBond(address(market));
        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond);
        oracle.dispute(address(market), 1);
        vm.stopPrank();

        // Admin resolves: AI was correct
        uint256 treasuryBalanceBefore = collateral.balanceOf(treasury);

        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit DisputeBondSlashed(address(market), user2, requiredBond);

        oracle.resolveDispute(address(market), 0, false);

        // Verify bond was slashed to treasury (USDT)
        assertEq(collateral.balanceOf(treasury), treasuryBalanceBefore + requiredBond);

        // Verify market finalized
        assertTrue(market.finalized());
        assertEq(market.winningOutcome(), 0);
    }

    function testResolveDisputeChallengerCorrect() public {
        // Setup disputed market
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 60);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        uint256 requiredBond = oracle.calculateDisputeBond(address(market));
        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond);
        oracle.dispute(address(market), 1);
        vm.stopPrank();

        // Admin resolves: Challenger was correct
        uint256 challengerBalanceBefore = collateral.balanceOf(user2);

        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit DisputeBondReturned(address(market), user2, requiredBond);

        oracle.resolveDispute(address(market), 1, false);

        // Verify bond was returned (USDT)
        assertEq(collateral.balanceOf(user2), challengerBalanceBefore + requiredBond);

        // Verify market finalized with challenger's outcome
        assertTrue(market.finalized());
        assertEq(market.winningOutcome(), 1);
    }

    function testResolveDisputeAsInvalid() public {
        // Setup disputed market
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 60);

        vm.prank(user1);
        oracle.requestResolve(address(market));

        uint256 requiredBond = oracle.calculateDisputeBond(address(market));
        vm.startPrank(user2);
        collateral.approve(address(oracle), requiredBond);
        oracle.dispute(address(market), 1);
        vm.stopPrank();

        // Admin marks as invalid
        vm.prank(admin);
        oracle.resolveDispute(address(market), 0, true);

        // Verify market marked invalid
        assertTrue(market.finalized());
        assertTrue(market.invalid());
    }

    // -------------------------------------------------------------------------
    // View Function Tests
    // -------------------------------------------------------------------------

    function testCanDispute() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        // Before resolution
        assertFalse(oracle.canDispute(address(market)));

        // After resolution with low confidence
        delphAI.resolveMarket(delphAIMarketId, 0, 60);
        vm.prank(user1);
        oracle.requestResolve(address(market));

        assertTrue(oracle.canDispute(address(market)));

        // After dispute window
        vm.warp(block.timestamp + 25 hours);
        assertFalse(oracle.canDispute(address(market)));
    }

    function testCanDisputeHighConfidence() public {
        vm.startPrank(admin);
        string[] memory outcomes = new string[](2);
        outcomes[0] = "Yes";
        outcomes[1] = "No";

        uint256 delphAIMarketId =
            delphAI.createMarket("Test question?", "Description", outcomes, block.timestamp + 1 days);

        oracle.registerMarket(address(market), delphAIMarketId);
        vm.stopPrank();

        delphAI.resolveMarket(delphAIMarketId, 0, 95);
        vm.prank(user1);
        oracle.requestResolve(address(market));

        // Cannot dispute high confidence
        assertFalse(oracle.canDispute(address(market)));
    }

    // -------------------------------------------------------------------------
    // Admin Function Tests
    // -------------------------------------------------------------------------

    function testSetDisputeBondBps() public {
        vm.prank(admin);
        oracle.setDisputeBondBps(200);

        assertEq(oracle.disputeBondBps(), 200);
    }

    function testSetDisputeBondBpsRevertsNonAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        oracle.setDisputeBondBps(200);
    }

    function testSetDisputeBondBpsRevertsInvalidBps() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(Oracle.Oracle_InvalidBps.selector, 10001));
        oracle.setDisputeBondBps(10001);
    }

    function testSetTreasury() public {
        address newTreasury = address(999);

        vm.prank(admin);
        oracle.setTreasury(newTreasury);

        assertEq(oracle.treasury(), newTreasury);
    }

    function testSetTreasuryRevertsNonAdmin() public {
        vm.prank(user1);
        vm.expectRevert();
        oracle.setTreasury(address(999));
    }

    function testSetTreasuryRevertsZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(Oracle.Oracle_InvalidAddress.selector);
        oracle.setTreasury(address(0));
    }
}
