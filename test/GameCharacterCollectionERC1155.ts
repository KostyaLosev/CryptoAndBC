import { expect } from "chai";
import { network } from "hardhat";

import { buildDefaultCharacterConfigs } from "../scripts/nft-helpers.js";

describe("GameCharacterCollectionERC1155", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [owner, student, operator, outsider] = await ethers.getSigners();
    const characterConfigs = buildDefaultCharacterConfigs(
      "ipfs://game-character-metadata",
      "ipfs://game-character-images",
    );

    const contract = await ethers.deployContract("GameCharacterCollectionERC1155", [
      owner.address,
      characterConfigs,
    ]);
    await contract.waitForDeployment();

    return { contract, owner, student, operator, outsider, characterConfigs };
  }

  it("stores a unique metadata URI and attributes for each configured character", async function () {
    const { contract, characterConfigs } = await deployFixture();

    expect(await contract.uri(1n)).to.equal("ipfs://game-character-metadata/1.json");
    expect(await contract.uri(10n)).to.equal("ipfs://game-character-metadata/10.json");

    const definition = await contract.characterDefinition(1n);

    expect(definition[0]).to.equal(characterConfigs[0].name);
    expect(definition[1]).to.equal(characterConfigs[0].imageURI);
    expect(definition[2]).to.equal(characterConfigs[0].metadataURI);
    expect(definition[3]).to.equal(characterConfigs[0].color);
    expect(definition[4]).to.equal(characterConfigs[0].speed);
    expect(definition[5]).to.equal(characterConfigs[0].strength);
    expect(definition[6]).to.equal(characterConfigs[0].rarity);
  });

  it("restricts minting to the contract owner", async function () {
    const { contract, outsider, student } = await deployFixture();

    await expect(
      contract.connect(outsider).mintCharacter(student.address, 1n, 1n, "0x"),
    )
      .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(outsider.address);
  });

  it("supports batch minting all 10 character NFTs and batch transfer to the student wallet", async function () {
    const { contract, owner, student } = await deployFixture();
    const tokenIds = Array.from({ length: 10 }, (_, index) => BigInt(index + 1));
    const amounts = Array.from({ length: 10 }, () => 1n);
    const transferredIds = [1n, 2n];
    const transferredAmounts = [1n, 1n];

    await expect(contract.mintBatch(owner.address, tokenIds, amounts, "0x"))
      .to.emit(contract, "CharacterBatchMinted")
      .withArgs(owner.address, tokenIds, amounts);

    await contract.safeBatchTransferFrom(
      owner.address,
      student.address,
      transferredIds,
      transferredAmounts,
      "0x",
    );

    expect(await contract.balanceOf(student.address, 1n)).to.equal(1n);
    expect(await contract.balanceOf(student.address, 2n)).to.equal(1n);
    expect(await contract.balanceOf(owner.address, 1n)).to.equal(0n);
    expect(await contract.balanceOf(owner.address, 2n)).to.equal(0n);
    expect(await contract.balanceOf(owner.address, 3n)).to.equal(1n);
  });

  it("keeps standard ERC1155 approval and operator transfer behavior enabled", async function () {
    const { contract, owner, student, operator } = await deployFixture();

    await contract.mintCharacter(owner.address, 1n, 2n, "0x");
    await contract.setApprovalForAll(operator.address, true);

    await contract.connect(operator).safeTransferFrom(
      owner.address,
      student.address,
      1n,
      1n,
      "0x",
    );

    expect(await contract.balanceOf(student.address, 1n)).to.equal(1n);
    expect(await contract.balanceOf(owner.address, 1n)).to.equal(1n);
    expect(await contract.isApprovedForAll(owner.address, operator.address)).to.equal(true);
  });

  it("rejects undefined token ids", async function () {
    const { contract, owner } = await deployFixture();

    await expect(contract.uri(11n))
      .to.be.revertedWithCustomError(contract, "InvalidTokenId")
      .withArgs(11n);

    await expect(contract.mintCharacter(owner.address, 11n, 1n, "0x"))
      .to.be.revertedWithCustomError(contract, "InvalidTokenId")
      .withArgs(11n);
  });
});
