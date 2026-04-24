import * as fs from "fs";
import * as path from "path";
import { loadConfig } from "./vault";
import { getSyncStatus } from "./sync";
import { checkTtlExpiry } from "./ttlMiddleware";
import { loadTtlConfig } from "./ttl";

export interface EnvStatusResult {
  file: string;
  exists: boolean;
  encryptedExists: boolean;
  recipients: string[];
  syncStatus: "in-sync" | "out-of-sync" | "unknown";
  ttlExpired: boolean;
  ttlExpiresAt: string | null;
  lastModified: string | null;
  sizeBytes: number | null;
}

export async function formatEnvStatus(
  envFile: string,
  vaultDir: string
): Promise<EnvStatusResult> {
  const exists = fs.existsSync(envFile);
  const encryptedPath = path.join(vaultDir, path.basename(envFile) + ".gpg");
  const encryptedExists = fs.existsSync(encryptedPath);

  let recipients: string[] = [];
  let syncStatus: "in-sync" | "out-of-sync" | "unknown" = "unknown";
  let lastModified: string | null = null;
  let sizeBytes: number | null = null;

  try {
    const config = await loadConfig(vaultDir);
    recipients = config.recipients ?? [];
  } catch {
    recipients = [];
  }

  if (exists) {
    const stat = fs.statSync(envFile);
    lastModified = stat.mtime.toISOString();
    sizeBytes = stat.size;
  }

  try {
    const status = await getSyncStatus(envFile, vaultDir);
    syncStatus = status.inSync ? "in-sync" : "out-of-sync";
  } catch {
    syncStatus = "unknown";
  }

  let ttlExpired = false;
  let ttlExpiresAt: string | null = null;
  try {
    const ttlConfig = await loadTtlConfig(vaultDir);
    const key = path.basename(envFile);
    const entry = ttlConfig[key];
    if (entry) {
      ttlExpiresAt = entry.expiresAt;
      ttlExpired = checkTtlExpiry(entry.expiresAt);
    }
  } catch {
    ttlExpired = false;
  }

  return {
    file: envFile,
    exists,
    encryptedExists,
    recipients,
    syncStatus,
    ttlExpired,
    ttlExpiresAt,
    lastModified,
    sizeBytes,
  };
}
