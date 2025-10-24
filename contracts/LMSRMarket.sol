// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {UD60x18, ud} from "@prb/math/UD60x18.sol";
import {Outcome1155} from "./Outcome1155.sol";
import {uEXP_MAX_INPUT} from "@prb/math/ud60x18/Constants.sol";

/**
 * @title LMSRMarket
 * @notice Automated Market Maker for multi-outcome prediction markets using the Logarithmic Market Scoring Rule (LMSR).
 * @dev Trades are priced with PRBMath UD60x18 fixed-point math. Shares are minted/burned via Outcome1155 tokens.
 */
contract LMSRMarket is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Emitted when the market is funded with additional collateral.
    event MarketFunded(address indexed funder, uint256 amount);

    /// @notice Emitted after a successful buy.
    event Buy(address indexed trader, uint8 indexed outcome, uint256 shares, uint256 cost, uint256 fee);

    /// @notice Emitted after a successful sell.
    event Sell(address indexed trader, uint8 indexed outcome, uint256 shares, uint256 payout, uint256 fee);

    /// @notice Emitted when accumulated fees are withdrawn.
    event FeeWithdrawn(address indexed receiver, uint256 amount);

    /// @notice Emitted when the trading fee is updated.
    event FeeUpdated(uint256 previousFee, uint256 newFee);

    /// @notice Emitted when trading pause state changes.
    event TradingPaused(bool status);

    /// @notice Emitted when market is resolved.
    event Resolved(uint8 indexed winningOutcome, bool invalid);

    /// @notice Emitted when a user redeems shares.
    event Redeemed(address indexed user, uint8 indexed outcome, uint256 shares, uint256 payout);

    /// @notice Market lifecycle states.
    enum MarketState {
        Trading,    // Active trading period
        Resolving,  // Resolution requested, waiting for oracle
        Finalized   // Outcome determined, redemption available
    }

    error LMSR_InvalidOutcome(uint8 outcomeId);
    error LMSR_InvalidOutcomeCount(uint8 count);
    error LMSR_InvalidAmount();
    error LMSR_FeeTooHigh(uint256 feeRaw);
    error LMSR_LiquidityParameterZero();
    error LMSR_TradeCostZero();
    error LMSR_NetPayoutZero();
    error LMSR_InsufficientUserShares(uint256 balance, uint256 requested);
    error LMSR_InsufficientCollateral(uint256 available, uint256 required);
    error LMSR_ExponentialInputTooLarge();
    error LMSR_InvalidAddress();
    error LMSR_TradingPaused();
    error LMSR_InvariantCostDecrease();
    error LMSR_InvariantCostIncrease();
    error LMSR_InsufficientMarketShares(uint256 available, uint256 requested);
    error LMSR_TradingEnded();
    error LMSR_WrongState();
    error LMSR_OnlyOracle();
    error LMSR_NotWinner();
    error LMSR_NoShares();
    error LMSR_MarketNotFinalized();

    uint256 private constant MAX_FEE_RAW = 1e17; // 10%
    uint8 private constant MIN_OUTCOMES = 2;
    uint8 private constant MAX_OUTCOMES = 10;

    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    /// @notice ERC-20 token used for collateral.
    IERC20 public immutable collateral;

    /// @notice Outcome1155 used for share accounting.
    Outcome1155 public immutable outcomeToken;

    /// @notice Identifier of the market within the Outcome1155 contract.
    uint256 public immutable marketId;

    /// @notice Number of outcomes supported by this market.
    uint8 public immutable outcomeCount;

    /// @notice Liquidity sensitivity parameter (b) expressed as UD60x18.
    UD60x18 public immutable liquidityB;

    /// @notice Timestamp when trading ends.
    uint64 public immutable tradingEndsAt;

    /// @notice Oracle contract address for resolution.
    address public immutable oracle;

    /// @notice Total trading volume (for analytics).
    uint256 public totalVolume;

    /// @notice Current market state.
    MarketState public state;

    /// @notice Winning outcome index (valid only when finalized).
    uint8 public winningOutcome;

    /// @notice Whether market is invalid (pro-rata refund).
    bool public invalid;

    /// @notice Total shares at finalization (for pro-rata calculation).
    uint256 public totalSharesAtFinalization;

    /// @notice Available collateral at finalization (for pro-rata calculation).
    uint256 public availableCollateralAtFinalization;

    /// @notice Trading fee percentage expressed as UD60x18.
    UD60x18 public tradeFee;

    /// @notice Accumulated fees pending withdrawal (raw ERC-20 units).
    uint256 public feeReserve;

    /// @notice Flag indicating whether trading is paused.
    bool public tradingPaused;

    /// @notice Outstanding outcome share quantities encoded as UD60x18 numbers.
    UD60x18[] private shares;

    constructor(
        uint256 marketId_,
        uint8 outcomeCount_,
        uint256 liquidityBRaw,
        uint256 feeRaw,
        address collateral_,
        address outcomeToken_,
        uint64 tradingEndsAt_,
        address oracle_
    ) {
        if (outcomeCount_ < MIN_OUTCOMES || outcomeCount_ > MAX_OUTCOMES) {
            revert LMSR_InvalidOutcomeCount(outcomeCount_);
        }
        if (liquidityBRaw == 0) {
            revert LMSR_LiquidityParameterZero();
        }
        if (collateral_ == address(0) || outcomeToken_ == address(0) || oracle_ == address(0)) {
            revert LMSR_InvalidAddress();
        }
        if (feeRaw > MAX_FEE_RAW) {
            revert LMSR_FeeTooHigh(feeRaw);
        }

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, msg.sender);

        collateral = IERC20(collateral_);
        outcomeToken = Outcome1155(outcomeToken_);
        marketId = marketId_;
        outcomeCount = outcomeCount_;
        liquidityB = ud(liquidityBRaw);
        tradeFee = ud(feeRaw);
        tradingEndsAt = tradingEndsAt_;
        oracle = oracle_;
        state = MarketState.Trading;

        shares = new UD60x18[](outcomeCount_);
    }

    modifier validOutcome(uint8 outcomeId) {
        if (outcomeId >= outcomeCount) {
            revert LMSR_InvalidOutcome(outcomeId);
        }
        _;
    }

    function fundMarket(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (amount == 0) {
            revert LMSR_InvalidAmount();
        }
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        emit MarketFunded(msg.sender, amount);
    }

    function setFee(uint256 newFeeRaw) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeeRaw > MAX_FEE_RAW) {
            revert LMSR_FeeTooHigh(newFeeRaw);
        }
        uint256 previous = tradeFee.unwrap();
        tradeFee = ud(newFeeRaw);
        emit FeeUpdated(previous, newFeeRaw);
    }

    function pauseTrading(bool pause) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tradingPaused = pause;
        emit TradingPaused(pause);
    }

    function withdrawFees(address receiver, uint256 amount) external onlyRole(TREASURY_ROLE) {
        if (receiver == address(0)) {
            revert LMSR_InvalidAddress();
        }
        if (amount == 0 || amount > feeReserve) {
            revert LMSR_InvalidAmount();
        }
        feeReserve -= amount;
        collateral.safeTransfer(receiver, amount);
        emit FeeWithdrawn(receiver, amount);
    }

    function getPrice(uint8 outcomeId) external view validOutcome(outcomeId) returns (uint256) {
        UD60x18[] memory snapshot = _snapshotShares();
        UD60x18 denominator = _sumExp(snapshot);
        UD60x18 numerator = _expTerm(snapshot[outcomeId]);
        return (numerator / denominator).unwrap();
    }

    function getCostFunction() external view returns (uint256) {
        return _costFunction(_snapshotShares()).unwrap();
    }

    function outstandingShares(uint8 outcomeId) external view validOutcome(outcomeId) returns (uint256) {
        return shares[outcomeId].unwrap();
    }

    function availableCollateral() external view returns (uint256) {
        return _availableCollateral();
    }

    function previewBuy(uint8 outcomeId, uint256 deltaSharesRaw)
        external
        view
        validOutcome(outcomeId)
        returns (uint256 costRaw, uint256 feeRaw, uint256 totalRaw)
    {
        UD60x18 deltaShares = _validateDelta(deltaSharesRaw);
        (UD60x18 tradeCost, UD60x18 feeAmount, UD60x18 totalCost) = _quoteBuy(outcomeId, deltaShares);
        costRaw = tradeCost.unwrap();
        feeRaw = feeAmount.unwrap();
        totalRaw = totalCost.unwrap();
    }

    function previewSell(uint8 outcomeId, uint256 deltaSharesRaw)
        external
        view
        validOutcome(outcomeId)
        returns (uint256 grossRaw, uint256 feeRaw, uint256 netRaw)
    {
        UD60x18 deltaShares = _validateDelta(deltaSharesRaw);
        (UD60x18 gross, UD60x18 feeAmount, UD60x18 net) = _quoteSell(outcomeId, deltaShares);
        grossRaw = gross.unwrap();
        feeRaw = feeAmount.unwrap();
        netRaw = net.unwrap();
    }

    function buy(uint8 outcomeId, uint256 deltaSharesRaw)
        external
        nonReentrant
        validOutcome(outcomeId)
        returns (uint256 totalPaid)
    {
        if (state != MarketState.Trading) {
            revert LMSR_WrongState();
        }
        if (block.timestamp >= tradingEndsAt) {
            revert LMSR_TradingEnded();
        }
        if (tradingPaused) {
            revert LMSR_TradingPaused();
        }
        UD60x18 deltaShares = _validateDelta(deltaSharesRaw);
        (UD60x18 tradeCost, UD60x18 feeAmount, UD60x18 totalCost) = _quoteBuy(outcomeId, deltaShares);
        if (tradeCost.isZero()) {
            revert LMSR_TradeCostZero();
        }

        uint256 costRaw = tradeCost.unwrap();
        uint256 feeRaw = feeAmount.unwrap();
        totalPaid = totalCost.unwrap();

        collateral.safeTransferFrom(msg.sender, address(this), totalPaid);
        feeReserve += feeRaw;
        totalVolume += totalPaid;
        shares[outcomeId] = shares[outcomeId] + deltaShares;

        outcomeToken.mintOutcome(msg.sender, marketId, outcomeId, deltaSharesRaw);

        emit Buy(msg.sender, outcomeId, deltaSharesRaw, costRaw, feeRaw);
    }

    function sell(uint8 outcomeId, uint256 deltaSharesRaw)
        external
        nonReentrant
        validOutcome(outcomeId)
        returns (uint256 netPayout)
    {
        if (state != MarketState.Trading) {
            revert LMSR_WrongState();
        }
        if (block.timestamp >= tradingEndsAt) {
            revert LMSR_TradingEnded();
        }
        if (tradingPaused) {
            revert LMSR_TradingPaused();
        }
        UD60x18 deltaShares = _validateDelta(deltaSharesRaw);
        uint256 tokenId = outcomeToken.encodeTokenId(marketId, outcomeId);
        uint256 userBalance = outcomeToken.balanceOf(msg.sender, tokenId);
        if (userBalance < deltaSharesRaw) {
            revert LMSR_InsufficientUserShares(userBalance, deltaSharesRaw);
        }
        uint256 marketShares = shares[outcomeId].unwrap();
        if (deltaSharesRaw > marketShares) {
            revert LMSR_InsufficientMarketShares(marketShares, deltaSharesRaw);
        }

        (, UD60x18 feeAmount, UD60x18 net) = _quoteSell(outcomeId, deltaShares);
        if (net.isZero()) {
            revert LMSR_NetPayoutZero();
        }

        uint256 feeRaw = feeAmount.unwrap();
        netPayout = net.unwrap();

        uint256 available = _availableCollateral();
        if (available < netPayout) {
            revert LMSR_InsufficientCollateral(available, netPayout);
        }

        feeReserve += feeRaw;
        shares[outcomeId] = shares[outcomeId] - deltaShares;

        outcomeToken.burnOutcome(msg.sender, marketId, outcomeId, deltaSharesRaw);
        collateral.safeTransfer(msg.sender, netPayout);

        emit Sell(msg.sender, outcomeId, deltaSharesRaw, netPayout, feeRaw);
    }

    function _quoteBuy(uint8 outcomeId, UD60x18 deltaShares)
        internal
        view
        returns (UD60x18 tradeCost, UD60x18 feeAmount, UD60x18 totalCost)
    {
        UD60x18[] memory snapshot = _snapshotShares();
        UD60x18 costBefore = _costFunction(snapshot);
        snapshot[outcomeId] = snapshot[outcomeId] + deltaShares;
        UD60x18 costAfter = _costFunction(snapshot);
        if (costAfter < costBefore) {
            revert LMSR_InvariantCostDecrease();
        }
        tradeCost = costAfter - costBefore;
        feeAmount = tradeCost * tradeFee;
        totalCost = tradeCost + feeAmount;
    }

    function _quoteSell(uint8 outcomeId, UD60x18 deltaShares)
        internal
        view
        returns (UD60x18 grossPayout, UD60x18 feeAmount, UD60x18 netPayout)
    {
        UD60x18[] memory snapshot = _snapshotShares();
        UD60x18 currentShares = snapshot[outcomeId];
        uint256 availableShares = currentShares.unwrap();
        uint256 requestedShares = deltaShares.unwrap();
        if (requestedShares > availableShares) {
            revert LMSR_InsufficientMarketShares(availableShares, requestedShares);
        }
        UD60x18 costBefore = _costFunction(snapshot);
        snapshot[outcomeId] = snapshot[outcomeId] - deltaShares;
        UD60x18 costAfter = _costFunction(snapshot);
        if (costAfter > costBefore) {
            revert LMSR_InvariantCostIncrease();
        }
        grossPayout = costBefore - costAfter;
        feeAmount = grossPayout * tradeFee;
        netPayout = grossPayout - feeAmount;
    }

    function _validateDelta(uint256 deltaSharesRaw) internal pure returns (UD60x18) {
        if (deltaSharesRaw == 0) {
            revert LMSR_InvalidAmount();
        }
        return ud(deltaSharesRaw);
    }

    function _snapshotShares() internal view returns (UD60x18[] memory snapshot) {
        uint256 length = shares.length;
        snapshot = new UD60x18[](length);
        for (uint256 i = 0; i < length; i++) {
            snapshot[i] = shares[i];
        }
    }

    function _costFunction(UD60x18[] memory quantities) internal view returns (UD60x18) {
        UD60x18 sumExp = _sumExp(quantities);
        return liquidityB * sumExp.ln();
    }

    function _sumExp(UD60x18[] memory quantities) internal view returns (UD60x18 sum) {
        sum = ud(0);
        uint256 length = quantities.length;
        for (uint256 i = 0; i < length; i++) {
            UD60x18 term = _expTerm(quantities[i]);
            sum = sum + term;
        }
    }

    function _expTerm(UD60x18 quantity) internal view returns (UD60x18) {
        UD60x18 ratio = quantity / liquidityB;
        if (ratio.unwrap() > uEXP_MAX_INPUT) {
            revert LMSR_ExponentialInputTooLarge();
        }
        return ratio.exp();
    }

    function _availableCollateral() internal view returns (uint256) {
        uint256 balance = collateral.balanceOf(address(this));
        if (balance <= feeReserve) {
            return 0;
        }
        return balance - feeReserve;
    }

    // -------------------------------------------------------------------------
    // Resolution Functions
    // -------------------------------------------------------------------------

    /// @notice Request resolution from the oracle (only callable after trading ends)
    /// @dev Transitions market from Trading to Resolving state
    function requestResolve() external nonReentrant {
        if (state != MarketState.Trading) {
            revert LMSR_WrongState();
        }
        if (block.timestamp < tradingEndsAt) {
            revert LMSR_TradingEnded();
        }

        state = MarketState.Resolving;

        // Call oracle to request resolution
        IOracle(oracle).requestResolve(address(this));
    }

    /// @notice Finalize the market with the winning outcome (callable only by oracle)
    /// @param winning The winning outcome index
    /// @param invalid_ Whether the market is invalid (true = pro-rata refund)
    function finalize(uint8 winning, bool invalid_) external nonReentrant {
        if (msg.sender != oracle) {
            revert LMSR_OnlyOracle();
        }
        if (state != MarketState.Resolving) {
            revert LMSR_WrongState();
        }
        if (!invalid_ && winning >= outcomeCount) {
            revert LMSR_InvalidOutcome(winning);
        }

        state = MarketState.Finalized;
        winningOutcome = winning;
        invalid = invalid_;

        // Snapshot values for pro-rata calculation
        if (invalid_) {
            uint256 totalShares = 0;
            for (uint8 i = 0; i < outcomeCount; i++) {
                totalShares += shares[i].unwrap();
            }
            totalSharesAtFinalization = totalShares;
            availableCollateralAtFinalization = _availableCollateral();
        }

        emit Resolved(winning, invalid_);
    }

    /// @notice Redeem shares for payout after market finalization
    /// @param outcomeId The outcome index to redeem
    /// @param amount The amount of shares to redeem
    /// @return payout The amount of collateral paid out
    function redeem(uint8 outcomeId, uint256 amount)
        external
        nonReentrant
        validOutcome(outcomeId)
        returns (uint256 payout)
    {
        if (state != MarketState.Finalized) {
            revert LMSR_MarketNotFinalized();
        }
        if (amount == 0) {
            revert LMSR_InvalidAmount();
        }

        uint256 tokenId = outcomeToken.encodeTokenId(marketId, outcomeId);
        uint256 userBalance = outcomeToken.balanceOf(msg.sender, tokenId);
        if (userBalance < amount) {
            revert LMSR_NoShares();
        }

        if (invalid) {
            // Pro-rata refund: each share gets equal portion of available collateral
            // Use snapshotted values from finalization
            if (totalSharesAtFinalization == 0) {
                revert LMSR_NoShares();
            }

            payout = (amount * availableCollateralAtFinalization) / totalSharesAtFinalization;
        } else {
            // Winners get 1:1 payout
            if (outcomeId != winningOutcome) {
                revert LMSR_NotWinner();
            }
            payout = amount;
        }

        if (payout == 0) {
            revert LMSR_InvalidAmount();
        }

        uint256 available = _availableCollateral();
        if (available < payout) {
            revert LMSR_InsufficientCollateral(available, payout);
        }

        // Burn shares and transfer payout
        outcomeToken.burnOutcome(msg.sender, marketId, outcomeId, amount);
        collateral.safeTransfer(msg.sender, payout);

        emit Redeemed(msg.sender, outcomeId, amount, payout);
    }
}

// -------------------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------------------

interface IOracle {
    function requestResolve(address market) external;
}
