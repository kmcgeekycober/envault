import * as fs from "fs";
import * as path from "path";
import { parseEnvEntries } from "./env";
import { loadSchema } from "./schema";
import { loadTtlConfig, isTtlExpired } from "./ttl";
import { loadPins } from "./pin";

export interface EnvStatusEntry {
  key: string;
  hasValue: boolean;
  isRequired: boolean;
  isTtlExpired: boolean;
  isPinned: boolean;
  ttlExpiresAt?: string;
}

export interface EnvStatusResult {
  file: string;
  entries: EnvStatusEntry[];
  totalKeys: number;
  missingRequired: number;
  expiredTtl: number;
  pinnedKeys: number;
}

export async function getEnvStatus(
  envFile: string,
  configDir: string = ".envault"
): Promise<EnvStatusResult> {
  const content = fs.existsSync(envFile)
    ? fs.readFileSync(envFile, "utf8")
    : "";
  const entries = parseEnvEntries(content);
  const schema = await loadSchema(configDir).catch(() => ({ fields: {} }));
  const ttlConfig = await loadTtlConfig(configDir).catch(() => ({ ttls: {} }));
  const pins = await loadPins(configDir).catch(() => ({ keys: [] }));

  const pinnedSet = new Set<string>(pins.keys ?? []);
  const schemaFields = schema.fields ?? {};
  const ttls = ttlConfig.ttls ?? {};

  const statusEntries: EnvStatusEntry[] = entries.map((entry) => {
    const field = schemaFields[entry.key];
    const ttlEntry = ttls[entry.key];
    const expired = ttlEntry ? isTtlExpired(ttlEntry) : false;
    return {
      key: entry.key,
      hasValue: entry.value !== undefined && entry.value !== "",
      isRequired: field?.required === true,
      isTtlExpired: expired,
      isPinned: pinnedSet.has(entry.key),
      ttlExpiresAt: ttlEntry?.expiresAt,
    };
  });

  const missingRequired = statusEntries.filter(
    (e) => e.isRequired && !e.hasValue
  ).length;
  const expiredTtl = statusEntries.filter((e) => e.isTtlExpired).length;
  const pinnedKeys = statusEntries.filter((e) => e.isPinned).length;

  return {
    file: path.resolve(envFile),
    entries: statusEntries,
    totalKeys: statusEntries.length,
    missingRequired,
    expiredTtl,
    pinnedKeys,
  };
}

export function formatEnvStatus(result: EnvStatusResult): string {
  const lines: string[] = [
    `Status for: ${result.file}`,
    `Total keys: ${result.totalKeys} | Missing required: ${result.missingRequired} | Expired TTL: ${result.expiredTtl} | Pinned: ${result.pinnedKeys}`,
    "",
  ];
  for (const entry of result.entries) {
    const flags: string[] = [];
    if (entry.isRequired && !entry.hasValue) flags.push("MISSING");
    if (entry.isTtlExpired) flags.push("EXPIRED");
    if (entry.isPinned) flags.push("PINNED");
    const flagStr = flags.length > 0 ? `  [${flags.join(", ")}]` : "";
    const valueStr = entry.hasValue ? "set" : "empty";
    lines.push(`  ${entry.key}: ${valueStr}${flagStr}`);
  }
  return lines.join("\n");
}
