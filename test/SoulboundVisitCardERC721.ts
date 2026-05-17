import { expect } from "chai";
import { network } from "hardhat";

describe("SoulboundVisitCardERC721", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [owner, student, outsider] = await ethers.getSigners();

    const contract = await ethers.deployContract("SoulboundVisitCardERC721", [
      "Student Visit Card",
      "SVC",
      owner.address,
    ]);
    await contract.waitForDeployment();

    return { contract, owner, student, outsider };
  }

  it("mints exactly one visit card per student with a custom metadata URI", async function () {
    const { contract, student } = await deployFixture();
    const metadataURI = "ipfs://visit-card-metadata/student-001.json";

    await expect(contract.mintVisitCard(student.address, metadataURI))
      .to.emit(contract, "VisitCardMinted")
      .withArgs(student.address, 1n, metadataURI);

    expect(await contract.ownerOf(1n)).to.equal(student.address);
    expect(await contract.balanceOf(student.address)).to.equal(1n);
    expect(await contract.tokenOfStudent(student.address)).to.equal(1n);
    expect(await contract.tokenURI(1n)).to.equal(metadataURI);
  });

  it("restricts minting to the contract owner", async function () {
    const { contract, outsider, student } = await deployFixture();

    await expect(
      contract.connect(outsider).mintVisitCard(student.address, "ipfs://visit-card-metadata/student-002.json"),
    )
      .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount")
      .withArgs(outsider.address);
  });

  it("prevents minting a second visit card to the same student", async function () {
    const { contract, student } = await deployFixture();

    await contract.mintVisitCard(student.address, "ipfs://visit-card-metadata/student-003.json");

    await expect(
      contract.mintVisitCard(student.address, "ipfs://visit-card-metadata/student-004.json"),
    )
      .to.be.revertedWithCustomError(contract, "StudentAlreadyHasVisitCard")
      .withArgs(student.address);
  });

  it("blocks all approvals after minting", async function () {
    const { contract, student, outsider } = await deployFixture();

    await contract.mintVisitCard(student.address, "ipfs://visit-card-metadata/student-005.json");

    await expect(contract.connect(student).approve(outsider.address, 1n))
      .to.be.revertedWithCustomError(contract, "SoulboundApprovalsDisabled");

    await expect(contract.connect(student).setApprovalForAll(outsider.address, true))
      .to.be.revertedWithCustomError(contract, "SoulboundApprovalsDisabled");
  });

  it("blocks transferFrom and safeTransferFrom to preserve soulbound behavior", async function () {
    const { contract, student, outsider } = await deployFixture();

    await contract.mintVisitCard(student.address, "ipfs://visit-card-metadata/student-006.json");

    await expect(
      contract.connect(student).transferFrom(student.address, outsider.address, 1n),
    ).to.be.revertedWithCustomError(contract, "SoulboundTransfersDisabled");

    await expect(
      contract.connect(student).safeTransferFrom(student.address, outsider.address, 1n),
    ).to.be.revertedWithCustomError(contract, "SoulboundTransfersDisabled");
  });
});
