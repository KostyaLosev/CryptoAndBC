import { network } from "hardhat";

import { loadDeployment, saveDeployment } from "./kostoken-helpers.js";

const connection = await network.create("sepolia");
const { ethers, networkName } = connection;

const deployment = await loadDeployment(networkName);
const [owner, secondSigner] = await ethers.getSigners();

const mintRecipient =
  process.env.MINT_TO_ADDRESS ?? secondSigner?.address ?? deployment.owner;
const transferRecipient =
  process.env.TRANSFER_TO_ADDRESS ?? secondSigner?.address;

if (transferRecipient === undefined) {
  throw new Error(
    "Set TRANSFER_TO_ADDRESS in .env when using Sepolia with a single configured signer.",
  );
}

const mintAmount = ethers.parseEther("1000");
const transferAmount = ethers.parseEther("250");

const token = await ethers.getContractAt("KosTokenV1", deployment.proxyAddress);

const mintTx = await token.connect(owner).mint(mintRecipient, mintAmount);
await mintTx.wait();

const transferTx = await token
  .connect(owner)
  .transfer(transferRecipient, transferAmount);
await transferTx.wait();

deployment.mintRecipient = mintRecipient;
deployment.transferRecipient = transferRecipient;
deployment.mintTxHash = mintTx.hash;
deployment.transferTxHash = transferTx.hash;

await saveDeployment(networkName, deployment);

console.log("Proxy:", deployment.proxyAddress);
console.log("Mint tx:", mintTx.hash);
console.log("Transfer tx:", transferTx.hash);
console.log(
  "Mint recipient balance on V1 proxy:",
  (await token.balanceOf(mintRecipient)).toString(),
);
console.log(
  "Transfer recipient balance on V1 proxy:",
  (await token.balanceOf(transferRecipient)).toString(),
);
console.log(
  "Owner balance on V1 proxy:",
  (await token.balanceOf(owner.address)).toString(),
);
