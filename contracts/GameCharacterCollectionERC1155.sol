// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract GameCharacterCollectionERC1155 is ERC1155, Ownable {
    uint256 public constant CHARACTER_COUNT = 10;

    error EmptyImageURI(uint256 tokenId);
    error EmptyMetadataURI(uint256 tokenId);
    error InvalidCharacterConfigLength(uint256 actualLength);
    error InvalidTokenId(uint256 tokenId);

    struct CharacterConfig {
        string name;
        string imageURI;
        string metadataURI;
        string color;
        uint256 speed;
        uint256 strength;
        string rarity;
    }

    struct CharacterDefinition {
        string name;
        string imageURI;
        string metadataURI;
        string color;
        uint256 speed;
        uint256 strength;
        string rarity;
        bool exists;
    }

    event CharacterBatchMinted(
        address indexed to,
        uint256[] tokenIds,
        uint256[] amounts
    );
    event CharacterMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );

    mapping(uint256 tokenId => CharacterDefinition) private s_characterDefinitions;

    constructor(
        address initialOwner,
        CharacterConfig[] memory characterConfigs
    ) ERC1155("") Ownable(initialOwner) {
        if (characterConfigs.length != CHARACTER_COUNT) {
            revert InvalidCharacterConfigLength(characterConfigs.length);
        }

        for (uint256 i = 0; i < CHARACTER_COUNT; i++) {
            _setCharacterDefinition(i + 1, characterConfigs[i]);
        }
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        _requireValidTokenId(tokenId);
        return s_characterDefinitions[tokenId].metadataURI;
    }

    function mintCharacter(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external onlyOwner {
        _requireValidTokenId(tokenId);
        _mint(to, tokenId, amount, data);
        emit CharacterMinted(to, tokenId, amount);
    }

    function mintBatch(
        address to,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        bytes calldata data
    ) external onlyOwner {
        _validateTokenIds(tokenIds);
        _mintBatch(to, tokenIds, amounts, data);
        emit CharacterBatchMinted(to, tokenIds, amounts);
    }

    function characterDefinition(
        uint256 tokenId
    )
        external
        view
        returns (
            string memory name,
            string memory imageURI,
            string memory metadataURI,
            string memory color,
            uint256 speed,
            uint256 strength,
            string memory rarity
        )
    {
        _requireValidTokenId(tokenId);

        CharacterDefinition storage definition = s_characterDefinitions[tokenId];

        return (
            definition.name,
            definition.imageURI,
            definition.metadataURI,
            definition.color,
            definition.speed,
            definition.strength,
            definition.rarity
        );
    }

    function _setCharacterDefinition(
        uint256 tokenId,
        CharacterConfig memory config
    ) private {
        if (bytes(config.metadataURI).length == 0) {
            revert EmptyMetadataURI(tokenId);
        }
        if (bytes(config.imageURI).length == 0) {
            revert EmptyImageURI(tokenId);
        }

        s_characterDefinitions[tokenId] = CharacterDefinition({
            name: config.name,
            imageURI: config.imageURI,
            metadataURI: config.metadataURI,
            color: config.color,
            speed: config.speed,
            strength: config.strength,
            rarity: config.rarity,
            exists: true
        });

        emit URI(config.metadataURI, tokenId);
    }

    function _validateTokenIds(uint256[] memory tokenIds) private view {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _requireValidTokenId(tokenIds[i]);
        }
    }

    function _requireValidTokenId(uint256 tokenId) private view {
        if (!s_characterDefinitions[tokenId].exists) {
            revert InvalidTokenId(tokenId);
        }
    }
}
