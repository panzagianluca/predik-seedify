// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {LMSRMarket} from "./LMSRMarket.sol";
import {Treasury} from "./Treasury.sol";
import {Oracle} from "./Oracle.sol";
import {Router} from "./Router.sol";
import {Outcome1155} from "./Outcome1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MarketFactory
 * @notice Factory contract for creating LMSR prediction markets.
 * @dev Deploys new market instances, registers with Treasury and Oracle, tracks all markets.
 */
contract MarketFactory is AccessControl {
    using SafeERC20 for IERC20;

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    /// @notice Parameters for creating a new market
    struct CreateMarketParams {
        string title;
        string description;
        string category;
        string imageUrl;
        string[] outcomes;
        uint64 tradingEndsAt;
        uint256 liquidityParameter;
        uint16 protocolFeeBps;
        uint16 creatorFeeBps;
        uint16 oracleFeeBps;
        uint256 initialLiquidity;
        uint256 delphAIMarketId;
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a new market is created
    event MarketCreated(
        uint256 indexed marketId,
        address indexed marketAddress,
        address indexed creator,
        string title,
        string description,
        string category,
        string imageUrl,
        string[] outcomes,
        uint64 tradingEndsAt,
        uint256 liquidityParameter
    );

    /// @notice Emitted when global parameters are updated
    event DefaultLiquidityParameterUpdated(uint256 newValue);
    event DefaultFeeUpdated(uint16 protocolBps, uint16 creatorBps, uint16 oracleBps);
    event CollateralUpdated(address newCollateral);
    event Outcome1155Updated(address newOutcome1155);
    event TreasuryUpdated(address newTreasury);
    event OracleUpdated(address newOracle);
    event RouterUpdated(address newRouter);

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error MarketFactory_InvalidAddress();
    error MarketFactory_InvalidParameter();
    error MarketFactory_InvalidFee();
    error MarketFactory_InvalidOutcomeCount();
    error MarketFactory_TradingEndsInPast();
    error MarketFactory_InsufficientLiquidity();
    error MarketFactory_MarketNotFound();
    error MarketFactory_LiquidityTooLow(uint256 provided, uint256 minimum);

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /// @notice Minimum liquidity parameter to prevent PRBMath overflow
    /// @dev This is a dimensionless UD60x18 value representing the LMSR b parameter.
    ///      100e18 means b=100.0 in UD60x18 space (not 100 USDT).
    ///      This provides sufficient liquidity sensitivity for price discovery.
    uint256 public constant MIN_LIQUIDITY_PARAMETER = 100e18; // 100.0 in UD60x18 (dimensionless)

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------

    /// @notice Role for creating markets
    bytes32 public constant MARKET_CREATOR_ROLE = keccak256("MARKET_CREATOR_ROLE");

    /// @notice Collateral token (e.g., USDT)
    address public collateral;

    /// @notice ERC-1155 outcome token contract
    address public outcome1155;

    /// @notice Treasury contract for fee collection
    address public treasury;

    /// @notice Oracle contract for market resolution
    address public oracle;

    /// @notice Router contract for gasless trading
    address public router;

    /// @notice Default LMSR liquidity parameter (b)
    uint256 public defaultLiquidityParameter;

    /// @notice Default protocol fee in basis points (10000 = 100%)
    uint16 public defaultProtocolFeeBps;

    /// @notice Default creator fee in basis points (10000 = 100%)
    uint16 public defaultCreatorFeeBps;

    /// @notice Default oracle fee in basis points (10000 = 100%)
    uint16 public defaultOracleFeeBps;

    /// @notice Market ID counter
    uint256 public nextMarketId;

    /// @notice Mapping from market ID to market address
    mapping(uint256 => address) public marketById;

    /// @notice Mapping from market address to market ID
    mapping(address => uint256) public marketIdByAddress;

    /// @notice Mapping from our market ID to DelphAI market ID
    mapping(uint256 => uint256) public delphAIMarketIdByMarketId;

    /// @notice Array of all market addresses
    address[] public allMarkets;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /// @notice Initialize the factory
    /// @param collateral_ Collateral token address
    /// @param outcome1155_ Outcome1155 token address
    /// @param treasury_ Treasury address
    /// @param oracle_ Oracle address
    /// @param router_ Router address for gasless trading
    /// @param defaultLiquidityParameter_ Default LMSR b parameter
    /// @param defaultProtocolFeeBps_ Default protocol fee (basis points)
    /// @param defaultCreatorFeeBps_ Default creator fee (basis points)
    /// @param defaultOracleFeeBps_ Default oracle fee (basis points)
    constructor(
        address collateral_,
        address outcome1155_,
        address treasury_,
        address oracle_,
        address router_,
        uint256 defaultLiquidityParameter_,
        uint16 defaultProtocolFeeBps_,
        uint16 defaultCreatorFeeBps_,
        uint16 defaultOracleFeeBps_
    ) {
        if (
            collateral_ == address(0) || outcome1155_ == address(0) || treasury_ == address(0) || oracle_ == address(0)
                || router_ == address(0)
        ) {
            revert MarketFactory_InvalidAddress();
        }
        if (defaultLiquidityParameter_ < MIN_LIQUIDITY_PARAMETER) {
            revert MarketFactory_LiquidityTooLow(defaultLiquidityParameter_, MIN_LIQUIDITY_PARAMETER);
        }
        if (defaultProtocolFeeBps_ + defaultCreatorFeeBps_ + defaultOracleFeeBps_ > 10000) {
            revert MarketFactory_InvalidFee();
        }

        collateral = collateral_;
        outcome1155 = outcome1155_;
        treasury = treasury_;
        oracle = oracle_;
        router = router_;
        defaultLiquidityParameter = defaultLiquidityParameter_;
        defaultProtocolFeeBps = defaultProtocolFeeBps_;
        defaultCreatorFeeBps = defaultCreatorFeeBps_;
        defaultOracleFeeBps = defaultOracleFeeBps_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MARKET_CREATOR_ROLE, msg.sender);
    }

    // -------------------------------------------------------------------------
    // Market Creation
    // -------------------------------------------------------------------------

    /// @notice Create a new prediction market
    /// @param params Market creation parameters
    /// @return marketId The ID of the created market
    /// @return marketAddress The address of the created market
    /// @dev IMPORTANT: Before calling this function, you must:
    ///      1. Call DelphAI.createMarket() to create the oracle market with full metadata
    ///      2. Pass the returned DelphAI market ID in params.delphAIMarketId
    ///      This ensures proper oracle resolution mapping.
    function createMarket(CreateMarketParams calldata params)
        external
        onlyRole(MARKET_CREATOR_ROLE)
        returns (uint256 marketId, address marketAddress)
    {
        // Validation
        if (params.outcomes.length < 2) {
            revert MarketFactory_InvalidOutcomeCount();
        }
        if (params.tradingEndsAt <= block.timestamp) {
            revert MarketFactory_TradingEndsInPast();
        }
        
        // Validate initial liquidity based on collateral decimals
        // Minimum: 100 tokens in collateral's native decimals (e.g., 100 USDT = 100 * 10^6)
        uint8 collateralDecimals = IERC20Metadata(collateral).decimals();
        uint256 minInitialLiquidity = 100 * (10 ** collateralDecimals);
        if (params.initialLiquidity < minInitialLiquidity) {
            revert MarketFactory_InsufficientLiquidity();
        }

        // Use defaults if not specified
        uint256 b = params.liquidityParameter == 0 ? defaultLiquidityParameter : params.liquidityParameter;
        uint16 protocolBps = params.protocolFeeBps == 0 ? defaultProtocolFeeBps : params.protocolFeeBps;
        uint16 creatorBps = params.creatorFeeBps == 0 ? defaultCreatorFeeBps : params.creatorFeeBps;
        uint16 oracleBps = params.oracleFeeBps == 0 ? defaultOracleFeeBps : params.oracleFeeBps;

        // Validate liquidity parameter meets minimum threshold
        if (b < MIN_LIQUIDITY_PARAMETER) {
            revert MarketFactory_LiquidityTooLow(b, MIN_LIQUIDITY_PARAMETER);
        }

        // Validate total fees don't exceed 100%
        if (protocolBps + creatorBps + oracleBps > 10000) {
            revert MarketFactory_InvalidFee();
        }

        // Calculate total fee for LMSRMarket constructor (includes all three fee types)
        // Treasury will split this total according to its configured percentages
        uint256 totalFeeRaw = ((uint256(protocolBps) + uint256(creatorBps) + uint256(oracleBps)) * 1e18) / 10000;

        // Deploy new market instance
        marketId = nextMarketId++;
        marketAddress = address(
            new LMSRMarket(
                marketId,
                uint8(params.outcomes.length),
                b,
                totalFeeRaw,
                collateral,
                outcome1155,
                params.tradingEndsAt,
                oracle,
                treasury  // ✅ Pass treasury address
            )
        );

        // Register with Treasury
        Treasury(treasury).registerMarket(marketId, marketAddress, msg.sender);

        // Grant MINTER_BURNER_ROLE to the market so it can mint/burn shares
        Outcome1155(outcome1155).grantRole(Outcome1155(outcome1155).MINTER_BURNER_ROLE(), marketAddress);

        // Register market with Router for gasless trading
        Router(router).registerMarket(marketId, marketAddress);

        // ✅ CRITICAL FIX: Register with Oracle using DelphAI market ID (not our internal ID)
        // The delphAIMarketId parameter must be obtained by calling DelphAI.createMarket() first
        Oracle(oracle).registerMarket(marketAddress, params.delphAIMarketId);

        // Store mapping
        marketById[marketId] = marketAddress;
        marketIdByAddress[marketAddress] = marketId;
        delphAIMarketIdByMarketId[marketId] = params.delphAIMarketId;
        allMarkets.push(marketAddress);

        // Transfer initial liquidity from creator and fund market
        IERC20(collateral).safeTransferFrom(msg.sender, address(this), params.initialLiquidity);
        IERC20(collateral).approve(marketAddress, params.initialLiquidity);
        LMSRMarket(marketAddress).fundMarket(params.initialLiquidity);

        emit MarketCreated(marketId, marketAddress, msg.sender, params.title, params.description, params.category, params.imageUrl, params.outcomes, params.tradingEndsAt, b);
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /// @notice Get market address by ID
    /// @param marketId Market ID
    /// @return Market address
    function getMarket(uint256 marketId) external view returns (address) {
        address market = marketById[marketId];
        if (market == address(0)) {
            revert MarketFactory_MarketNotFound();
        }
        return market;
    }

    /// @notice Get market ID by address
    /// @param marketAddress Market address
    /// @return Market ID
    function getMarketId(address marketAddress) external view returns (uint256) {
        uint256 id = marketIdByAddress[marketAddress];
        if (id == 0 && marketById[0] != marketAddress) {
            revert MarketFactory_MarketNotFound();
        }
        return id;
    }

    /// @notice Check if market exists
    /// @param marketId Market ID
    /// @return True if market exists
    function marketExists(uint256 marketId) external view returns (bool) {
        return marketById[marketId] != address(0);
    }

    /// @notice Get total number of markets
    /// @return Total market count
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }

    /// @notice Get all market addresses
    /// @return Array of market addresses
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }

    /// @notice Get paginated market addresses
    /// @param offset Starting index
    /// @param limit Number of markets to return
    /// @return markets Array of market addresses
    function getMarkets(uint256 offset, uint256 limit) external view returns (address[] memory markets) {
        uint256 total = allMarkets.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        markets = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            markets[i - offset] = allMarkets[i];
        }
    }

    // -------------------------------------------------------------------------
    // Admin Functions
    // -------------------------------------------------------------------------

    /// @notice Update collateral address
    /// @param newCollateral New collateral address
    function setCollateral(address newCollateral) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newCollateral == address(0)) {
            revert MarketFactory_InvalidAddress();
        }
        collateral = newCollateral;
        emit CollateralUpdated(newCollateral);
    }

    /// @notice Update outcome1155 address
    /// @param newOutcome1155 New outcome1155 address
    function setOutcome1155(address newOutcome1155) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newOutcome1155 == address(0)) {
            revert MarketFactory_InvalidAddress();
        }
        outcome1155 = newOutcome1155;
        emit Outcome1155Updated(newOutcome1155);
    }

    /// @notice Update treasury address
    /// @param newTreasury New treasury address
    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) {
            revert MarketFactory_InvalidAddress();
        }
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /// @notice Update oracle address
    /// @param newOracle New oracle address
    function setOracle(address newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newOracle == address(0)) {
            revert MarketFactory_InvalidAddress();
        }
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    /// @notice Update router address
    /// @param newRouter New router address
    function setRouter(address newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRouter == address(0)) {
            revert MarketFactory_InvalidAddress();
        }
        router = newRouter;
        emit RouterUpdated(newRouter);
    }

    /// @notice Update default liquidity parameter
    /// @param newValue New default b value
    function setDefaultLiquidityParameter(uint256 newValue) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newValue < MIN_LIQUIDITY_PARAMETER) {
            revert MarketFactory_LiquidityTooLow(newValue, MIN_LIQUIDITY_PARAMETER);
        }
        defaultLiquidityParameter = newValue;
        emit DefaultLiquidityParameterUpdated(newValue);
    }

    /// @notice Update default fees
    /// @param newProtocolBps New protocol fee
    /// @param newCreatorBps New creator fee
    /// @param newOracleBps New oracle fee
    function setDefaultFees(uint16 newProtocolBps, uint16 newCreatorBps, uint16 newOracleBps)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (newProtocolBps + newCreatorBps + newOracleBps > 10000) {
            revert MarketFactory_InvalidFee();
        }
        defaultProtocolFeeBps = newProtocolBps;
        defaultCreatorFeeBps = newCreatorBps;
        defaultOracleFeeBps = newOracleBps;
        emit DefaultFeeUpdated(newProtocolBps, newCreatorBps, newOracleBps);
    }
}
