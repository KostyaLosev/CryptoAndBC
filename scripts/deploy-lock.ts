import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create("sepolia");

  const unlockTime = Math.floor(Date.now() / 1000) + 60;

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime);

  await lock.waitForDeployment();

  console.log("Lock deployed to:", await lock.getAddress());
  console.log("TX:", lock.deploymentTransaction()?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});