import { Command } from "commander";
import {
  readEnvFile,
  writeEnvFile,
  getEnvValue,
  setEnvValue,
  deleteEnvKey,
} from "./env";

export function registerEnvCommands(program: Command): void {
  const env = program
    .command("env")
    .description("Read and write .env file entries directly");

  env
    .command("get <key>")
    .description("Get the value of a key from the .env file")
    .option("-f, --file <path>", "Path to .env file", ".env")
    .action((key: string, opts: { file: string }) => {
      const ef = readEnvFile(opts.file);
      const value = getEnvValue(ef, key);
      if (value === undefined) {
        console.error(`Key "${key}" not found in ${opts.file}`);
        process.exit(1);
      }
      console.log(value);
    });

  env
    .command("set <key> <value>")
    .description("Set a key in the .env file")
    .option("-f, --file <path>", "Path to .env file", ".env")
    .option("-c, --comment <comment>", "Optional comment for the key")
    .action(
      (key: string, value: string, opts: { file: string; comment?: string }) => {
        let ef = readEnvFile(opts.file);
        ef = setEnvValue(ef, key, value, opts.comment);
        writeEnvFile(ef);
        console.log(`Set ${key} in ${opts.file}`);
      }
    );

  env
    .command("delete <key>")
    .description("Delete a key from the .env file")
    .option("-f, --file <path>", "Path to .env file", ".env")
    .action((key: string, opts: { file: string }) => {
      let ef = readEnvFile(opts.file);
      if (getEnvValue(ef, key) === undefined) {
        console.error(`Key "${key}" not found in ${opts.file}`);
        process.exit(1);
      }
      ef = deleteEnvKey(ef, key);
      writeEnvFile(ef);
      console.log(`Deleted ${key} from ${opts.file}`);
    });

  env
    .command("list")
    .description("List all keys in the .env file")
    .option("-f, --file <path>", "Path to .env file", ".env")
    .action((opts: { file: string }) => {
      const ef = readEnvFile(opts.file);
      if (ef.entries.length === 0) {
        console.log("No entries found.");
        return;
      }
      for (const entry of ef.entries) {
        const comment = entry.comment ? `  # ${entry.comment}` : "";
        console.log(`${entry.key}=${entry.value}${comment}`);
      }
    });
}
