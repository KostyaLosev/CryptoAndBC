import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect("sepolia");

  const Greeting = await ethers.getContractFactory("Greeting");
  const greeting = await Greeting.deploy("Konstantin");
  await greeting.waitForDeployment();

  const address = await greeting.getAddress();
  const tx = greeting.deploymentTransaction();

  console.log("Greeting deployed to:", address);
  console.log("Deployment tx hash:", tx?.hash);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});