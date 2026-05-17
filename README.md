# NFT Assignment: Soulbound ERC-721 + ERC-1155 Game Characters

This branch adds two separate NFT contracts to the Hardhat project:

- `contracts/SoulboundVisitCardERC721.sol`
- `contracts/GameCharacterCollectionERC1155.sol`

Both contracts use Solidity `0.8.24` and audited OpenZeppelin contracts.

## Assignment Coverage

### 1. Soulbound student visit card

`SoulboundVisitCardERC721.sol` implements:

- OpenZeppelin `ERC721`
- owner-only minting through `mintVisitCard`
- exactly one NFT per student wallet
- custom `tokenURI` per student visit card
- disabled `approve`, `setApprovalForAll`, `transferFrom`, and `safeTransferFrom`
- internal `_update` protection so minted tokens cannot move later

### 2. ERC-1155 game character collection

`GameCharacterCollectionERC1155.sol` implements:

- OpenZeppelin `ERC1155`
- 10 distinct token IDs
- unique metadata URI for each token ID
- unique image URI plus attributes stored in the contract definition
- owner-only single and batch minting
- standard ERC-1155 approval and transfer behavior
- batch minting and batch transfer support

## Project Files

- `contracts/SoulboundVisitCardERC721.sol` - soulbound ERC-721 student visit card
- `contracts/GameCharacterCollectionERC1155.sol` - ERC-1155 game character collection
- `scripts/deploy-soulbound-visit-card.ts` - deploy ERC-721 contract
- `scripts/mint-soulbound-visit-card.ts` - mint one visit card to the student wallet
- `scripts/deploy-game-character-collection.ts` - deploy ERC-1155 contract with 10 predefined characters
- `scripts/mint-game-characters.ts` - batch mint all 10 NFTs and batch transfer 1 or 2 to the student wallet
- `scripts/nft-helpers.ts` - shared deployment helpers and default character configuration
- `test/SoulboundVisitCardERC721.ts` - ERC-721 tests
- `test/GameCharacterCollectionERC1155.ts` - ERC-1155 tests

## Install

```bash
npm install
```

## Compile

```bash
npm run compile
```

## Run Tests

```bash
npm test
```

## Environment Variables

Copy `.env.example` to `.env` and fill the required values.

```dotenv
SEPOLIA_RPC_URL=
PRIVATE_KEY=

VISIT_CARD_NAME=Student Visit Card
VISIT_CARD_SYMBOL=SVC
VISIT_CARD_METADATA_URI=

STUDENT_WALLET=
STUDENT_CHARACTER_IDS=1,2

GAME_CHARACTER_METADATA_BASE_URI=
GAME_CHARACTER_IMAGE_BASE_URI=
```

### Required values

- `SEPOLIA_RPC_URL` - Sepolia RPC endpoint
- `PRIVATE_KEY` - deployer/admin private key
- `STUDENT_WALLET` - wallet that will receive the soulbound NFT and 1 or 2 ERC-1155 NFTs
- `VISIT_CARD_METADATA_URI` - metadata URI for the specific student visit card
- `GAME_CHARACTER_METADATA_BASE_URI` - base IPFS folder URI for ERC-1155 metadata JSON files
- `GAME_CHARACTER_IMAGE_BASE_URI` - base IPFS folder URI for character images

### Optional values

- `VISIT_CARD_NAME` - defaults to `Student Visit Card`
- `VISIT_CARD_SYMBOL` - defaults to `SVC`
- `STUDENT_CHARACTER_IDS` - comma-separated list of `1` or `2` token IDs to transfer to the student, defaults to `1,2`

## Local Workflow

### 1. Deploy the soulbound ERC-721 contract

```bash
npm run deploy:visitcard
```

This writes the deployment data to:

- `deployments/sepolia-soulbound-visit-card-erc721.json`

### 2. Mint the student visit card NFT

```bash
npm run mint:visitcard
```

What this script does:

- loads the deployed ERC-721 address
- mints exactly one NFT to `STUDENT_WALLET`
- stores the student-specific metadata URI on-chain
- prints the mint transaction hash

### 3. Deploy the ERC-1155 game character collection

```bash
npm run deploy:characters
```

This writes the deployment data to:

- `deployments/sepolia-game-character-collection-erc1155.json`

The deployment script automatically creates 10 predefined character definitions with:

- unique `metadataURI`
- unique `imageURI`
- `color`
- `speed`
- `strength`
- `rarity`

### 4. Batch mint the 10 game character NFTs and transfer 1 or 2 to the student wallet

```bash
npm run mint:characters
```

What this script does:

- batch mints token IDs `1..10` with amount `1` each to the owner wallet
- batch transfers the IDs in `STUDENT_CHARACTER_IDS` to `STUDENT_WALLET`
- prints both the batch mint and batch transfer transaction hashes

## Metadata Structure

The contracts store metadata off-chain via IPFS URIs.

### ERC-721 visit card metadata example

`VISIT_CARD_METADATA_URI` should point to a JSON file like this:

```json
{
  "name": "Student Visit Card #1",
  "description": "Soulbound student visit card NFT",
  "image": "ipfs://YOUR_IMAGE_CID/student-001.png",
  "attributes": [
    { "trait_type": "studentName", "value": "Alice Johnson" },
    { "trait_type": "studentID", "value": "ST-2026-001" },
    { "trait_type": "course", "value": "Blockchain Development" },
    { "trait_type": "year", "value": "2026" }
  ]
}
```

### ERC-1155 character metadata example

Each ERC-1155 metadata file should follow marketplace-compatible JSON structure:

```json
{
  "name": "Arcane Knight",
  "description": "Game character NFT from the ERC-1155 collection",
  "image": "ipfs://YOUR_IMAGE_CID/arcane-knight.png",
  "attributes": [
    { "trait_type": "color", "value": "Crimson" },
    { "trait_type": "speed", "value": 72 },
    { "trait_type": "strength", "value": 91 },
    { "trait_type": "rarity", "value": "legendary" }
  ]
}
```

## Contract Notes

### SoulboundVisitCardERC721

- only the owner can mint
- one wallet can hold only one visit card
- approvals are disabled
- transfers are disabled
- each token has its own metadata URI

### GameCharacterCollectionERC1155

- supports standard ERC-1155 transfers and approvals
- provides batch minting via `mintBatch`
- uses 10 predefined token IDs
- `uri(tokenId)` returns the metadata URI for that specific ID
- `characterDefinition(tokenId)` returns the image URI and attributes stored on-chain

## Proof Of Functionality For Submission

After running the Sepolia scripts, include the following in your submission:

1. ERC-721 contract deployment transaction hash
2. ERC-721 mint transaction hash showing one soulbound visit card minted to the student wallet
3. ERC-1155 contract deployment transaction hash
4. ERC-1155 batch mint transaction hash showing all 10 NFTs minted
5. ERC-1155 batch transfer transaction hash showing 1 or 2 NFTs sent to the student wallet
6. screenshots from Sepolia Etherscan or another explorer confirming ownership and balances

## Notes

- The two contracts are separate to avoid interface and event conflicts between ERC-721 and ERC-1155.
- The ERC-721 metadata is stored off-chain per token with `tokenURI`.
- The ERC-1155 metadata is stored off-chain per token ID with `uri(tokenId)`.
- The actual IPFS upload step must be done before Sepolia deployment if you want fully valid marketplace metadata.
