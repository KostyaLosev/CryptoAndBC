import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CharacterConfigInput = {
  name: string;
  imageURI: string;
  metadataURI: string;
  color: string;
  speed: bigint;
  strength: bigint;
  rarity: string;
};

type DeploymentRecord = Record<string, unknown>;

type CharacterSeed = {
  slug: string;
  name: string;
  color: string;
  speed: bigint;
  strength: bigint;
  rarity: string;
};

const CHARACTER_SEEDS: CharacterSeed[] = [
  { slug: "arcane-knight", name: "Arcane Knight", color: "Crimson", speed: 72n, strength: 91n, rarity: "legendary" },
  { slug: "forest-ranger", name: "Forest Ranger", color: "Emerald", speed: 88n, strength: 67n, rarity: "epic" },
  { slug: "sand-assassin", name: "Sand Assassin", color: "Gold", speed: 95n, strength: 63n, rarity: "epic" },
  { slug: "glacier-giant", name: "Glacier Giant", color: "Ice Blue", speed: 40n, strength: 99n, rarity: "legendary" },
  { slug: "storm-mage", name: "Storm Mage", color: "Silver", speed: 84n, strength: 70n, rarity: "rare" },
  { slug: "lava-bruiser", name: "Lava Bruiser", color: "Obsidian", speed: 58n, strength: 93n, rarity: "rare" },
  { slug: "shadow-hunter", name: "Shadow Hunter", color: "Black", speed: 90n, strength: 74n, rarity: "epic" },
  { slug: "mecha-paladin", name: "Mecha Paladin", color: "Steel", speed: 65n, strength: 89n, rarity: "rare" },
  { slug: "tidal-scout", name: "Tidal Scout", color: "Teal", speed: 86n, strength: 61n, rarity: "uncommon" },
  { slug: "solar-bard", name: "Solar Bard", color: "Amber", speed: 77n, strength: 68n, rarity: "uncommon" },
];

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export function getDeploymentFilePath(
  networkName: string,
  deploymentName: string,
): string {
  return path.join(
    process.cwd(),
    "deployments",
    `${networkName}-${deploymentName}.json`,
  );
}

export async function saveDeployment(
  networkName: string,
  deploymentName: string,
  data: DeploymentRecord,
): Promise<void> {
  const deploymentPath = getDeploymentFilePath(networkName, deploymentName);

  await mkdir(path.dirname(deploymentPath), { recursive: true });
  await writeFile(deploymentPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function loadDeployment<T>(
  networkName: string,
  deploymentName: string,
): Promise<T> {
  const deploymentPath = getDeploymentFilePath(networkName, deploymentName);
  const raw = await readFile(deploymentPath, "utf8");
  return JSON.parse(raw) as T;
}

export function buildDefaultCharacterConfigs(
  metadataBaseUri: string,
  imageBaseUri: string,
): CharacterConfigInput[] {
  const normalizedMetadataBase = trimTrailingSlash(metadataBaseUri);
  const normalizedImageBase = trimTrailingSlash(imageBaseUri);

  return CHARACTER_SEEDS.map((seed, index) => ({
    name: seed.name,
    imageURI: `${normalizedImageBase}/${seed.slug}.png`,
    metadataURI: `${normalizedMetadataBase}/${index + 1}.json`,
    color: seed.color,
    speed: seed.speed,
    strength: seed.strength,
    rarity: seed.rarity,
  }));
}

export function parseCharacterIds(rawValue: string): bigint[] {
  const parsedIds = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => {
      const numericValue = Number(value);

      if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 10) {
        throw new Error(`Invalid character id: ${value}`);
      }

      return BigInt(numericValue);
    });

  const uniqueIds = [...new Set(parsedIds.map((value) => value.toString()))].map(
    (value) => BigInt(value),
  );

  if (uniqueIds.length === 0 || uniqueIds.length > 2) {
    throw new Error("STUDENT_CHARACTER_IDS must contain 1 or 2 unique ids");
  }

  return uniqueIds;
}

export function defaultBatchMintIds(): bigint[] {
  return Array.from({ length: 10 }, (_, index) => BigInt(index + 1));
}

export function defaultBatchMintAmounts(): bigint[] {
  return Array.from({ length: 10 }, () => 1n);
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
