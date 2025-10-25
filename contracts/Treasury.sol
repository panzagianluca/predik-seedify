// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Treasury
 * @notice Centralized fee collection and distribution system for the prediction market platform.
 * @dev Handles fee splits between protocol, market creators, and oracle providers.
 */
contract Treasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when fees are collected from a market
    event FeesCollected(
        uint256 indexed marketId,
        address indexed market,
        address indexed token,
        uint256 protocolAmount,
        uint256 creatorAmount,
        uint256 oracleAmount,
        uint256 totalAmount
    );

    /// @notice Emitted when protocol fees are withdrawn
    event ProtocolWithdrawal(address indexed token, address indexed to, uint256 amount);

    /// @notice Emitted when creator fees are withdrawn
    event CreatorWithdrawal(
        uint256 indexed marketId, address indexed creator, address indexed token, uint256 amount
    );

    /// @notice Emitted when oracle fees are withdrawn
    event OracleWithdrawal(address indexed oracle, address indexed token, uint256 amount);

    /// @notice Emitted when fee split basis points are updated
    event FeeSplitUpdated(uint256 protocolBps, uint256 creatorBps, uint256 oracleBps);

    /// @notice Emitted when a new market is registered
    event MarketRegistered(uint256 indexed marketId, address indexed market, address indexed creator);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error Treasury_InvalidAddress();
    error Treasury_InvalidBps();
    error Treasury_InvalidAmount();
    error Treasury_InsufficientBalance();
    error Treasury_MarketNotRegistered();
    error Treasury_MarketAlreadyRegistered();
    error Treasury_Unauthorized();

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    /// @notice Role for withdrawing protocol fees
    bytes32 public constant PROTOCOL_ROLE = keccak256("PROTOCOL_ROLE");

    /// @notice Role for registering new markets
    bytes32 public constant MARKET_MANAGER_ROLE = keccak256("MARKET_MANAGER_ROLE");

    /// @notice Basis points for protocol fee split (10000 = 100%)
    uint256 public protocolFeeBps;

    /// @notice Basis points for creator fee split (10000 = 100%)
    uint256 public creatorFeeBps;

    /// @notice Basis points for oracle fee split (10000 = 100%)
    uint256 public oracleFeeBps;

    /// @notice Oracle address that receives oracle fees
    address public oracle;

    /// @notice Market registration tracking
    struct MarketInfo {
        address marketAddress;
        address creator;
        bool registered;
    }

    /// @notice Mapping from market ID to market info
    mapping(uint256 => MarketInfo) public markets;

    /// @notice Protocol fee balances per token
    mapping(address => uint256) public protocolBalances;

    /// @notice Creator fee balances per market ID and token
    mapping(uint256 => mapping(address => uint256)) public creatorBalances;

    /// @notice Oracle fee balances per token
    mapping(address => uint256) public oracleBalances;

    /// @notice Total fees collected per market ID and token (for analytics)
    mapping(uint256 => mapping(address => uint256)) public marketTotalFees;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @notice Initializes the Treasury with fee split configuration
    /// @param protocolBps_ Protocol fee basis points (out of 10000)
    /// @param creatorBps_ Creator fee basis points (out of 10000)
    /// @param oracleBps_ Oracle fee basis points (out of 10000)
    /// @param oracle_ Oracle address
    constructor(uint256 protocolBps_, uint256 creatorBps_, uint256 oracleBps_, address oracle_) {
        if (oracle_ == address(0)) {
            revert Treasury_InvalidAddress();
        }
        if (protocolBps_ + creatorBps_ + oracleBps_ != 10000) {
            revert Treasury_InvalidBps();
        }

        protocolFeeBps = protocolBps_;
        creatorFeeBps = creatorBps_;
        oracleFeeBps = oracleBps_;
        oracle = oracle_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROTOCOL_ROLE, msg.sender);
        _grantRole(MARKET_MANAGER_ROLE, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Market Registration
    // -------------------------------------------------------------------------

    /// @notice Register a new market for fee tracking
    /// @param marketId Market identifier
    /// @param marketAddress Market contract address
    /// @param creator Market creator address
    function registerMarket(uint256 marketId, address marketAddress, address creator)
        external
        onlyRole(MARKET_MANAGER_ROLE)
    {
        if (marketAddress == address(0) || creator == address(0)) {
            revert Treasury_InvalidAddress();
        }
        if (markets[marketId].registered) {
            revert Treasury_MarketAlreadyRegistered();
        }

        markets[marketId] = MarketInfo({marketAddress: marketAddress, creator: creator, registered: true});

        emit MarketRegistered(marketId, marketAddress, creator);
    }

    // -------------------------------------------------------------------------
    // Fee Collection
    // -------------------------------------------------------------------------

    /// @notice Collect fees from a market and split according to configured percentages
    /// @param marketId Market identifier
    /// @param token Token address (collateral)
    /// @param amount Total fee amount to collect
    function collect(uint256 marketId, address token, uint256 amount) external nonReentrant {
        if (!markets[marketId].registered) {
            revert Treasury_MarketNotRegistered();
        }
        if (msg.sender != markets[marketId].marketAddress) {
            revert Treasury_Unauthorized();
        }
        if (amount == 0) {
            revert Treasury_InvalidAmount();
        }

        // Calculate splits
        uint256 protocolAmount = (amount * protocolFeeBps) / 10000;
        uint256 creatorAmount = (amount * creatorFeeBps) / 10000;
        uint256 oracleAmount = (amount * oracleFeeBps) / 10000;

        // Handle rounding: any remainder goes to protocol
        uint256 total = protocolAmount + creatorAmount + oracleAmount;
        if (total < amount) {
            protocolAmount += (amount - total);
        }

        // Transfer fees from market
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update balances
        protocolBalances[token] += protocolAmount;
        creatorBalances[marketId][token] += creatorAmount;
        oracleBalances[token] += oracleAmount;
        marketTotalFees[marketId][token] += amount;

        emit FeesCollected(marketId, msg.sender, token, protocolAmount, creatorAmount, oracleAmount, amount);
    }

    // -------------------------------------------------------------------------
    // Withdrawals
    // -------------------------------------------------------------------------

    /// @notice Withdraw protocol fees
    /// @param token Token address
    /// @param to Recipient address
    /// @param amount Amount to withdraw
    function withdrawProtocol(address token, address to, uint256 amount)
        external
        nonReentrant
        onlyRole(PROTOCOL_ROLE)
    {
        if (to == address(0)) {
            revert Treasury_InvalidAddress();
        }
        if (amount == 0 || amount > protocolBalances[token]) {
            revert Treasury_InsufficientBalance();
        }

        protocolBalances[token] -= amount;
        IERC20(token).safeTransfer(to, amount);

        emit ProtocolWithdrawal(token, to, amount);
    }

    /// @notice Withdraw creator fees for a specific market
    /// @param marketId Market identifier
    /// @param token Token address
    /// @param amount Amount to withdraw
    function withdrawCreator(uint256 marketId, address token, uint256 amount) external nonReentrant {
        if (!markets[marketId].registered) {
            revert Treasury_MarketNotRegistered();
        }
        if (msg.sender != markets[marketId].creator) {
            revert Treasury_Unauthorized();
        }
        if (amount == 0 || amount > creatorBalances[marketId][token]) {
            revert Treasury_InsufficientBalance();
        }

        creatorBalances[marketId][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit CreatorWithdrawal(marketId, msg.sender, token, amount);
    }

    /// @notice Withdraw oracle fees
    /// @param token Token address
    /// @param amount Amount to withdraw
    function withdrawOracle(address token, uint256 amount) external nonReentrant {
        if (msg.sender != oracle) {
            revert Treasury_Unauthorized();
        }
        if (amount == 0 || amount > oracleBalances[token]) {
            revert Treasury_InsufficientBalance();
        }

        oracleBalances[token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit OracleWithdrawal(msg.sender, token, amount);
    }

    // -------------------------------------------------------------------------
    // Admin Functions
    // -------------------------------------------------------------------------

    /// @notice Update fee split percentages
    /// @param protocolBps_ New protocol fee basis points
    /// @param creatorBps_ New creator fee basis points
    /// @param oracleBps_ New oracle fee basis points
    function updateFeeSplit(uint256 protocolBps_, uint256 creatorBps_, uint256 oracleBps_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (protocolBps_ + creatorBps_ + oracleBps_ != 10000) {
            revert Treasury_InvalidBps();
        }

        protocolFeeBps = protocolBps_;
        creatorFeeBps = creatorBps_;
        oracleFeeBps = oracleBps_;

        emit FeeSplitUpdated(protocolBps_, creatorBps_, oracleBps_);
    }

    /// @notice Update oracle address
    /// @param newOracle New oracle address
    function setOracle(address newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newOracle == address(0)) {
            revert Treasury_InvalidAddress();
        }
        oracle = newOracle;
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /// @notice Get market creator address
    /// @param marketId Market identifier
    /// @return creator Market creator address
    function getMarketCreator(uint256 marketId) external view returns (address) {
        if (!markets[marketId].registered) {
            revert Treasury_MarketNotRegistered();
        }
        return markets[marketId].creator;
    }

    /// @notice Check if a market is registered
    /// @param marketId Market identifier
    /// @return registered True if market is registered
    function isMarketRegistered(uint256 marketId) external view returns (bool) {
        return markets[marketId].registered;
    }

    /// @notice Get total fees collected for a market
    /// @param marketId Market identifier
    /// @param token Token address
    /// @return Total fees collected
    function getMarketTotalFees(uint256 marketId, address token) external view returns (uint256) {
        return marketTotalFees[marketId][token];
    }

    /// @notice Get available balance for creator withdrawal
    /// @param marketId Market identifier
    /// @param token Token address
    /// @return Available creator balance
    function getCreatorBalance(uint256 marketId, address token) external view returns (uint256) {
        return creatorBalances[marketId][token];
    }

    /// @notice Get available balance for protocol withdrawal
    /// @param token Token address
    /// @return Available protocol balance
    function getProtocolBalance(address token) external view returns (uint256) {
        return protocolBalances[token];
    }

    /// @notice Get available balance for oracle withdrawal
    /// @param token Token address
    /// @return Available oracle balance
    function getOracleBalance(address token) external view returns (uint256) {
        return oracleBalances[token];
    }
}
