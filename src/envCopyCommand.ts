import { Command } from "commander";
import { copyEnvKeyInFiles, formatCopyResult } from "./envCopy";

export function registerEnvCopyCommands(program: Command): void {
  program
    .command("copy <key> <from> <to>")
    .description("Copy an env key from one file to another")
    .option("--overwrite", "Overwrite the key if it already exists in the destination", false)
    .action((key: string, from: string, to: string, opts: { overwrite: boolean }) => {
      try {
        const result = copyEnvKeyInFiles(key, from, to, opts.overwrite);
        console.log(formatCopyResult(result));
      } catch (err: unknown) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      }
    });
}
