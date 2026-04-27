import { expect } from "chai";
import { network } from "hardhat";

describe("KosToken", function () {
  async function deployTokenFixture() {
    const { ethers } = await network.create();

    const [owner, user1, user2] = await ethers.getSigners();

    const MyToken = await ethers.getContractFactory("MyToken");
    const initialSupply = ethers.parseEther("1000000");

    const token = await MyToken.deploy(initialSupply);
    await token.waitForDeployment();

    return { ethers, token, owner, user1, user2, initialSupply };
  }

  it("Should deploy with correct initial supply", async function () {
    const { token, owner, initialSupply } = await deployTokenFixture();

    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should have correct name and symbol", async function () {
    const { token } = await deployTokenFixture();

    expect(await token.name()).to.equal("KosToken");
    expect(await token.symbol()).to.equal("KOS");
  });

  it("Should allow owner to mint tokens", async function () {
    const { ethers, token, user1 } = await deployTokenFixture();

    const mintAmount = ethers.parseEther("1000");

    await token.mint(user1.address, mintAmount);

    expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
  });

  it("Should transfer tokens between accounts", async function () {
    const { ethers, token, owner, user1 } = await deployTokenFixture();

    const amount = ethers.parseEther("500");

    await token.transfer(user1.address, amount);

    expect(await token.balanceOf(user1.address)).to.equal(amount);

    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseEther("999500"));
  });

 it("Should fail when transferring more than balance", async function () {
  const { ethers, token, user1, user2 } = await deployTokenFixture();

  const amount = ethers.parseEther("1");

  await expect(
    token.connect(user1).transfer(user2.address, amount)
  ).to.be.revert(ethers);
});

it("Should not allow non-owner to mint tokens", async function () {
  const { ethers, token, user1, user2 } = await deployTokenFixture();

  const mintAmount = ethers.parseEther("100");

  await expect(
    token.connect(user1).mint(user2.address, mintAmount)
  ).to.be.revert(ethers);
});
});
