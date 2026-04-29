import { Command } from "commander";
import { encryptEnvFile, formatEncryptResult } from "./envEncrypt";

export function registerEnvEncryptCommands(program: Command): void {
  const enc = program
    .command("encrypt")
    .description("Encrypt a .env file using configured GPG recipients");

  enc
    .command("run <envFile>")
    .description("Encrypt the given .env file")
    .option("-o, --output <outputFile>", "Output path for encrypted file")
    .option("-r, --recipient <email>", "Additional recipient (repeatable)", (v, acc: string[]) => [...acc, v], [] as string[])
    .action(async (envFile: string, opts: { output?: string; recipient: string[] }) => {
      const result = await encryptEnvFile(envFile, opts.output, opts.recipient);
      console.log(formatEncryptResult(result));
      if (!result.success) process.exit(1);
    });

  enc
    .command("check <envFile>")
    .description("Check if an encrypted version of the file exists and is up-to-date")
    .action(async (envFile: string) => {
      const fs = await import("fs");
      const encPath = envFile + ".gpg";
      if (!fs.existsSync(encPath)) {
        console.log(`⚠️  No encrypted file found at ${encPath}`);
        process.exit(1);
      }
      const envStat = fs.statSync(envFile);
      const encStat = fs.statSync(encPath);
      if (envStat.mtimeMs > encStat.mtimeMs) {
        console.log(`⚠️  ${envFile} is newer than ${encPath}. Re-encrypt recommended.`);
        process.exit(1);
      }
      console.log(`✅ ${encPath} is up-to-date.`);
    });
}
