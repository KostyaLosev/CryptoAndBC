import { network } from "hardhat";

import {
  defaultBatchMintAmounts,
  defaultBatchMintIds,
  loadDeployment,
  parseCharacterIds,
  requireEnv,
} from "./nft-helpers.js";

type CharacterDeployment = {
  contractAddress: string;
};

async function main() {
  const { ethers, networkName } = await network.create("sepolia");
  const [owner] = await ethers.getSigners();

  const studentWallet = requireEnv("STUDENT_WALLET");
  const transferIds = parseCharacterIds(process.env.STUDENT_CHARACTER_IDS?.trim() || "1,2");
  const transferAmounts = transferIds.map(() => 1n);

  const deployment = await loadDeployment<CharacterDeployment>(
    networkName,
    "game-character-collection-erc1155",
  );

  const contract = await ethers.getContractAt(
    "GameCharacterCollectionERC1155",
    deployment.contractAddress,
  );

  const mintTx = await contract.mintBatch(
    owner.address,
    defaultBatchMintIds(),
    defaultBatchMintAmounts(),
    "0x",
  );
  const mintReceipt = await mintTx.wait();

  const transferTx = await contract.safeBatchTransferFrom(
    owner.address,
    studentWallet,
    transferIds,
    transferAmounts,
    "0x",
  );
  const transferReceipt = await transferTx.wait();

  console.log("Game character contract:", deployment.contractAddress);
  console.log("Owner wallet:", owner.address);
  console.log("Student wallet:", studentWallet);
  console.log("Mint tx hash:", mintReceipt?.hash ?? mintTx.hash);
  console.log("Batch transfer tx hash:", transferReceipt?.hash ?? transferTx.hash);
  console.log("Transferred token ids:", transferIds.map((id) => id.toString()).join(", "));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
