import { network } from "hardhat";

import { loadDeployment, requireEnv } from "./nft-helpers.js";

type VisitCardDeployment = {
  contractAddress: string;
};

async function main() {
  const { ethers, networkName } = await network.create("sepolia");
  const studentWallet = requireEnv("STUDENT_WALLET");
  const metadataURI = requireEnv("VISIT_CARD_METADATA_URI");

  const deployment = await loadDeployment<VisitCardDeployment>(
    networkName,
    "soulbound-visit-card-erc721",
  );

  const contract = await ethers.getContractAt(
    "SoulboundVisitCardERC721",
    deployment.contractAddress,
  );

  const tx = await contract.mintVisitCard(studentWallet, metadataURI);
  const receipt = await tx.wait();
  const tokenId = await contract.tokenOfStudent(studentWallet);

  console.log("Visit card contract:", deployment.contractAddress);
  console.log("Student wallet:", studentWallet);
  console.log("Minted token id:", tokenId.toString());
  console.log("Mint tx hash:", receipt?.hash ?? tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
