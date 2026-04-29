import * as fs from "fs";
import { encryptEnvFile } from "./envEncrypt";

export interface EncryptMiddlewareOptions {
  autoEncrypt?: boolean;
  warnOnly?: boolean;
}

/**
 * After a command writes to an env file, optionally auto-encrypt it.
 * If autoEncrypt is true, the file is encrypted in-place (.env.gpg).
 * If warnOnly is true (default), only warns when the encrypted copy is stale.
 */
export async function withAutoEncrypt(
  envFile: string,
  action: () => Promise<void>,
  opts: EncryptMiddlewareOptions = {}
): Promise<void> {
  await action();

  const encPath = envFile + ".gpg";
  const encExists = fs.existsSync(encPath);

  if (opts.autoEncrypt) {
    const result = await encryptEnvFile(envFile);
    if (!result.success) {
      console.warn(`⚠️  Auto-encrypt failed: ${result.error}`);
    } else {
      console.log(`🔒 Auto-encrypted ${envFile} → ${encPath}`);
    }
    return;
  }

  if (encExists) {
    const envStat = fs.statSync(envFile);
    const encStat = fs.statSync(encPath);
    if (envStat.mtimeMs > encStat.mtimeMs) {
      console.warn(
        `⚠️  ${envFile} has changed but ${encPath} is stale. Run \`envault encrypt run ${envFile}\` to update.`
      );
    }
  }
}
