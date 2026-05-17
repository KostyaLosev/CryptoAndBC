import { network } from "hardhat";

import { saveDeployment } from "./nft-helpers.js";

async function main() {
  const { ethers, networkName } = await network.create("sepolia");
  const [owner] = await ethers.getSigners();

  const collectionName = process.env.VISIT_CARD_NAME?.trim() || "Student Visit Card";
  const collectionSymbol = process.env.VISIT_CARD_SYMBOL?.trim() || "SVC";

  const contract = await ethers.deployContract("SoulboundVisitCardERC721", [
    collectionName,
    collectionSymbol,
    owner.address,
  ]);
  await contract.waitForDeployment();

  const deployment = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    owner: owner.address,
    collectionName,
    collectionSymbol,
    contractAddress: await contract.getAddress(),
    deploymentTxHash: contract.deploymentTransaction()?.hash ?? null,
  };

  await saveDeployment(networkName, "soulbound-visit-card-erc721", deployment);

  console.log("SoulboundVisitCardERC721 deployed to:", await contract.getAddress());
  console.log("Deployment tx hash:", contract.deploymentTransaction()?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
