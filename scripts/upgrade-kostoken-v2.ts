import { network } from "hardhat";

import {
  IMPLEMENTATION_SLOT,
  implementationFromSlot,
  loadDeployment,
  saveDeployment,
} from "./kostoken-helpers.js";

const connection = await network.create("sepolia");
const { ethers, networkName } = connection;

const deployment = await loadDeployment(networkName);

const implementationV2 = await ethers.deployContract("KosTokenV2");
await implementationV2.waitForDeployment();

const tokenV2 = await ethers.getContractAt("KosTokenV2", deployment.proxyAddress);
const upgradeTx = await tokenV2.upgradeToAndCall(
  await implementationV2.getAddress(),
  "0x",
);
await upgradeTx.wait();

const rawImplementationSlot = await ethers.provider.getStorage(
  deployment.proxyAddress,
  IMPLEMENTATION_SLOT,
);

deployment.implementationV2Address = await implementationV2.getAddress();
deployment.implementationV2TxHash = implementationV2.deploymentTransaction()?.hash;
deployment.upgradeTxHash = upgradeTx.hash;

await saveDeployment(networkName, deployment);

console.log("Proxy:", deployment.proxyAddress);
console.log("V2 implementation:", await implementationV2.getAddress());
console.log("V2 implementation deployment tx:", implementationV2.deploymentTransaction()?.hash);
console.log("Upgrade tx:", upgradeTx.hash);
console.log("Implementation slot after upgrade:", implementationFromSlot(rawImplementationSlot));
console.log("version() via proxy:", await tokenV2.version());

if (deployment.mintRecipient !== undefined) {
  console.log(
    "Mint recipient balance after upgrade:",
    (await tokenV2.balanceOf(deployment.mintRecipient)).toString(),
  );
}

if (deployment.transferRecipient !== undefined) {
  console.log(
    "Transfer recipient balance after upgrade:",
    (await tokenV2.balanceOf(deployment.transferRecipient)).toString(),
  );
}

console.log(
  "Owner balance after upgrade:",
  (await tokenV2.balanceOf(deployment.owner)).toString(),
);
