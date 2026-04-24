import { Command } from "commander";
import * as path from "path";
import { formatEnvStatus } from "./envStatus";

export function registerEnvStatusCommands(program: Command): void {
  program
    .command("status [envFile]")
    .description("Show the status of an env file in the vault")
    .option("-d, --vault-dir <dir>", "Vault directory", ".envault")
    .option("--json", "Output as JSON")
    .action(async (envFile: string | undefined, opts: { vaultDir: string; json?: boolean }) => {
      const file = envFile ?? ".env";
      const vaultDir = opts.vaultDir;

      try {
        const result = await formatEnvStatus(path.resolve(file), path.resolve(vaultDir));

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(`File:             ${result.file}`);
        console.log(`Exists:           ${result.exists ? "yes" : "no"}`);
        console.log(`Encrypted copy:   ${result.encryptedExists ? "yes" : "no"}`);
        console.log(`Sync status:      ${result.syncStatus}`);
        console.log(`Recipients:       ${result.recipients.length > 0 ? result.recipients.join(", ") : "(none)"}`);
        console.log(`Last modified:    ${result.lastModified ?? "n/a"}`);
        console.log(`Size:             ${result.sizeBytes !== null ? result.sizeBytes + " bytes" : "n/a"}`);
        console.log(`TTL expired:      ${result.ttlExpired ? "yes" : "no"}`);
        if (result.ttlExpiresAt) {
          console.log(`TTL expires at:   ${result.ttlExpiresAt}`);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
