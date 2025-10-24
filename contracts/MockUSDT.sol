// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @notice Mock USDT token for testing on BNB Testnet
 * @dev ERC-20 token with 6 decimals (matching USDT) and a faucet function
 */
contract MockUSDT is ERC20, Ownable {
    /// @notice Number of decimals (matching real USDT)
    uint8 private constant DECIMALS = 6;

    /// @notice Amount minted per faucet call (10,000 USDT)
    uint256 public constant FAUCET_AMOUNT = 10_000 * 10 ** DECIMALS;

    /// @notice Initial mint amount for deployer (100,000 USDT)
    uint256 private constant INITIAL_MINT = 100_000 * 10 ** DECIMALS;

    /// @notice Cooldown period between faucet calls (1 hour)
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    /// @notice Mapping of address to last faucet claim timestamp
    mapping(address => uint256) public lastFaucetClaim;

    /// @notice Emitted when tokens are minted via faucet
    event FaucetClaimed(address indexed user, uint256 amount);

    /**
     * @notice Constructor - Mints initial supply to deployer
     */
    constructor() ERC20("Mock USDT", "USDT") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_MINT);
    }

    /**
     * @notice Returns the number of decimals (6)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @notice Faucet function - Mints 10,000 USDT to caller
     * @dev Has 1-hour cooldown to prevent abuse
     */
    function faucet() external {
        uint256 lastClaim = lastFaucetClaim[msg.sender];
        if (lastClaim != 0) {
            require(block.timestamp >= lastClaim + FAUCET_COOLDOWN, "MockUSDT: Faucet cooldown active");
        }

        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Admin mint function (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in token units, not wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Check if address can claim from faucet
     * @param user Address to check
     * @return bool True if cooldown has passed
     */
    function canClaimFaucet(address user) external view returns (bool) {
        uint256 lastClaim = lastFaucetClaim[user];
        if (lastClaim == 0) {
            return true;
        }
        return block.timestamp >= lastClaim + FAUCET_COOLDOWN;
    }

    /**
     * @notice Get time remaining until next faucet claim
     * @param user Address to check
     * @return uint256 Seconds remaining (0 if can claim now)
     */
    function faucetCooldownRemaining(address user) external view returns (uint256) {
        uint256 nextClaimTime = lastFaucetClaim[user] + FAUCET_COOLDOWN;
        if (lastFaucetClaim[user] == 0 || block.timestamp >= nextClaimTime) {
            return 0;
        }
        return nextClaimTime - block.timestamp;
    }
}
