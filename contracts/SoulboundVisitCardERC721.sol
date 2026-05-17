// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SoulboundVisitCardERC721 is ERC721, Ownable {
    error EmptyMetadataURI();
    error InvalidStudent(address student);
    error SoulboundApprovalsDisabled();
    error SoulboundTransfersDisabled();
    error StudentAlreadyHasVisitCard(address student);

    event VisitCardMinted(
        address indexed student,
        uint256 indexed tokenId,
        string metadataURI
    );

    uint256 private s_nextTokenId = 1;
    mapping(uint256 tokenId => string) private s_tokenUris;
    mapping(address student => uint256 tokenId) private s_studentTokenIds;

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {}

    function mintVisitCard(
        address student,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        if (student == address(0)) {
            revert InvalidStudent(student);
        }
        if (bytes(metadataURI).length == 0) {
            revert EmptyMetadataURI();
        }
        if (s_studentTokenIds[student] != 0) {
            revert StudentAlreadyHasVisitCard(student);
        }

        tokenId = s_nextTokenId;
        s_nextTokenId += 1;

        s_studentTokenIds[student] = tokenId;
        s_tokenUris[tokenId] = metadataURI;

        _safeMint(student, tokenId);

        emit VisitCardMinted(student, tokenId, metadataURI);
    }

    function tokenOfStudent(address student) external view returns (uint256) {
        return s_studentTokenIds[student];
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        return s_tokenUris[tokenId];
    }

    function approve(address, uint256) public pure override {
        revert SoulboundApprovalsDisabled();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundApprovalsDisabled();
    }

    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundTransfersDisabled();
    }

    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert SoulboundTransfersDisabled();
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) {
            revert SoulboundTransfersDisabled();
        }

        return super._update(to, tokenId, auth);
    }
}
