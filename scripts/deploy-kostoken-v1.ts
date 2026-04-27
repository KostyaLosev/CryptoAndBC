import { network } from "hardhat";

import {
  getDeploymentFilePath,
  IMPLEMENTATION_SLOT,
  implementationFromSlot,
  saveDeployment,
} from "./kostoken-helpers.js";

const connection = await network.create("sepolia");
const { ethers, networkName } = connection;

const [owner] = await ethers.getSigners();
const initialSupply = ethers.parseEther(process.env.INITIAL_SUPPLY ?? "1000000");

const implementation = await ethers.deployContract("KosTokenV1");
await implementation.waitForDeployment();

const initData = implementation.interface.encodeFunctionData("initialize", [
  owner.address,
  initialSupply,
]);

const proxy = await ethers.deployContract("KosTokenProxy", [
  await implementation.getAddress(),
  initData,
]);
await proxy.waitForDeployment();

const token = await ethers.getContractAt("KosTokenV1", await proxy.getAddress());
const rawImplementationSlot = await ethers.provider.getStorage(
  await proxy.getAddress(),
  IMPLEMENTATION_SLOT,
);

const deployment = {
  network: networkName,
  chainId: (await ethers.provider.getNetwork()).chainId.toString(),
  owner: owner.address,
  initialSupply: initialSupply.toString(),
  proxyAddress: await proxy.getAddress(),
  implementationV1Address: await implementation.getAddress(),
  implementationV1TxHash: implementation.deploymentTransaction()?.hash,
  proxyDeploymentTxHash: proxy.deploymentTransaction()?.hash,
};

await saveDeployment(networkName, deployment);

console.log("Owner:", owner.address);
console.log("KosToken V1 implementation:", await implementation.getAddress());
console.log("Proxy:", await proxy.getAddress());
console.log("Implementation slot:", implementationFromSlot(rawImplementationSlot));
console.log("Implementation deployment tx:", implementation.deploymentTransaction()?.hash);
console.log("Proxy deployment tx:", proxy.deploymentTransaction()?.hash);
console.log("Token name via proxy:", await token.name());
console.log("Token symbol via proxy:", await token.symbol());
console.log("Owner balance via proxy:", (await token.balanceOf(owner.address)).toString());
console.log("Deployment file:", getDeploymentFilePath(networkName));
