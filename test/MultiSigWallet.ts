import { expect } from "chai";
import { network } from "hardhat";

describe("MultiSigWallet", function () {
  async function deployFixture() {
    const { ethers } = await network.create();
    const [owner1, owner2, owner3, outsider, recipient] = await ethers.getSigners();

    const owners = [owner1.address, owner2.address, owner3.address];
    const requiredConfirmations = 2n;

    const wallet = await ethers.deployContract("MultiSigWallet", [
      owners,
      requiredConfirmations,
    ]);
    await wallet.waitForDeployment();

    const target = await ethers.deployContract("MultiSigWalletTarget");
    await target.waitForDeployment();

    const token = await ethers.deployContract("MyToken", [
      ethers.parseEther("1000000"),
    ]);
    await token.waitForDeployment();

    return {
      ethers,
      owner1,
      owner2,
      owner3,
      outsider,
      recipient,
      owners,
      requiredConfirmations,
      wallet,
      target,
      token,
    };
  }

  it("deploys with the expected owners and threshold", async function () {
    const { wallet, owners, requiredConfirmations } = await deployFixture();

    expect(await wallet.required()).to.equal(requiredConfirmations);
    expect(await wallet.getOwners()).to.deep.equal(owners);
    expect(await wallet.getTransactionCount()).to.equal(0n);

    for (const owner of owners) {
      expect(await wallet.isOwner(owner)).to.equal(true);
    }
  });

  it("lets an owner submit a transaction proposal", async function () {
    const { owner1, wallet, target } = await deployFixture();
    const data = target.interface.encodeFunctionData("setValue", [42n]);

    await expect(
      wallet.connect(owner1).submitTransaction(await target.getAddress(), 0n, data),
    )
      .to.emit(wallet, "SubmitTransaction")
      .withArgs(owner1.address, 0n, await target.getAddress(), 0n, data);

    const transaction = await wallet.getTransaction(0n);
    expect(transaction[0]).to.equal(await target.getAddress());
    expect(transaction[1]).to.equal(0n);
    expect(transaction[2]).to.equal(data);
    expect(transaction[3]).to.equal(false);
    expect(transaction[4]).to.equal(0n);
  });

  it("tracks confirmations and allows revocation before execution", async function () {
    const { owner1, owner2, wallet, target } = await deployFixture();
    const data = target.interface.encodeFunctionData("setValue", [7n]);

    await wallet.connect(owner1).submitTransaction(await target.getAddress(), 0n, data);
    await wallet.connect(owner1).confirmTransaction(0n);
    await wallet.connect(owner2).confirmTransaction(0n);

    let transaction = await wallet.getTransaction(0n);
    expect(transaction[4]).to.equal(2n);
    expect(await wallet.isConfirmed(0n, owner2.address)).to.equal(true);

    await expect(wallet.connect(owner2).revokeConfirmation(0n))
      .to.emit(wallet, "RevokeConfirmation")
      .withArgs(owner2.address, 0n);

    transaction = await wallet.getTransaction(0n);
    expect(transaction[4]).to.equal(1n);
    expect(await wallet.isConfirmed(0n, owner2.address)).to.equal(false);

    await expect(wallet.connect(owner1).executeTransaction(0n))
      .to.be.revertedWithCustomError(wallet, "InsufficientConfirmations")
      .withArgs(1n, 2n);
  });

  it("executes an Ether transfer only after the threshold is met", async function () {
    const { ethers, owner1, owner2, owner3, recipient, wallet } = await deployFixture();
    const fundedAmount = ethers.parseEther("2");
    const transferAmount = ethers.parseEther("0.5");

    await owner1.sendTransaction({
      to: await wallet.getAddress(),
      value: fundedAmount,
    });

    const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);

    await wallet.connect(owner1).submitTransaction(recipient.address, transferAmount, "0x");
    await wallet.connect(owner1).confirmTransaction(0n);
    await wallet.connect(owner2).confirmTransaction(0n);

    await expect(wallet.connect(owner3).executeTransaction(0n))
      .to.emit(wallet, "ExecuteTransaction")
      .withArgs(owner3.address, 0n);

    const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
    const transaction = await wallet.getTransaction(0n);

    expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(transferAmount);
    expect(await ethers.provider.getBalance(await wallet.getAddress())).to.equal(
      fundedAmount - transferAmount,
    );
    expect(transaction[3]).to.equal(true);
  });

  it("can execute ERC20 transfers through arbitrary call data", async function () {
    const { ethers, owner1, owner2, recipient, wallet, token } = await deployFixture();
    const walletFunding = ethers.parseEther("100");
    const tokenTransfer = ethers.parseEther("40");

    await token.transfer(await wallet.getAddress(), walletFunding);

    const data = token.interface.encodeFunctionData("transfer", [
      recipient.address,
      tokenTransfer,
    ]);

    await wallet.connect(owner1).submitTransaction(await token.getAddress(), 0n, data);
    await wallet.connect(owner1).confirmTransaction(0n);
    await wallet.connect(owner2).confirmTransaction(0n);
    await wallet.connect(owner1).executeTransaction(0n);

    expect(await token.balanceOf(recipient.address)).to.equal(tokenTransfer);
    expect(await token.balanceOf(await wallet.getAddress())).to.equal(
      walletFunding - tokenTransfer,
    );
  });

  it("rejects duplicate confirmations, unauthorized access, and invalid transaction ids", async function () {
    const { owner1, outsider, wallet, target } = await deployFixture();
    const data = target.interface.encodeFunctionData("setValue", [1n]);

    await wallet.connect(owner1).submitTransaction(await target.getAddress(), 0n, data);
    await wallet.connect(owner1).confirmTransaction(0n);

    await expect(wallet.connect(owner1).confirmTransaction(0n))
      .to.be.revertedWithCustomError(wallet, "TransactionAlreadyConfirmed")
      .withArgs(0n, owner1.address);

    await expect(wallet.connect(outsider).submitTransaction(await target.getAddress(), 0n, data))
      .to.be.revertedWithCustomError(wallet, "NotOwner")
      .withArgs(outsider.address);

    await expect(wallet.connect(owner1).confirmTransaction(99n))
      .to.be.revertedWithCustomError(wallet, "TransactionDoesNotExist")
      .withArgs(99n);
  });
});
