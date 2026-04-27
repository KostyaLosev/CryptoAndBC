import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const IMPLEMENTATION_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

const DEPLOYMENTS_DIR = path.resolve(process.cwd(), "deployments");

export type KosTokenDeployment = {
  network: string;
  chainId: string;
  owner: string;
  initialSupply: string;
  proxyAddress: string;
  implementationV1Address?: string;
  implementationV2Address?: string;
  implementationV1TxHash?: string;
  implementationV2TxHash?: string;
  proxyDeploymentTxHash?: string;
  mintTxHash?: string;
  transferTxHash?: string;
  upgradeTxHash?: string;
  mintRecipient?: string;
  transferRecipient?: string;
};

export function getDeploymentFilePath(networkName: string) {
  return path.join(DEPLOYMENTS_DIR, `${networkName}-kostoken.json`);
}

export async function saveDeployment(
  networkName: string,
  deployment: KosTokenDeployment,
) {
  await mkdir(DEPLOYMENTS_DIR, { recursive: true });
  await writeFile(
    getDeploymentFilePath(networkName),
    `${JSON.stringify(deployment, null, 2)}\n`,
    "utf8",
  );
}

export async function loadDeployment(
  networkName: string,
): Promise<KosTokenDeployment> {
  const raw = await readFile(getDeploymentFilePath(networkName), "utf8");
  return JSON.parse(raw) as KosTokenDeployment;
}

export function implementationFromSlot(rawSlotValue: string) {
  return `0x${rawSlotValue.slice(-40)}`;
}
