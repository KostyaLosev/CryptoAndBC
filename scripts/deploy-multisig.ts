import { network } from "hardhat";

function readOwners(
  isAddress: (value: string) => boolean,
): string[] {
  const rawOwners = process.env.MULTISIG_OWNERS;

  if (!rawOwners) {
    throw new Error(
      "Missing MULTISIG_OWNERS in .env or your shell environment. Example: MULTISIG_OWNERS=0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222",
    );
  }

  const owners = rawOwners
    .split(",")
    .map((owner) => owner.trim())
    .filter(Boolean);

  if (owners.length === 0) {
    throw new Error("MULTISIG_OWNERS is empty. Provide at least one owner address.");
  }

  const invalidOwners = owners.filter((owner) => !isAddress(owner));
  if (invalidOwners.length > 0) {
    throw new Error(
      `MULTISIG_OWNERS contains invalid address values: ${invalidOwners.join(", ")}`,
    );
  }

  const uniqueOwners = new Set(owners.map((owner) => owner.toLowerCase()));
  if (uniqueOwners.size !== owners.length) {
    throw new Error("MULTISIG_OWNERS contains duplicate addresses.");
  }

  return owners;
}

function readRequiredConfirmations(ownerCount: number): bigint {
  const rawValue = process.env.MULTISIG_CONFIRMATIONS;

  if (!rawValue) {
    throw new Error(
      "Missing MULTISIG_CONFIRMATIONS in .env or your shell environment. Example: MULTISIG_CONFIRMATIONS=2",
    );
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new Error("MULTISIG_CONFIRMATIONS must be a positive integer.");
  }

  const requiredConfirmations = BigInt(rawValue);

  if (requiredConfirmations === 0n) {
    throw new Error("MULTISIG_CONFIRMATIONS must be greater than 0.");
  }

  if (requiredConfirmations > BigInt(ownerCount)) {
    throw new Error(
      `MULTISIG_CONFIRMATIONS cannot exceed the number of owners (${ownerCount}).`,
    );
  }

  return requiredConfirmations;
}

async function main() {
  const { ethers } = await network.create("sepolia");

  const owners = readOwners(ethers.isAddress);
  const requiredConfirmations = readRequiredConfirmations(owners.length);

  const wallet = await ethers.deployContract("MultiSigWallet", [
    owners,
    requiredConfirmations,
  ]);
  await wallet.waitForDeployment();

  console.log("MultiSigWallet deployed to:", await wallet.getAddress());
  console.log("Owners:", owners.join(", "));
  console.log("Required confirmations:", requiredConfirmations.toString());
  console.log("Deployment tx hash:", wallet.deploymentTransaction()?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
