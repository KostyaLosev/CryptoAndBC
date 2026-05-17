import { network } from "hardhat";

import {
  buildDefaultCharacterConfigs,
  requireEnv,
  saveDeployment,
} from "./nft-helpers.js";

async function main() {
  const { ethers, networkName } = await network.create("sepolia");
  const [owner] = await ethers.getSigners();

  const metadataBaseUri = requireEnv("GAME_CHARACTER_METADATA_BASE_URI");
  const imageBaseUri = requireEnv("GAME_CHARACTER_IMAGE_BASE_URI");
  const characterConfigs = buildDefaultCharacterConfigs(metadataBaseUri, imageBaseUri);

  const contract = await ethers.deployContract("GameCharacterCollectionERC1155", [
    owner.address,
    characterConfigs,
  ]);
  await contract.waitForDeployment();

  const deployment = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    owner: owner.address,
    contractAddress: await contract.getAddress(),
    metadataBaseUri,
    imageBaseUri,
    deploymentTxHash: contract.deploymentTransaction()?.hash ?? null,
  };

  await saveDeployment(
    networkName,
    "game-character-collection-erc1155",
    deployment,
  );

  console.log("GameCharacterCollectionERC1155 deployed to:", await contract.getAddress());
  console.log("Deployment tx hash:", contract.deploymentTransaction()?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
