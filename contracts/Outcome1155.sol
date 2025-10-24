// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Outcome1155
 * @notice ERC-1155 token that represents outcome shares for LMSR markets.
 * @dev Token IDs are composed using encodeTokenId(marketId, outcomeId).
 *      Only addresses with the MINTER_BURNER_ROLE can mint or burn shares.
 *      A designated router is auto-approved to manage tokens on behalf of users.
 */
contract Outcome1155 is ERC1155, AccessControl {
    /// @notice Role identifier for accounts allowed to mint/burn outcome shares.
    bytes32 public constant MINTER_BURNER_ROLE = keccak256("MINTER_BURNER_ROLE");

    /// @notice Number of bits used to encode the outcome id within a token id.
    uint8 private constant OUTCOME_ID_BITS = 8;

    /// @notice Mask for extracting the outcome id portion of a token id.
    uint256 private constant OUTCOME_ID_MASK = (1 << OUTCOME_ID_BITS) - 1;

    /// @notice Address of the router that should be auto-approved for transfers.
    address public router;

    /// @notice Base URI used for token metadata. Should contain the {id} placeholder.
    string private baseUri;

    event RouterUpdated(address indexed newRouter);
    event BaseUriUpdated(string newBaseUri);

    constructor(string memory initialBaseUri, address initialRouter) ERC1155(initialBaseUri) {
        require(initialRouter != address(0), "Outcome1155: router required");

        baseUri = initialBaseUri;
        router = initialRouter;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_BURNER_ROLE, msg.sender);
        _setRoleAdmin(MINTER_BURNER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    // -------------------------------------------------------------------------
    // Token ID helpers
    // -------------------------------------------------------------------------

    /// @notice Compose a token id from a market id and outcome id.
    function encodeTokenId(uint256 marketId, uint8 outcomeId) public pure returns (uint256) {
        return (marketId << OUTCOME_ID_BITS) | outcomeId;
    }

    /// @notice Extract the market id from a token id.
    function decodeMarketId(uint256 tokenId) public pure returns (uint256) {
        return tokenId >> OUTCOME_ID_BITS;
    }

    /// @notice Extract the outcome id from a token id.
    function decodeOutcomeId(uint256 tokenId) public pure returns (uint8) {
        return uint8(tokenId & OUTCOME_ID_MASK);
    }

    // -------------------------------------------------------------------------
    // Mint / Burn
    // -------------------------------------------------------------------------

    /// @notice Mint outcome shares to a recipient. Only callable by MINTER_BURNER_ROLE.
    function mintOutcome(address to, uint256 marketId, uint8 outcomeId, uint256 amount)
        external
        onlyRole(MINTER_BURNER_ROLE)
    {
        _mint(to, encodeTokenId(marketId, outcomeId), amount, "");
    }

    /// @notice Mint multiple outcome ids in a single batch.
    function mintOutcomeBatch(address to, uint256 marketId, uint8[] calldata outcomeIds, uint256[] calldata amounts)
        external
        onlyRole(MINTER_BURNER_ROLE)
    {
        require(outcomeIds.length == amounts.length, "Outcome1155: length mismatch");

        uint256 len = outcomeIds.length;
        uint256[] memory tokenIds = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            tokenIds[i] = encodeTokenId(marketId, outcomeIds[i]);
        }

        _mintBatch(to, tokenIds, amounts, "");
    }

    /// @notice Burn a specific amount of outcome shares from an account.
    function burnOutcome(address from, uint256 marketId, uint8 outcomeId, uint256 amount)
        external
        onlyRole(MINTER_BURNER_ROLE)
    {
        _burn(from, encodeTokenId(marketId, outcomeId), amount);
    }

    /// @notice Burn multiple outcome ids from an account in a single batch.
    function burnOutcomeBatch(address from, uint256 marketId, uint8[] calldata outcomeIds, uint256[] calldata amounts)
        external
        onlyRole(MINTER_BURNER_ROLE)
    {
        require(outcomeIds.length == amounts.length, "Outcome1155: length mismatch");

        uint256 len = outcomeIds.length;
        uint256[] memory tokenIds = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            tokenIds[i] = encodeTokenId(marketId, outcomeIds[i]);
        }

        _burnBatch(from, tokenIds, amounts);
    }

    // -------------------------------------------------------------------------
    // Admin controls
    // -------------------------------------------------------------------------

    /// @notice Update the router address that receives default approval.
    function setRouter(address newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRouter != address(0), "Outcome1155: router required");
        router = newRouter;
        emit RouterUpdated(newRouter);
    }

    /// @notice Update the base metadata URI. Should include the {id} placeholder.
    function setBaseUri(string calldata newBaseUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseUri = newBaseUri;
        _setURI(newBaseUri);
        emit BaseUriUpdated(newBaseUri);
    }

    /// @inheritdoc ERC1155
    function uri(uint256 id) public view override returns (string memory) {
        return bytes(baseUri).length == 0 ? "" : _replaceIdPlaceholder(id);
    }

    /// @notice Internal helper to replace the {id} placeholder in the base URI.
    function _replaceIdPlaceholder(uint256 id) internal view returns (string memory) {
        // ERC-1155 metadata requires lowercase hex, zero padded to 64 chars.
        string memory hexId = _toPaddedHexString(id);
        bytes memory baseBytes = bytes(baseUri);
        bytes memory placeholder = bytes("{id}");

        // If the base URI does not contain the placeholder, just append the id.
        if (!_contains(baseBytes, placeholder)) {
            return string(abi.encodePacked(baseUri, hexId));
        }

        return _replace(baseBytes, placeholder, bytes(hexId));
    }

    /// @notice Returns true if the pattern exists in data.
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

    /// @notice Replace all occurrences of a pattern within data with replacement.
    function _replace(bytes memory data, bytes memory pattern, bytes memory replacement)
        private
        pure
        returns (string memory)
    {
        if (pattern.length == 0) {
            return string(data);
        }

        // Count occurrences
        uint256 count;
        for (uint256 i = 0; i <= data.length - pattern.length; i++) {
            bool matchFound = true;
            for (uint256 j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    matchFound = false;
                    break;
                }
            }
            if (matchFound) {
                count++;
                i += pattern.length - 1;
            }
        }

        if (count == 0) {
            return string(data);
        }

        uint256 newLength = data.length + count * (replacement.length - pattern.length);
        bytes memory result = new bytes(newLength);

        uint256 k;
        for (uint256 i = 0; i < data.length;) {
            bool matchFound = true;
            if (i + pattern.length <= data.length) {
                for (uint256 j = 0; j < pattern.length; j++) {
                    if (data[i + j] != pattern[j]) {
                        matchFound = false;
                        break;
                    }
                }
            } else {
                matchFound = false;
            }

            if (matchFound) {
                for (uint256 j = 0; j < replacement.length; j++) {
                    result[k++] = replacement[j];
                }
                i += pattern.length;
            } else {
                result[k++] = data[i++];
            }
        }

        return string(result);
    }

    /// @notice Convert id to lowercase hex string padded to 64 characters.
    function _toPaddedHexString(uint256 id) private pure returns (string memory) {
        bytes memory full = bytes(_toHex(id));
        bytes memory trimmed = new bytes(64);
        for (uint256 i = 0; i < 64; i++) {
            trimmed[i] = full[i + 2]; // skip 0x prefix
        }
        return string(trimmed);
    }

    function _toHex(uint256 value) private pure returns (string memory) {
        bytes16 hexSymbols = "0123456789abcdef";
        bytes memory buffer = new bytes(2 + 64);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 0; i < 64; ++i) {
            buffer[65 - i] = hexSymbols[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }

    /// @inheritdoc ERC1155
    function isApprovedForAll(address account, address operator) public view override returns (bool) {
        if (operator == router) {
            return true;
        }
        return super.isApprovedForAll(account, operator);
    }
    /// @inheritdoc ERC1155

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
