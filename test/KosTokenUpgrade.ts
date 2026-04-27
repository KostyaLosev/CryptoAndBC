import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("KosToken upgrade flow", function () {
  async function deployUpgradeableTokenFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const initialSupply = ethers.parseEther("1000000");

    const implementationV1 = await ethers.deployContract("KosTokenV1");
    await implementationV1.waitForDeployment();

    const initData = implementationV1.interface.encodeFunctionData("initialize", [
      owner.address,
      initialSupply,
    ]);

    const proxy = await ethers.deployContract("KosTokenProxy", [
      await implementationV1.getAddress(),
      initData,
    ]);
    await proxy.waitForDeployment();

    const tokenV1 = await ethers.getContractAt("KosTokenV1", await proxy.getAddress());

    return {
      owner,
      user1,
      user2,
      initialSupply,
      implementationV1,
      proxy,
      tokenV1,
    };
  }

  it("mints and transfers through the V1 proxy", async function () {
    const { owner, user1, user2, tokenV1 } = await deployUpgradeableTokenFixture();

    const mintAmount = ethers.parseEther("1000");
    const transferAmount = ethers.parseEther("250");

    await tokenV1.connect(owner).mint(user1.address, mintAmount);
    await tokenV1.connect(owner).transfer(user2.address, transferAmount);

    expect(await tokenV1.balanceOf(user1.address)).to.equal(mintAmount);
    expect(await tokenV1.balanceOf(user2.address)).to.equal(transferAmount);
  });

  it("upgrades to V2 without losing balances", async function () {
    const { owner, user1, user2, initialSupply, proxy, tokenV1 } =
      await deployUpgradeableTokenFixture();

    const mintAmount = ethers.parseEther("1000");
    const transferAmount = ethers.parseEther("250");

    await tokenV1.connect(owner).mint(user1.address, mintAmount);
    await tokenV1.connect(owner).transfer(user2.address, transferAmount);

    const implementationV2 = await ethers.deployContract("KosTokenV2");
    await implementationV2.waitForDeployment();

    const tokenV2 = await ethers.getContractAt("KosTokenV2", await proxy.getAddress());

    await tokenV2.upgradeToAndCall(await implementationV2.getAddress(), "0x");

    expect(await tokenV2.version()).to.equal("V2");
    expect(await tokenV2.balanceOf(owner.address)).to.equal(
      initialSupply - transferAmount,
    );
    expect(await tokenV2.balanceOf(user1.address)).to.equal(mintAmount);
    expect(await tokenV2.balanceOf(user2.address)).to.equal(transferAmount);
    expect(await tokenV2.name()).to.equal("KosToken");
    expect(await tokenV2.symbol()).to.equal("KOS");
  });
});
