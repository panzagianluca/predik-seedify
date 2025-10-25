// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "./LMSRMarket.sol";
import "./Outcome1155.sol";

/**
 * @title Router
 * @notice Gasless UX helper for batched trading operations. Single call target for Biconomy UserOps.
 * @dev Provides buy/sell flows with optional EIP-2612 permit integration for one-click trades.
 *      All external functions are nonReentrant to prevent cross-function attacks.
 */
contract Router is ReentrancyGuard, AccessControl, IERC1155Receiver {
    using SafeERC20 for IERC20;

    /// @notice Role for addresses allowed to pause the router in emergencies.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Shared outcome token contract for minting/burning shares across markets.
    Outcome1155 public immutable outcomeToken;

    /// @notice Indicates whether the router is paused, blocking all trades.
    bool public paused;

    /// @notice Mapping from market ID to the deployed LMSRMarket contract address.
    mapping(uint256 => address) public markets;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event MarketRegistered(uint256 indexed marketId, address indexed marketAddress);
    event RouterPaused(bool paused);
    event TradeExecuted(
        address indexed trader,
        uint256 indexed marketId,
        uint8 indexed outcome,
        uint256 shares,
        uint256 cost,
        bool isBuy
    );

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error Router_Paused();
    error Router_MarketNotRegistered(uint256 marketId);
    error Router_InvalidMarket(uint256 marketId);
    error Router_SlippageExceeded(uint256 expected, uint256 actual);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _outcomeToken) {
        require(_outcomeToken != address(0), "Router: outcome token required");
        outcomeToken = Outcome1155(_outcomeToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Admin functions
    // -------------------------------------------------------------------------

    /// @notice Register a market so the router can interact with it.
    function registerMarket(uint256 marketId, address marketAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(marketAddress != address(0), "Router: invalid market address");
        markets[marketId] = marketAddress;
        emit MarketRegistered(marketId, marketAddress);
    }

    /// @notice Pause or unpause the router to block trades in emergencies.
    function setPaused(bool _paused) external onlyRole(PAUSER_ROLE) {
        paused = _paused;
        emit RouterPaused(_paused);
    }

    // -------------------------------------------------------------------------
    // Trading functions
    // -------------------------------------------------------------------------

    /// @notice Buy outcome shares with optional EIP-2612 permit for gasless approval.
    /// @param marketId The ID of the market to trade in.
    /// @param outcome The outcome index to buy.
    /// @param shareDelta The number of shares to purchase (in UD60x18 fixed-point).
    /// @param maxCost Maximum collateral the user is willing to spend (slippage protection).
    /// @param permitDeadline EIP-2612 permit deadline (0 to skip permit).
    /// @param permitV EIP-2612 signature v.
    /// @param permitR EIP-2612 signature r.
    /// @param permitS EIP-2612 signature s.
    /// @return totalCost The actual cost paid by the user.
    function buyWithPermit(
        uint256 marketId,
        uint8 outcome,
        uint256 shareDelta,
        uint256 maxCost,
        uint256 permitDeadline,
        uint8 permitV,
        bytes32 permitR,
        bytes32 permitS
    ) external nonReentrant returns (uint256 totalCost) {
        if (paused) revert Router_Paused();

        address marketAddress = markets[marketId];
        if (marketAddress == address(0)) revert Router_MarketNotRegistered(marketId);

        LMSRMarket market = LMSRMarket(marketAddress);
        IERC20 collateral = IERC20(market.collateral());

        // Execute permit if provided
        if (permitDeadline > 0) {
            try IERC20Permit(address(collateral)).permit(
                msg.sender, address(this), maxCost, permitDeadline, permitV, permitR, permitS
            ) {} catch {
                // Permit may fail if already approved or signature invalid; continue anyway
            }
        }

        // Preview the cost
        (,, uint256 previewTotal) = market.previewBuy(outcome, shareDelta);
        if (previewTotal > maxCost) {
            revert Router_SlippageExceeded(maxCost, previewTotal);
        }

        // Transfer collateral from user to this contract
        collateral.safeTransferFrom(msg.sender, address(this), previewTotal);

        // Approve market to spend collateral
        collateral.forceApprove(marketAddress, previewTotal);

        // Execute the buy on behalf of the user
        totalCost = market.buy(outcome, shareDelta);

        // Transfer minted shares to the user
        uint256 tokenId = outcomeToken.encodeTokenId(marketId, outcome);
        outcomeToken.safeTransferFrom(address(this), msg.sender, tokenId, shareDelta, "");

        emit TradeExecuted(msg.sender, marketId, outcome, shareDelta, totalCost, true);

        return totalCost;
    }

    /// @notice Sell outcome shares and transfer proceeds to a specified recipient.
    /// @param marketId The ID of the market to trade in.
    /// @param outcome The outcome index to sell.
    /// @param shareDelta The number of shares to sell (in UD60x18 fixed-point).
    /// @param minPayout Minimum collateral the user expects to receive (slippage protection).
    /// @param recipient Address to receive the payout (use msg.sender to receive directly).
    /// @return netPayout The actual payout sent to the recipient.
    function sellAndTransfer(uint256 marketId, uint8 outcome, uint256 shareDelta, uint256 minPayout, address recipient)
        external
        nonReentrant
        returns (uint256 netPayout)
    {
        if (paused) revert Router_Paused();

        address marketAddress = markets[marketId];
        if (marketAddress == address(0)) revert Router_MarketNotRegistered(marketId);

        LMSRMarket market = LMSRMarket(marketAddress);

        // Preview the payout
        (,, uint256 previewNet) = market.previewSell(outcome, shareDelta);
        if (previewNet < minPayout) {
            revert Router_SlippageExceeded(minPayout, previewNet);
        }

        // Transfer shares from user to this contract
        outcomeToken.safeTransferFrom(
            msg.sender, address(this), outcomeToken.encodeTokenId(marketId, outcome), shareDelta, ""
        );

        // Execute the sell (market will burn shares from this contract)
        netPayout = market.sell(outcome, shareDelta);

        // Transfer payout to recipient
        IERC20(market.collateral()).safeTransfer(recipient, netPayout);

        emit TradeExecuted(msg.sender, marketId, outcome, shareDelta, netPayout, false);

        return netPayout;
    }

    // -------------------------------------------------------------------------
    // REMOVED: multicall() function
    // -------------------------------------------------------------------------
    // The multicall function was removed due to delegatecall security vulnerability.
    // Delegatecall executes arbitrary code in Router's context, allowing potential
    // admin takeover attacks. Users should batch transactions via frontend or use
    // individual calls. We may add a safer version in the future with whitelisted
    // function selectors if batching is needed.
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

    /// @notice Check if a market is registered with the router.
    function isMarketRegistered(uint256 marketId) external view returns (bool) {
        return markets[marketId] != address(0);
    }

    /// @notice Get the market address for a given market ID.
    function getMarket(uint256 marketId) external view returns (address) {
        return markets[marketId];
    }

    // -------------------------------------------------------------------------
    // ERC1155 Receiver Implementation
    // -------------------------------------------------------------------------

    /// @notice Handle receipt of a single ERC1155 token.
    function onERC1155Received(address, address, uint256, uint256, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        return this.onERC1155Received.selector;
    }

    /// @notice Handle receipt of multiple ERC1155 tokens.
    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        return this.onERC1155BatchReceived.selector;
    }

    ///  @notice ERC165 interface support.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC1155Receiver).interfaceId || AccessControl.supportsInterface(interfaceId);
    }
}

/**
 * @notice Minimal EIP-2612 interface for permit functionality.
 */
interface IERC20Permit {
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external;
}
