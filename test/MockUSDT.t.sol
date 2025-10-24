// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../contracts/MockUSDT.sol";

contract MockUSDTTest is Test {
    MockUSDT public usdt;
    address public owner;
    address public user1;
    address public user2;

    uint256 constant FAUCET_AMOUNT = 10_000 * 10 ** 6; // 10,000 USDT
    uint256 constant INITIAL_MINT = 100_000 * 10 ** 6; // 100,000 USDT

    event FaucetClaimed(address indexed user, uint256 amount);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        usdt = new MockUSDT();
    }

    // ===== DEPLOYMENT TESTS =====

    function test_InitialState() public view {
        assertEq(usdt.name(), "Mock USDT");
        assertEq(usdt.symbol(), "USDT");
        assertEq(usdt.decimals(), 6);
        assertEq(usdt.totalSupply(), INITIAL_MINT);
        assertEq(usdt.balanceOf(owner), INITIAL_MINT);
    }

    function test_OwnerIsDeployer() public view {
        assertEq(usdt.owner(), owner);
    }

    // ===== FAUCET TESTS =====

    function test_FaucetMints10kUSDT() public {
        vm.startPrank(user1);

        uint256 balanceBefore = usdt.balanceOf(user1);
        usdt.faucet();
        uint256 balanceAfter = usdt.balanceOf(user1);

        assertEq(balanceAfter - balanceBefore, FAUCET_AMOUNT);
        vm.stopPrank();
    }

    function test_FaucetEmitsEvent() public {
        vm.startPrank(user1);

        vm.expectEmit(true, false, false, true);
        emit FaucetClaimed(user1, FAUCET_AMOUNT);

        usdt.faucet();
        vm.stopPrank();
    }

    function test_FaucetUpdatesLastClaimTime() public {
        vm.startPrank(user1);

        uint256 timeBefore = usdt.lastFaucetClaim(user1);
        assertEq(timeBefore, 0); // No previous claim

        usdt.faucet();

        uint256 timeAfter = usdt.lastFaucetClaim(user1);
        assertEq(timeAfter, block.timestamp);

        vm.stopPrank();
    }

    function test_FaucetCannotBeCalledTwiceImmediately() public {
        vm.startPrank(user1);

        usdt.faucet(); // First claim succeeds

        vm.expectRevert("MockUSDT: Faucet cooldown active");
        usdt.faucet(); // Second claim fails

        vm.stopPrank();
    }

    function test_FaucetCanBeCalledAfterCooldown() public {
        vm.startPrank(user1);

        usdt.faucet(); // First claim
        assertEq(usdt.balanceOf(user1), FAUCET_AMOUNT);

        // Warp time forward by 1 hour + 1 second
        vm.warp(block.timestamp + 1 hours + 1);

        usdt.faucet(); // Second claim succeeds
        assertEq(usdt.balanceOf(user1), FAUCET_AMOUNT * 2);

        vm.stopPrank();
    }

    function test_FaucetCooldownIndependentPerUser() public {
        // User1 claims
        vm.prank(user1);
        usdt.faucet();
        assertEq(usdt.balanceOf(user1), FAUCET_AMOUNT);

        // User2 can claim immediately (different cooldown)
        vm.prank(user2);
        usdt.faucet();
        assertEq(usdt.balanceOf(user2), FAUCET_AMOUNT);
    }

    function test_CanClaimFaucet_ReturnsTrueWhenNoPreviousClaim() public view {
        assertTrue(usdt.canClaimFaucet(user1));
    }

    function test_CanClaimFaucet_ReturnsFalseDuringCooldown() public {
        vm.prank(user1);
        usdt.faucet();

        assertFalse(usdt.canClaimFaucet(user1));
    }

    function test_CanClaimFaucet_ReturnsTrueAfterCooldown() public {
        vm.prank(user1);
        usdt.faucet();

        vm.warp(block.timestamp + 1 hours + 1);
        assertTrue(usdt.canClaimFaucet(user1));
    }

    function test_FaucetCooldownRemaining_ReturnsZeroWhenNoPreviousClaim() public view {
        assertEq(usdt.faucetCooldownRemaining(user1), 0);
    }

    function test_FaucetCooldownRemaining_ReturnsCorrectTimeRemaining() public {
        vm.prank(user1);
        usdt.faucet();

        // Immediately after claim, should be 1 hour
        uint256 remaining = usdt.faucetCooldownRemaining(user1);
        assertEq(remaining, 1 hours);

        // After 30 minutes, should be 30 minutes
        vm.warp(block.timestamp + 30 minutes);
        remaining = usdt.faucetCooldownRemaining(user1);
        assertEq(remaining, 30 minutes);
    }

    function test_FaucetCooldownRemaining_ReturnsZeroAfterCooldown() public {
        vm.prank(user1);
        usdt.faucet();

        vm.warp(block.timestamp + 1 hours + 1);
        assertEq(usdt.faucetCooldownRemaining(user1), 0);
    }

    // ===== ADMIN MINT TESTS =====

    function test_OwnerCanMint() public {
        uint256 mintAmount = 50_000 * 10 ** 6; // 50,000 USDT

        usdt.mint(user1, mintAmount);

        assertEq(usdt.balanceOf(user1), mintAmount);
    }

    function test_NonOwnerCannotMint() public {
        uint256 mintAmount = 50_000 * 10 ** 6;

        vm.prank(user1);
        vm.expectRevert();
        usdt.mint(user1, mintAmount);
    }

    // ===== STANDARD ERC-20 TESTS =====

    function test_Transfer() public {
        uint256 transferAmount = 1_000 * 10 ** 6; // 1,000 USDT

        bool success = usdt.transfer(user1, transferAmount);
        assertTrue(success);

        assertEq(usdt.balanceOf(user1), transferAmount);
        assertEq(usdt.balanceOf(owner), INITIAL_MINT - transferAmount);
    }

    function test_Approve() public {
        uint256 approvalAmount = 5_000 * 10 ** 6;

        usdt.approve(user1, approvalAmount);

        assertEq(usdt.allowance(owner, user1), approvalAmount);
    }

    function test_TransferFrom() public {
        uint256 amount = 2_000 * 10 ** 6;

        // Owner approves user1
        usdt.approve(user1, amount);

        // User1 transfers from owner to user2
        vm.prank(user1);
        bool success = usdt.transferFrom(owner, user2, amount);
        assertTrue(success);

        assertEq(usdt.balanceOf(user2), amount);
        assertEq(usdt.balanceOf(owner), INITIAL_MINT - amount);
    }

    // ===== FUZZ TESTS =====

    function testFuzz_FaucetAlwaysMintsFaucetAmount(address user) public {
        vm.assume(user != address(0));

        vm.prank(user);
        usdt.faucet();

        assertEq(usdt.balanceOf(user), FAUCET_AMOUNT);
    }

    function testFuzz_AdminMint(address recipient, uint256 amount) public {
        vm.assume(recipient != address(0));
        vm.assume(amount <= type(uint256).max - usdt.totalSupply()); // Prevent overflow

        uint256 supplyBefore = usdt.totalSupply();
        usdt.mint(recipient, amount);

        assertEq(usdt.balanceOf(recipient), amount);
        assertEq(usdt.totalSupply(), supplyBefore + amount);
    }

    function testFuzz_Transfer(address recipient, uint256 amount) public {
        vm.assume(recipient != address(0));
        vm.assume(amount <= usdt.balanceOf(owner));

        bool success = usdt.transfer(recipient, amount);
        assertTrue(success);

        assertEq(usdt.balanceOf(recipient), amount);
    }
}
