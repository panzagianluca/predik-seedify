// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Oracle
 * @notice Bridge between LMSRMarket contracts and DelphAI oracle for AI-powered market resolution.
 * @dev Supports dispute mechanism for low-confidence resolutions and manages the resolution lifecycle.
 */
contract Oracle is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice DelphAI oracle interface
    IDelphAI public immutable delphAI;

    /// @notice Collateral token used for dispute bonds
    IERC20 public immutable collateral;

    /// @notice Duration of dispute window in seconds (24 hours)
    uint64 public constant DISPUTE_WINDOW = 24 hours;

    /// @notice Minimum confidence threshold to allow disputes (80%)
    uint8 public constant MIN_CONFIDENCE_THRESHOLD = 80;

    /// @notice Dispute bond as basis points of market volume (100 bps = 1%)
    uint256 public disputeBondBps;

    /// @notice Treasury address for slashed bonds
    address public treasury;

    /// @notice Resolution states
    enum ResolutionStatus {
        Pending, // Not yet requested
        Proposed, // AI resolution fetched, dispute window active
        Disputed, // Under dispute
        Finalized // Final outcome determined

    }

    /// @notice Resolution data for each market
    struct Resolution {
        uint256 delphAIMarketId; // DelphAI market identifier
        uint8 proposedOutcome; // AI-proposed winning outcome
        uint8 confidence; // AI confidence level (0-100)
        uint64 proposedAt; // Timestamp when resolution was proposed
        ResolutionStatus status; // Current resolution status
        uint256 disputeBond; // Amount staked by disputer
        address challenger; // Address that disputed
        uint8 disputedOutcome; // Alternative outcome proposed
        bool invalid; // Whether market should be marked invalid
    }

    /// @notice Market address to resolution mapping
    mapping(address => Resolution) public resolutions;

    /// @notice Market address to DelphAI market ID mapping
    mapping(address => uint256) public marketToDelphAI;

    /// @notice DelphAI market ID to our market address
    mapping(uint256 => address) public delphAIToMarket;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event MarketRegistered(address indexed market, uint256 indexed delphAIMarketId);
    event ResolutionProposed(
        address indexed market, uint256 indexed delphAIMarketId, uint8 outcome, uint8 confidence, string resolutionData
    );
    event ResolutionDisputed(address indexed market, address indexed challenger, uint8 altOutcome, uint256 bond);
    event ResolutionFinalized(address indexed market, uint8 finalOutcome, bool invalid);
    event DisputeBondSlashed(address indexed market, address indexed loser, uint256 amount);
    event DisputeBondReturned(address indexed market, address indexed winner, uint256 amount);
    event DisputeBondBpsUpdated(uint256 previousBps, uint256 newBps);
    event TreasuryUpdated(address indexed previousTreasury, address indexed newTreasury);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error Oracle_MarketAlreadyRegistered(address market);
    error Oracle_MarketNotRegistered(address market);
    error Oracle_DelphAIMarketNotResolved(uint256 delphAIMarketId);
    error Oracle_ResolutionAlreadyProposed(address market);
    error Oracle_ResolutionNotProposed(address market);
    error Oracle_DisputeWindowClosed(address market);
    error Oracle_DisputeNotAllowed(uint8 confidence);
    error Oracle_InsufficientDisputeBond(uint256 required, uint256 provided);
    error Oracle_DisputeWindowActive(address market, uint64 endsAt);
    error Oracle_AlreadyFinalized(address market);
    error Oracle_InvalidOutcome(uint8 outcome);
    error Oracle_InvalidAddress();
    error Oracle_InvalidBps(uint256 bps);
    error Oracle_DelphAIMarketCancelled(uint256 delphAIMarketId);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address delphAI_, address collateral_, address treasury_, uint256 disputeBondBps_) {
        if (delphAI_ == address(0) || collateral_ == address(0) || treasury_ == address(0)) {
            revert Oracle_InvalidAddress();
        }
        if (disputeBondBps_ > 10000) {
            revert Oracle_InvalidBps(disputeBondBps_);
        }

        delphAI = IDelphAI(delphAI_);
        collateral = IERC20(collateral_);
        treasury = treasury_;
        disputeBondBps = disputeBondBps_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Market Registration
    // -------------------------------------------------------------------------

    /// @notice Register a market with its corresponding DelphAI market ID
    /// @param market Address of the LMSRMarket contract
    /// @param delphAIMarketId DelphAI market identifier
    function registerMarket(address market, uint256 delphAIMarketId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (marketToDelphAI[market] != 0) {
            revert Oracle_MarketAlreadyRegistered(market);
        }

        marketToDelphAI[market] = delphAIMarketId;
        delphAIToMarket[delphAIMarketId] = market;

        resolutions[market].delphAIMarketId = delphAIMarketId;
        resolutions[market].status = ResolutionStatus.Pending;

        emit MarketRegistered(market, delphAIMarketId);
    }

    // -------------------------------------------------------------------------
    // Resolution Flow
    // -------------------------------------------------------------------------

    /// @notice Request resolution for a market by fetching DelphAI outcome
    /// @param market Address of the market to resolve
    /// @dev Anyone can call this after the market's resolution timestamp
    function requestResolve(address market) external nonReentrant {
        uint256 delphAIMarketId = marketToDelphAI[market];
        if (delphAIMarketId == 0) {
            revert Oracle_MarketNotRegistered(market);
        }

        Resolution storage resolution = resolutions[market];
        if (resolution.status != ResolutionStatus.Pending) {
            revert Oracle_ResolutionAlreadyProposed(market);
        }

        // Fetch market data from DelphAI
        Market memory delphMarket = delphAI.getMarket(delphAIMarketId);

        // Check if DelphAI has resolved the market
        if (delphMarket.status == MarketStatus.Cancelled) {
            revert Oracle_DelphAIMarketCancelled(delphAIMarketId);
        }
        if (delphMarket.status != MarketStatus.Resolved) {
            revert Oracle_DelphAIMarketNotResolved(delphAIMarketId);
        }

        // Validate outcome index fits in uint8
        if (delphMarket.outcomeIndex > type(uint8).max) {
            revert Oracle_InvalidOutcome(uint8(delphMarket.outcomeIndex));
        }

        // Validate outcome is within the market's valid range
        uint8 marketOutcomeCount = ILMSRMarket(market).outcomeCount();
        if (delphMarket.outcomeIndex >= marketOutcomeCount) {
            revert Oracle_InvalidOutcome(uint8(delphMarket.outcomeIndex));
        }

        // Store resolution data
        resolution.proposedOutcome = uint8(delphMarket.outcomeIndex);
        resolution.confidence = delphMarket.resolutionConfidence;
        resolution.proposedAt = uint64(block.timestamp);
        resolution.status = ResolutionStatus.Proposed;

        emit ResolutionProposed(
            market, delphAIMarketId, resolution.proposedOutcome, resolution.confidence, delphMarket.resolutionData
        );
    }

    /// @notice Dispute a resolution if confidence is below threshold
    /// @param market Address of the market to dispute
    /// @param altOutcome Alternative outcome being proposed
    function dispute(address market, uint8 altOutcome) external nonReentrant {
        Resolution storage resolution = resolutions[market];

        if (resolution.status != ResolutionStatus.Proposed) {
            revert Oracle_ResolutionNotProposed(market);
        }

        uint64 disputeDeadline = resolution.proposedAt + DISPUTE_WINDOW;
        if (block.timestamp > disputeDeadline) {
            revert Oracle_DisputeWindowClosed(market);
        }

        if (resolution.confidence >= MIN_CONFIDENCE_THRESHOLD) {
            revert Oracle_DisputeNotAllowed(resolution.confidence);
        }

        // Validate alternative outcome is within range
        uint8 marketOutcomeCount = ILMSRMarket(market).outcomeCount();
        if (altOutcome >= marketOutcomeCount) {
            revert Oracle_InvalidOutcome(altOutcome);
        }

        // Calculate required dispute bond from market
        uint256 requiredBond = _calculateDisputeBond(market);

        // Transfer USDT bond from disputer
        collateral.safeTransferFrom(msg.sender, address(this), requiredBond);

        // Store dispute data
        resolution.status = ResolutionStatus.Disputed;
        resolution.challenger = msg.sender;
        resolution.disputedOutcome = altOutcome;
        resolution.disputeBond = requiredBond;

        emit ResolutionDisputed(market, msg.sender, altOutcome, requiredBond);
    }

    /// @notice Finalize resolution after dispute window expires
    /// @param market Address of the market to finalize
    /// @dev Can be called by anyone after dispute window; calls market.finalize()
    function finalize(address market) external nonReentrant {
        Resolution storage resolution = resolutions[market];

        if (resolution.status == ResolutionStatus.Pending) {
            revert Oracle_ResolutionNotProposed(market);
        }
        if (resolution.status == ResolutionStatus.Finalized) {
            revert Oracle_AlreadyFinalized(market);
        }

        uint64 disputeDeadline = resolution.proposedAt + DISPUTE_WINDOW;

        // If disputed, admin must manually resolve
        if (resolution.status == ResolutionStatus.Disputed) {
            // For hackathon: disputed markets require manual admin resolution
            // In production: implement voting/stake-weighted resolution
            revert Oracle_DisputeWindowActive(market, disputeDeadline);
        }

        // Ensure dispute window has passed
        if (block.timestamp <= disputeDeadline) {
            revert Oracle_DisputeWindowActive(market, disputeDeadline);
        }

        // Mark as finalized
        resolution.status = ResolutionStatus.Finalized;

        // Call the market's finalize function
        ILMSRMarket(market).finalize(resolution.proposedOutcome, resolution.invalid);

        emit ResolutionFinalized(market, resolution.proposedOutcome, resolution.invalid);
    }

    /// @notice Admin function to resolve disputed markets
    /// @param market Address of the disputed market
    /// @param finalOutcome The final outcome determined by admin/governance
    /// @param invalid Whether the market should be marked invalid
    function resolveDispute(address market, uint8 finalOutcome, bool invalid)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        Resolution storage resolution = resolutions[market];

        if (resolution.status != ResolutionStatus.Disputed) {
            revert Oracle_ResolutionNotProposed(market);
        }

        // Validate final outcome is within range (unless market is invalid)
        if (!invalid) {
            uint8 marketOutcomeCount = ILMSRMarket(market).outcomeCount();
            if (finalOutcome >= marketOutcomeCount) {
                revert Oracle_InvalidOutcome(finalOutcome);
            }
        }

        // Determine who was correct and handle bonds
        bool aiWasCorrect = (finalOutcome == resolution.proposedOutcome);

        if (aiWasCorrect) {
            // Slash disputer's bond to treasury (USDT)
            // Transfer directly to treasury - Treasury will track this separately
            collateral.safeTransfer(treasury, resolution.disputeBond);
            emit DisputeBondSlashed(market, resolution.challenger, resolution.disputeBond);
        } else {
            // Return bond to challenger (USDT)
            collateral.safeTransfer(resolution.challenger, resolution.disputeBond);
            emit DisputeBondReturned(market, resolution.challenger, resolution.disputeBond);
        }

        // Update resolution
        resolution.proposedOutcome = finalOutcome;
        resolution.invalid = invalid;
        resolution.status = ResolutionStatus.Finalized;

        // Call the market's finalize function
        ILMSRMarket(market).finalize(finalOutcome, invalid);

        emit ResolutionFinalized(market, finalOutcome, invalid);
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /// @notice Get resolution data for a market
    function getResolution(address market) external view returns (Resolution memory) {
        return resolutions[market];
    }

    /// @notice Check if a market can be disputed
    function canDispute(address market) external view returns (bool) {
        Resolution memory resolution = resolutions[market];

        if (resolution.status != ResolutionStatus.Proposed) {
            return false;
        }

        uint64 disputeDeadline = resolution.proposedAt + DISPUTE_WINDOW;
        if (block.timestamp > disputeDeadline) {
            return false;
        }

        return resolution.confidence < MIN_CONFIDENCE_THRESHOLD;
    }

    /// @notice Calculate required dispute bond for a market
    function calculateDisputeBond(address market) external view returns (uint256) {
        return _calculateDisputeBond(market);
    }

    // -------------------------------------------------------------------------
    // Admin Functions
    // -------------------------------------------------------------------------

    /// @notice Update dispute bond basis points
    function setDisputeBondBps(uint256 newBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newBps > 10000) {
            revert Oracle_InvalidBps(newBps);
        }

        uint256 previousBps = disputeBondBps;
        disputeBondBps = newBps;

        emit DisputeBondBpsUpdated(previousBps, newBps);
    }

    /// @notice Update treasury address
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) {
            revert Oracle_InvalidAddress();
        }

        address previousTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(previousTreasury, newTreasury);
    }

    // -------------------------------------------------------------------------
    // Internal Functions
    // -------------------------------------------------------------------------

    /// @notice Calculate dispute bond based on market volume
    function _calculateDisputeBond(address market) internal view returns (uint256) {
        // Get market volume from the market contract
        uint256 volume = ILMSRMarket(market).getTotalVolume();

        // Calculate bond as percentage of volume
        return (volume * disputeBondBps) / 10000;
    }
}

// -------------------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------------------

/// @notice DelphAI market states
enum MarketStatus {
    Open,
    Resolved,
    Cancelled
}

/// @notice DelphAI market structure
struct Market {
    uint256 id;
    address creator;
    string question;
    string description;
    string[] possibleOutcomes;
    uint256 createdAt;
    uint256 resolutionTimestamp;
    MarketStatus status;
    uint256 outcomeIndex;
    string resolutionData;
    string[] resolutionSources;
    uint8 resolutionConfidence;
    bytes proofData;
    uint256 resolvedAt;
    address resolvedBy;
}

/// @notice DelphAI oracle interface
interface IDelphAI {
    function createMarket(
        string memory question,
        string memory description,
        string[] memory possibleOutcomes,
        uint256 resolutionTimestamp
    ) external payable returns (uint256);

    function getMarket(uint256 marketId) external view returns (Market memory);
    function marketCreationFee() external view returns (uint256);
}

/// @notice LMSRMarket interface for finalization
interface ILMSRMarket {
    function finalize(uint8 winningOutcome, bool invalid) external;
    function getTotalVolume() external view returns (uint256);
    function outcomeCount() external view returns (uint8);
}

/// @notice Treasury interface for bond collection
interface ITreasury {
    function collect(uint256 marketId, address token, uint256 amount) external;
}
