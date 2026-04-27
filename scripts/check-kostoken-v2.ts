import { network } from "hardhat";

import { loadDeployment } from "./kostoken-helpers.js";

const connection = await network.create("sepolia");
const { ethers, networkName } = connection;

const deployment = await loadDeployment(networkName);
const tokenV2 = await ethers.getContractAt("KosTokenV2", deployment.proxyAddress);

console.log("Proxy:", deployment.proxyAddress);
console.log("version() via proxy:", await tokenV2.version());
console.log("totalSupply() via proxy:", (await tokenV2.totalSupply()).toString());
console.log(
  "Owner balance via proxy:",
  (await tokenV2.balanceOf(deployment.owner)).toString(),
);

if (deployment.mintRecipient !== undefined) {
  console.log(
    "Mint recipient balance via proxy:",
    (await tokenV2.balanceOf(deployment.mintRecipient)).toString(),
  );
}

if (deployment.transferRecipient !== undefined) {
  console.log(
    "Transfer recipient balance via proxy:",
    (await tokenV2.balanceOf(deployment.transferRecipient)).toString(),
  );
}
