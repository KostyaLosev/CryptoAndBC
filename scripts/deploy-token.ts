import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create("sepolia");

  const MyToken = await ethers.getContractFactory("MyToken");
  const initialSupply = ethers.parseEther("1000000");

  const myToken = await MyToken.deploy(initialSupply);
  await myToken.waitForDeployment();

  console.log("KosToken deployed to:", await myToken.getAddress());
  console.log("Deployment tx hash:", myToken.deploymentTransaction()?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});