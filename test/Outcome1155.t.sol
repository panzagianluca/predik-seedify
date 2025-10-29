// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../contracts/Outcome1155.sol";

contract Outcome1155Test is Test {
    Outcome1155 internal outcome;

    address internal admin;
    address internal market;
    address internal router;
    address internal trader;

    string internal constant BASE_URI = "https://api.predik.io/outcomes/{id}.json";

    function setUp() public {
        admin = address(this);
        market = makeAddr("market");
        router = makeAddr("router");
        trader = makeAddr("trader");

        outcome = new Outcome1155(BASE_URI, router);
        outcome.grantRole(outcome.MINTER_BURNER_ROLE(), market);
    }

    function testInitialRoles() public {
        assertTrue(outcome.hasRole(outcome.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(outcome.hasRole(outcome.MINTER_BURNER_ROLE(), admin));
    }

    function testEncodeDecode() public {
        uint256 marketId = 42;
        uint8 outcomeId = 3;
        uint256 tokenId = outcome.encodeTokenId(marketId, outcomeId);
        assertEq(outcome.decodeMarketId(tokenId), marketId);
        assertEq(outcome.decodeOutcomeId(tokenId), outcomeId);
    }

    function testRouterAutoApproval() public {
        assertTrue(outcome.isApprovedForAll(trader, router));
    }

    function testSetRouterOnlyAdmin() public {
        address newRouter = makeAddr("newRouter");
        outcome.setRouter(newRouter);
        assertEq(outcome.router(), newRouter);

        vm.prank(trader);
        vm.expectRevert();
        outcome.setRouter(makeAddr("bad"));
    }

    function testSetBaseUri() public {
        string memory newUri = "https://cdn.predik.io/meta/{id}.json";
        outcome.setBaseUri(newUri);
        uint256 tokenId = outcome.encodeTokenId(1, 0);

        string memory expected = _formattedUri(newUri, tokenId);
        assertEq(outcome.uri(tokenId), expected);
    }

    function testMintAndBurnByAuthorizedRole() public {
        uint256 marketId = 1;
        uint8 outcomeId = 2;
        uint256 tokenId = outcome.encodeTokenId(marketId, outcomeId);

        vm.prank(market);
        outcome.mintOutcome(trader, marketId, outcomeId, 100 ether);
        assertEq(outcome.balanceOf(trader, tokenId), 100 ether);

        vm.prank(market);
        outcome.burnOutcome(trader, marketId, outcomeId, 40 ether);
        assertEq(outcome.balanceOf(trader, tokenId), 60 ether);
    }

    function testMintRevertsForUnauthorized() public {
        address stranger = makeAddr("stranger");
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)", stranger, outcome.MINTER_BURNER_ROLE()
            )
        );
        vm.prank(stranger);
        outcome.mintOutcome(trader, 1, 0, 1 ether);
    }

    function testBurnRevertsForUnauthorized() public {
        uint256 tokenId = outcome.encodeTokenId(1, 1);
        vm.prank(market);
        outcome.mintOutcome(trader, 1, 1, 10 ether);

        address stranger = makeAddr("stranger2");
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)", stranger, outcome.MINTER_BURNER_ROLE()
            )
        );
        vm.prank(stranger);
        outcome.burnOutcome(trader, 1, 1, 1 ether);

        assertEq(outcome.balanceOf(trader, tokenId), 10 ether);
    }

    function testMintBatch() public {
        uint8[] memory outcomes = new uint8[](3);
        outcomes[0] = 0;
        outcomes[1] = 1;
        outcomes[2] = 2;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 10 ether;
        amounts[1] = 20 ether;
        amounts[2] = 30 ether;

        vm.prank(market);
        outcome.mintOutcomeBatch(trader, 7, outcomes, amounts);

        for (uint8 i = 0; i < outcomes.length; i++) {
            uint256 tokenId = outcome.encodeTokenId(7, outcomes[i]);
            assertEq(outcome.balanceOf(trader, tokenId), amounts[i]);
        }
    }

    function testBurnBatch() public {
        uint8[] memory outcomes = new uint8[](2);
        outcomes[0] = 0;
        outcomes[1] = 1;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 5 ether;
        amounts[1] = 15 ether;

        vm.startPrank(market);
        outcome.mintOutcomeBatch(trader, 9, outcomes, amounts);
        outcome.burnOutcomeBatch(trader, 9, outcomes, amounts);
        vm.stopPrank();

        for (uint8 i = 0; i < outcomes.length; i++) {
            uint256 tokenId = outcome.encodeTokenId(9, outcomes[i]);
            assertEq(outcome.balanceOf(trader, tokenId), 0);
        }
    }

    function testUriWithoutPlaceholderAppendsHex() public {
        string memory simpleUri = "https://cdn.predik.io/outcome/";
        outcome.setBaseUri(simpleUri);

        uint256 tokenId = outcome.encodeTokenId(123, 4);
        string memory expected = string.concat(simpleUri, _hexId(tokenId));
        assertEq(outcome.uri(tokenId), expected);
    }

    // ---------------------------------------------------------------------
    // helpers
    // ---------------------------------------------------------------------

    function _formattedUri(string memory base, uint256 tokenId) internal pure returns (string memory) {
        bytes memory placeholder = bytes("{id}");
        bytes memory baseBytes = bytes(base);
        if (!_contains(baseBytes, placeholder)) {
            return string.concat(base, _hexId(tokenId));
        }

        bytes memory replacement = bytes(_hexId(tokenId));
        bytes memory output = new bytes(baseBytes.length - placeholder.length + replacement.length);
        uint256 k;
        for (uint256 i = 0; i < baseBytes.length;) {
            bool matchFound = true;
            if (i + placeholder.length <= baseBytes.length) {
                for (uint256 j = 0; j < placeholder.length; j++) {
                    if (baseBytes[i + j] != placeholder[j]) {
                        matchFound = false;
                        break;
                    }
                }
            } else {
                matchFound = false;
            }

            if (matchFound) {
                for (uint256 j = 0; j < replacement.length; j++) {
                    output[k++] = replacement[j];
                }
                i += placeholder.length;
            } else {
                output[k++] = baseBytes[i++];
            }
        }

        return string(output);
    }

    function _hexId(uint256 tokenId) internal pure returns (string memory) {
        bytes16 hexSymbols = "0123456789abcdef";
        bytes memory buffer = new bytes(64);
        for (uint256 i = 0; i < 64; ++i) {
            buffer[63 - i] = hexSymbols[tokenId & 0xf];
            tokenId >>= 4;
        }
        return string(buffer);
    }

    function _contains(bytes memory data, bytes memory pattern) private pure returns (bool) {
        if (pattern.length == 0 || pattern.length > data.length) {
            return false;
        }
        for (uint256 i = 0; i <= data.length - pattern.length; i++) {
            bool matchFound = true;
            for (uint256 j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    matchFound = false;
                    break;
                }
            }
            if (matchFound) {
                return true;
            }
        }
        return false;
    }
}
