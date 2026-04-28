import { Command } from "commander";
import { promoteEnvFile, formatPromoteResult } from "./envPromote";

export function registerEnvPromoteCommands(program: Command): void {
  const promote = program
    .command("promote")
    .description("Promote env keys from one file to another");

  promote
    .command("run <source> <target> [keys...]")
    .description("Copy specified keys from source env file to target env file")
    .option("-f, --force", "Overwrite existing keys in target", false)
    .option("-a, --all", "Promote all keys from source", false)
    .action((source: string, target: string, keys: string[], opts) => {
      try {
        let keysToPromote = keys;
        if (opts.all) {
          const { parseEnvEntries } = require("./env");
          const fs = require("fs");
          const content = fs.readFileSync(source, "utf8");
          keysToPromote = parseEnvEntries(content)
            .filter((e: any) => e.key)
            .map((e: any) => e.key);
        }
        if (!keysToPromote.length) {
          console.error("No keys specified. Use [keys...] or --all.");
          process.exit(1);
        }
        const result = promoteEnvFile(source, target, keysToPromote, opts.force);
        console.log(formatPromoteResult(result, source, target));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
